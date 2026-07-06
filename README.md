# リハ栄養カードゲーム GAS MVP v0.5

## 追加仕様

### Patient_Deck シート必須

列：

PatientID | CardID | DeckRole | SortOrder | Notes

DeckRole：

- Initial：初期手札
- Add：追加用デッキ

例：

P01 | N01 | Initial | 1
P01 | R01 | Initial | 2
P01 | G01 | Initial | 3
P01 | M01 | Initial | 4
P01 | R02 | Add | 1
P01 | N07 | Add | 2

## 重要

- 症例ごとにカード候補を固定する。
- ランダムなのは追加用デッキの順番だけ。
- 薬カードは共通ランダムにしない。
- 1ターンに使えるカードは1枚まで。
- 使用後に追加用デッキから1枚補充する。
