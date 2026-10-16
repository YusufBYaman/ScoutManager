import os
import struct
import datetime
import xml.etree.ElementTree as ET
import pandas as pd

EPOCH_DATE = datetime.date(1582, 10, 15)

POSITION_MAP = {
    -1: '',
    0: 'GK',
    3: 'RB',
    4: 'RCB',
    5: 'CB',
    6: 'LCB',
    7: 'LB',
    9: 'RDM',
    10: 'CDM',
    11: 'LDM',
    12: 'RM',
    13: 'RCM',
    14: 'CM',
    15: 'LCM',
    16: 'LM',
    17: 'RAM',
    18: 'CAM',
    19: 'LAM',
    20: 'RF',
    22: 'LF',
    23: 'RW',
    24: 'RS',
    25: 'ST',
    26: 'LS',
    27: 'LW',
}

PLAYSTYLES_1 = [
    "Finesse Shot", "Chip Shot", "Power Shot", "Dead Ball", "Power Header",
    "Incisive Pass", "Pinged Pass", "Long Ball Pass", "Tiki Taka", "Whipped Cross",
    "Jockey", "Block", "Intercept", "Anticipate", "Slide Tackle",
    "Bruiser", "Technical", "Rapid", "Flair", "First Touch",
    "Trickster", "Press Proven", "Quick Step", "Relentless", "Trivela",
    "Acrobatic", "Long Throw", "Aerial", "Far Throw", "Footwork"
][::-1]

PLAYSTYLES_2 = [
    'Cross Claimer', '1v1 Close Down', 'Far Reach', 'Quick Reflexes',
    'Long Shot Taker (CPU AI)', 'Early Crosser (CPU AI)', 'Solid Player',
    'Team Player', 'One Club Player', 'Injury Prone', 'Leadership'
][::-1]

def parse_birthdate(fifa_date_val):
    """Convert FIFA date integer (days since 1582-10-15) to day, month, year."""
    if not fifa_date_val or fifa_date_val <= 0:
        return None, None, None, ''
    try:
        b_date = EPOCH_DATE + datetime.timedelta(days=int(fifa_date_val))
        return b_date.day, b_date.month, b_date.year, b_date.strftime('%d.%m.%Y')
    except Exception:
        return None, None, None, ''

def calculate_age(year, month, day, reference_year=2025):
    if not year:
        return None
    return reference_year - year

def decode_bitmask_traits(val, trait_names):
    if not val:
        return []
    bit_str = bin(val & 0xFFFFFFFF)[2:].zfill(len(trait_names))
    active = []
    for idx, bit in enumerate(bit_str):
        if bit == '1' and idx < len(trait_names):
            active.append(trait_names[idx])
    return active

def get_player_playstyles(trait1, trait2):
    p1 = decode_bitmask_traits(trait1, PLAYSTYLES_1)
    p2 = decode_bitmask_traits(trait2, PLAYSTYLES_2)
    return ', '.join(p1 + p2)


class FCSaveParser:
    def __init__(self, save_path, xml_meta_path, playernames_path=None):
        self.save_path = save_path
        self.xml_meta_path = xml_meta_path
        self.playernames_path = playernames_path
        self.schema = self._load_schema()
        self.static_names = self._load_static_names()

    def _load_schema(self):
        tree = ET.parse(self.xml_meta_path)
        root = tree.getroot()
        schema = {}
        for t in root.findall('.//table'):
            t_short = t.attrib['shortname']
            t_name = t.attrib['name']
            fields = {}
            for f in t.findall('.//field'):
                f_short = f.attrib['shortname']
                f_name = f.attrib['name']
                f_type = f.attrib.get('type')
                r_low = int(f.attrib.get('rangelow', 0)) if f_type == 'DBOFIELDTYPE_INTEGER' else 0
                fields[f_short] = {
                    'name': f_name,
                    'type': f_type,
                    'rangelow': r_low
                }
            schema[t_short] = {'name': t_name, 'fields': fields}
        return schema

    def _load_static_names(self):
        names = {}
        if self.playernames_path and os.path.exists(self.playernames_path):
            try:
                df = pd.read_csv(self.playernames_path, encoding='utf-8', on_bad_lines='skip')
                for _, row in df.iterrows():
                    nid = row.get('nameid')
                    nm = row.get('name')
                    if pd.notna(nid) and pd.notna(nm):
                        names[int(nid)] = str(nm).strip()
            except Exception as e:
                print(f"Warning: Failed loading playernames.csv: {e}")
        return names

    def parse(self):
        with open(self.save_path, 'rb') as f:
            save_bytes = f.read()

        db_header = b'\x44\x42\x00\x08\x00\x00\x00\x00'
        offset = save_bytes.find(db_header)
        databases = []
        while offset >= 0:
            db_size = struct.unpack('<I', save_bytes[offset + 8 : offset + 12])[0]
            databases.append(save_bytes[offset : offset + db_size])
            offset = save_bytes.find(db_header, offset + db_size)

        if len(databases) < 2:
            raise ValueError(f"Expected at least 2 DB blocks in save file, found {len(databases)}")

        db1_data = databases[0] # Career dynamics
        db2_data = databases[1] # World & player database

        print("Parsing DB1 (Kariyer Dinamik Verileri)...")
        db1_tables = self._extract_tables(db1_data)
        print("Parsing DB2 (Dünya ve Kadro Verileri)...")
        db2_tables = self._extract_tables(db2_data)

        return self._build_models(db1_tables, db2_tables)

    def _extract_tables(self, db_bytes):
        table_count = struct.unpack('<I', db_bytes[16:20])[0]
        pos = 24
        table_meta_list = []
        for _ in range(table_count):
            t_short = db_bytes[pos:pos+4].decode('latin1', errors='replace')
            t_offset = struct.unpack('<I', db_bytes[pos+4:pos+8])[0]
            pos += 8
            table_meta_list.append((t_short, t_offset))

        tables_start = 24 + table_count * 8 + 4
        extracted = {}

        for t_short, t_offset in table_meta_list:
            if t_short not in self.schema:
                continue
            table_def = self.schema[t_short]
            t_name = table_def['name']
            fields_schema = table_def['fields']

            t_pos = tables_start + t_offset + 4 # skip 4
            record_size = struct.unpack('<I', db_bytes[t_pos:t_pos+4])[0]
            t_pos += 4
            t_pos += 10 # skip 10
            valid_records = struct.unpack('<H', db_bytes[t_pos:t_pos+2])[0]
            t_pos += 2
            t_pos += 4 # skip 4
            fields_count = db_bytes[t_pos]
            t_pos += 1
            t_pos += 11 # skip 11

            if valid_records <= 0:
                extracted[t_name] = []
                continue

            raw_fields = []
            for _ in range(fields_count):
                f_type, bit_off = struct.unpack('<II', db_bytes[t_pos:t_pos+8])
                t_pos += 8
                f_short = db_bytes[t_pos:t_pos+4].decode('latin1', errors='replace')
                t_pos += 4
                bit_depth = struct.unpack('<I', db_bytes[t_pos:t_pos+4])[0]
                t_pos += 4
                meta = fields_schema.get(f_short, {'name': f_short, 'rangelow': 0})
                raw_fields.append({
                    'type': f_type,
                    'bit_off': bit_off,
                    'name': meta['name'],
                    'depth': bit_depth,
                    'rangelow': meta['rangelow']
                })

            records = []
            records_start = t_pos
            for r_idx in range(valid_records):
                rec_pos = records_start + r_idx * record_size
                rec_bytes = db_bytes[rec_pos : rec_pos + record_size]
                row = {}
                for f in raw_fields:
                    ft = f['type']
                    bit_off = f['bit_off']
                    depth = f['depth']
                    name = f['name']
                    if ft == 0: # string
                        byte_start = bit_off >> 3
                        byte_len = depth >> 3
                        val = rec_bytes[byte_start : byte_start + byte_len].split(b'\x00')[0].decode('utf-8', errors='replace').strip()
                        row[name] = val
                    elif ft == 3: # bit-packed int
                        byte_start = bit_off >> 3
                        bit_in_byte = bit_off & 7
                        num_bytes = (bit_in_byte + depth + 7) >> 3
                        chunk = rec_bytes[byte_start : byte_start + num_bytes]
                        int_val = int.from_bytes(chunk, 'little')
                        int_val >>= bit_in_byte
                        int_val &= (1 << depth) - 1
                        row[name] = int_val + f['rangelow']
                    elif ft == 4: # float
                        byte_start = bit_off >> 3
                        row[name] = struct.unpack('<f', rec_bytes[byte_start : byte_start + 4])[0]
                records.append(row)
            extracted[t_name] = records

        return extracted

    def _build_models(self, db1, db2):
        # 1. Names lookup
        names_dict = dict(self.static_names)

        # Dynamic names from career mode
        dc_names = db2.get('dcplayernames', [])
        for r in dc_names:
            nid = r.get('nameid')
            nm = r.get('name')
            if nid is not None and nm:
                names_dict[nid] = nm

        edited_names = {}
        for r in db2.get('editedplayernames', []):
            pid = r.get('playerid')
            if pid:
                edited_names[pid] = {
                    'firstname': r.get('firstname', ''),
                    'surname': r.get('surname', ''),
                    'commonname': r.get('commonname', ''),
                    'playerjerseyname': r.get('playerjerseyname', '')
                }

        # 2. Teams map
        teams_map = {}
        for t in db2.get('teams', []):
            tid = t.get('teamid')
            if tid:
                teams_map[tid] = t

        # 3. Leagues map
        leagues_map = {}
        for l in db2.get('leagues', []):
            lid = l.get('leagueid')
            if lid:
                leagues_map[lid] = l.get('leaguename', f'Lig {lid}')

        team_to_league = {}
        for ltl in db2.get('leagueteamlinks', []):
            tid = ltl.get('teamid')
            lid = ltl.get('leagueid')
            if tid and lid:
                team_to_league[tid] = leagues_map.get(lid, f'Lig {lid}')

        # 4. Contracts & Wages map from DB1
        contracts_map = {}
        for c in db1.get('career_playercontract', []):
            pid = c.get('playerid')
            if pid:
                contracts_map[pid] = c

        # 5. Team Player links (squads, shirt numbers, positions)
        team_player_map = {}
        for link in db2.get('teamplayerlinks', []):
            pid = link.get('playerid')
            if pid:
                team_player_map[pid] = link

        # 6. Player loans
        loan_map = {}
        for loan in db2.get('playerloans', []):
            pid = loan.get('playerid')
            from_team_id = loan.get('teamidloanedfrom')
            if pid and from_team_id:
                loan_map[pid] = from_team_id

        # 7. Build Players Dataset
        players_raw = db2.get('players', [])
        players_rows = []

        for p in players_raw:
            pid = p.get('playerid')
            if not pid:
                continue

            # Full name resolution
            if pid in edited_names:
                fn = edited_names[pid]['firstname']
                ln = edited_names[pid]['surname']
                cn = edited_names[pid]['commonname']
            else:
                fn = names_dict.get(p.get('firstnameid'), '')
                ln = names_dict.get(p.get('lastnameid'), '')
                cn = names_dict.get(p.get('commonnameid'), '')

            if cn:
                full_name = cn
            elif fn and ln:
                full_name = f"{fn} {ln}"
            elif ln:
                full_name = ln
            else:
                full_name = fn or f"Oyuncu {pid}"

            # Birthdate & Age (Gün, Ay, Yıl)
            b_day, b_month, b_year, b_str = parse_birthdate(p.get('birthdate'))
            age = calculate_age(b_year, b_month, b_day)

            # Team resolution
            tpl = team_player_map.get(pid, {})
            current_team_id = tpl.get('teamid')
            current_team_obj = teams_map.get(current_team_id, {})
            current_team_name = current_team_obj.get('teamname', 'Serbest Oyuncu' if current_team_id == 111592 or not current_team_id else f'Takım {current_team_id}')
            league_name = team_to_league.get(current_team_id, '')

            # Loan status
            owner_team_id = loan_map.get(pid)
            if owner_team_id:
                owner_team_obj = teams_map.get(owner_team_id, {})
                owner_team_name = owner_team_obj.get('teamname', f'Takım {owner_team_id}')
                loan_status = f"{owner_team_name} kulübünden kiralık"
            else:
                owner_team_name = current_team_name
                loan_status = 'Bonservisli'

            # Contract & Wage
            contract_info = contracts_map.get(pid, {})
            wage = contract_info.get('wage', 0)
            contract_expiry = p.get('contractvaliduntil', '') if current_team_id != 111592 else ''

            # Positions
            positions = []
            for pos_key in ['preferredposition1', 'preferredposition2', 'preferredposition3', 'preferredposition4']:
                pos_val = p.get(pos_key)
                if pos_val in POSITION_MAP and POSITION_MAP[pos_val]:
                    positions.append(POSITION_MAP[pos_val])
            pos_str = '/'.join(positions) if positions else 'Bilinmiyor'
            primary_pos = positions[0] if positions else ''

            # PlayStyles
            playstyles = get_player_playstyles(p.get('trait1'), p.get('trait2'))
            playstyles_plus = get_player_playstyles(p.get('icontrait1'), p.get('icontrait2'))

            player_record = {
                'Oyuncu ID': pid,
                'Ad Soyad': full_name,
                'Bilinen Ad (Common)': cn,
                'Adı': fn,
                'Soyadı': ln,
                'Takım': current_team_name,
                'Lig': league_name,
                'Kiralık Durumu': loan_status,
                'Asıl Kulüp': owner_team_name,
                'Ana Pozisyon': primary_pos,
                'Oynayabildiği Pozisyonlar': pos_str,
                'Forma No': tpl.get('jerseynumber', ''),
                'Genel Reyting': p.get('overallrating'),
                'Potansiyel': p.get('potential'),
                'Fark (Gelişim Potansiyeli)': (p.get('potential', 0) - p.get('overallrating', 0)),
                'Yaş': age,
                'Doğum Tarihi (GG.AA.YYYY)': b_str,
                'Doğum Günü': b_day,
                'Doğum Ayı': b_month,
                'Doğum Yılı': b_year,
                'Haftalık Maaş (€)': wage,
                'Sözleşme Bitiş': contract_expiry,
                'Boy (cm)': p.get('height'),
                'Kilo (kg)': p.get('weight'),
                'Ters Ayak (1-5)': p.get('weakfootabilitytypecode'),
                'Beceri Hareketi (1-5)': p.get('skillmoves'),
                'Hızlanma': p.get('acceleration'),
                'Depar Hızı': p.get('sprintspeed'),
                'Bitiricilik': p.get('finishing'),
                'Şut Gücü': p.get('shotpower'),
                'Uzaktan Şut': p.get('longshots'),
                'Voleler': p.get('volleys'),
                'Penaltılar': p.get('penalties'),
                'Kısa Pas': p.get('shortpassing'),
                'Uzun Pas': p.get('longpassing'),
                'Vizyon': p.get('vision'),
                'Orta Açma': p.get('crossing'),
                'Frikik': p.get('freekickaccuracy'),
                'Falso': p.get('curve'),
                'Top Kontrolü': p.get('ballcontrol'),
                'Dripling': p.get('dribbling'),
                'Çeviklik': p.get('agility'),
                'Denge': p.get('balance'),
                'Reaksiyon': p.get('reactions'),
                'Soğukkanlılık': p.get('composure'),
                'Defansif Farkındalık': p.get('defensiveawareness'),
                'Ayakta Müdahale': p.get('standingtackle'),
                'Kayarak Müdahale': p.get('slidingtackle'),
                'Top Kesme': p.get('interceptions'),
                'Kafa İsabeti': p.get('headingaccuracy'),
                'Zıplama': p.get('jumping'),
                'Dayanıklılık': p.get('stamina'),
                'Güç': p.get('strength'),
                'Saldırganlık': p.get('aggression'),
                'KL Uçma': p.get('gkdiving'),
                'KL Top Tutma': p.get('gkhandling'),
                'KL Degaj': p.get('gkkicking'),
                'KL Yer Tutma': p.get('gkpositioning'),
                'KL Refleks': p.get('gkreflexes'),
                'PlayStyles': playstyles,
                'PlayStyles+': playstyles_plus,
            }
            players_rows.append(player_record)

        # 8. Build Teams Dataset
        teams_rows = []
        for t in db2.get('teams', []):
            tid = t.get('teamid')
            if not tid or not t.get('teamname'):
                continue
            teams_rows.append({
                'Takım ID': tid,
                'Takım Adı': t.get('teamname'),
                'Lig': team_to_league.get(tid, ''),
                'Genel Güç': t.get('overallrating'),
                'Hücum Gücü': t.get('attackrating'),
                'Orta Saha Gücü': t.get('midfieldrating'),
                'Savunma Gücü': t.get('defenserating'),
                'Stadyum Kapasitesi': t.get('teamstadiumcapacity'),
                'Kuruluş Yılı': t.get('foundationyear'),
            })

        # 9. Career Manager / User Overview
        users_rows = []
        for u in db1.get('career_users', []):
            club_id = u.get('clubteamid')
            club_name = teams_map.get(club_id, {}).get('teamname', f'Takım {club_id}')
            users_rows.append({
                'Kullanıcı ID': u.get('userid'),
                'Adı': u.get('firstname'),
                'Soyadı': u.get('surname'),
                'Yönetilen Kulüp': club_name,
                'Maaş (€)': u.get('wage'),
                'Sezon Sayısı': u.get('seasoncount'),
            })

        # 10. Youth Academy Players
        youth_rows = []
        for yp in db1.get('career_youthplayers', []):
            youth_rows.append(yp)

        return {
            'players': pd.DataFrame(players_rows),
            'teams': pd.DataFrame(teams_rows),
            'career_users': pd.DataFrame(users_rows),
            'youth_players': pd.DataFrame(youth_rows),
        }


def export_save_to_excel(save_file, output_excel, xml_meta, playernames_csv):
    parser = FCSaveParser(save_file, xml_meta, playernames_csv)
    print("Save dosyası çözümleniyor...")
    data = parser.parse()

    print(f"Toplam Çözümlenen Oyuncu Sayısı: {len(data['players'])}")
    print(f"Toplam Çözümlenen Takım Sayısı: {len(data['teams'])}")

    df_players = data['players']
    df_teams = data['teams']
    df_users = data['career_users']

    # Filter managed team players if available
    managed_team = None
    if not df_users.empty and 'Yönetilen Kulüp' in df_users.columns:
        managed_team = df_users.iloc[0]['Yönetilen Kulüp']

    df_my_team = pd.DataFrame()
    if managed_team:
        df_my_team = df_players[df_players['Takım'] == managed_team].sort_values(by='Genel Reyting', ascending=False)

    # Filter Wonderkids (Genç Yetenekler: Yaş <= 22 ve Potansiyel >= 83)
    df_wonderkids = df_players[
        (df_players['Yaş'] <= 22) & (df_players['Potansiyel'] >= 83)
    ].sort_values(by='Potansiyel', ascending=False)

    print(f"Excel dosyası oluşturuluyor: {output_excel}...")
    with pd.ExcelWriter(output_excel, engine='openpyxl') as writer:
        if not df_my_team.empty:
            df_my_team.to_excel(writer, sheet_name='Yönetilen Takım Kadrosu', index=False)
        if not df_wonderkids.empty:
            df_wonderkids.to_excel(writer, sheet_name='Genç Yetenekler (Wonderkids)', index=False)
        df_players.to_excel(writer, sheet_name='Tüm Oyuncular', index=False)
        df_teams.to_excel(writer, sheet_name='Tüm Takımlar', index=False)
        if not df_users.empty:
            df_users.to_excel(writer, sheet_name='Kariyer Bilgisi', index=False)

    print("İşlem tamamlandı! Excel başarıyla kaydedildi.")


if __name__ == '__main__':
    base_dir = r'c:\Users\ysufb\ProjectAntiGravity\deneme\CmTracker'
    save_file = os.path.join(base_dir, 'CmMgrC20261011014327769')
    xml_meta = os.path.join(base_dir, 'fifa_ng_db-meta.xml')
    playernames = os.path.join(base_dir, 'playernames.csv')
    out_excel = os.path.join(base_dir, 'FC26_Kariyer_Verileri.xlsx')

    export_save_to_excel(save_file, out_excel, xml_meta, playernames)
