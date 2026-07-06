function testStartP01() {
  const state = GameEngine.startGame('P01');
  Logger.log(JSON.stringify(state, null, 2));
}

function debugPatients() {
  Logger.log(JSON.stringify(DB.getPatients(), null, 2));
}

function debugCards() {
  Logger.log(JSON.stringify(DB.getCards().slice(0, 5), null, 2));
}

function debugEvents() {
  Logger.log(JSON.stringify(DB.getEvents().slice(0, 5), null, 2));
}
