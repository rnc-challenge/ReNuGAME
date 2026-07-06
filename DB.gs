const CONFIG = {
  SPREADSHEET_ID: '1FFtoyWUxtX-frTr7jiSgAgf5gLoQ_EW1a49xX5DjYKs',
  MAX_STATUS: 10,
  MIN_STATUS: 0,
  MAX_TURN: 3,
  MAX_CARDS_PER_TURN: 2,
  FIXED_HAND_COUNT: 2,
  CANDIDATE_DRAW_COUNT: 3
};

const STATUS_KEYS = ['Pain', 'Activity', 'Muscle', 'Nutrition', 'Balance', 'Alertness', 'Hydration'];

const STATUS_LABELS = {
  Pain: '❤️ 症状・痛み',
  Activity: '🚶 活動性',
  Muscle: '💪 筋力',
  Nutrition: '🍚 栄養',
  Balance: '⚖ バランス',
  Alertness: '😴 覚醒・睡眠',
  Hydration: '💧 水分'
};

const DB = (() => {
  function ss_() {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }

  function readSheet_(name) {
    const sh = ss_().getSheetByName(name);
    if (!sh) throw new Error('Sheet not found: ' + name);
    const values = sh.getDataRange().getValues();
    if (values.length < 2) return [];
    const headers = values[0].map(h => String(h).trim());
    return values.slice(1).filter(r => r.some(v => v !== '')).map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
  }

  function getFirst_(obj, names, fallback) {
    for (const n of names) {
      if (obj[n] !== undefined && obj[n] !== '') return obj[n];
    }
    return fallback;
  }

  function normalizeEffect_(obj) {
    STATUS_KEYS.forEach(k => {
      const val = getFirst_(obj, [k, k === 'Alertness' ? 'Sleep' : k], 0);
      obj[k] = Number(val || 0);
    });
    return obj;
  }

  function getPatients() {
    return readSheet_('Patients').map(row => ({
      PatientID: String(getFirst_(row, ['PatientID', 'Patient', '患者ID', 'ID'], '')).trim(),
      Name: String(getFirst_(row, ['患者名', 'Name', '氏名'], '')).trim(),
      Age: String(getFirst_(row, ['年齢', 'Age'], '')).trim(),
      Sex: String(getFirst_(row, ['性別', 'Sex'], '')).trim(),
      Disease: String(getFirst_(row, ['主疾患', 'Disease', '疾患'], '')).trim(),
      SubDisease: String(getFirst_(row, ['副疾患', 'SubDisease'], '')).trim(),
      Height: String(getFirst_(row, ['身長(cm)', '身長', 'Height'], '')).trim(),
      Weight: String(getFirst_(row, ['体重(kg)', '体重', 'Weight'], '')).trim(),
      BMI: String(getFirst_(row, ['BMI'], '')).trim(),
      Life: String(getFirst_(row, ['生活背景', 'Life'], '')).trim(),
      CareLevel: String(getFirst_(row, ['介護度', 'CareLevel'], '')).trim(),
      Walking: String(getFirst_(row, ['歩行能力', 'Walking'], '')).trim(),
      Cognition: String(getFirst_(row, ['認知機能', 'Cognition'], '')).trim(),
      NutritionStatus: String(getFirst_(row, ['栄養状態', 'NutritionStatus'], '')).trim(),
      MedicationCount: String(getFirst_(row, ['服薬数', 'MedicationCount'], '')).trim(),
      Goal: String(getFirst_(row, ['患者の目標', '目標', 'Goal'], '')).trim(),
      Values: String(getFirst_(row, ['本人が大切にしていること', 'Values'], '')).trim(),
      Summary: String(getFirst_(row, ['症例概要', '患者背景', 'Summary'], '')).trim(),
      Difficulty: String(getFirst_(row, ['難易度', 'Difficulty'], '')).trim()
    })).filter(p => p.PatientID);
  }

  function getPatientStatusRows() {
    return readSheet_('Patient_Status').map(row => {
      const obj = {
        PatientID: String(getFirst_(row, ['PatientID', 'Patient', '患者ID', 'ID'], '')).trim()
      };
      STATUS_KEYS.forEach(k => {
        obj[k] = Number(getFirst_(row, [k, k === 'Alertness' ? 'Sleep' : k], 0) || 0);
        obj['Goal_' + k] = Number(getFirst_(row, ['Goal_' + k, k === 'Alertness' ? 'Goal_Sleep' : 'Goal_' + k], 0) || 0);
      });
      return obj;
    }).filter(r => r.PatientID);
  }

  function getCards() {
    return readSheet_('Card_Effects_Normalized').map(row => {
      normalizeEffect_(row);
      return {
        ID: String(getFirst_(row, ['CardID', 'ID'], '')).trim(),
        CardID: String(getFirst_(row, ['CardID', 'ID'], '')).trim(),
        Type: String(getFirst_(row, ['カード種別', '種類', 'Type'], '')).trim(),
        Subtype: String(getFirst_(row, ['サブタイプ', 'Subtype'], '')).trim(),
        UseType: String(getFirst_(row, ['使用区分', 'UseType'], '')).trim(),
        Name: String(getFirst_(row, ['カード名', 'Name', '名称'], '')).trim(),
        EffectText: String(getFirst_(row, ['効果テキスト', '効果', 'EffectText'], '')).trim(),
        SideEffect: String(getFirst_(row, ['副作用/特殊', '副作用', 'SideEffect'], '')).trim(),
        Category: String(getFirst_(row, ['分類', 'Category'], '')).trim(),
        Learning: String(getFirst_(row, ['学びテーマ', 'Learning', '学び'], '')).trim(),
        Targets: String(getFirst_(row, ['対象患者', 'Targets'], '')).trim(),
        Pain: row.Pain,
        Activity: row.Activity,
        Muscle: row.Muscle,
        Nutrition: row.Nutrition,
        Balance: row.Balance,
        Alertness: row.Alertness,
        Hydration: row.Hydration
      };
    }).filter(c => c.ID);
  }

  function getEvents() {
    return readSheet_('Event_Effects_Normalized').map(row => {
      normalizeEffect_(row);
      return {
        ID: String(getFirst_(row, ['EventID', 'ID'], '')).trim(),
        EventID: String(getFirst_(row, ['EventID', 'ID'], '')).trim(),
        Type: String(getFirst_(row, ['区分', 'Type'], '')).trim(),
        Name: String(getFirst_(row, ['イベント名', 'カード名', 'Name', '名称'], '')).trim(),
        EffectText: String(getFirst_(row, ['効果テキスト', '効果', 'EffectText'], '')).trim(),
        Category: String(getFirst_(row, ['分類', 'Category'], '')).trim(),
        Learning: String(getFirst_(row, ['学びテーマ', 'Learning', '学び'], '')).trim(),
        Targets: String(getFirst_(row, ['対象患者', 'Targets'], '')).trim(),
        Pain: row.Pain,
        Activity: row.Activity,
        Muscle: row.Muscle,
        Nutrition: row.Nutrition,
        Balance: row.Balance,
        Alertness: row.Alertness,
        Hydration: row.Hydration
      };
    }).filter(e => e.ID);
  }

  function getEventsForPatient(patientId) {
    return getEvents().filter(event => {
      const targets = String(event.Targets || '').replace(/\s/g, '');
      if (targets === '' || targets === 'ALL' || targets === '全患者') return true;
      return targets.split(',').includes(patientId);
    });
  }

  function getPatientDeckRows() {
    return readSheet_('Patient_Deck').map(row => ({
      PatientID: String(getFirst_(row, ['PatientID', 'Patient', '患者ID'], '')).trim(),
      CardID: String(getFirst_(row, ['CardID', 'カードID'], '')).trim(),
      DeckRole: String(getFirst_(row, ['DeckRole', 'Role', '区分'], '')).trim(),
      SortOrder: Number(getFirst_(row, ['SortOrder', 'Order', '順番'], 999) || 999),
      Notes: String(getFirst_(row, ['Notes', '備考'], '')).trim()
    })).filter(r => r.PatientID && r.CardID);
  }

  function getDeckForPatient(patientId) {
    const cardById = {};
    getCards().forEach(card => cardById[String(card.ID)] = card);

    const rows = getPatientDeckRows()
      .filter(row => String(row.PatientID).trim() === String(patientId).trim())
      .filter(row => cardById[String(row.CardID).trim()]);

    const fixedRows = rows
      .filter(row => ['固定', 'Fixed'].includes(String(row.DeckRole).trim()))
      .sort((a, b) => a.SortOrder - b.SortOrder);

    const candidateRows = rows
      .filter(row => ['候補', 'Candidate'].includes(String(row.DeckRole).trim()))
      .sort((a, b) => a.SortOrder - b.SortOrder);

    const addRows = rows
      .filter(row => ['追加', '追加用', 'Add'].includes(String(row.DeckRole).trim()))
      .sort((a, b) => a.SortOrder - b.SortOrder);

    const fixedCards = fixedRows.map(row => cardById[String(row.CardID).trim()]);
    const candidateCards = candidateRows.map(row => cardById[String(row.CardID).trim()]);
    const addCards = addRows.map(row => cardById[String(row.CardID).trim()]);

    return { fixedCards, candidateCards, addCards, rows };
  }

  function findPatient(patientId) {
    const patients = getPatients();
    return patients.find(p => String(p.PatientID) === String(patientId)) || patients[0];
  }

  function findStatus(patientId) {
    const rows = getPatientStatusRows();
    return rows.find(r => String(r.PatientID) === String(patientId));
  }

  return {
    getPatients,
    getPatientStatusRows,
    getCards,
    getEvents,
    getEventsForPatient,
    getPatientDeckRows,
    getDeckForPatient,
    findPatient,
    findStatus
  };
})();
