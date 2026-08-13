# 超音波導引注射課程

這是可搜尋、可離線閱讀、可安裝成手機主畫面 App 的靜態課程庫。

## 電腦使用

1. 雙擊 `啟動超音波課程.bat`。
2. 瀏覽器會開啟 `http://localhost:4191/`。
3. 使用期間請保留黑色命令視窗；關閉視窗即停止本機網站。

文章、時間軸、論文連結資訊與引用圖片均已存放在本機。YouTube、Vimeo、Yale 與 Philips 串流影片仍需網路連線，YouTube 與 Vimeo 會直接在頁面內播放。

## 手機 App

本專案已包含 PWA manifest、圖示與離線快取。放到 HTTPS 網站後：

- iPhone／iPad：Safari「分享」→「加入主畫面」。
- Android：Chrome 選單→「安裝應用程式」或「加到主畫面」。

PWA 安裝通常需要 HTTPS；Windows 電腦上的 `localhost` 版本主要供本機離線閱讀與測試。

## 收錄核對

- 公開課程：109 筆（95 筆學會／官方公開原課＋14 筆核心精讀）
- King Hei Stanley Lam：9 個技術單元、29 篇本人署名文獻
- Ke‑Vin Chang：9 個技術單元、29 篇本人署名文獻
- 公開影片時間軸：1,100 段
- 作者論文引用圖片：已下載至 `public/media`，靜態輸出則位於 `out/media`

## 檔案說明

- `out`：可直接由任何靜態網站伺服器提供的完成版
- `public/archive-data.json`：完整整理資料
- `public/media`：下載至本機的引用圖版與影片預覽圖
- `source-archive`：原始網站資料封存
