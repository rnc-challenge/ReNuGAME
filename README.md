# リハ栄養カードゲーム GAS MVP v0.6

## 追加・変更仕様

### ターン構成
1. イベントカードが裏向きで表示される
2. イベントカードをクリックして表示する
3. イベント効果が自動適用される
4. 手札から最大2枚までカードを使用できる
5. 効果を確認して次のターンへ進む

### イベント対象患者
Event_Effects_Normalized の「対象患者」列を参照する。

- ALL または空欄：全患者共通
- P03,P10：P03とP10のみ出現

### カード
Patient_Deckで症例ごとの初期手札・追加用を明示指定する。

列：
PatientID | CardID | DeckRole | SortOrder | Notes

DeckRole：
- Initial
- Add
