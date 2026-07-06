/**
 * リハ栄養カードゲーム GAS v1.1
 *
 * v1.1 修正点
 * - Patient_Status の旧列名にも対応
 *   Pain / Initial_Pain / Status_❤️Pain
 *   Activity / Initial_Activity / Status_🚶Activity
 *   Muscle / Initial_Muscle / Status_💪Muscle
 *   Nutrition / Initial_Nutrition / Status_🍚Nutrition
 *   Balance / Initial_Balance / Status_⚖Balance
 *   Alertness / Sleep / Initial_Alertness / Initial_Sleep / Status_😴Alertness / Status_😴Sleep
 *   Hydration / Initial_Hydration / Status_💧Hydration
 * - ファイル末尾に誤って追加された getPatientStatusRows は不要
 * - Code.gs 1本にDBとゲームエンジンを統合
 */

// ===============================
// Config
// ===============================

const CONFIG = {
  SPREADSHEET_ID: '1FFtoyWUxtX-frTr7jiSgAgf5gLoQ_EW1a49xX5DjYKs',
  MAX_STATUS: 10,
  MIN_STATUS: 0,
  MAX_TURN: 3,
  MAX_CARDS_PER_TURN: 2,
  FIXED_HAND_COUNT: 2,
  CANDIDATE_DRAW_COUNT: 3
};

const STATUS_KEYS = [
  'Pain',
  'Activity',
  'Muscle',
  'Nutrition',
  'Balance',
  'Alertness',
  'Hydration'
];

const STATUS_LABELS = {
  Pain: '❤️ 症状・痛み',
  Activity: '🚶 活動性',
  Muscle: '💪 筋力',
  Nutrition: '🍚 栄養',
  Balance: '⚖ バランス',
  Alertness: '😴 覚醒・睡眠',
  Hydration: '💧 水分'
};

// ===============================
// Web App API
// ===============================

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('リハ栄養カードゲーム v1.1')
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
    patientStatus: DB.getPatientStatusRows().slice(0, 3),
    cards: DB.getCards().slice(0, 3),
    events: DB.getEvents().slice(0, 3),
    deck: DB.getPatientDeckRows().slice(0, 20)
  };
}

// ===============================
// Database
// ===============================

const DB = (function () {
  function ss_() {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }

  function readSheet_(name) {
    const sh = ss_().getSheetByName(name);
    if (!sh) throw new Error('Sheet not found: ' + name);

    const values = sh.getDataRange().getValues();
    if (values.length < 2) return [];

    const headers = values[0].map(function (h) {
      return String(h).trim();
    });

    return values
      .slice(1)
      .filter(function (row) {
        return row.some(function (v) {
          return v !== '' && v !== null;
        });
      })
      .map(function (row) {
        const obj = {};
        headers.forEach(function (h, i) {
          obj[h] = row[i];
        });
        return obj;
      });
  }

  function getFirst_(obj, names, fallback) {
    for (let i = 0; i < names.length; i++) {
      const n = names[i];
      if (obj[n] !== undefined && obj[n] !== null && obj[n] !== '') {
        return obj[n];
      }
    }
    return fallback;
  }

  function number_(value, fallback) {
    if (value === undefined || value === null || value === '') return fallback || 0;
    const n = Number(value);
    return isNaN(n) ? (fallback || 0) : n;
  }

  function normalizeEffect_(obj) {
    obj.Pain = number_(getFirst_(obj, ['Pain'], 0), 0);
    obj.Activity = number_(getFirst_(obj, ['Activity'], 0), 0);
    obj.Muscle = number_(getFirst_(obj, ['Muscle'], 0), 0);
    obj.Nutrition = number_(getFirst_(obj, ['Nutrition'], 0), 0);
    obj.Balance = number_(getFirst_(obj, ['Balance'], 0), 0);
    obj.Alertness = number_(getFirst_(obj, ['Alertness', 'Sleep'], 0), 0);
    obj.Hydration = number_(getFirst_(obj, ['Hydration'], 0), 0);
    return obj;
  }

  function getPatients() {
    return readSheet_('Patients')
      .map(function (row) {
        return {
          PatientID: String(getFirst_(row, ['PatientID', 'Patient', '患者ID', 'ID'], '')).trim(),
          Name: String(getFirst_(row, ['患者名', 'Name', '氏名'], '')).trim(),
          Age: String(getFirst_(row, ['年齢', 'Age'], '')).trim(),
          Sex: String(getFirst_(row, ['性別', 'Sex'], '')).trim(),
          Disease: String(getFirst_(row, ['主疾患', 'Disease', '疾患'], '')).trim(),
          SubDisease: String(getFirst_(row, ['副疾患', 'SubDisease'], '')).trim(),
          Height: String(getFirst_(row, ['身長(cm)', '身長', 'Height'], '')).trim(),
          Weight: String(getFirst_(row, ['体重(kg)', '体重', 'Weight'], '')).trim(),
          BMI: String(getFirst_(row, ['BMI'], '')).trim(),
          Life: String(getFirst_(row, ['生活背景', 'Life'], '')).trim(),
          CareLevel: String(getFirst_(row, ['介護度', 'CareLevel'], '')).trim(),
          Walking: String(getFirst_(row, ['歩行能力', 'Walking'], '')).trim(),
          Cognition: String(getFirst_(row, ['認知機能', 'Cognition'], '')).trim(),
          NutritionStatus: String(getFirst_(row, ['栄養状態', 'NutritionStatus'], '')).trim(),
          MedicationCount: String(getFirst_(row, ['服薬数', 'MedicationCount'], '')).trim(),
          Goal: String(getFirst_(row, ['患者の目標', '目標', 'Goal'], '')).trim(),
          Values: String(getFirst_(row, ['本人が大切にしていること', 'Values'], '')).trim(),
          Summary: String(getFirst_(row, ['症例概要', '患者背景', 'Summary'], '')).trim(),
          Difficulty: String(getFirst_(row, ['難易度', 'Difficulty'], '')).trim()
        };
      })
      .filter(function (p) {
        return p.PatientID;
      });
  }

  function getPatientStatusRows() {
    return readSheet_('Patient_Status')
      .map(function (row) {
        const obj = {
          PatientID: String(getFirst_(row, ['PatientID', 'Patient', '患者ID', 'ID'], '')).trim()
        };

        obj.Pain = number_(getFirst_(row, ['Pain', 'Initial_Pain', 'Status_❤️Pain'], 0), 0);
        obj.Activity = number_(getFirst_(row, ['Activity', 'Initial_Activity', 'Status_🚶Activity'], 0), 0);
        obj.Muscle = number_(getFirst_(row, ['Muscle', 'Initial_Muscle', 'Status_💪Muscle'], 0), 0);
        obj.Nutrition = number_(getFirst_(row, ['Nutrition', 'Initial_Nutrition', 'Status_🍚Nutrition'], 0), 0);
        obj.Balance = number_(getFirst_(row, ['Balance', 'Initial_Balance', 'Status_⚖Balance'], 0), 0);
        obj.Alertness = number_(getFirst_(row, ['Alertness', 'Sleep', 'Initial_Alertness', 'Initial_Sleep', 'Status_😴Alertness', 'Status_😴Sleep'], 0), 0);
        obj.Hydration = number_(getFirst_(row, ['Hydration', 'Initial_Hydration', 'Status_💧Hydration'], 0), 0);

        obj.Goal_Pain = number_(getFirst_(row, ['Goal_Pain'], 0), 0);
        obj.Goal_Activity = number_(getFirst_(row, ['Goal_Activity'], 0), 0);
        obj.Goal_Muscle = number_(getFirst_(row, ['Goal_Muscle'], 0), 0);
        obj.Goal_Nutrition = number_(getFirst_(row, ['Goal_Nutrition'], 0), 0);
        obj.Goal_Balance = number_(getFirst_(row, ['Goal_Balance'], 0), 0);
        obj.Goal_Alertness = number_(getFirst_(row, ['Goal_Alertness', 'Goal_Sleep'], 0), 0);
        obj.Goal_Hydration = number_(getFirst_(row, ['Goal_Hydration'], 0), 0);

        return obj;
      })
      .filter(function (r) {
        return r.PatientID;
      });
  }

  function getCards() {
    return readSheet_('Card_Effects_Normalized')
      .map(function (row) {
        normalizeEffect_(row);

        return {
          ID: String(getFirst_(row, ['CardID', 'ID'], '')).trim(),
          CardID: String(getFirst_(row, ['CardID', 'ID'], '')).trim(),
          Type: String(getFirst_(row, ['カード種別', '種類', 'Type'], '')).trim(),
          Subtype: String(getFirst_(row, ['サブタイプ', 'Subtype'], '')).trim(),
          UseType: String(getFirst_(row, ['使用区分', 'UseType'], '')).trim(),
          Name: String(getFirst_(row, ['カード名', 'Name', '名称'], '')).trim(),
          EffectText: String(getFirst_(row, ['効果テキスト', '効果', 'EffectText'], '')).trim(),
          SideEffect: String(getFirst_(row, ['副作用/特殊', '副作用', 'SideEffect'], '')).trim(),
          Category: String(getFirst_(row, ['分類', 'Category'], '')).trim(),
          Learning: String(getFirst_(row, ['学びテーマ', 'Learning', '学び'], '')).trim(),
          Targets: String(getFirst_(row, ['対象患者', 'Targets'], '')).trim(),

          Pain: row.Pain,
          Activity: row.Activity,
          Muscle: row.Muscle,
          Nutrition: row.Nutrition,
          Balance: row.Balance,
          Alertness: row.Alertness,
          Hydration: row.Hydration
        };
      })
      .filter(function (c) {
        return c.ID;
      });
  }

  function getEvents() {
    return readSheet_('Event_Effects_Normalized')
      .map(function (row) {
        normalizeEffect_(row);

        return {
          ID: String(getFirst_(row, ['EventID', 'ID'], '')).trim(),
          EventID: String(getFirst_(row, ['EventID', 'ID'], '')).trim(),
          Type: String(getFirst_(row, ['区分', 'Type'], '')).trim(),
          Name: String(getFirst_(row, ['イベント名', 'カード名', 'Name', '名称'], '')).trim(),
          EffectText: String(getFirst_(row, ['効果テキスト', '効果', 'EffectText'], '')).trim(),
          Category: String(getFirst_(row, ['分類', 'Category'], '')).trim(),
          Learning: String(getFirst_(row, ['学びテーマ', 'Learning', '学び'], '')).trim(),
          Targets: String(getFirst_(row, ['対象患者', 'Targets'], '')).trim(),

          Pain: row.Pain,
          Activity: row.Activity,
          Muscle: row.Muscle,
          Nutrition: row.Nutrition,
          Balance: row.Balance,
          Alertness: row.Alertness,
          Hydration: row.Hydration
        };
      })
      .filter(function (e) {
        return e.ID;
      });
  }

  function getEventsForPatient(patientId) {
    return getEvents().filter(function (event) {
      const targets = String(event.Targets || '').replace(/\s/g, '');
      if (targets === '' || targets === 'ALL' || targets === '全患者') return true;
      return targets.split(',').indexOf(patientId) >= 0;
    });
  }

  function getPatientDeckRows() {
    return readSheet_('Patient_Deck')
      .map(function (row) {
        return {
          PatientID: String(getFirst_(row, ['PatientID', 'Patient', '患者ID'], '')).trim(),
          CardID: String(getFirst_(row, ['CardID', 'カードID'], '')).trim(),
          DeckRole: String(getFirst_(row, ['DeckRole', 'Role', '区分'], '')).trim(),
          SortOrder: number_(getFirst_(row, ['SortOrder', 'Order', '順番'], 999), 999),
          Notes: String(getFirst_(row, ['Notes', '備考'], '')).trim()
        };
      })
      .filter(function (r) {
        return r.PatientID && r.CardID;
      });
  }

  function getDeckForPatient(patientId) {
    const cardById = {};
    getCards().forEach(function (card) {
      cardById[String(card.ID)] = card;
    });

    const rows = getPatientDeckRows()
      .filter(function (row) {
        return String(row.PatientID).trim() === String(patientId).trim();
      })
      .filter(function (row) {
        return cardById[String(row.CardID).trim()];
      });

    const fixedRows = rows
      .filter(function (row) {
        return ['固定', 'Fixed'].indexOf(String(row.DeckRole).trim()) >= 0;
      })
      .sort(function (a, b) {
        return a.SortOrder - b.SortOrder;
      });

    const candidateRows = rows
      .filter(function (row) {
        return ['候補', 'Candidate'].indexOf(String(row.DeckRole).trim()) >= 0;
      })
      .sort(function (a, b) {
        return a.SortOrder - b.SortOrder;
      });

    const addRows = rows
      .filter(function (row) {
        return ['追加', '追加用', 'Add'].indexOf(String(row.DeckRole).trim()) >= 0;
      })
      .sort(function (a, b) {
        return a.SortOrder - b.SortOrder;
      });

    return {
      fixedCards: fixedRows.map(function (row) {
        return cardById[String(row.CardID).trim()];
      }),
      candidateCards: candidateRows.map(function (row) {
        return cardById[String(row.CardID).trim()];
      }),
      addCards: addRows.map(function (row) {
        return cardById[String(row.CardID).trim()];
      }),
      rows: rows
    };
  }

  function findPatient(patientId) {
    const patients = getPatients();
    return patients.find(function (p) {
      return String(p.PatientID) === String(patientId);
    }) || patients[0];
  }

  function findStatus(patientId) {
    const rows = getPatientStatusRows();
    return rows.find(function (r) {
      return String(r.PatientID) === String(patientId);
    });
  }

  return {
    getPatients: getPatients,
    getPatientStatusRows: getPatientStatusRows,
    getCards: getCards,
    getEvents: getEvents,
    getEventsForPatient: getEventsForPatient,
    getPatientDeckRows: getPatientDeckRows,
    getDeckForPatient: getDeckForPatient,
    findPatient: findPatient,
    findStatus: findStatus
  };
})();

// ===============================
// Game Engine
// ===============================

const GameEngine = (function () {
  function startGame(patientId) {
    const patient = DB.findPatient(patientId);
    if (!patient) throw new Error('Patientsシートで患者が見つかりません。');

    const statusRow = DB.findStatus(patient.PatientID);
    if (!statusRow) throw new Error('Patient_Statusに ' + patient.PatientID + ' がありません。');

    const patientDeck = DB.getDeckForPatient(patient.PatientID);

    if (patientDeck.fixedCards.length < CONFIG.FIXED_HAND_COUNT) {
      throw new Error(patient.PatientID + ' の固定カードが不足しています。DeckRole=固定を2枚設定してください。');
    }

    if (patientDeck.candidateCards.length < CONFIG.CANDIDATE_DRAW_COUNT) {
      throw new Error(patient.PatientID + ' の候補カードが不足しています。DeckRole=候補を3枚以上設定してください。');
    }

    const fixedCards = patientDeck.fixedCards.slice(0, CONFIG.FIXED_HAND_COUNT);
    const shuffledCandidates = shuffle_(patientDeck.candidateCards);
    const chosenCandidates = shuffledCandidates.slice(0, CONFIG.CANDIDATE_DRAW_COUNT);
    const remainingCandidates = shuffledCandidates.slice(CONFIG.CANDIDATE_DRAW_COUNT);

    const hand = fixedCards.concat(chosenCandidates);
    const deck = shuffle_(remainingCandidates.concat(patientDeck.addCards));

    const eventDeck = shuffle_(DB.getEventsForPatient(patient.PatientID));
    if (eventDeck.length === 0) throw new Error(patient.PatientID + ' に使用できるイベントがありません。');

    const currentEvent = eventDeck.shift();
    const initialStatus = pickStatus_(statusRow);

    return {
      gameId: Utilities.getUuid(),
      patientId: patient.PatientID,
      patient: patient,
      turn: 1,
      maxTurn: CONFIG.MAX_TURN,
      gameOver: false,
      finished: false,
      status: Object.assign({}, initialStatus),
      goals: pickGoals_(statusRow),
      statusHistory: [
        {
          label: '開始時',
          turn: 0,
          status: Object.assign({}, initialStatus)
        }
      ],
      fixedCards: fixedCards,
      chosenCandidates: chosenCandidates,
      hand: hand,
      deck: deck,
      discard: [],
      usedCards: [],
      permanentCards: [],
      eventDeck: eventDeck,
      eventDiscard: [],
      currentEvent: currentEvent,
      eventRevealed: false,
      eventHistory: [],
      cardsUsedThisTurn: 0,
      maxCardsPerTurn: CONFIG.MAX_CARDS_PER_TURN,
      log: [
        'ゲーム開始：' + patient.PatientID + ' ' + patient.Name,
        'Turn 1: イベントカードをめくってください'
      ]
    };
  }

  function revealEvent(state) {
    if (!state.currentEvent) throw new Error('イベントカードがありません。');
    if (state.eventRevealed) return state;

    applyEffect_(state.status, state.currentEvent);
    state.eventRevealed = true;
    state.eventHistory.push(state.currentEvent);
    state.log.push('Turn ' + state.turn + ': イベント「' + (state.currentEvent.Name || state.currentEvent.ID) + '」発生');
    return state;
  }

  function useCard(state, cardId) {
    if (!state.eventRevealed) throw new Error('先にイベントカードをクリックして表示してください。');

    if (state.cardsUsedThisTurn >= state.maxCardsPerTurn) {
      throw new Error('このターンで使えるカードは' + state.maxCardsPerTurn + '枚までです。');
    }

    const idx = state.hand.findIndex(function (c) {
      return String(c.ID) === String(cardId);
    });

    if (idx < 0) throw new Error('手札にそのカードがありません: ' + cardId);

    const card = state.hand.splice(idx, 1)[0];
    applyEffect_(state.status, card);

    state.usedCards.push(card);
    state.cardsUsedThisTurn++;

    if (isPermanent_(card)) {
      state.permanentCards.push(card);
      state.log.push('Turn ' + state.turn + ': 永続カード「' + (card.Name || card.ID) + '」を設置');
    } else {
      state.discard.push(card);
      state.log.push('Turn ' + state.turn + ': 「' + (card.Name || card.ID) + '」を使用');
    }

    drawOne_(state);
    return state;
  }

  function nextTurn(state) {
    if (!state.eventRevealed) throw new Error('イベントカードをめくってから次のターンへ進んでください。');

    recordStatusHistory_(state);
    state.eventDiscard.push(state.currentEvent);

    if (state.turn >= state.maxTurn) {
      state.gameOver = true;
      state.finished = true;
      state.result = judge_(state);
      state.log.push('最終結果：' + state.result.message + '（' + state.result.score + '点）');
      return state;
    }

    state.turn++;
    state.cardsUsedThisTurn = 0;
    state.eventRevealed = false;

    if (state.eventDeck.length === 0 && state.eventDiscard.length > 0) {
      state.eventDeck = shuffle_(state.eventDiscard);
      state.eventDiscard = [];
      state.log.push('イベント捨て札をシャッフルして山札に戻した');
    }

    state.currentEvent = state.eventDeck.shift();
    state.log.push('Turn ' + state.turn + ': イベントカードをめくってください');
    return state;
  }

  function recordStatusHistory_(state) {
    const label = state.turn >= state.maxTurn ? '最終結果' : state.turn + 'ターン終了時';

    const alreadyRecorded = state.statusHistory.some(function (h) {
      return h.turn === state.turn;
    });

    if (alreadyRecorded) return;

    state.statusHistory.push({
      label: label,
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
    STATUS_KEYS.forEach(function (k) {
      status[k] = clamp_(Number(status[k] || 0) + Number(obj[k] || 0));
    });
  }

  function pickStatus_(obj) {
    const out = {};
    STATUS_KEYS.forEach(function (k) {
      out[k] = clamp_(Number(obj[k] || 0));
    });
    return out;
  }

  function pickGoals_(obj) {
    const out = {};
    STATUS_KEYS.forEach(function (k) {
      out[k] = Number(obj['Goal_' + k] || 0);
    });
    return out;
  }

  function isPermanent_(card) {
    return String(card.UseType || '').indexOf('永続') >= 0 ||
      String(card.Subtype || '').indexOf('永続') >= 0 ||
      String(card.Type || '').indexOf('永続') >= 0;
  }

  function clamp_(v) {
    return Math.max(CONFIG.MIN_STATUS, Math.min(CONFIG.MAX_STATUS, v));
  }

  function shuffle_(arr) {
    const a = arr.slice();

    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = a[i];
      a[i] = a[j];
      a[j] = temp;
    }

    return a;
  }

  function judge_(state) {
    const goalKeys = STATUS_KEYS.filter(function (k) {
      return Number(state.goals[k] || 0) > 0;
    });

    let achieved = 0;

    goalKeys.forEach(function (k) {
      if (Number(state.status[k] || 0) >= Number(state.goals[k] || 0)) achieved++;
    });

    const score = goalKeys.length
      ? Math.round((achieved / goalKeys.length) * 100)
      : Math.round((STATUS_KEYS.reduce(function (s, k) {
          return s + Number(state.status[k] || 0);
        }, 0) / STATUS_KEYS.length) * 10);

    return {
      score: score,
      clear: score >= 100,
      message: score >= 100 ? 'クリア' : '未達成',
      achieved: achieved,
      totalGoals: goalKeys.length
    };
  }

  return {
    startGame: startGame,
    revealEvent: revealEvent,
    useCard: useCard,
    nextTurn: nextTurn
  };
})();

// ===============================
// Debug
// ===============================

function testStartP001() {
  const state = GameEngine.startGame('P001');
  Logger.log(JSON.stringify(state, null, 2));
}

function debugDb() {
  Logger.log(JSON.stringify(apiDebugDb(), null, 2));
}
