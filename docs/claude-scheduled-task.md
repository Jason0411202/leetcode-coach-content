# 自動更新此 Repo — Claude Code Routines 完整設定教學

設定 Claude Code 的 **Routines**(雲端排程,前身為 Scheduled Tasks)讓 Claude 每天自動為今日 LeetCode daily challenge 產生繁體中文教學內容,推到本 repo 的 `claude/daily-<date>` 分支。

> 本文件對應的官方文件:[code.claude.com/docs/en/web-scheduled-tasks](https://code.claude.com/docs/en/web-scheduled-tasks)

## 0. 前置條件

| 項目 | 需要 |
| --- | --- |
| Claude.ai 訂閱方案 | **Pro / Max / Team / Enterprise** 任一 |
| Claude Code on the web | 已啟用([claude.ai/code](https://claude.ai/code) 看得到) |
| GitHub 連結 | Claude 帳號已連接 GitHub(用於 clone & push) |
| 本 repo | 已 push 到你自己的 GitHub(public 或 private 都可以) |

> ⚠️ Routines 在 **research preview** 階段,行為與限制可能變動。每個帳號每天有「Daily routine run cap」,在 [claude.ai/code/routines](https://claude.ai/code/routines) 看剩餘次數。

## 1. 連結 GitHub 帳號(只需一次)

如果這是你第一次用 Claude Code on the web:

1. 進入 Claude Code CLI(`claude` 指令)
2. 執行 `/web-setup`
3. 依照提示授權 GitHub OAuth — Claude 會取得 clone & push 權限到你選的 repo
4. 也可以從 web 進入 [claude.ai/code/routines](https://claude.ai/code/routines),建立第一個 routine 時系統會引導授權

> **注意:**`/web-setup` 只給「clone」權限,不安裝 Claude GitHub App。本教學的排程 routine 不需要 GitHub App,只有「GitHub event trigger」(用 PR/release 事件觸發)才需要。

## 2. 在 Web 介面建立 Routine

### Step 1 — 開啟建立表單

開啟瀏覽器 → [https://claude.ai/code/routines](https://claude.ai/code/routines) → 右上角點 **「New routine」**。

(也可以從 Claude desktop app 左側 sidebar 的 **Routines** → **New routine** → 選 **Remote**。`Local` 是跑在你電腦上的 Desktop scheduled task,**不要選那個**。)

### Step 2 — 命名 + 寫 Prompt

| 欄位 | 填入 |
| --- | --- |
| **Name** | `LeetCode Coach Daily Content` |
| **Model** | 預設 Sonnet 即可。複雜題目可選 Opus |
| **Prompt** | 完整內容見下方 [§4](#4-完整-prompt) |

> Prompt 是整個 routine 的核心。Routines 沒有「permission-mode」也沒有「approval prompts」— 完全自動化跑完。所以 prompt 必須**自包含、明確、給出成功標準**。

### Step 3 — 選 Repository

點 **Add repository** → 選擇你 fork 的這個 repo(`USER/leetcode-coach-content`)。

只需要這一個 repo。每次跑 routine 都會自動從**預設分支**(通常是 `main`)clone 一份,所以你的 repo 隨時是最新狀態。

### Step 4 — 選 Environment(**這步最容易被卡住,請仔細看**)

⚠️ **不能用 Default environment。** 預設的 `Trusted` 網路 level 只允許 GitHub、package registries 等少數常用 host,**`leetcode.com`、`*.onrender.com`、`*.vercel.app` 全部不在 allowlist**(實測:三個都回 HTTP 403 `Host not in allowlist`)。Routine 跑起來時 curl 會被 security proxy 擋下。

詳細的 default allowlist 看[官方文件 → Default allowed domains](https://code.claude.com/docs/en/claude-code-on-the-web#default-allowed-domains)。

### 設定可用的 environment

你必須建一個 **Custom** environment:

1. 在 [claude.ai/code/routines](https://claude.ai/code/routines)(或 Environment 切換選單)→ **Add environment**
2. **Name:** `leetcode-coach`(或任意)
3. **Network access:** 選 **Custom**
4. **Allowed domains:** 一行一個,貼入:
   ```
   alfa-leetcode-api.onrender.com
   leetcode-api-pied.vercel.app
   leetcode.com
   ```
5. **「Also include default list of common package managers」: ✅ 勾選**(保留 GitHub + package 管理器)
6. **Environment variables:** 留空
7. **Setup script:** 留空(內建 Node 即可)
8. Save

回到 routine 編輯頁,**Environment 選擇剛建好的 `leetcode-coach`**(不是 Default!)。

### 三個 host 各自的用途

| Host | 角色 | 為什麼需要 |
| --- | --- | --- |
| `alfa-leetcode-api.onrender.com` | 主要 daily API,有完整題目 + 官方 hints | 第一選擇 |
| `leetcode-api-pied.vercel.app` | 備案 daily API,Vercel 無冷啟動 | alfa 冷啟動或暫掛時用 |
| `leetcode.com` | 萬不得已直接打官方 GraphQL | 上面兩個都掛時最後一搏 |

> 💡 **如果你嫌煩,Network access 直接選 `Full`(any domain)** 也行,但官方建議盡量收斂為 `Custom` 以免無關的 outbound 流量被混進來。安全 vs 方便的取捨,選你習慣的。

> 🛡️ **WebFetch 是另一條退路:**Claude Code routine 的內建 `WebFetch` 工具走 Anthropic server-side,**不受環境 allowlist 限制**。即使你忘了改 environment,prompt 裡的 fallback chain 最後一層仍可用 WebFetch 強行取資料(不過只能拿到 markdown-summarized 結果,parse 略不可靠,不建議當主要方案)。

### Step 5 — 選 Trigger:Schedule

在 **Select a trigger** 區塊點 **Schedule**:

| 欄位 | 填入 |
| --- | --- |
| Frequency | **Daily** |
| Time | `09:00`(填**本地時區**,系統自動轉換為 UTC) |

> ⏱️ Routines 有 **stagger**:實際開跑時間可能比設定晚數分鐘,但每個 routine 的 offset 是**穩定的**。
>
> 🔁 想要更精細的 cron(例如「週一到週五 7:30」)? 在 CLI 跑 `/schedule update` 改 cron 表達式。**最小間隔是 1 小時**,跑得比這更頻繁的 routine 會被拒絕。

### Step 6 — Connectors & Permissions

捲到表單最下方:

**Connectors** — 預設會包含你所有已連接的 MCP connectors。本 routine **不需要任何 connector**,把它們**全部移除**(routine 會用 GitHub OAuth 已授予的 push 權限,不依賴 connector)。

**Permissions** — 對 `USER/leetcode-coach-content` 這個 repo:
- ✅ **「Allow unrestricted branch pushes」: 必須勾選**
- 結果:Claude 可以直接推到 `main`,extension 立刻就能抓到新內容,**完全不需要人工 review**

> ⚠️ **品質防線從「人工 review」改為「自動化驗證」:**
>
> 1. **Prompt 內建嚴格的 pre-push 檢查** — 一定先跑 `node scripts/validate.mjs`,失敗 3 次就放棄,不會 push 半成品
> 2. **Repo 端 CI 防線** — `.github/workflows/validate.yml` 在每次 push 到 main 都會跑 schema + HTML 安全檢查
> 3. **自動回退網** — `.github/workflows/auto-revert.yml`:CI 一旦在 main 失敗,自動推一個 revert commit 還原該次 push,並開 issue 通知你
> 4. **Extension 端 sanitize** — `<review-card>` 渲染前會剝掉 `<script>` 與 `on*=`,XSS 不可能透過內容 repo 達成
> 5. **24h 內容快取** — 萬一壞內容溜進來,大多數既有使用者要 24 小時後才會看到,有時間在 cache TTL 內 revert

### Step 7 — 建立 Routine

點 **Create**。Routine 立刻出現在 [claude.ai/code/routines](https://claude.ai/code/routines) 列表。

> 想立刻測試?點 routine 詳情頁的 **Run now**,會馬上開一個 session,結果不算入今天的 daily cap。

## 3. 從 CLI 建立(替代方案)

如果你習慣用 CLI:

```bash
# 在任何 Claude Code session 中:
/schedule daily LeetCode coach content at 9am

# 或一次給完描述:
/schedule daily 9am — fetch today's LeetCode daily challenge and produce content for USER/leetcode-coach-content following the prompt in docs/claude-scheduled-task.md
```

Claude 會用對話式問你細節,然後存檔。

CLI 也支援:

```bash
/schedule list           # 列出全部 routines
/schedule update <id>    # 改 prompt、cron、repo
/schedule run <id>       # 立即觸發一次
```

> CLI 的 `/schedule` **只能建立 Schedule trigger**。要加 API trigger 或 GitHub event trigger,只能在 [claude.ai/code/routines](https://claude.ai/code/routines) 編輯。

## 4. 完整 Prompt

把以下整段貼到 routine 的 **Prompt** 欄位:

````
你是 LeetCode Coach 內容生成 routine。每天為今日 LeetCode daily
challenge 產生一份繁體中文教學 JSON,**直接 push 到 main 分支**讓
extension 立刻抓得到。沒有人工 review 環節,所以 pre-push 驗證
必須非常嚴格 — 寧可放棄 push 也不要推半成品。

## 步驟

1. 抓取今日 daily challenge — **依序嘗試以下四個來源,第一個成功就用,
   不要重複呼叫**。前三個透過環境 sandbox 的 curl,第四個透過
   Claude WebFetch 工具(走 Anthropic server-side,bypass 環境
   allowlist,即使 environment 沒設好也能通)。

   重要:你**必須**收到非空且能 JSON.parse 的回應才算成功。
   HTTP 403 / 503 / connection reset / `Host not in allowlist`
   全部視為失敗,接著嘗試下一個來源。

   來源 A(主要,資料最完整):
     curl -sf --max-time 60 https://alfa-leetcode-api.onrender.com/daily

     成功時回 JSON,結構:
       {
         "date": "YYYY-MM-DD",
         "questionFrontendId": "1559",
         "questionTitle": "Detect Cycles in 2D Grid",
         "titleSlug": "detect-cycles-in-2d-grid",
         "difficulty": "Medium",
         "question": "<p>...full HTML...</p>",   // 原題敘述
         "exampleTestcases": "...",
         "topicTags": [{"name":"Array","slug":"array"}, ...],
         "hints": ["...", "..."]                 // 官方 hint
       }

   來源 B(備案,Vercel hosted 無冷啟動,但沒有官方 hints):
     curl -sf --max-time 20 https://leetcode-api-pied.vercel.app/daily

     成功時回 JSON,**注意題目欄位嵌套在 .question 物件下**:
       {
         "date": "YYYY-MM-DD",
         "link": "/problems/detect-cycles-in-2d-grid/",
         "question": {
           "questionId": "1663",
           "questionFrontendId": "1559",
           "title": "Detect Cycles in 2D Grid",
           "titleSlug": "detect-cycles-in-2d-grid",
           "difficulty": "Medium",
           "acRate": 53.087...,
           "topicTags": [{"name":"Array","slug":"array"}, ...],
           "content": "<p>...full HTML...</p>"
         }
       }

     沒有 hints 與 exampleTestcases — 不影響運作,你可以從
     content 中看出 LeetCode 內嵌的 example。

   來源 C(直打官方,需 environment allowlist 含 leetcode.com):
     curl -sf -X POST --max-time 30 https://leetcode.com/graphql \
       -H "Content-Type: application/json" \
       -d '{"query":"{ activeDailyCodingChallengeQuestion { date link question { questionFrontendId title titleSlug content difficulty topicTags { slug } } } }"}'

   來源 D(最後一招,**bypass 環境 sandbox**):
     使用 Claude Code 內建的 WebFetch 工具(不是 curl)直接呼叫:
       WebFetch(
         url="https://alfa-leetcode-api.onrender.com/daily",
         prompt="Return the full raw JSON response verbatim. Include
                 every field including titleSlug, difficulty, question
                 (HTML), topicTags array of {name, slug}, and hints[].
                 Do not summarize or paraphrase."
       )
     再用第二個 WebFetch 對 leetcode-api-pied.vercel.app/daily 一次。
     WebFetch 走 Anthropic server-side,不受 environment allowlist 限制。
     回傳格式是 markdown 含 ```json``` 區塊,你需要從 markdown 中
     parse 出 JSON object。

   四個來源**全部**失敗 → 結束 routine,訊息中明確列出每個來源的錯誤
   (curl exit code、HTTP status、WebFetch 是否回傳可解析 JSON),
   並提示使用者去 environment 設定改 Network access:
     - 改成 Custom → 加 `alfa-leetcode-api.onrender.com`、
       `leetcode-api-pied.vercel.app`、`leetcode.com` 到 allowed domains
     - 或直接改成 Full(允許所有 domain)

   從成功的回應中存出(注意每個來源的欄位路徑不同):

   | 變數 | 來源 A (alfa) | 來源 B (pied) | 來源 C (graphql) | 來源 D (WebFetch) |
   | --- | --- | --- | --- | --- |
   | `<slug>` | `titleSlug` | `question.titleSlug` | `data.activeDailyCodingChallengeQuestion.question.titleSlug` | 同 A 或 B 看你打哪一個 URL |
   | `<leetcode_id>` | `questionFrontendId` | `question.questionFrontendId` | `...question.questionFrontendId` | 同左 |
   | `<title>` | `questionTitle` | `question.title` | `...question.title` | 同左 |
   | `<difficulty>` | `difficulty` | `question.difficulty` | `...question.difficulty` | 同左 |
   | `<topicTags>` | `topicTags[].slug` | `question.topicTags[].slug` | `...question.topicTags[].slug` | 同左 |
   | `<official_html>` | `question`(string) | `question.content` | `...question.content` | 同左 |
   | `<official_hints>` | `hints[]` | (無 → null) | (預設 query 沒抓 → null) | A 有,B 無 |

   全部 difficulty 統一 `.toLowerCase()` 變 `easy`/`medium`/`hard`。
   `<leetcode_id>` 統一 `parseInt`。

   ⚠️ 來源 D(WebFetch)的回應是 markdown 包裹的 JSON,大概長這樣:
   ```
   ```json
   {"date":"2026-04-26","titleSlug":"...","difficulty":"Medium",...}
   ```
   ```
   你要從 markdown 中 extract 出 ```json``` 區塊內的 JSON 字串再 parse。
   萬一 WebFetch 把 JSON「歸納改寫」而不是 verbatim 回傳,當作失敗繼續往下試。

2. 確認這題還沒被涵蓋:讀 manifest.json,如果 problems[].slug
   已經有 <slug>,**直接結束 routine**,不要 push、不要產生「v2」之類
   的衍生內容(沒有人工 review,衍生內容品質風險太高)。
   在結束訊息中說明「今日題目 <slug> 已涵蓋,跳過」。

3. 讀 schemas/problem.schema.json 了解格式。
   讀 problems/two-sum.json 作為品質範本(必看 — 這是黃金標準)。

4. 撰寫 problems/<slug>.json,符合 schema_version: 1。
   嚴格的內容寫作規範:

   explanation_html:
     - 中文重新詮釋題目,不要整段翻譯 LeetCode 原文(版權)
     - 必須包含一段 inline SVG 視覺化,viewBox="0 0 600 200"
     - 列出邊界情況提醒
     - 不能透露任何解法線索

   hints_html(陣列,3~4 條由淺入深):
     - Hint 1:重新框架問題,引導思考方向,不指向具體解法
     - Hint 2:指向關鍵資料結構或關鍵觀察
     - Hint 3:虛擬碼骨架,留關鍵填空(用 ____ 標示)
     - Hint 4(選用):更具體的虛擬碼骨架

   solution_html:
     - 完整 Python 解法,註解豐富
     - 程式碼走查的逐行解說(配一個範例輸入)
     - 複雜度分析(時間 + 空間,附原因)
     - 一句話 key insight(放在彩色 callout 區塊)
     - 視需要可加解法步驟的 SVG

   通用:
     - 顏色用 CSS 變數:--lc-primary, --lc-success, --lc-warning,
       --lc-danger, --lc-bg, --lc-text, --lc-border, --lc-muted。
       絕對不要寫死 hex 色碼。
     - 不能包含 <script> 標籤
     - 不能包含 on* 事件 attribute(onclick, onload 等)
     - 不能包含外部 <img src="...">,只用 inline SVG

5. 把步驟 1 取得的 <leetcode_topicTags> 映射到我們的 pattern 列舉。
   只允許下列 21 個值,其他全部丟掉(如 "Matrix"、"Counting" 等
   schema 不接受):

     hash-map, two-pointers, sliding-window, binary-search, stack,
     queue, linked-list, tree, graph, bfs, dfs, dp, greedy,
     backtracking, bit-manipulation, math, array, string, union-find,
     trie, heap

   標準映射表(LeetCode slug → 我們的 pattern):
     hash-table              → hash-map
     two-pointers            → two-pointers
     sliding-window          → sliding-window
     binary-search           → binary-search
     stack                   → stack
     queue                   → queue
     monotonic-stack         → stack
     monotonic-queue         → queue
     linked-list             → linked-list
     tree                    → tree
     binary-tree             → tree
     binary-search-tree      → tree
     graph                   → graph
     breadth-first-search    → bfs
     depth-first-search      → dfs
     dynamic-programming     → dp
     greedy                  → greedy
     backtracking            → backtracking
     bit-manipulation        → bit-manipulation
     math                    → math
     array                   → array
     string                  → string
     union-find              → union-find
     trie                    → trie
     heap-priority-queue     → heap
     priority-queue          → heap

   映射後若 pattern 陣列為空,根據題目本質手動填入至少一個合適值
   (例如「Matrix + DFS + BFS + Union-Find」雖然 Matrix 被丟掉,
   但 dfs / bfs / union-find 都會留下;極端情況才需手動補)。

   metadata.difficulty:用步驟 1 的 <difficulty>(已是小寫)
   metadata.title_en:用 <title>
   metadata.leetcode_id:用 <leetcode_id>(int)
   metadata.leetcode_url:`https://leetcode.com/problems/<slug>/`
   metadata.generated_by:"claude"
   metadata.generated_at:今天日期(YYYY-MM-DD)

6. 更新 manifest.json:
   - 在 problems 陣列加入新題:
     {
       "slug": "<slug>",
       "leetcode_id": <leetcode_id>,
       "title_en": "<title>",
       "pattern": [...],
       "difficulty": "...",
       "added_at": "<today>"
     }
   - 把頂層 updated_at 更新為現在 ISO 時間

7. **嚴格 pre-push 自我檢查**(這是品質防線,沒有 human review):

   7a. 跑 schema 驗證:
       node scripts/validate.mjs

       如果 fail,讀錯誤訊息修 JSON 後再跑。**最多重試 3 次。**
       第 4 次仍失敗 → 立刻結束 routine,**絕對不要 push**。

   7b. 自我審查 solution_html 中的 Python 解法 — 至少在心裡
       (或實際在 environment 中)跑兩個 LeetCode 範例 input,
       確認輸出與題目期待一致。

   7c. 自我審查 hints_html — 第一條提示不能直接洩漏 pattern,
       最後一條提示不能等於 solution。

   7d. 自我審查 explanation_html — 不能整段直接照搬 LeetCode
       原題敘述(版權)。如果你發現自己「翻譯」原文,重寫。

   7e. 確認 git diff 只動到:
       - problems/<slug>.json (新增)
       - manifest.json (修改)
       任何其他檔案被動到 → 結束 routine,不要 push。

8. Commit & push 直接到 main:
   - 確認當前 branch 是 main(`git status`、`git rev-parse --abbrev-ref HEAD`)
   - 如果不是,`git checkout main && git pull --ff-only origin main`
   - `git add problems/<slug>.json manifest.json`(只 add 這兩個)
   - Commit message: `Add <slug> daily problem (<YYYY-MM-DD>)`
   - `git push origin main`(**禁止使用** --force、--force-with-lease、
     `git commit --amend`、`git rebase` — 任何會改寫歷史的操作都不行)
   - 如果 push 因 non-fast-forward 被拒(remote 領先 local):
     `git pull --rebase origin main` → 重跑 validate.mjs → 再 push。
     如果 rebase 出 conflict → 結束 routine,不要強推。

9. 在 routine 結束訊息中列出:
   - <slug>、<leetcode_id>、<difficulty>、<pattern>
   - validate.mjs 是否通過
   - push 的 commit SHA
   - LeetCode URL(讓使用者快速去看注入後的卡片)
   - 任何你 7b–7d 自我審查時覺得邊緣可疑的點(誠實 flag)

## 成功標準

- problems/<slug>.json 通過 scripts/validate.mjs(零 error)
- HTML 在瀏覽器渲染無語法錯誤
- 至少一段 SVG 視覺化
- 提示有教學價值,不直接洩漏答案
- main 分支成功更新且 GitHub Actions CI 也通過

## 失敗時的行為(務必嚴格遵守 — 沒有 human review,寧可不 push)

- 三個 daily API 來源全部拿不到資料 → 結束 routine,不要 push;
  在訊息中列出每個來源的 curl exit code 與 HTTP status,
  並提示去 environment 設定加 allowlist
- 題目已存在(slug 已在 manifest)→ 結束 routine,不要 push
- validate.mjs 重試 3 次仍失敗 → 結束 routine,不要 push
- 7b–7e 任一項自我審查發現問題 → 結束 routine,不要 push
- git push 被拒且 rebase 有 conflict → 結束 routine,不要強推
- 任何意外狀況 → 結束 routine,在訊息中清楚列出錯誤位置與原因

絕對禁止:`git push --force`、`git commit --amend` 已 push 的 commit、
`git reset --hard` 後 push、跳過 validate.mjs。
````

## 5. 你的工作流(零審查,只監控)

平時你**完全不需要做任何事**。Claude 每天 09:00 自己抓題、產內容、push 到 main、CI 自動驗證,extension 隔天就抓得到。

### 唯一會打擾你的情況

GitHub 會在以下時機通知你(透過你訂閱的 watch 設定):

| 事件 | 意思 | 你要做的 |
| --- | --- | --- |
| Routine session 失敗 | Claude 自己放棄 push(資料抓不到、validate 連續失敗等) | 看 [claude.ai/code/routines](https://claude.ai/code/routines) session log,通常是 prompt 要調整 |
| `validate.yml` workflow fail 在 main | 壞內容溜過 pre-push 檢查 | **`auto-revert.yml` 會自動回退**,並開一個 issue 說明 |
| `auto-revert.yml` 開的 issue | 自動 revert 已完成 | 看 issue 內提到的 bad commit,加強 prompt 防止再犯 |

### 萬一需要手動 rollback

雖然 `auto-revert.yml` 會自動處理 99% 情況,但極端狀況(例如 CI 通過但內容仍然有問題,人工發現)可以手動回退:

```bash
git clone https://github.com/USER/leetcode-coach-content
cd leetcode-coach-content
git log --oneline -5                  # 找出 bad commit SHA
git revert <bad-sha>                  # 產生反向 commit
git push origin main                  # 推上去
```

Extension 端的 24h 內容快取意味著大多數既有使用者根本不會看到那次壞內容(他們的 cache 有效,要等過期才會抓新版,而那時你已經 revert 完)。

### 第一次跑時(只做這次,之後就不用管)

1. 上 [claude.ai/code/routines](https://claude.ai/code/routines)
2. 點你建好的 routine
3. 點 **Run now** 立刻觸發一次(這次不算 daily cap)
4. 等 session 跑完,確認:
   - main 分支多了一個 `Add <slug> daily problem (...)` commit
   - `validate.yml` workflow 在 GitHub Actions 跑綠
   - 該題的 LeetCode 頁面打開,extension 注入的 `<review-card>` 內容正確、提示三段都能展開、解答能看
5. 沒問題 → 你的工作結束,Claude 從此每天自動跑。

> 💡 把 GitHub repo 設成「Watching」→「Custom」→ 勾「Issues」與「Actions」。 這樣只有真正需要你的時候才會收通知,日常順利 push 不會打擾你。

## 6. 觀察 Run 結果

每次 routine 跑完都會建立一個 **session**,在 [claude.ai/code/routines](https://claude.ai/code/routines) → 點 routine → 看 **past runs** 列表。

點任一 run 進入完整 session 介面:

- 看 Claude 跑了哪些指令
- 看 GraphQL 回應、validate.mjs 輸出、git push 訊息
- 如果失敗,可以**直接在 session 中繼續對話**叫 Claude 修正

## 7. 暫停 / 修改 / 刪除

在 routine 詳情頁:

| 動作 | 怎麼做 |
| --- | --- |
| 暫停一陣子 | **Repeats** 區塊的 toggle 切到 off,設定保留,只是暫停 |
| 改 prompt | 鉛筆 icon → **Edit routine** → 改 prompt → Save |
| 改頻率 | 同上,Edit 表單的 trigger 區塊 |
| 立刻跑一次 | **Run now** 按鈕 |
| 永久刪除 | 垃圾桶 icon — past sessions 仍會保留在 session list |

## 8. 用量與費用

- Routines 用的是你**現有訂閱方案**的 usage,跟互動式 session 一樣計費
- 每天有 **daily routine run cap**(具體數字看 [claude.ai/settings/usage](https://claude.ai/settings/usage))
- 達上限後,有開「extra usage」的會走 metered overage,沒開的會被拒絕
- **One-off** runs(例如「兩週後幫我清掉這個 flag」)**不算 daily cap**

## 9. 故障排除

| 症狀 | 排查 |
| --- | --- |
| Routine 沒在預期時間跑 | Stagger 可能延遲幾分鐘;在 [claude.ai/code/routines](https://claude.ai/code/routines) 看 next run 時間 |
| Push 到 main 被拒 | 確認 Permissions 區塊有勾「Allow unrestricted branch pushes」;檢查 `/web-setup` GitHub OAuth 是否還有效 |
| 全部來源 curl 都回 403 `Host not in allowlist` | 你 routine 的 environment 是 `Trusted` 或 `None`,allowlist 不含 daily API 的 host。**§Step 4** 教你建 Custom environment 加上正確的 host。改完後 routine 會 cache 環境,下次 run 就會通 |
| `*.onrender.com` 第一次冷啟動超慢 | Render 免費 tier 閒置會休眠,首次請求 30~60 秒。`--max-time 60` 已含;如果還是 timeout,改用 `*.vercel.app` 或 WebFetch fallback |
| WebFetch 也 fail 了 | Routine 級的 WebFetch 工具罕見會壞。看 session log 確認是否真的呼叫了 WebFetch(而不是 curl)。重跑一次通常就好 |
| 改了 env 但還是被擋 | Environment 改動後**第一次 run 會重建 cache**,有時要等 1~2 分鐘。也檢查 routine 是否真的指到新建的 environment 而非 Default |
| validate.mjs 一直失敗 | 多半是 schema 太嚴或 prompt 規範不夠精確 — 在 session 中手動修一次,把修法寫回 prompt |
| 內容品質不穩定 | 在 prompt「規範」段加更具體的「不要 X」與「應該 Y」,並把實際的負面案例貼進 prompt |
| 達到 daily routine cap | 改買 extra usage,或減少 routine 數,或拉長 cadence |
| `auto-revert.yml` 自動 revert 了 | 看它開的 issue,根據壞內容類型加強 prompt 的「失敗時的行為」段;不需要手動處理 main(已被 revert) |
| 想手動 revert 一個 commit | `git revert <sha> && git push origin main`;extension 24h cache 意味著大多數使用者不會看到那次壞內容 |

## 10. 進階:配合 GitHub Event Trigger

想要「**有人開 PR 到本 repo 時自動跑 schema 驗證並留言**」?

1. 在 routine 編輯頁 → **Select a trigger** → **Add another trigger** → 選 **GitHub event**
2. 安裝 **Claude GitHub App**(系統會引導,跟 `/web-setup` 不同)
3. Repository 選本 repo,Event 選 `pull_request.opened`
4. Filter 可加 `Author is one of: claude`(只對 routine 自己開的 PR 跑)
5. Prompt 改成「跑 validate.mjs,把結果留言到 PR」

這樣可以同時做到「每天產內容」+「PR 自動回饋」。

## 相關連結

- 官方 routines 文件:<https://code.claude.com/docs/en/web-scheduled-tasks>
- API trigger reference:<https://platform.claude.com/docs/en/api/claude-code/routines-fire>
- Claude Code on the web:<https://code.claude.com/docs/en/claude-code-on-the-web>
- 本 repo 內容寫作規範:[CONTRIBUTING.md](../CONTRIBUTING.md)
- JSON Schema:[schemas/problem.schema.json](../schemas/problem.schema.json)
- 黃金範本:[problems/two-sum.json](../problems/two-sum.json)
