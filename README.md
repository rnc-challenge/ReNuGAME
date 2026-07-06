# リハ栄養カードゲーム GAS MVP v0.7

## 固定ルール

- 初期手札：5枚
- 1ターンで使用できるカード：最大2枚
- イベントカード：クリックして表示
- イベント表示時にイベント効果を反映
- ターン終了時にステータス推移を保存

## ステータス推移の表示

3ターン制では以下の時点を表示する。

- 開始時
- 1ターン終了時
- 2ターン終了時
- 最終結果

## 必須シート

- Patient_Status
- Card_Effects_Normalized
- Event_Effects_Normalized
- Patient_Deck

## Patient_Deck

列：

PatientID | CardID | DeckRole | SortOrder | Notes

DeckRole：

- 初期手札
- 追加

英語でも可：

- Initial
- Add
