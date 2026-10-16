import struct
import xml.etree.ElementTree as ET
import os

xml_path = r'c:\Users\ysufb\ProjectAntiGravity\deneme\CmTracker\fifa_ng_db-meta.xml'
tree = ET.parse(xml_path)
root = tree.getroot()
t = [x for x in root.findall('.//table') if x.attrib['shortname'] == 'lyxL'][0]
fields_meta = {}
for f in t.findall('.//field'):
    sn = f.attrib['shortname']
    fn = f.attrib['name']
    ft = f.attrib.get('type')
    rl = int(f.attrib.get('rangelow', 0)) if ft == 'DBOFIELDTYPE_INTEGER' else 0
    fields_meta[sn] = {'name': fn, 'type': ft, 'rangelow': rl}

save_path = r'c:\Users\ysufb\ProjectAntiGravity\deneme\CmTracker\CmMgrC20261011014327769'
with open(save_path, 'rb') as f:
    data = f.read()

header = b'\x44\x42\x00\x08\x00\x00\x00\x00'
p1 = data.find(header)
db1_sz = struct.unpack('<I', data[p1+8:p1+12])[0]
p2 = data.find(header, p1 + db1_sz)
db2 = data[p2:p2+struct.unpack('<I', data[p2+8:p2+12])[0]]

tbl_count = struct.unpack('<I', db2[16:20])[0]
pos = 24
target_offset = None
for _ in range(tbl_count):
    sn = db2[pos:pos+4].decode('latin1')
    off = struct.unpack('<I', db2[pos+4:pos+8])[0]
    pos += 8
    if sn == 'lyxL':
        target_offset = off

tables_start = 24 + tbl_count * 8 + 4
t_pos = tables_start + target_offset + 4
rec_size = struct.unpack('<I', db2[t_pos:t_pos+4])[0]
t_pos += 14
valid_records = struct.unpack('<H', db2[t_pos:t_pos+2])[0]
t_pos += 6
fields_count = db2[t_pos]
t_pos += 12

raw_fields = []
for _ in range(fields_count):
    ftype, bit_off = struct.unpack('<II', db2[t_pos:t_pos+8])
    t_pos += 8
    fsn = db2[t_pos:t_pos+4].decode('latin1')
    t_pos += 4
    bit_depth = struct.unpack('<I', db2[t_pos:t_pos+4])[0]
    t_pos += 4
    meta = fields_meta.get(fsn, {'name': fsn, 'rangelow': 0})
    raw_fields.append({'type': ftype, 'bit_off': bit_off, 'short': fsn, 'name': meta['name'], 'depth': bit_depth, 'rangelow': meta['rangelow']})

fields = sorted(raw_fields, key=lambda x: x['bit_off'])
print(f"Record size: {rec_size}, Valid records: {valid_records}")
for fld in fields:
    byte_idx = fld['bit_off'] >> 3
    bit_idx = fld['bit_off'] % 8
    print(f"{fld['bit_off']:5d} (byte {byte_idx:2d}, bit {bit_idx}): type={fld['type']} depth={fld['depth']:3d} {fld['name']:<25} rl={fld['rangelow']}")
