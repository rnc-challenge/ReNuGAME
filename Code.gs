function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('リハ栄養カードゲーム v0.8')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function apiGetPatients() {
  return DB.getPatients();
}

function apiStartGame(patientId) {
  return GameEngine.startGame(patientId || 'P001');
}

function apiRevealEvent(state) {
  return GameEngine.revealEvent(state);
}

function apiUseCard(state, cardId) {
  return GameEngine.useCard(state, cardId);
}

function apiNextTurn(state) {
  return GameEngine.nextTurn(state);
}

function apiDebugDb() {
  return {
    patients: DB.getPatients().slice(0, 3),
    cards: DB.getCards().slice(0, 3),
    events: DB.getEvents().slice(0, 3),
    deck: DB.getPatientDeckRows().slice(0, 20)
  };
}
