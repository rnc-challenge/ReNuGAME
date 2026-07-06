const GameEngine = (() => {
  function startGame(patientId) {
    const patient = DB.findPatient(patientId);
    if (!patient) throw new Error('Patient not found. Patient_Statusシートを確認してください。');

    const patientDeck = DB.getDeckForPatient(patient.PatientID);
    if (patientDeck.initialHand.length === 0) {
      throw new Error(`Patient_Deckに ${patient.PatientID} の初期手札がありません。DeckRole=Initial を設定してください。`);
    }
    if (patientDeck.addDeck.length === 0) {
      throw new Error(`Patient_Deckに ${patient.PatientID} の追加用デッキがありません。DeckRole=Add を設定してください。`);
    }

    const deck = shuffle_(patientDeck.addDeck);
    const hand = patientDeck.initialHand.slice();
    const eventDeck = shuffle_(DB.getEventsForPatient(patient.PatientID));
    if (eventDeck.length === 0) throw new Error(`${patient.PatientID} に使用できるイベントがありません。対象患者列を確認してください。`);

    const currentEvent = eventDeck.shift();

    const state = {
      gameId: Utilities.getUuid(),
      patientId: patient.PatientID,
      patientName: patient.Name,
      disease: patient.Disease,
      want: patient.Want,
      difficulty: patient.Difficulty,
      special: patient.Special,

      turn: 1,
      maxTurn: CONFIG.MAX_TURN,
      gameOver: false,

      status: pickStatus_(patient),

      hand,
      deck,
      discard: [],
      usedCards: [],
      permanentCards: [],

      eventDeck,
      eventDiscard: [],
      currentEvent,
      eventRevealed: false,
      eventHistory: [],

      cardsUsedThisTurn: 0,
      maxCardsPerTurn: CONFIG.MAX_CARDS_PER_TURN,

      log: ['Turn 1: イベントカードをめくってください']
    };

    return state;
  }

  function revealEvent(state) {
    if (!state.currentEvent) throw new Error('イベントカードがありません。');
    if (state.eventRevealed) return state;

    applyEffect_(state.status, state.currentEvent);
    state.eventRevealed = true;
    state.eventHistory.push(state.currentEvent);
    state.log.push(`Turn ${state.turn}: イベント「${state.currentEvent.Name || state.currentEvent.ID}」発生`);
    return state;
  }

  function useCard(state, cardId) {
    if (!state.eventRevealed) {
      throw new Error('先にイベントカードをクリックして表示してください。');
    }
    if (state.cardsUsedThisTurn >= state.maxCardsPerTurn) {
      throw new Error(`このターンで使えるカードは${state.maxCardsPerTurn}枚までです。`);
    }

    const idx = state.hand.findIndex(c => String(c.ID) === String(cardId));
    if (idx < 0) throw new Error('Card not in hand: ' + cardId);

    const card = state.hand.splice(idx, 1)[0];
    applyEffect_(state.status, card);

    state.usedCards.push(card);
    state.cardsUsedThisTurn++;

    if (isPermanent_(card)) {
      state.permanentCards.push(card);
      state.log.push(`Turn ${state.turn}: 永続カード「${card.Name || card.ID}」を設置`);
    } else {
      state.discard.push(card);
      state.log.push(`Turn ${state.turn}: 「${card.Name || card.ID}」を使用`);
    }

    drawOne_(state);
    return state;
  }

  function nextTurn(state) {
    if (!state.eventRevealed) {
      throw new Error('イベントカードをめくってから次のターンへ進んでください。');
    }

    state.eventDiscard.push(state.currentEvent);

    if (state.turn >= state.maxTurn) {
      state.gameOver = true;
      state.finished = true;
      state.result = judge_(state);
      return state;
    }

    state.turn += 1;
    state.cardsUsedThisTurn = 0;
    state.eventRevealed = false;

    if (state.eventDeck.length === 0 && state.eventDiscard.length > 0) {
      state.eventDeck = shuffle_(state.eventDiscard);
      state.eventDiscard = [];
      state.log.push('イベント捨て札をシャッフルして山札に戻した');
    }

    state.currentEvent = state.eventDeck.shift();
    state.log.push(`Turn ${state.turn}: イベントカードをめくってください`);

    return state;
  }

  function drawOne_(state) {
    if (state.deck.length === 0 && state.discard.length > 0) {
      state.deck = shuffle_(state.discard);
      state.discard = [];
      state.log.push('捨て札をシャッフルして山札に戻した');
    }
    if (state.deck.length > 0) {
      state.hand.push(state.deck.shift());
    }
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

  function isPermanent_(card) {
    return String(card.UseType || '').includes('永続') ||
           String(card.Subtype || '').includes('永続') ||
           String(card.Type || '').includes('永続');
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

  return { startGame, revealEvent, useCard, nextTurn };
})();
