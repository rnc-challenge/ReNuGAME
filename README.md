# リハ栄養カードゲーム GAS MVP v0.3

## 修正点
- PatientsシートのID列名として、以下に対応。
  - PatientID
  - Patient
  - 患者ID
  - ID
- `apiStartGame('P01')` で該当患者が見つからない場合、先頭患者を使用する安全策を追加。
- `testStartP01()` の Patient not found を回避。

## 推奨ヘッダー
Patientsシートは以下が推奨。

PatientID | Name | Disease | Status_❤️Pain | Status_🚶Activity | Status_💪Muscle | Status_🍚Nutrition | Status_⚖Balance | Status_😴Alertness | Status_💧Hydration

※列名を `Patient` にした場合でも動く。
