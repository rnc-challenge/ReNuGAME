# リハ栄養カードゲーム GAS v0.8

## 対応DB
rehab_nutrition_card_game_db_ver1_clean.xlsx

## 主な変更
- Patientsシートから年齢・性別・患者背景を表示
- Patient_DeckのDeckRole「固定・候補・追加」に対応
- 初期手札：固定2枚＋候補からランダム3枚＝5枚
- 山札：残った候補＋追加
- 「最初から始める」ボタン追加
- 「同じ患者でもう一度」ボタン追加
- 初期手札が表示されない問題に対応

## 必須シート
- Patients
- Patient_Status
- Patient_Deck
- Card_Effects_Normalized
- Event_Effects_Normalized
