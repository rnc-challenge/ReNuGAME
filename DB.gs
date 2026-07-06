const CONFIG = {
  // Googleスプレッドシートにアップロード後、IDをここに貼る
  SPREADSHEET_ID: 'PASTE_SPREADSHEET_ID_HERE',
  MAX_STATUS: 10,
  MIN_STATUS: 0,
  INITIAL_HAND_SIZE: 4,
  MAX_TURN: 3
};

const STATUS_KEYS = ['Pain', 'Activity', 'Muscle', 'Nutrition', 'Balance', 'Sleep', 'Hydration'];

const DB = (() => {
  function ss_() {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }

  function readSheet_(name) {
    const sh = ss_().getSheetByName(name);
    if (!sh) throw new Error('Sheet not found: ' + name);
    const values = sh.getDataRange().getValues();
    if (values.length < 2) return [];
    const headers = values[0].map(String);
    return values.slice(1).filter(r => r.some(v => v !== '')).map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
  }

  function getPatients() {
    return readSheet_('Patients').map(p => normalizeStatus_(p));
  }

  function getCards() {
    // Card_Effects_GAS があれば優先。なければ Cards を読む
    try {
      return readSheet_('Card_Effects_GAS').map(c => normalizeStatus_(c));
    } catch (e) {
      return readSheet_('Cards').map(c => normalizeStatus_(c));
    }
  }

  function getEvents() {
    try {
      return readSheet_('Event_Effects_GAS').map(e => normalizeStatus_(e));
    } catch (e) {
      return readSheet_('Events').map(e => normalizeStatus_(e));
    }
  }

  function normalizeStatus_(obj) {
    STATUS_KEYS.forEach(k => obj[k] = Number(obj[k] || 0));
    return obj;
  }

  function findPatient(patientId) {
    return getPatients().find(p => String(p.PatientID) === String(patientId));
  }

  function findCard(cardId) {
    return getCards().find(c => String(c.CardID) === String(cardId));
  }

  return { getPatients, getCards, getEvents, findPatient, findCard };
})();
