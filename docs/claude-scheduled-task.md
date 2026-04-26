# 自動更新此 Repo — Claude Code Routines 完整設定教學

設定 Claude Code 的 **Routines**(雲端排程,前身為 Scheduled Tasks)讓 Claude 每天自動為今日 LeetCode daily challenge 產生繁體中文教學內容,**直接 push 到 `main`** 讓 extension 立刻抓得到。

> 本文件對應的官方文件:[code.claude.com/docs/en/web-scheduled-tasks](https://code.claude.com/docs/en/web-scheduled-tasks)

## 0. 前置條件

| 項目 | 需要 |
| --- | --- |
| Claude.ai 訂閱方案 | **Pro / Max / Team / Enterprise** 任一 |
| Claude Code on the web | 已啟用([claude.ai/code](https://claude.ai/code) 看得到) |
| **Claude Code GitHub App** | 已安裝到目標 repo,且授予 `Contents: Read and write`(見 §1)— **`/web-setup` 給的 OAuth 只夠 clone,不夠 push,必須額外裝 App** |
| 本 repo | 已 push 到你自己的 GitHub(public 或 private 都可以) |

> ⚠️ Routines 在 **research preview** 階段,行為與限制可能變動。每個帳號每天有「Daily routine run cap」,在 [claude.ai/code/routines](https://claude.ai/code/routines) 看剩餘次數。

## 1. 連結 GitHub 帳號(只需一次)

要 routine 直接 push 到 `main`,**必須**做兩步:

### Step 1.1 — 用 `/web-setup` 給 clone 權限

1. 進入 Claude Code CLI(`claude` 指令)
2. 執行 `/web-setup`
3. 依照提示授權 GitHub OAuth — 這步只給 routine sandbox **clone** 權限,**不夠 push**

### Step 1.2 — 安裝 Claude Code GitHub App 並給 `Contents: write`

1. 從 [claude.ai/code/routines](https://claude.ai/code/routines)(建立第一個 routine 時系統會跳引導),或直接到 https://github.com/settings/installations 點 **Configure** Claude Code App
2. **Repository access** 選 `Only select repositories` → 加入 `Jason0411202/leetcode-coach-content`(或 `All repositories` 也可,較粗)
3. **Permissions** 必須包含:
   - `Contents: Read and write`(寫 commit + push 必需)
   - `Metadata: Read`(預設給)
   - `Pull requests: Read and write`(若日後改用 PR 流程)
4. 若頁面上方出現黃色 **Permissions need review** banner → 點 **Review and accept**,新 scope 才生效

### Step 1.3 — 驗證裝對 App

到 https://github.com/settings/installations → 點 Claude Code 的 **Configure** → 確認:
- Repository access 含目標 repo
- Permissions 區塊看得到 **Contents: Read and write**

看不到 Contents write 通常是裝錯版本(只做 PR/issue 留言的那支 Claude App 沒有 Contents write)。從 [claude.ai/code/routines](https://claude.ai/code/routines) 走一次 reconnect 流程通常會引導到正確的 App。

> 💡 **權限三層,別混淆:**
> 1. Sandbox proxy 允許推哪些 branch — routine 設定頁的 **Permissions: Allow unrestricted branch pushes**
> 2. **GitHub App 對 repo 的 scope** — 上面 Step 1.2,缺這個 push 會在 proxy 端回 `403 from 127.0.0.1:<port>`
> 3. App 裝在哪些 repo — 上面 Step 1.2 的 Repository access
>
> 三層全部通,push 才會到 GitHub。

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

**Connectors** — 預設會包含你所有已連接的 MCP connectors。本 routine **不需要任何 connector**,把它們**全部移除**(routine 用的是 §1 安裝的 GitHub App 權限,不依賴 connector)。

**Permissions** — 對 `Jason0411202/leetcode-coach-content` 這個 repo:
- ✅ **「Allow unrestricted branch pushes」: 必須勾選**(sandbox proxy 層的 branch 白名單)
- 結果:配上 §1 已給 `Contents: write` 的 GitHub App,Claude 就能直接推到 `main`,extension 立刻抓到新內容,**完全不需要人工 review**

> ⚠️ 這個勾只是 proxy 層的 branch 白名單,**不會**自動補上 GitHub App 的 push scope。如果 §1 的 App 沒裝對,push 仍會在 proxy 端回 403。

> ⚠️ **品質防線從「人工 review」改為「自動化驗證」:**
>
> 1. **Prompt 內建嚴格的 pre-push 檢查** — `node scripts/validate.mjs` 與 solution code 對全部 example test cases 實際執行,任一 fail 就放棄。push 後還會比對 remote SHA 確認真的上 main
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
你是 LeetCode Coach 內容生成 routine。每天為今日 daily challenge 產生一份繁體中文教學 JSON,**直接 push 到 main 分支**讓 extension 立刻抓得到。沒有人工 review,所以 pre-push 驗證必須非常嚴格 — 寧可放棄 push 也不要推半成品。

## 鐵律(任何時候都不准違反)

- **必須 push 到 main**。如果發現自己不在 main(sandbox 給了 `claude/...` 之類 branch):`git checkout main && git pull --ff-only origin main`,然後在 main 上 commit + push。**不准 reason「session branch 優先」、「先推 feature branch 之後再 merge」、「待會開 PR」等任何例外。沒有任何例外。**
- 任何不確定 / 失敗 / 衝突 → 結束 routine,不 push。寧可什麼都不做。
- 禁止 `--force`、`--force-with-lease`、`commit --amend`(已 push)、`reset --hard` 後 push、跳過 validate.mjs、跳過 solution 實際執行。

## 步驟

### 1. 抓今日 daily challenge

依序試以下三個來源,第一個成功就用。**不要重複呼叫**。HTTP 403 / 503 / connection reset / `Host not in allowlist` / 空回應 / 無法 JSON.parse → 失敗,試下一個。

| # | 方法 | URL |
| --- | --- | --- |
| A | `curl -sf --max-time 60` | `https://alfa-leetcode-api.onrender.com/daily` |
| B | `curl -sf --max-time 20` | `https://leetcode-api-pied.vercel.app/daily` |
| C | Claude `WebFetch` 工具(走 Anthropic server-side,bypass 環境 allowlist) | 對 A 或 B 的 URL,prompt 必須是「Return the full raw JSON response verbatim. Do not summarize or paraphrase.」 |

抽出欄位(每個來源的 path 不同):

| 變數 | A | B |
| --- | --- | --- |
| `<slug>` | `titleSlug` | `question.titleSlug` |
| `<leetcode_id>` | `parseInt(questionFrontendId)` | `parseInt(question.questionFrontendId)` |
| `<title>` | `questionTitle` | `question.title` |
| `<difficulty>` | `difficulty.toLowerCase()` | `question.difficulty.toLowerCase()` |
| `<topicTags>` | `topicTags[].slug` | `question.topicTags[].slug` |
| `<official_html>` | `question`(string) | `question.content` |

C 的回應是 markdown 包裹的 ```json``` block,extract 後 parse。WebFetch 把 JSON 改寫而非 verbatim → 視為失敗。

三個都失敗 → 結束 routine,訊息列出每個 source 的 status/error,並提示使用者去 environment 加 `alfa-leetcode-api.onrender.com`、`leetcode-api-pied.vercel.app` 到 allowed domains(或改 Network access = Full)。

### 2. 確認題目沒被涵蓋

讀 `manifest.json`。`problems[].slug` 已含 `<slug>` → 結束 routine(訊息:「<slug> 已涵蓋,跳過」)。**不要**產 v2 衍生內容。

### 3. 讀範本

讀 `schemas/problem.schema.json` 與 `problems/two-sum.json`(黃金標準)。

### 4. 寫 problems/<slug>.json(`schema_version: 1`)

**explanation_html**
- 中文重新詮釋,不可整段翻譯 LeetCode 原文(版權)
- 含一段 inline SVG 視覺化(`viewBox="0 0 600 200"`)
- 列邊界情況
- 不可洩漏解法

**hints_html**(3~4 條由淺入深)
1. 重新框架問題,**不可**直接點名 pattern(例如不可寫「用 hash map」)
2. 指向關鍵資料結構或關鍵觀察
3. 虛擬碼骨架,關鍵處留 `____`
4. (選用)更具體的虛擬碼骨架。**最後一條不可等同完整 solution。**

**solution_html**
- 完整 Python solution,註解充分
- 走查段(配範例輸入逐行解說)
- 複雜度分析(時間 + 空間 + 原因)
- 一句話 key insight(callout)
- 視需要加 SVG

**通用**
- 顏色用 CSS 變數:`--lc-primary`、`--lc-success`、`--lc-warning`、`--lc-danger`、`--lc-bg`、`--lc-text`、`--lc-border`、`--lc-muted`。**禁止 hex**
- 禁止 `<script>`、`on*=`、外部 `<img src>`(只能 inline SVG)

### 5. topicTags 映射到 pattern

只接受這 21 個 enum:`hash-map`, `two-pointers`, `sliding-window`, `binary-search`, `stack`, `queue`, `linked-list`, `tree`, `graph`, `bfs`, `dfs`, `dp`, `greedy`, `backtracking`, `bit-manipulation`, `math`, `array`, `string`, `union-find`, `trie`, `heap`。其他丟掉(如 `Matrix`、`Counting`)。

非身分映射:

```
hash-table                                → hash-map
binary-tree, binary-search-tree           → tree
breadth-first-search                      → bfs
depth-first-search                        → dfs
dynamic-programming                       → dp
heap-priority-queue, priority-queue       → heap
monotonic-stack                           → stack
monotonic-queue                           → queue
```

其餘 LeetCode slug 與 enum 同名 → 直接用。映射後若陣列為空,依題目本質手動補至少一個。

`metadata` 欄位:`difficulty`(小寫)、`title_en`(`<title>`)、`leetcode_id`(int)、`leetcode_url`(`https://leetcode.com/problems/<slug>/`)、`generated_by`(`"claude"`)、`generated_at`(今天 YYYY-MM-DD)。

### 6. 更新 manifest.json

加入 `{ slug, leetcode_id, title_en, pattern, difficulty, added_at: <today> }` 到 `problems` 陣列,並把頂層 `updated_at` 改成現在 ISO 時間。

### 7. Pre-push 自我審查(任一條失敗 → 結束 routine,不 push)

**7a — Schema 驗證**
`node scripts/validate.mjs`。失敗 → 讀錯誤、修 JSON、最多重試 3 次。第 4 次仍敗 → 結束。

**7b — Solution 必須真的跑過(禁止只腦中走查)**
把 `solution_html` 中的 Python solution 抽出來存成 `/tmp/sol.py`,加 driver 餵**所有** LeetCode example inputs,執行 `python3 /tmp/sol.py`,逐個比對 stdout 與題目 expected。

- 任一 example 不符 → 結束 routine。
- **最終訊息中必須附上 stdout** 證明真的跑過。

**7c — Diff 範圍**
`git status --porcelain` 必須**只**列出 `?? problems/<slug>.json` 與 ` M manifest.json`。其他檔案被動 → 結束 routine。

### 8. Branch + Push

1. `git rev-parse --abbrev-ref HEAD`。不是 `main` → `git checkout main && git pull --ff-only origin main`。**重申:不准 reason 例外。**
2. 再跑一次 7c(checkout 可能改變 working tree)。
3. `git add problems/<slug>.json manifest.json`(**只**這兩個)。
4. `git commit -m "Add <slug> daily problem (<YYYY-MM-DD>)"`。
5. `git push origin main`。錯誤分支處理:
   - **`403 from http://127.0.0.1:<port>/git/...`(sandbox proxy 把 GitHub 403 包起來)**:GitHub App 的 `Contents: write` scope 沒給夠。**不重試、不換 branch、不 fallback 到 PR**。STATUS: `ABORTED`,flags 必寫「GitHub App scope insufficient — 請使用者去 §1 Step 1.2/1.3 確認 App 安裝與 Permissions」並結束。
   - **non-fast-forward**:`git pull --rebase origin main` → 重跑 7a → 再 push 一次。Rebase conflict → 結束,**禁止強推**。
   - **其他錯誤**(network、unknown ref...):STATUS: `ABORTED`,flags 列原始 stderr,不重試。

### 9. 驗證 push 真的到 remote main

`git ls-remote origin refs/heads/main` 取 remote SHA;`git rev-parse HEAD` 取 local SHA。

- 一致 → STATUS: DONE
- 不一致 → STATUS: PUSH_UNVERIFIED,訊息中列出兩個 SHA 與可能原因。**不重試。**

### 10. 最終訊息(固定格式)

```
STATUS: DONE | SKIPPED | ABORTED | PUSH_UNVERIFIED
slug: <slug>
leetcode_id: <leetcode_id>
difficulty: <difficulty>
pattern: [...]
validate.mjs: pass / fail (retry N 次)
solution test: PASS (N examples) / FAIL / N/A
local SHA:  <sha 或 N/A>
remote main SHA: <sha 或 N/A>
URL: https://leetcode.com/problems/<slug>/
flags: <7b/7c 自評時邊緣可疑點;ABORTED 必列原因>
solution stdout(7b 必附):
<...>
```

ABORTED 原因可能:三來源全失敗 / validate 連敗 3 次 / solution test fail / diff 範圍錯 / rebase conflict / 不在 main 且無法 checkout / **GitHub App scope insufficient(proxy 403)** / 其他。
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
| `git push` 回 `403 from http://127.0.0.1:<port>/git/...` | Sandbox proxy 把 GitHub 的 403 包成本地 403。**最常見原因**:GitHub App 沒有 `Contents: Read and write`(只裝了 PR/issue 留言版本的 Claude App),或 App 沒選到目標 repo。修法見 §1 Step 1.2/1.3 |
| Push 被拒,但 App 已裝對 | 確認 routine **Permissions** 區塊勾了「Allow unrestricted branch pushes」(這是 sandbox proxy 層的 branch 白名單,跟 App scope 是不同層) |
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
