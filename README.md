# リハ栄養カードゲーム GAS MVP v0.4

## DB v4 Phase1監査版対応

この版は、以下のシートを読む前提。

- Patient_Status
- Card_Effects_Normalized
- Event_Effects_Normalized

## 重要

Patientsシートは患者プロフィール用。
ゲーム開始時の初期ステータスは Patient_Status から読む。

## 読み込む列

### Patient_Status
- PatientID
- 患者名
- 症例
- やりたいこと
- 難易度
- 特殊能力
- Initial_Pain
- Initial_Activity
- Initial_Muscle
- Initial_Nutrition
- Initial_Balance
- Initial_Sleep または Initial_Alertness
- Initial_Hydration

### Card_Effects_Normalized / Event_Effects_Normalized
- CardID または EventID
- カード名 / イベント名
- Pain
- Activity
- Muscle
- Nutrition
- Balance
- Sleep または Alertness
- Hydration

## 注意
内部表示は「Alertness」だが、DB v4の「Sleep」列も自動で読み込む。
