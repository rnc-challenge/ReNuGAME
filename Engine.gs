const GameEngine = (() => {
  function startGame(patientId) {
    const patient = DB.findPatient(patientId);
    if (!patient) throw new Error('Patientsシートで患者が見つかりません。');

    const statusRow = DB.findStatus(patient.PatientID);
    if (!statusRow) throw new Error(`Patient_Statusに ${patient.PatientID} がありません。`);

    const patientDeck = DB.getDeckForPatient(patient.PatientID);

    if (patientDeck.fixedCards.length < CONFIG.FIXED_HAND_COUNT) {
      throw new Error(`${patient.PatientID} の固定カードが不足しています。Patient_DeckでDeckRole=固定を2枚設定してください。`);
    }
    if (patientDeck.candidateCards.length < CONFIG.CANDIDATE_DRAW_COUNT) {
      throw new Error(`${patient.PatientID} の候補カードが不足しています。Patient_DeckでDeckRole=候補を3枚以上設定してください。`);
    }

    const fixedCards = patientDeck.fixedCards.slice(0, CONFIG.FIXED_HAND_COUNT);
    const shuffledCandidates = shuffle_(patientDeck.candidateCards);
    const chosenCandidates = shuffledCandidates.slice(0, CONFIG.CANDIDATE_DRAW_COUNT);
    const remainingCandidates = shuffledCandidates.slice(CONFIG.CANDIDATE_DRAW_COUNT);

    const hand = fixedCards.concat(chosenCandidates);
    const deck = shuffle_(remainingCandidates.concat(patientDeck.addCards));

    const eventDeck = shuffle_(DB.getEventsForPatient(patient.PatientID));
    if (eventDeck.length === 0) throw new Error(`${patient.PatientID} に使用できるイベントがありません。`);

    const currentEvent = eventDeck.shift();
    const initialStatus = pickStatus_(statusRow);

    const state = {
      gameId: Utilities.getUuid(),

      patientId: patient.PatientID,
      patient: patient,

      turn: 1,
      maxTurn: CONFIG.MAX_TURN,
      gameOver: false,

      status: Object.assign({}, initialStatus),
      goals: pickGoals_(statusRow),
      statusHistory: [
        {
          label: '開始時',
          turn: 0,
          status: Object.assign({}, initialStatus)
        }
      ],

      fixedCards,
      chosenCandidates,
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

      log: [
        `ゲーム開始：${patient.PatientID} ${patient.Name}`,
        'Turn 1: イベントカードをめくってください'
      ]
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
    if (idx < 0) throw new Error('手札にそのカードがありません: ' + cardId);

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

    recordStatusHistory_(state);
    state.eventDiscard.push(state.currentEvent);

    if (state.turn >= state.maxTurn) {
      state.gameOver = true;
      state.finished = true;
      state.result = judge_(state);
      state.log.push(`最終結果：${state.result.message}（${state.result.score}点）`);
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

  function recordStatusHistory_(state) {
    const label = state.turn >= state.maxTurn ? '最終結果' : `${state.turn}ターン終了時`;
    const alreadyRecorded = state.statusHistory.some(h => h.turn === state.turn);
    if (alreadyRecorded) return;

    state.statusHistory.push({
      label,
      turn: state.turn,
      status: Object.assign({}, state.status)
    });
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

  function pickGoals_(obj) {
    const out = {};
    STATUS_KEYS.forEach(k => out[k] = Number(obj['Goal_' + k] || 0));
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
    const goalKeys = STATUS_KEYS.filter(k => Number(state.goals[k] || 0) > 0);
    let achieved = 0;

    goalKeys.forEach(k => {
      if (Number(state.status[k] || 0) >= Number(state.goals[k] || 0)) achieved++;
    });

    const score = goalKeys.length
      ? Math.round((achieved / goalKeys.length) * 100)
      : Math.round((STATUS_KEYS.reduce((s, k) => s + Number(state.status[k] || 0), 0) / STATUS_KEYS.length) * 10);

    return {
      score,
      clear: score >= 100,
      message: score >= 100 ? 'クリア' : '未達成',
      achieved,
      totalGoals: goalKeys.length
    };
  }

  return { startGame, revealEvent, useCard, nextTurn };
})();
