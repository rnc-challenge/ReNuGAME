const GameEngine = (() => {
  function startGame(patientId) {
    const patient = DB.findPatient(patientId);
    if (!patient) throw new Error('Patient not found. PatientsシートのID列を確認してください。');

    const deck = shuffle_(DB.getCards());
    const hand = deck.splice(0, CONFIG.INITIAL_HAND_SIZE);
    const event = drawEvent_();

    const state = {
      patientId: patient.PatientID,
      patientName: patient.Name,
      disease: patient.Disease,
      turn: 1,
      maxTurn: CONFIG.MAX_TURN,
      status: pickStatus_(patient),
      hand,
      deck,
      usedCards: [],
      currentEvent: event,
      log: []
    };

    applyEffect_(state.status, event);
    state.log.push(`Turn 1: イベント「${event.Name || event.ID}」発生`);
    return state;
  }

  function useCard(state, cardId) {
    const idx = state.hand.findIndex(c => String(c.ID) === String(cardId) || String(c.CardID) === String(cardId));
    if (idx < 0) throw new Error('Card not in hand: ' + cardId);

    const card = state.hand.splice(idx, 1)[0];
    applyEffect_(state.status, card);
    state.usedCards.push(card);
    state.log.push(`Turn ${state.turn}: 「${card.Name || card.ID}」を使用`);

    if (state.deck.length > 0) state.hand.push(state.deck.shift());
    return state;
  }

  function nextTurn(state) {
    if (state.turn >= state.maxTurn) {
      state.finished = true;
      state.result = judge_(state);
      return state;
    }
    state.turn += 1;
    const event = drawEvent_();
    state.currentEvent = event;
    applyEffect_(state.status, event);
    state.log.push(`Turn ${state.turn}: イベント「${event.Name || event.ID}」発生`);
    return state;
  }

  function drawEvent_() {
    const events = DB.getEvents();
    return events[Math.floor(Math.random() * events.length)];
  }

  function applyEffect_(status, obj) {
    STATUS_KEYS.forEach(k => {
      status[k] = clamp_(Number(status[k] || 0) + Number(obj[k] || 0));
    });
  }

  function pickStatus_(obj) {
    const out = {};
    STATUS_KEYS.forEach(k => out[k] = clamp_(Number(obj[k] || 0)));
    return out;
  }

  function clamp_(v) {
    return Math.max(CONFIG.MIN_STATUS, Math.min(CONFIG.MAX_STATUS, v));
  }

  function shuffle_(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function judge_(state) {
    const sum = STATUS_KEYS.reduce((s, k) => s + Number(state.status[k] || 0), 0);
    const avg = sum / STATUS_KEYS.length;
    return {
      score: Math.round(avg * 10),
      clear: avg >= 6,
      message: avg >= 6 ? 'クリア' : '未達成'
    };
  }

  return { startGame, useCard, nextTurn };
})();
