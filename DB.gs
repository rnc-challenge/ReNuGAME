const CONFIG = {
  SPREADSHEET_ID: '1FFtoyWUxtX-frTr7jiSgAgf5gLoQ_EW1a49xX5DjYKs',
  MAX_STATUS: 10,
  MIN_STATUS: 0,
  INITIAL_HAND_SIZE: 4,
  MAX_TURN: 3
};

// ゲーム内部キー
const STATUS_KEYS = ['Pain', 'Activity', 'Muscle', 'Nutrition', 'Balance', 'Alertness', 'Hydration'];

// 表示名
const STATUS_LABELS = {
  Pain: '❤️ 症状・痛み',
  Activity: '🚶 活動性',
  Muscle: '💪 筋力',
  Nutrition: '🍚 栄養',
  Balance: '⚖ バランス',
  Alertness: '😴 覚醒・睡眠',
  Hydration: '💧 水分'
};

// シート側の列名候補。左から優先して読む。
const STATUS_COLUMNS = {
  Pain: ['Status_❤️Pain', 'Pain', '❤️Pain', '症状・痛み'],
  Activity: ['Status_🚶Activity', 'Activity', '🚶Activity', '活動性'],
  Muscle: ['Status_💪Muscle', 'Muscle', '💪Muscle', '筋力'],
  Nutrition: ['Status_🍚Nutrition', 'Nutrition', '🍚Nutrition', '栄養'],
  Balance: ['Status_⚖Balance', 'Balance', '⚖Balance', 'バランス'],
  Alertness: ['Status_😴Alertness', 'Alertness', 'Sleep', 'Status_😴Sleep', '😴Alertness', '睡眠'],
  Hydration: ['Status_💧Hydration', 'Hydration', 'Water', 'Status_💧Water', '💧Hydration', '水分']
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

  function normalizeStatus_(obj) {
    STATUS_KEYS.forEach(k => {
      const v = getFirst_(obj, STATUS_COLUMNS[k], 0);
      obj[k] = Number(v || 0);
    });
    return obj;
  }

  function normalizeCard_(obj) {
    normalizeStatus_(obj);
    obj.ID = String(obj.CardID || obj.EventID || obj.ID || '').trim();
    obj.Name = String(obj.Name || obj['名称'] || obj['カード名'] || obj['患者名'] || obj.ID || '').trim();
    obj.Type = String(obj.Type || obj['種類'] || obj['区分'] || '').trim();
    obj.Category = String(obj.Category || obj['分類'] || '').trim();
    obj.Learning = String(obj.Learning || obj['学び'] || obj['学習テーマ'] || obj['学びポイント'] || '').trim();
    return obj;
  }

  function normalizePatient_(obj) {
    normalizeStatus_(obj);
    obj.PatientID = String(obj.PatientID || obj.ID || '').trim();
    obj.Name = String(obj.Name || obj['患者名'] || obj['患者'] || obj.PatientID || '').trim();
    obj.Disease = String(obj.Disease || obj['疾患'] || '').trim();
    return obj;
  }

  function getPatients() {
    return readSheet_('Patients').map(normalizePatient_);
  }

  function getCards() {
    // まずGAS用シートを読む。なければCards_All、Cardsの順に読む。
    for (const name of ['Card_Effects_GAS', 'Cards_All', 'Cards']) {
      try {
        return readSheet_(name)
          .map(normalizeCard_)
          .filter(c => c.ID && !String(c.ID).startsWith('E'));
      } catch (e) {}
    }
    throw new Error('Card sheet not found');
  }

  function getEvents() {
    for (const name of ['Event_Effects_GAS', 'Events']) {
      try {
        return readSheet_(name)
          .map(normalizeCard_)
          .filter(e => e.ID || String(e.EventID || '').startsWith('E'));
      } catch (e) {}
    }
    throw new Error('Event sheet not found');
  }

  function findPatient(patientId) {
    return getPatients().find(p => String(p.PatientID) === String(patientId));
  }

  return { getPatients, getCards, getEvents, findPatient };
})();
