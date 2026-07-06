function testStartP001() {
  const state = GameEngine.startGame('P001');
  Logger.log(JSON.stringify(state, null, 2));
}

function debugDb() {
  Logger.log(JSON.stringify(apiDebugDb(), null, 2));
}
