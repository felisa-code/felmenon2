# 菲米諾吸音板 felmenon2

獨立於舊站的 GitHub Pages 網站。唯一部署目標：**felisa-code/felmenon2**。
原有 felisa-code/felmenon 完整保留。本專案沒有舊站的寫入憑證、推送指令或部署設定。

## 2026-11-02 更新（手機案例輪播版）

首頁精選 9 張。電腦與平板保留每列 3 張九宮格；手機寬度720px以下改為左右滑動輪播，每次1張大圖，另有上一張／下一張、1／9頁碼、縮圖導覽與鍵盤方向鍵／Home／End。手機的標題與單行簡介位於照片下方，不自動輪播；點選照片可看完整原圖與完整介紹。電腦仍使用圖上漸層介紹。

首頁保留臥室、兒童房、藍灰品牌體驗室、客廳、日式客廳、會議室、商業展示、琴房與青綠主牆，共9張。體驗室只選藍灰照片；紫色渲染圖 case10.jpg 以 visible:false 移出首頁，原圖與資料仍保留。

所有案例簡介採範例的「特色 × 空間應用」形式，固定一行、不換行；未來過長的文字以省略號處理，點開仍可看完整 description。summary 為選填的縮圖簡述；未填時採 description，仍限制為一行。新增案例預設展示。

目前採 GPT 協作提供文案，全部案例均已鎖定，不需設定 AI API 金鑰。日後將新照片與新版 data/cases.json 上傳即可，既有可選 AI 功能可維持不設定；PDF 自動轉圖不依賴 AI 金鑰。

## 第一次使用

請先看 `docs/GitHub網頁版操作手冊.html`，可直接用瀏覽器開啟。以下全部只在新 Repo 執行。

1. GitHub 建立 Public Repository：Owner `felisa-code`、名稱 `felmenon2`、預設分支 `main`。可勾選 Add a README，方便進入設定頁。
2. 新 Repo → Settings → Pages → Build and deployment → Source 選 **GitHub Actions**。
3. 解壓部署 ZIP。新 Repo → Code → Add file → Upload files，拖入解壓後資料夾**裡面**所有檔案及目錄，保留 `.github/workflows/`。不要上傳 ZIP 本身，不要多包一層 felmenon2 目錄。選 Commit directly to main。
4. **不需設定 AI API 金鑰**。本版 10 張案例已備妥文案並設為人工定稿。日後把新照片傳到 GPT，提供公開 Repo 網址，取得新版 data/cases.json 後與照片上傳即可。
5. Actions → Publish website → Run workflow → main → Run workflow。開啟本次執行，確認 build 與 deploy 均綠色。完成後網址：https://felisa-code.github.io/felmenon2/ 。

若上傳檔案時先觸發 workflow，卻尚未設定 Pages，第一次失敗可在設定完成後重新執行。若 .github 未上傳，請用 Add file → Create new file，逐一建立本包提供的四份 `.github/workflows/*.yml`，路徑及內容完整照貼。

不必變更整個帳號的工作流程預設權限。workflow 已自行宣告所需權限。若組織政策或 main 分支保護禁止 bot 寫入，請由管理員確認新 Repo 的規則；不可用強制推送處理。此架構需要 Actions 能提交自動資料到 main。

## 日常維護

| 工作 | GitHub 網頁操作 | 結果 |
|---|---|---|
| 新增案例 | Code → cases → Add file → Upload files，選 JPG/JPEG/PNG/WebP | 自動辨識新圖，生成文案並部署 |
| 更新照片 | cases 中上傳同名照片 | 未鎖定案例重生；人工鎖定案例保留文案並提示確認 |
| 更換型錄 | Repo 根目錄上傳同名 catalog.pdf | 轉圖、頁數與版本自動更新 |
| 人工改文案 | data/cases.json → 鉛筆，改 title/description/alt，設 locked:true、manual:true、status:"ready" | 下一次部署保留定稿 |
| 補做待處理文案 | 設定好金鑰後，Actions → Update case photos → Run workflow，regenerate 留空 | 只補 pending，不重寫 ready |
| 重做一張文案 | 同上，在 regenerate 填 cases 下的精確檔名，如 office-2026.jpg | 明確覆寫該張，包括人工定稿；其餘保留 |
| 移除案例 | 刪除 cases 中那張照片並 Commit | 自動從清單移除 |

照片取不同檔名，例如 `meeting-room-20261101-01.jpg`；不要為了新增照片覆蓋既有 case1.jpg。支援子資料夾，regenerate 填相對 cases 的路徑。HEIC 請先轉 JPG。完全相同的圖片依 SHA-256 去重；摘要會指出重複檔，不額外顯示相同案例。

AI 只使用於案例的三個欄位，不會改首頁、Logo、歌曲介紹或官方連結。初始 7 個案例保留交接包人工定稿。生成以可見內容為準，檢查標題唯一及描述／ALT 字串相似度；每張最多嘗試 3 次。這不是客觀事實保證，發布後仍應人工審閱。單次最多處理 20 張，超出可再 Run workflow。

缺少金鑰、API 失效、額度不足、格式不符時，圖片仍顯示，資料標示 status:pending，Actions Summary 顯示管理警告。此時通用文字是備援，**不代表 AI 已生成**。不在公開網頁展示後台錯誤。

## 型錄頁數

現有 PDF 為 30 個橫式跨頁。本版拆為 **60 個閱讀書頁**，手機單頁、電腦雙頁；下載 PDF 仍為原始完整 30 頁，不修改 PDF 內容。直式 PDF 每頁直接成為 1 個書頁；長寬比大於 1.2 的橫式頁平均分成左右兩半。若將來是非跨頁的橫式簡報，可請維護人員調整 scripts/catalog.py 的拆頁規則。

PDF 轉圖在 Actions 執行，前端不載入 PDF.js、不一次渲染整份 PDF、不嵌入 base64 頁面。JPG 最長約 1400px，依版本雜湊分目錄。前端僅為目前與鄰近頁指定圖片來源，離開時移除；手機直式單頁仍有 3D 翻頁，左右滑動翻頁、上下滑動捲動。放大時改為滑動閱讀，可用按鈕翻頁。iPhone 不支援元素全螢幕時以滿版覆蓋層備援。

轉換先在暫存目錄完成，再切換 data/catalog.json。失敗保留最後可用圖與 PDF 快照，摘要提示錯誤；下載連結也指向最後成功版本。根目錄的 catalog.pdf 是您下一次替換的來源。若要撤回損壞檔，重新上傳上一份正常 PDF。

## 工作流程

- `case-captions.yml`：cases/** 變更及手動重做指定檔案。
- `catalog-build.yml`：catalog.pdf 變更及手動更新。
- `deploy.yml`：其他來源變更與手動發布。
- `pipeline.yml`：共用建置、資料提交與部署。跨 workflow 共用同一佇列，所有 run 取最新 main，避免舊事件覆蓋新內容。

同次提交同時改照片及 PDF 時，可能各觸發一次；程序用雜湊跳過已完成內容。GitHub 同一 concurrency group 只保留一個執行中與一個等待中，其餘等待可被後續 run 取代，最後仍讀最新 main。bot 用 GITHUB_TOKEN 提交的資料不再觸發新 run，所以在**同一次 run**直接上傳 artifact 並部署；不依賴 bot commit 重新觸發另一個 Pages workflow。

推送遇到同時編輯 main 時不強推、不自動覆寫使用者修改；失敗 run 停止，後續 run 或手動重跑會讀最新 main。發布只打包 index.html、assets、cases、data、catalog-pages、catalog.pdf、vendor。Secrets 不會寫入成品。

## 故障判讀

| 現象 | 檢查與處理 |
|---|---|
| 整站 404 | Settings → Pages 是否選 GitHub Actions；deploy 是否成功；路徑需含 /felmenon2/ |
| 首頁空白／檔案 2 Bytes | Code 確認根目錄唯一 index.html，不能是 index .html 或 index (2).html；重新上傳本包正確檔案 |
| 案例出現通用文案 | Actions 該次 Summary 看金鑰、額度、圖片格式；修正後 Run Update case photos |
| 案例照片不出現 | 確認上傳在 cases/，副檔名支援；檢查是否 duplicate、data/cases.json 是否成功提交 |
| 破圖 | 檔案路徑大小寫與資料清單一致；勿單獨刪除自動產生 catalog-pages；重新 Run workflow |
| PDF 換了卻仍為舊型錄 | 看 Summary 是否顯示轉換失敗；可能正在提供最後成功版本，先確認原檔可開啟 |
| workflow 403 | 新 Repo 的分支／組織規則是否允許 GITHUB_TOKEN 提交 main；確認不是舊 Repo |
| git push rejected | 上傳與 bot 同時提交；等待其他 run 完成，再手動重跑；不要強制推送 |
| 沒有 Run workflow | 確認四份 yml 均位於 main 的 .github/workflows/；重新整理 Actions |
| PDF 超過 25 MiB | GitHub 網頁單檔上限 25 MiB，先輸出網頁用壓縮 PDF；完整高畫質版另存 |

## 回復與驗收

一般回復：從已保存 ZIP 重新上傳需回復的照片或 catalog.pdf，Actions 自動重建。人工文案可在 data/cases.json → History → 開啟先前版本，複製該筆文字回到目前檔案後 Commit。恢復整站版本可由維護人員使用 Git revert（不改寫歷史）。不要把已過期的自動產生 data/catalog.json 單獨貼回，卻沒有對應圖片。

正式驗收前請在您的 iPhone Safari 與電腦 Chrome 檢查：首／中／末頁、左右翻頁與上下捲動、縮放與滿版、7 張原案例、新增第 8/9 張、人工定稿不被改寫、不同頁數 PDF 更新、缺少 API 時不影響圖片、歌曲點播、全部官方連結。驗收結果與尚待確認項目見 docs/驗證紀錄.md。

## 技術參考與授權

StPageFlip 固定 2.0.7，隨站附帶本機檔及 MIT LICENSE，不依賴外部 CDN。PyMuPDF 依其 AGPL／商用雙重授權使用；本儲存庫將建置程式碼公開，若改作封閉服務請另行審查授權。品牌素材權利屬原權利人，第三方程式授權不授予品牌素材使用權。

官方文件：
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions
- https://developers.openai.com/api/docs/guides/images-vision
- https://github.com/Nodlik/StPageFlip

本包提供可部署的網站及工作流程，尚未在您的 GitHub 帳號完成建立／部署，也沒有 API 真實呼叫驗收。不需要交付任何帳號密碼或 API 金鑰給聊天。
