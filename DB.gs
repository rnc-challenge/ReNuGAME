const CONFIG = {
  SPREADSHEET_ID: '1FFtoyWUxtX-frTr7jiSgAgf5gLoQ_EW1a49xX5DjYKs',
  MAX_STATUS: 10,
  MIN_STATUS: 0,
  MAX_TURN: 3,
  MAX_CARDS_PER_TURN: 1
};
const STATUS_KEYS = ['Pain','Activity','Muscle','Nutrition','Balance','Alertness','Hydration'];
const STATUS_LABELS = {Pain:'❤️ 症状・痛み',Activity:'🚶 活動性',Muscle:'💪 筋力',Nutrition:'🍚 栄養',Balance:'⚖ バランス',Alertness:'😴 覚醒・睡眠',Hydration:'💧 水分'};
const PATIENT_STATUS_COLUMNS = {
  Pain:['Initial_Pain','Status_❤️Pain','Pain'],
  Activity:['Initial_Activity','Status_🚶Activity','Activity'],
  Muscle:['Initial_Muscle','Status_💪Muscle','Muscle'],
  Nutrition:['Initial_Nutrition','Status_🍚Nutrition','Nutrition'],
  Balance:['Initial_Balance','Status_⚖Balance','Balance'],
  Alertness:['Initial_Alertness','Initial_Sleep','Status_😴Alertness','Status_😴Sleep','Alertness','Sleep'],
  Hydration:['Initial_Hydration','Status_💧Hydration','Hydration']
};
const EFFECT_COLUMNS = {Pain:['Pain'],Activity:['Activity'],Muscle:['Muscle'],Nutrition:['Nutrition'],Balance:['Balance'],Alertness:['Alertness','Sleep'],Hydration:['Hydration']};
const DB = (() => {
  function ss_(){return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);}
  function readSheet_(name){const sh=ss_().getSheetByName(name); if(!sh) throw new Error('Sheet not found: '+name); const values=sh.getDataRange().getValues(); if(values.length<2) return []; const headers=values[0].map(h=>String(h).trim()); return values.slice(1).filter(r=>r.some(v=>v!=='')).map(row=>{const obj={}; headers.forEach((h,i)=>obj[h]=row[i]); return obj;});}
  function getFirst_(obj,names,fallback){for(const n of names){if(obj[n]!==undefined && obj[n] !== '') return obj[n];} return fallback;}
  function normalizePatientStatus_(obj){STATUS_KEYS.forEach(k=>obj[k]=Number(getFirst_(obj,PATIENT_STATUS_COLUMNS[k],0)||0)); return obj;}
  function normalizeEffect_(obj){STATUS_KEYS.forEach(k=>obj[k]=Number(getFirst_(obj,EFFECT_COLUMNS[k],0)||0)); return obj;}
  function getPatients(){return readSheet_('Patient_Status').map(row=>{normalizePatientStatus_(row); return {PatientID:String(getFirst_(row,['PatientID','Patient','患者ID','ID'],'')).trim(),Name:String(getFirst_(row,['患者名','Name','氏名'],'')).trim(),Disease:String(getFirst_(row,['症例','Disease','疾患'],'')).trim(),Want:String(getFirst_(row,['やりたいこと','Want'],'')).trim(),Difficulty:String(getFirst_(row,['難易度','Difficulty'],'')).trim(),Special:String(getFirst_(row,['特殊能力','Special'],'')).trim(),Pain:row.Pain,Activity:row.Activity,Muscle:row.Muscle,Nutrition:row.Nutrition,Balance:row.Balance,Alertness:row.Alertness,Hydration:row.Hydration};}).filter(p=>p.PatientID);}
  function getCards(){return readSheet_('Card_Effects_Normalized').map(row=>{normalizeEffect_(row); return {ID:String(getFirst_(row,['CardID','ID'],'')).trim(),CardID:String(getFirst_(row,['CardID','ID'],'')).trim(),Name:String(getFirst_(row,['カード名','Name','名称'],'')).trim(),Type:String(getFirst_(row,['カード種別','Type'],'')).trim(),Subtype:String(getFirst_(row,['サブタイプ','Subtype'],'')).trim(),UseType:String(getFirst_(row,['使用区分','UseType'],'')).trim(),Category:String(getFirst_(row,['分類','Category'],'')).trim(),Learning:String(getFirst_(row,['学びテーマ','Learning','学び'],'')).trim(),EffectText:String(getFirst_(row,['効果テキスト','効果','EffectText'],'')).trim(),SideEffect:String(getFirst_(row,['副作用/特殊','副作用','SideEffect'],'')).trim(),Targets:String(getFirst_(row,['対象患者','Targets'],'')).trim(),Pain:row.Pain,Activity:row.Activity,Muscle:row.Muscle,Nutrition:row.Nutrition,Balance:row.Balance,Alertness:row.Alertness,Hydration:row.Hydration};}).filter(c=>c.ID);}
  function getEvents(){return readSheet_('Event_Effects_Normalized').map(row=>{normalizeEffect_(row); return {ID:String(getFirst_(row,['EventID','ID'],'')).trim(),EventID:String(getFirst_(row,['EventID','ID'],'')).trim(),Name:String(getFirst_(row,['イベント名','カード名','Name','名称'],'')).trim(),Type:String(getFirst_(row,['区分','Type'],'')).trim(),Category:String(getFirst_(row,['分類','Category'],'')).trim(),Learning:String(getFirst_(row,['学びテーマ','Learning','学び'],'')).trim(),EffectText:String(getFirst_(row,['効果テキスト','効果','EffectText'],'')).trim(),Targets:String(getFirst_(row,['対象患者','Targets'],'')).trim(),Pain:row.Pain,Activity:row.Activity,Muscle:row.Muscle,Nutrition:row.Nutrition,Balance:row.Balance,Alertness:row.Alertness,Hydration:row.Hydration};}).filter(e=>e.ID);}
  function getPatientDeckRows(){return readSheet_('Patient_Deck').map(row=>({PatientID:String(getFirst_(row,['PatientID','Patient','患者ID'],'')).trim(),CardID:String(getFirst_(row,['CardID','カードID'],'')).trim(),DeckRole:String(getFirst_(row,['DeckRole','Role','区分'],'')).trim(),SortOrder:Number(getFirst_(row,['SortOrder','Order','順番'],999)||999),Notes:String(getFirst_(row,['Notes','備考'],'')).trim()})).filter(r=>r.PatientID&&r.CardID);}
  function getDeckForPatient(patientId){const allCards=getCards(); const byId={}; allCards.forEach(c=>byId[c.ID]=c); const rows=getPatientDeckRows().filter(r=>r.PatientID===patientId || r.PatientID==='ALL').filter(r=>byId[r.CardID]); const initialRows=rows.filter(r=>['Initial','初期手札'].includes(r.DeckRole)).sort((a,b)=>a.SortOrder-b.SortOrder); const addRows=rows.filter(r=>['Add','追加','追加用'].includes(r.DeckRole)).sort((a,b)=>a.SortOrder-b.SortOrder); const initialIds=new Set(initialRows.map(r=>r.CardID)); return {initialHand:initialRows.map(r=>byId[r.CardID]), addDeck:addRows.filter(r=>!initialIds.has(r.CardID)).map(r=>byId[r.CardID]), rows};}
  function findPatient(patientId){const ps=getPatients(); return ps.find(p=>String(p.PatientID)===String(patientId)) || ps[0];}
  return {getPatients,getCards,getEvents,getPatientDeckRows,getDeckForPatient,findPatient};
})();
