# Contributing — Content

歡迎貢獻新題目或改進現有內容。

## 加入新題目

1. Fork 這個 repo
2. 在 `problems/` 建立 `<slug>.json`,例如 `problems/three-sum.json`
3. 內容格式參考 [`schemas/problem.schema.json`](schemas/problem.schema.json) 與現有的 `two-sum.json`
4. 在 `manifest.json` 的 `problems` 陣列加入索引
5. 跑驗證:
   ```bash
   node scripts/validate.mjs
   ```
6. 開 PR

## 內容寫作規範

### 不要

- ❌ 整段翻譯 LeetCode 原題敘述(版權考量)
- ❌ 在 HTML 片段中包含 `<script>` 標籤
- ❌ 在 HTML 中加入 `onclick`、`onload` 等事件 attribute
- ❌ 寫死 hex 色碼,要用 CSS 變數
- ❌ 第一條提示就直接洩漏解法

### 要

- ✅ `explanation_html`:中文重新詮釋 + 至少一段 SVG 視覺化 + 邊界情況提醒
- ✅ `hints_html`:1~5 條,從問題重新框架 → 關鍵資料結構 → 虛擬碼骨架,逐步逼近
- ✅ `solution_html`:完整 Python 解法 + 註解 + 程式碼走查 + 複雜度分析 + key insight
- ✅ 用 CSS 變數:`--lc-primary`、`--lc-success`、`--lc-warning`、`--lc-danger`、`--lc-bg`、`--lc-text`、`--lc-border`、`--lc-muted`

### Pattern 標籤

從以下選用(可多選):

```
hash-map, two-pointers, sliding-window, binary-search, stack, queue,
linked-list, tree, graph, bfs, dfs, dp, greedy, backtracking,
bit-manipulation, math, array, string, union-find, trie, heap
```

## 內容錯誤回報

任何人在 extension 中按「⚠️ 內容有問題?」會自動帶你到這個 repo 開 issue。也歡迎直接在 GitHub Issues 開 issue,加 `content` label。

## 授權

提交內容即同意以 [CC-BY-SA-4.0](LICENSE) 釋出。
