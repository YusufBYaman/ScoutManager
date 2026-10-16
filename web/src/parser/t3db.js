/**
 * T3DB Parser for EA Sports FC Career Mode saves
 * Decodes FBCHUNKS container and extracts tables using bit-unpacking
 */

export function findDatabaseOffsets(buffer) {
  const bytes = new Uint8Array(buffer);
  const header = [0x44, 0x42, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00];
  const offsets = [];

  for (let i = 0; i <= bytes.length - 8; i++) {
    let match = true;
    for (let j = 0; j < 8; j++) {
      if (bytes[i + j] !== header[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      offsets.push(i);
      // read db size to skip
      const view = new DataView(buffer, i + 8, 4);
      const dbSize = view.getUint32(0, true);
      if (dbSize > 0) {
        i += dbSize - 1;
      }
    }
  }
  return offsets;
}

export function parseSchemaXml(xmlText) {
  const tables = {};
  const tableRegex = /<table\s+([^>]+)>([\s\S]*?)<\/table>/g;
  let tMatch;
  while ((tMatch = tableRegex.exec(xmlText)) !== null) {
    const tAttrs = tMatch[1];
    const tBody = tMatch[2];
    const nameMatch = tAttrs.match(/name="([^"]+)"/);
    const shortMatch = tAttrs.match(/shortname="([^"]+)"/);
    if (!nameMatch || !shortMatch) continue;
    const tableName = nameMatch[1];
    const shortName = shortMatch[1];
    const fields = {};

    const fieldRegex = /<field\s+([^>]+)\/>/g;
    let fMatch;
    while ((fMatch = fieldRegex.exec(tBody)) !== null) {
      const fAttrs = fMatch[1];
      const fnMatch = fAttrs.match(/name="([^"]+)"/);
      const fsMatch = fAttrs.match(/shortname="([^"]+)"/);
      const ftMatch = fAttrs.match(/type="([^"]+)"/);
      const rlMatch = fAttrs.match(/rangelow="([^"]+)"/);
      if (!fnMatch || !fsMatch || !ftMatch) continue;
      const rLow = ftMatch[1] === 'DBOFIELDTYPE_INTEGER' ? parseInt(rlMatch ? rlMatch[1] : '0', 10) : 0;
      fields[fsMatch[1]] = {
        name: fnMatch[1],
        type: ftMatch[1],
        rangelow: isNaN(rLow) ? 0 : rLow
      };
    }
    tables[shortName] = { name: tableName, fields };
  }
  return tables;
}

export function extractDatabaseTables(buffer, dbOffset, schema, onProgress) {
  const dataView = new DataView(buffer, dbOffset);
  const dbBytes = new Uint8Array(buffer, dbOffset);

  // Offset 16: table count
  const tableCount = dataView.getUint32(16, true);
  let pos = 24;
  const tableEntries = [];

  for (let i = 0; i < tableCount; i++) {
    let shortName = '';
    for (let c = 0; c < 4; c++) {
      shortName += String.fromCharCode(dbBytes[pos + c]);
    }
    const offset = dataView.getUint32(pos + 4, true);
    pos += 8;
    tableEntries.push({ shortName, offset });
  }

  const tablesStart = 24 + tableCount * 8 + 4;
  const extracted = {};

  for (let i = 0; i < tableEntries.length; i++) {
    const { shortName, offset } = tableEntries[i];
    if (onProgress && i % 5 === 0) {
      onProgress(i, tableEntries.length);
    }

    const tableDef = schema[shortName];
    if (!tableDef) continue;

    const tableName = tableDef.name;
    const fieldsSchema = tableDef.fields;

    let tPos = tablesStart + offset + 4; // skip 4
    const recordSize = dataView.getUint32(tPos, true);
    tPos += 4 + 10; // skip 10
    const validRecords = dataView.getUint16(tPos, true);
    tPos += 2 + 4; // skip 4
    const fieldsCount = dbBytes[tPos];
    tPos += 1 + 11; // skip 11

    if (validRecords <= 0) {
      extracted[tableName] = [];
      continue;
    }

    const rawFields = [];
    for (let f = 0; f < fieldsCount; f++) {
      const fType = dataView.getUint32(tPos, true);
      const bitOff = dataView.getUint32(tPos + 4, true);
      tPos += 8;

      let fShort = '';
      for (let c = 0; c < 4; c++) {
        fShort += String.fromCharCode(dbBytes[tPos + c]);
      }
      tPos += 4;

      const bitDepth = dataView.getUint32(tPos, true);
      tPos += 4;

      const meta = fieldsSchema[fShort] || { name: fShort, rangelow: 0 };
      rawFields.push({
        type: fType,
        bitOff,
        name: meta.name,
        depth: bitDepth,
        rangelow: meta.rangelow
      });
    }

    const records = [];
    const recordsStart = tPos;
    const decoder = new TextDecoder('utf-8');

    for (let r = 0; r < validRecords; r++) {
      const recPos = recordsStart + r * recordSize;
      const row = {};

      for (let f = 0; f < rawFields.length; f++) {
        const field = rawFields[f];
        const ft = field.type;
        const bitOff = field.bitOff;
        const depth = field.depth;
        const name = field.name;

        if (ft === 0) {
          // String
          const byteStart = recPos + (bitOff >> 3);
          const byteLen = depth >> 3;
          let nullIdx = byteLen;
          for (let s = 0; s < byteLen; s++) {
            if (dbBytes[byteStart + s] === 0) {
              nullIdx = s;
              break;
            }
          }
          row[name] = decoder.decode(dbBytes.subarray(byteStart, byteStart + nullIdx)).trim();
        } else if (ft === 3) {
          // Bit-packed integer
          const byteStart = recPos + (bitOff >> 3);
          const bitInByte = bitOff & 7;
          const numBytes = ((bitInByte + depth + 7) >> 3);

          let intVal = 0n;
          for (let b = 0; b < numBytes; b++) {
            intVal |= BigInt(dbBytes[byteStart + b]) << BigInt(b * 8);
          }
          intVal >>= BigInt(bitInByte);
          const mask = (1n << BigInt(depth)) - 1n;
          intVal &= mask;

          row[name] = Number(intVal) + field.rangelow;
        } else if (ft === 4) {
          // Float
          const byteStart = recPos + (bitOff >> 3);
          row[name] = dataView.getFloat32(byteStart, true);
        }
      }
      records.push(row);
    }

    extracted[tableName] = records;
  }

  return extracted;
}
