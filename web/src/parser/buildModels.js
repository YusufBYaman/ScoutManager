/**
 * Builds clean relational data models from extracted T3DB tables
 */
import nationsData from '../data/nations.json';

const EPOCH_DATE = new Date(Date.UTC(1582, 9, 15)); // 15 Oct 1582

export const POSITION_MAP = {
  '-1': '',
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
  28: 'YEDEK',
  29: 'REZERV',
};

export const PLAYSTYLES_1 = [
  "Finesse Shot", "Chip Shot", "Power Shot", "Dead Ball", "Power Header",
  "Incisive Pass", "Pinged Pass", "Long Ball Pass", "Tiki Taka", "Whipped Cross",
  "Jockey", "Block", "Intercept", "Anticipate", "Slide Tackle",
  "Bruiser", "Technical", "Rapid", "Flair", "First Touch",
  "Trickster", "Press Proven", "Quick Step", "Relentless", "Trivela",
  "Acrobatic", "Long Throw", "Aerial", "Far Throw", "Footwork"
].reverse();

export const PLAYSTYLES_2 = [
  'Cross Claimer', '1v1 Close Down', 'Far Reach', 'Quick Reflexes',
  'Long Shot Taker (CPU AI)', 'Early Crosser (CPU AI)', 'Solid Player',
  'Team Player', 'One Club Player', 'Injury Prone', 'Leadership'
].reverse();

export function parseBirthdate(fifaDateVal) {
  if (!fifaDateVal || fifaDateVal <= 0) {
    return { day: null, month: null, year: null, formatted: '', age: null };
  }
  const dateObj = new Date(EPOCH_DATE.getTime() + fifaDateVal * 24 * 60 * 60 * 1000);
  const day = dateObj.getUTCDate();
  const month = dateObj.getUTCMonth() + 1;
  const year = dateObj.getUTCFullYear();
  const formatted = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
  const age = 2025 - year;
  return { day, month, year, formatted, age };
}

export function calcEstimatedValue(ovr, pot, age) {
  if (!ovr || ovr < 40) return 0;
  let base = Math.pow(1.155, ovr - 40) * 85000;

  if (pot && pot > ovr) {
    const diff = pot - ovr;
    base *= (1 + (diff * 0.05));
  }

  if (age) {
    if (age <= 21) {
      base *= 1.25;
    } else if (age >= 22 && age <= 26) {
      base *= 1.15;
    } else if (age >= 27 && age <= 29) {
      base *= 1.0;
    } else if (age >= 30 && age <= 32) {
      base *= 0.65;
    } else if (age >= 33) {
      base *= Math.max(0.15, 0.45 - (age - 33) * 0.08);
    }
  }

  if (base > 50000000) {
    return Math.round(base / 1000000) * 1000000;
  } else if (base > 5000000) {
    return Math.round(base / 500000) * 500000;
  } else if (base > 1000000) {
    return Math.round(base / 100000) * 100000;
  } else {
    return Math.round(base / 10000) * 10000;
  }
}

export function calcEstimatedWage(overall, potential, age, isFreeAgent) {
  if (isFreeAgent) return 0;
  const ovr = Math.max(45, Math.min(99, overall || 50));
  const pot = Math.max(ovr, Math.min(99, potential || ovr));

  let baseWage;
  if (ovr >= 90) {
    baseWage = 280000 + (ovr - 90) * 45000;
  } else if (ovr >= 85) {
    baseWage = 110000 + (ovr - 85) * 34000;
  } else if (ovr >= 80) {
    baseWage = 35000 + (ovr - 80) * 15000;
  } else if (ovr >= 75) {
    baseWage = 12000 + (ovr - 75) * 4600;
  } else if (ovr >= 70) {
    baseWage = 5000 + (ovr - 70) * 1400;
  } else if (ovr >= 65) {
    baseWage = 2000 + (ovr - 65) * 600;
  } else if (ovr >= 60) {
    baseWage = 1000 + (ovr - 60) * 200;
  } else {
    baseWage = Math.max(500, 500 + (ovr - 45) * 35);
  }

  // Potential bonus for high potential young players
  if (age < 23 && pot > ovr) {
    const potBonus = (pot - ovr) * 0.035;
    baseWage *= (1 + potBonus);
  }

  // Veteran adjustment (older stars)
  if (age >= 30 && age <= 35 && ovr >= 78) {
    baseWage *= 1.1;
  }

  // Round neatly
  if (baseWage >= 100000) {
    return Math.round(baseWage / 10000) * 10000;
  } else if (baseWage >= 10000) {
    return Math.round(baseWage / 1000) * 1000;
  } else if (baseWage >= 2000) {
    return Math.round(baseWage / 500) * 500;
  } else {
    return Math.round(baseWage / 50) * 50;
  }
}

export function formatCurrency(amount) {
  if (!amount || amount <= 0) return '€0';
  if (amount >= 1000000) {
    const m = (amount / 1000000).toFixed(1).replace('.0', '');
    return `€${m}M`;
  }
  if (amount >= 1000) {
    return `€${Math.round(amount / 1000)}K`;
  }
  return `€${amount}`;
}

export function calcPlayerPillarStats(p, isGK = false) {
  if (isGK) {
    const div = Math.round(p.gkdiving || 0);
    const han = Math.round(p.gkhandling || 0);
    const kic = Math.round(p.gkkicking || 0);
    const ref = Math.round(p.gkreflexes || 0);
    const spe = Math.round((p.acceleration || 0) * 0.45 + (p.sprintspeed || 0) * 0.55);
    const pos = Math.round(p.gkpositioning || 0);
    return {
      isGK: true,
      pac: spe,
      sho: han,
      pas: kic,
      dri: ref,
      def: div,
      phy: pos,
      cards: [
        { label: 'DIV', name: 'Uçuş', val: div },
        { label: 'HAN', name: 'Elle Kontrol', val: han },
        { label: 'KIC', name: 'Degaj', val: kic },
        { label: 'REF', name: 'Refleks', val: ref },
        { label: 'HIZ', name: 'Hız', val: spe },
        { label: 'YER', name: 'Pozisyon', val: pos },
      ]
    };
  }

  const pac = Math.round((p.acceleration || 0) * 0.45 + (p.sprintspeed || 0) * 0.55);
  const sho = Math.round(
    (p.finishing || 0) * 0.45 +
    (p.longshots || 0) * 0.20 +
    (p.shotpower || 0) * 0.20 +
    (p.volleys || 0) * 0.05 +
    (p.penalties || 0) * 0.05 +
    (p.headingaccuracy || 0) * 0.05
  );
  const pas = Math.round(
    (p.shortpassing || 0) * 0.35 +
    (p.vision || 0) * 0.20 +
    (p.crossing || 0) * 0.20 +
    (p.longpassing || 0) * 0.15 +
    (p.curve || 0) * 0.05 +
    (p.freekickaccuracy || 0) * 0.05
  );
  const dri = Math.round(
    (p.dribbling || 0) * 0.50 +
    (p.ballcontrol || 0) * 0.35 +
    (p.agility || 0) * 0.10 +
    (p.balance || 0) * 0.05
  );
  const def = Math.round(
    (p.defensiveawareness || 0) * 0.30 +
    (p.standingtackle || 0) * 0.30 +
    (p.slidingtackle || 0) * 0.25 +
    (p.interceptions || 0) * 0.10 +
    (p.headingaccuracy || 0) * 0.05
  );
  const phy = Math.round(
    (p.strength || 0) * 0.50 +
    (p.stamina || 0) * 0.25 +
    (p.aggression || 0) * 0.20 +
    (p.jumping || 0) * 0.05
  );

  return {
    isGK: false,
    pac,
    sho,
    pas,
    dri,
    def,
    phy,
    cards: [
      { label: 'PAC', name: 'Hız', val: pac },
      { label: 'SHO', name: 'Şut', val: sho },
      { label: 'PAS', name: 'Pas', val: pas },
      { label: 'DRI', name: 'Dripling', val: dri },
      { label: 'DEF', name: 'Defans', val: def },
      { label: 'PHY', name: 'Fizik', val: phy },
    ]
  };
}

export function decodeBitmaskTraits(val, traitNames) {
  if (!val) return [];
  const bitStr = (val >>> 0).toString(2).padStart(traitNames.length, '0');
  const active = [];
  for (let idx = 0; idx < bitStr.length; idx++) {
    if (bitStr[idx] === '1' && idx < traitNames.length) {
      active.push(traitNames[idx]);
    }
  }
  return active;
}

export function getPlayerPlaystyles(trait1, trait2) {
  const p1 = decodeBitmaskTraits(trait1, PLAYSTYLES_1);
  const p2 = decodeBitmaskTraits(trait2, PLAYSTYLES_2);
  return [...p1, ...p2];
}

export function buildCompleteModels(db1, db2, staticNamesMap = {}) {
  // 1. Names dictionary
  const namesMap = { ...staticNamesMap };

  (db2.dcplayernames || []).forEach(r => {
    if (r.nameid !== undefined && r.name) {
      namesMap[r.nameid] = r.name;
    }
  });

  const editedNames = {};
  (db2.editedplayernames || []).forEach(r => {
    if (r.playerid) {
      editedNames[r.playerid] = {
        firstname: r.firstname || '',
        surname: r.surname || '',
        commonname: r.commonname || '',
        playerjerseyname: r.playerjerseyname || ''
      };
    }
  });

  // 2. Teams map
  const teamsMap = {};
  (db2.teams || []).forEach(t => {
    if (t.teamid) teamsMap[t.teamid] = t;
  });

  // 3. Leagues map
  const leaguesMap = {};
  (db2.leagues || []).forEach(l => {
    if (l.leagueid) leaguesMap[l.leagueid] = l.leaguename || `Lig ${l.leagueid}`;
  });

  const teamToLeague = {};
  (db2.leagueteamlinks || []).forEach(link => {
    if (link.teamid && link.leagueid) {
      teamToLeague[link.teamid] = leaguesMap[link.leagueid] || `Lig ${link.leagueid}`;
    }
  });

  // 4. Contracts map (from DB1)
  const contractsMap = {};
  (db1.career_playercontract || []).forEach(c => {
    if (c.playerid) contractsMap[c.playerid] = c;
  });

  // 5. Team Player links (from DB2)
  const teamPlayerMap = {};
  (db2.teamplayerlinks || []).forEach(link => {
    if (link.playerid) teamPlayerMap[link.playerid] = link;
  });

  // 6. Loans map
  const loansMap = {};
  (db2.playerloans || []).forEach(loan => {
    if (loan.playerid && loan.teamidloanedfrom) {
      loansMap[loan.playerid] = loan.teamidloanedfrom;
    }
  });

  // 7. Managed Club & User info
  const users = db1.career_users || [];
  const activeUser = users[0] || null;
  const managedClubId = activeUser ? activeUser.clubteamid : null;
  const managedTeamObj = managedClubId ? teamsMap[managedClubId] : null;

  // 8. Process Players
  const playersRaw = db2.players || [];
  const processedPlayers = [];

  for (let i = 0; i < playersRaw.length; i++) {
    const p = playersRaw[i];
    const pid = p.playerid;
    if (!pid) continue;

    // Names
    let fn = '', ln = '', cn = '';
    if (editedNames[pid]) {
      fn = editedNames[pid].firstname;
      ln = editedNames[pid].surname;
      cn = editedNames[pid].commonname;
    } else {
      fn = namesMap[p.firstnameid] || '';
      ln = namesMap[p.lastnameid] || '';
      cn = namesMap[p.commonnameid] || '';
    }

    let fullName = cn || (fn && ln ? `${fn} ${ln}` : (ln || fn || `Oyuncu ${pid}`));

    // Nationality & Flag
    const natId = p.nationality;
    const natObj = nationsData[natId] || { name: 'Bilinmiyor', code: 'un' };

    // Birthdate
    const bdate = parseBirthdate(p.birthdate);

    // Team & League
    const tpl = teamPlayerMap[pid] || {};
    const teamId = tpl.teamid;
    const teamObj = teamsMap[teamId] || {};
    const isFreeAgent = teamId === 111592 || !teamId;
    const teamName = isFreeAgent ? 'Serbest Oyuncu' : (teamObj.teamname || `Takım ${teamId}`);
    const leagueName = teamToLeague[teamId] || '';

    // Loan info
    const loanFromId = loansMap[pid];
    let loanStatus = 'Bonservisli';
    let ownerTeamName = teamName;
    if (loanFromId) {
      const ownerObj = teamsMap[loanFromId];
      ownerTeamName = ownerObj ? ownerObj.teamname : `Takım ${loanFromId}`;
      loanStatus = `${ownerTeamName} kulübünden kiralık`;
    }

    // Contract & Wage
    const contract = contractsMap[pid] || {};
    let wage = contract.wage || 0;
    if (!wage && !isFreeAgent) {
      wage = calcEstimatedWage(p.overallrating, p.potential, bdate.age, isFreeAgent);
    }
    const contractExpiry = isFreeAgent ? '' : (p.contractvaliduntil || '');

    // Squad status (As / Yedek / Rezerv)
    const squadPos = tpl.position !== undefined ? tpl.position : -1;
    let isStarter = false;
    let isSub = false;
    let isReserve = false;
    if (squadPos >= 0 && squadPos < 28) {
      isStarter = true;
    } else if (squadPos === 28) {
      isSub = true;
    } else {
      isReserve = true;
    }

    // Positions
    const positions = [];
    ['preferredposition1', 'preferredposition2', 'preferredposition3', 'preferredposition4'].forEach(k => {
      const posCode = p[k];
      if (POSITION_MAP[posCode] && !positions.includes(POSITION_MAP[posCode])) {
        positions.push(POSITION_MAP[posCode]);
      }
    });
    const primaryPos = positions[0] || (POSITION_MAP[squadPos] || 'CM');

    // Market Value
    const estimatedValue = calcEstimatedValue(p.overallrating, p.potential, bdate.age);

    // PlayStyles
    const playstyles = getPlayerPlaystyles(p.trait1, p.trait2);
    const playstylesPlus = getPlayerPlaystyles(p.icontrait1, p.icontrait2);

    // 6-Pillar Card Stats (PAC, SHO, PAS, DRI, DEF, PHY / GK)
    const pillarStats = calcPlayerPillarStats(p, primaryPos === 'GK');

    processedPlayers.push({
      id: pid,
      name: fullName,
      commonName: cn,
      firstName: fn,
      lastName: ln,
      nationalityId: natId,
      nationalityName: natObj.name,
      countryCode: natObj.code,
      teamId,
      teamName,
      leagueName,
      ownerTeamName,
      loanStatus,
      isManagedTeamPlayer: teamId === managedClubId,
      isStarter,
      isSub,
      isReserve,
      squadPositionCode: squadPos,
      jerseyNumber: tpl.jerseynumber || '',
      primaryPosition: primaryPos,
      positions,
      overall: p.overallrating || 0,
      potential: p.potential || 0,
      growthDiff: (p.potential || 0) - (p.overallrating || 0),
      gender: p.gender !== undefined ? p.gender : 0,
      age: bdate.age,
      birthDateStr: bdate.formatted,
      birthDay: bdate.day,
      birthMonth: bdate.month,
      birthYear: bdate.year,
      wage,
      formattedWage: formatCurrency(wage),
      value: estimatedValue,
      formattedValue: formatCurrency(estimatedValue),
      contractExpiry,
      height: p.height || 0,
      weight: p.weight || 0,
      preferredFoot: p.preferredfoot === 1 ? 'Sol' : 'Sağ',
      weakFoot: p.weakfootabilitytypecode || 1,
      skillMoves: p.skillmoves || 1,
      // Attributes
      acceleration: p.acceleration || 0,
      sprintSpeed: p.sprintspeed || 0,
      finishing: p.finishing || 0,
      shotPower: p.shotpower || 0,
      longShots: p.longshots || 0,
      volleys: p.volleys || 0,
      penalties: p.penalties || 0,
      shortPassing: p.shortpassing || 0,
      longPassing: p.longpassing || 0,
      vision: p.vision || 0,
      crossing: p.crossing || 0,
      freeKickAccuracy: p.freekickaccuracy || 0,
      curve: p.curve || 0,
      ballControl: p.ballcontrol || 0,
      dribbling: p.dribbling || 0,
      agility: p.agility || 0,
      balance: p.balance || 0,
      reactions: p.reactions || 0,
      composure: p.composure || 0,
      defensiveAwareness: p.defensiveawareness || 0,
      standingTackle: p.standingtackle || 0,
      slidingTackle: p.slidingtackle || 0,
      interceptions: p.interceptions || 0,
      headingAccuracy: p.headingaccuracy || 0,
      jumping: p.jumping || 0,
      stamina: p.stamina || 0,
      strength: p.strength || 0,
      aggression: p.aggression || 0,
      gkDiving: p.gkdiving || 0,
      gkHandling: p.gkhandling || 0,
      gkKicking: p.gkkicking || 0,
      gkPositioning: p.gkpositioning || 0,
      gkReflexes: p.gkreflexes || 0,
      playstyles,
      playstylesPlus,
      pillarStats,
      pac: pillarStats.pac,
      sho: pillarStats.sho,
      pas: pillarStats.pas,
      dri: pillarStats.dri,
      def: pillarStats.def,
      phy: pillarStats.phy,
    });
  }

  // 9. Process Teams
  const processedTeams = (db2.teams || []).map(t => ({
    id: t.teamid,
    name: t.teamname,
    league: teamToLeague[t.teamid] || '',
    overall: t.overallrating || 0,
    attack: t.attackrating || 0,
    midfield: t.midfieldrating || 0,
    defense: t.defenserating || 0,
    stadiumCapacity: t.teamstadiumcapacity || 0,
    foundationYear: t.foundationyear || 0,
  }));

  // Managed squad breakdown
  const managedSquad = processedPlayers.filter(p => p.isManagedTeamPlayer);
  const starters = managedSquad.filter(p => p.isStarter);
  const substitutes = managedSquad.filter(p => p.isSub || p.isReserve);

  return {
    players: processedPlayers,
    teams: processedTeams,
    managedClub: managedTeamObj ? {
      id: managedClubId,
      name: managedTeamObj.teamname,
      isWomenClub: managedTeamObj.gender === 1,
      managerName: activeUser ? `${activeUser.firstname} ${activeUser.surname}`.trim() : '',
      season: activeUser ? activeUser.seasoncount : 1,
      wage: activeUser ? activeUser.wage : 0,
      totalSquadWage: managedSquad.reduce((sum, p) => sum + p.wage, 0),
      squadCount: managedSquad.length,
      startersCount: starters.length,
      subsCount: substitutes.length
    } : null,
    managedSquad,
    starters,
    substitutes
  };
}
