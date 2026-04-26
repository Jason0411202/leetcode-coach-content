# LeetCode Coach — Content

繁體中文 LeetCode 學習與複習內容資料庫,搭配 [leetcode-coach-extension](https://github.com/USER/leetcode-coach-extension) 使用。

## 結構

```
leetcode-coach-content/
├── problems/                          # 題目內容(每題一個 JSON)
│   ├── two-sum.json
│   └── valid-parentheses.json
├── manifest.json                      # 全部題目索引
├── schemas/
│   └── problem.schema.json            # JSON Schema 驗證
├── scripts/
│   └── validate.mjs                   # 驗證所有題目格式(零依賴)
├── docs/
│   └── claude-scheduled-task.md       # ⭐ Claude 自動更新 routine 完整教學
├── .github/
│   ├── ISSUE_TEMPLATE/content-issue.md
│   └── workflows/validate.yml         # PR 跑 schema + HTML 安全檢查
└── LICENSE                            # CC-BY-SA-4.0
```

## 使用方式

Extension 預設讀取 `https://raw.githubusercontent.com/USER/leetcode-coach-content/main`,你可以:

- Fork 後改成自己的 URL,放自己的私人題庫
- 或直接讀公開版本

## ⚙️ 讓 Claude 自動更新此 Repo(每日新題,零人工)

本 repo 設計為可由 [**Claude Code Routines**](https://code.claude.com/docs/en/web-scheduled-tasks) **完全自動更新**,無需人工 review — 每日 09:00(本地時區),Claude 會:

1. 抓取今日 LeetCode daily challenge
2. 為它產生符合 schema 的繁體中文教學 JSON
3. 跑 `scripts/validate.mjs` 驗證(失敗 3 次直接放棄,不 push 半成品)
4. 自我審查 solution、hints、explanation 是否品質達標
5. **直接 push 到 `main`**,extension 立刻就能抓到
6. 你不需要做任何事 ✨

### 品質防線(取代人工 review 的多層自動化)

| 防線 | 攔在哪一層 |
| --- | --- |
| **Prompt pre-push 檢查** | Claude 自己 push 前;失敗就放棄,不會推半成品 |
| **CI on main**(`validate.yml`) | push 後立刻跑;schema + HTML 安全檢查 |
| **Auto-revert**(`auto-revert.yml`) | CI fail 時自動推 revert commit + 開 issue |
| **Extension sanitize** | 渲染前剝掉 `<script>` 與 `on*=`,XSS 不可能 |
| **24h 內容快取** | 既有使用者要 24h 後才會看到 — 給你足夠時間發現問題 |

### 完整設定教學

⭐ **[docs/claude-scheduled-task.md](docs/claude-scheduled-task.md)** ⭐

那份文件涵蓋:

| 章節 | 內容 |
| --- | --- |
| §0 | 前置條件(訂閱方案、GitHub 連結) |
| §1 | 連結 GitHub 帳號(`/web-setup`) |
| §2 | Web 介面建立 routine 的逐步操作(7 步) |
| §3 | 從 CLI 用 `/schedule` 建立(替代方案) |
| §4 | **完整可貼上的 prompt**(數百行,涵蓋寫作規範與失敗處理) |
| §5 | 你的審查工作流(每天 5 分鐘) |
| §6 | 觀察 run 結果與 session log |
| §7 | 暫停、修改、刪除 |
| §8 | 用量與 daily cap |
| §9 | 故障排除表 |
| §10 | 進階:配合 GitHub event trigger 自動驗證 PR |

### 一句話 TL;DR

```
1. 上 https://claude.ai/code/routines
2. New routine → 貼 docs/claude-scheduled-task.md §4 的 prompt
3. Repo 選本 repo
4. Trigger:Schedule / Daily / 09:00
5. Permissions:✅ 勾「Allow unrestricted branch pushes」(讓 Claude 直接寫 main)
6. Create → Run now 跑一次確認
```

> ⚠️ 設定完之後,記得把這個 GitHub repo 設成 **Watching → Custom → Issues + Actions**。這樣只有 `auto-revert.yml` 真的攔到問題時才會通知你,日常成功 push 不會打擾。

## 內容格式

詳見 [`schemas/problem.schema.json`](schemas/problem.schema.json)。每題包含:

- `metadata` — 標題、難度、pattern 標籤
- `explanation_html` — 中文題目重新詮釋
- `hints_html[]` — 1~5 條由淺入深的提示
- `solution_html` — 完整解法 + 走查 + 複雜度

HTML 片段可含 inline `<style>` 與 inline SVG,但**不能含 `<script>`**(extension 注入時會被剝除,CI 也會擋下)。

## CSS 變數

撰寫 HTML 內容時,使用以下 CSS 變數讓題目能適應 light/dark 模式:

- `--lc-primary` 主色
- `--lc-success` 成功
- `--lc-warning` 警告
- `--lc-danger` 危險
- `--lc-bg` 背景
- `--lc-text` 文字
- `--lc-border` 邊框
- `--lc-muted` 次要文字

## 手動貢獻

1. Fork 這個 repo
2. 在 `problems/` 加入新題目 JSON
3. 在 `manifest.json` 加入索引
4. 執行 `node scripts/validate.mjs` 驗證格式
5. 提 PR(CI 會自動跑同樣的驗證 + HTML 安全檢查)

詳見 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 黃金範本

新題目品質的標竿是 [`problems/two-sum.json`](problems/two-sum.json)。任何 PR(包含 Claude 產的)都應該對齊它的:

- 視覺化 SVG(viewBox 0 0 600 200,顏色用 CSS 變數)
- 由淺入深的 3 條提示(框架 → 資料結構 → 虛擬碼骨架)
- 完整 Python 解法 + 走查 + 複雜度表格 + key insight callout

## 授權

內容採 [CC-BY-SA-4.0](LICENSE)。可自由使用、修改、再發佈,但需署名並以相同授權釋出。
