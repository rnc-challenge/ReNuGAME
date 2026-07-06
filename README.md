# リハ栄養カードゲーム GAS v1.0

## ファイル構成

Apps Scriptで以下の4ファイルを作成する。

- Code.gs
- Index.html
- Style.html
- Script.html

以前の `DB.gs` や `Engine.gs` が残っている場合は削除するか、すべて中身を空にする。
同名の `DB` や `GameEngine` が複数あるとエラーになる。

## 対応DB

- rehab_nutrition_card_game_db_ver1_clean.xlsx
- Googleスプレッドシートにアップロードして使用する

## 必須シート

- Patients
- Patient_Status
- Patient_Deck
- Card_Effects_Normalized
- Event_Effects_Normalized

## 実装済み

- 最初から始める
- 同じ患者でもう一度
- 患者背景表示
- 固定2枚＋候補3枚の初期手札5枚
- 残った候補＋追加カードを山札にする
- イベントカードクリック表示
- 1ターン最大2枚まで使用
- ステータス推移表示
