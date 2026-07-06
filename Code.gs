function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('リハ栄養カードゲーム MVP v0.2')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function apiStartGame(patientId) {
  return GameEngine.startGame(patientId || 'P01');
}

function apiUseCard(state, cardId) {
  return GameEngine.useCard(state, cardId);
}

function apiNextTurn(state) {
  return GameEngine.nextTurn(state);
}

function apiGetPatients() {
  return DB.getPatients();
}
