# リハ栄養カードゲーム GAS MVP v0.2

## 変更点
- 初期ステータス列を以下の形式で読めるようにした。
  - Status_❤️Pain
  - Status_🚶Activity
  - Status_💪Muscle
  - Status_🍚Nutrition
  - Status_⚖Balance
  - Status_😴Alertness
  - Status_💧Hydration
- `Sleep` ではなく `Alertness` を内部キーに変更。
- 患者名、カード名、効果、学びが表示されるようにした。
- `undefined` と `効果なし` になりにくいように列名候補を複数対応。

## 必須シート
- Patients
- Card_Effects_GAS または Cards_All または Cards
- Event_Effects_GAS または Events

## 注意
カード効果シートとイベント効果シートにも、同じステータス列名を入れると正しく計算される。
