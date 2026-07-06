function testStartP01() {
  const state = GameEngine.startGame('P01');
  Logger.log(JSON.stringify(state, null, 2));
}
