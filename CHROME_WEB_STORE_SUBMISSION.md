# Chrome Web Store Submission Guide

本指南說明如何將 Reddit Quant Signal Analyzer 提交到 Chrome Web Store。

## 📋 提交前檢查清單

### 必要文件

- [x] `manifest.json` - 已更新（版本 1.0.0，包含 storage 權限）
- [x] `options.html` - API key 配置頁面
- [x] `options.js` - 設定管理邏輯
- [x] `popup.html` - 主介面
- [x] `popup.js` - 已修改使用 Chrome Storage API
- [x] `icon16.png`, `icon48.png`, `icon128.png` - 擴展圖標
- [x] `README.md` - 專案說明
- [x] `SETUP.md` - 用戶設置指南

### 需要移除的文件

- [ ] `config.js` - **必須移除**（包含敏感 API keys）
- [ ] `.git/` - Git 目錄（可選，但建議移除以減小文件大小）
- [ ] `node_modules/` - 如果有的話

---

## 🎨 準備資源

### 1. 圖標（已完成 ✅）

需要的尺寸：
- ✅ 16x16 (icon16.png)
- ✅ 48x48 (icon48.png)
- ✅ 128x128 (icon128.png)

### 2. 截圖（需要準備）

**必須提供至少 1 張**，最多 5 張：

- 尺寸：**1280x800** 或 **640x400**
- 格式：PNG 或 JPEG
- 內容建議：
  1. 主介面顯示 LLM 摘要
  2. 3D 視覺化截圖
  3. 投資信號分析頁面
  4. 設定頁面（顯示 API key 配置）
  5. 使用範例（在 Reddit 頁面上使用）

### 3. 宣傳圖片（可選）

- Small tile: 440x280
- 可用於 Chrome Web Store 展示頁面

---

## 📝 商店資訊

### 短描述（132 字元以內）

```
Transform Reddit discussions into quantitative investment signals with AI analysis and 3D visualization.
```

### 詳細描述

```markdown
# Reddit Quant Signal Analyzer

Unlock actionable insights from Reddit discussions with AI-powered analysis and stunning 3D visualizations.

## 🎯 What It Does

Reddit Quant Signal Analyzer helps investors, traders, and researchers extract quantitative signals from Reddit community discussions. Perfect for analyzing r/wallstreetbets, r/cryptocurrency, r/stocks, and more.

## ✨ Key Features

### 🤖 AI-Powered Analysis
- Google Gemini AI summarizes discussion sentiment and key points
- Automatic detection of market sentiment (bullish/bearish/neutral)
- Identifies false optimism and capitulation signals

### 🎨 Interactive 3D Visualization
- Explore comment threads in stunning 3D
- Color-coded nodes: Solutions (green), Questions (orange), Debates (red)
- Visual encoding: Node size = reply count, Opacity = upvotes
- Click to select and center on specific comments

### 📊 Quantitative Metrics
- **Confidence Score**: How reliable is the discussion?
- **Controversy Score**: Level of disagreement
- **Solution Density**: How helpful is the community?
- **Author Diversity**: Echo chamber detection
- **Activity Velocity**: Trending indicator
- **And 20+ more metrics!**

### 💡 Smart Features
- **Daily limit**: 10 analyses/day (free tier friendly)
- **Caching system**: Revisit analyzed posts instantly (doesn't count toward limit)
- **Privacy-first**: All data stays local, no third-party servers

## 🚀 Quick Start

1. **Install the extension**
2. **Get free API keys** (5 minutes):
   - Reddit API: reddit.com/prefs/apps
   - Gemini API: makersuite.google.com/app/apikey
3. **Enter keys in extension settings**
4. **Visit any Reddit post** and click the extension icon

No credit card required! Both APIs offer generous free tiers.

## 🎓 Perfect For

- **Retail Investors**: Gauge community sentiment on stocks/crypto
- **Researchers**: Study social media influence on markets
- **Traders**: Extract alternative data signals
- **Analysts**: Quantify discussion quality and engagement

## 🔒 Privacy & Security

✅ Local storage only - your API keys never leave your browser
✅ No data collection - we don't store or transmit your data
✅ Open source - full code available on GitHub
✅ Direct API calls - your browser talks directly to Reddit and Gemini

## 📖 Documentation

Full documentation, metrics guide, and troubleshooting available in the extension's GitHub repository.

## 💬 Support

Questions or issues? Open an issue on GitHub or check our detailed setup guide.

**Disclaimer**: This tool is for educational and research purposes only. Not financial advice.
```

### 類別

Primary: **Productivity**
Secondary: **Developer Tools** (可選)

### 語言

- English (primary)
- 可以後續添加其他語言

---

## 🔐 隱私政策

Chrome Web Store **要求**提供隱私政策 URL。

### 選項 1: GitHub Pages（推薦）

創建 `docs/privacy.html` 並在 GitHub Pages 上托管：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Privacy Policy - Reddit Quant Signal Analyzer</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1 { color: #2563eb; }
        h2 { color: #1e40af; margin-top: 30px; }
    </style>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p><strong>Last Updated:</strong> 2024</p>
    <p><strong>Extension:</strong> Reddit Quant Signal Analyzer</p>

    <h2>1. Data Collection</h2>
    <p>This extension does <strong>NOT</strong> collect, store, or transmit any personal data or user information.</p>

    <h2>2. API Credentials</h2>
    <p>Your Reddit API credentials and Gemini API key are stored <strong>locally</strong> in your browser using Chrome's storage API. These credentials:</p>
    <ul>
        <li>Are <strong>never transmitted</strong> to our servers (we don't have any servers)</li>
        <li>Are <strong>encrypted</strong> by Chrome's built-in security</li>
        <li>Are <strong>only accessible</strong> by this extension on your device</li>
    </ul>

    <h2>3. Third-Party API Usage</h2>
    <p>This extension makes direct API calls from your browser to:</p>
    <ul>
        <li><strong>Reddit API</strong> (reddit.com, oauth.reddit.com) - To fetch post and comment data</li>
        <li><strong>Google Gemini API</strong> (generativelanguage.googleapis.com) - For AI-powered analysis</li>
    </ul>
    <p>These communications are governed by Reddit's and Google's respective privacy policies.</p>

    <h2>4. Local Storage</h2>
    <p>The extension caches analyzed posts locally for 24 hours to:</p>
    <ul>
        <li>Reduce API usage and costs</li>
        <li>Provide faster results when revisiting posts</li>
        <li>Improve user experience</li>
    </ul>
    <p>Cached data:</p>
    <ul>
        <li>Is stored <strong>locally</strong> on your device only</li>
        <li>Expires automatically after 24 hours</li>
        <li>Can be manually cleared in extension settings</li>
    </ul>

    <h2>5. Permissions Explanation</h2>
    <p>This extension requests the following permissions:</p>
    <ul>
        <li><strong>storage</strong>: Store API keys and cached analysis results locally</li>
        <li><strong>activeTab</strong>: Access the current Reddit page to extract post data</li>
        <li><strong>scripting</strong>: Execute content scripts for web scraping (when API unavailable)</li>
        <li><strong>tabs</strong>: Query current tab URL to detect Reddit posts</li>
    </ul>
    <p>All permissions are used <strong>exclusively</strong> for the stated functionality.</p>

    <h2>6. No Analytics or Tracking</h2>
    <p>This extension does NOT use:</p>
    <ul>
        <li>Google Analytics</li>
        <li>Any tracking pixels or beacons</li>
        <li>Cookies (beyond Chrome's built-in storage)</li>
        <li>Any telemetry or usage reporting</li>
    </ul>

    <h2>7. Open Source Transparency</h2>
    <p>The complete source code is available on GitHub: <a href="https://github.com/Carrie1013/REDDIT-ANALYZER">github.com/Carrie1013/REDDIT-ANALYZER</a></p>
    <p>You can verify that the extension operates exactly as described.</p>

    <h2>8. Changes to Privacy Policy</h2>
    <p>Any changes to this privacy policy will be posted on this page and in the extension's GitHub repository.</p>

    <h2>9. Contact</h2>
    <p>Questions or concerns? Open an issue on GitHub: <a href="https://github.com/Carrie1013/REDDIT-ANALYZER/issues">github.com/Carrie1013/REDDIT-ANALYZER/issues</a></p>

    <h2>10. Compliance</h2>
    <p>This extension complies with:</p>
    <ul>
        <li>Chrome Web Store Developer Program Policies</li>
        <li>Reddit API Terms of Service</li>
        <li>Google Gemini API Terms of Service</li>
    </ul>
</body>
</html>
```

在 `manifest.json` 中添加（如果還沒有）：

```json
{
  "homepage_url": "https://github.com/Carrie1013/REDDIT-ANALYZER"
}
```

隱私政策 URL: `https://carrie1013.github.io/REDDIT-ANALYZER/privacy.html`

---

## 📦 打包步驟

### 1. 清理項目

```bash
cd REDDIT-ANALYZER

# 移除敏感文件
rm config.js

# 移除開發文件（可選）
rm -rf .git
rm .gitignore

# 確認文件列表
ls -la
```

### 2. 創建 ZIP 文件

```bash
# 在項目目錄中
zip -r reddit-analyzer-v1.0.0.zip . \
  -x "*.git*" \
  -x "node_modules/*" \
  -x "*.DS_Store" \
  -x "config.js"

# 或使用更簡單的命令（如果已經清理）
zip -r reddit-analyzer-v1.0.0.zip .
```

### 3. 驗證 ZIP 內容

```bash
# 查看 ZIP 內容
unzip -l reddit-analyzer-v1.0.0.zip

# 確認包含：
# ✅ manifest.json
# ✅ options.html, options.js
# ✅ popup.html, popup.js
# ✅ content.js
# ✅ reddit-graph-transformer.js
# ✅ reddit-3d-renderer.js
# ✅ three.min.js
# ✅ tailwind.min.css
# ✅ icon16.png, icon48.png, icon128.png
# ✅ README.md, SETUP.md
# ❌ config.js (必須不存在！)
```

---

## 🚀 提交流程

### 1. 註冊開發者賬號

1. 前往：https://chrome.google.com/webstore/devconsole/
2. 登錄 Google 賬號
3. **支付 $5 USD 一次性註冊費**（信用卡或 PayPal）
4. 完成開發者註冊

### 2. 創建新項目

1. 點擊 **"New Item"**
2. **上傳 ZIP 文件**：`reddit-analyzer-v1.0.0.zip`
3. 等待文件處理（通常幾秒鐘）

### 3. 填寫商店列表信息

#### Product Details

- **Product Name**: Reddit Quant Signal Analyzer
- **Summary**: (使用上面的短描述)
- **Detailed Description**: (使用上面的詳細描述)
- **Category**: Productivity
- **Language**: English

#### Graphic Assets

- **Icon**: 已包含在 ZIP 中（128x128）
- **Screenshots**: 上傳 1-5 張截圖（1280x800）
- **Promotional images** (可選): 440x280

#### Privacy

- **Privacy Policy**: `https://carrie1013.github.io/REDDIT-ANALYZER/privacy.html`
- **Permissions Justification**: 填寫每個權限的用途
  - `storage`: "Store user's API keys locally and cache analyzed posts"
  - `activeTab`: "Access Reddit post content on the current tab"
  - `scripting`: "Extract Reddit data when API is unavailable"
  - `tabs`: "Detect current tab URL to identify Reddit posts"

#### Distribution

- **Visibility**: Public
- **Regions**: All regions (或選擇特定區域)

### 4. 提交審核

1. 點擊 **"Submit for Review"**
2. 確認所有信息正確
3. 提交

### 5. 等待審核

- **預計時間**: 1-3 個工作日（通常更快）
- **狀態檢查**: 在開發者控制台查看審核狀態

---

## ✅ 審核標準

### 會通過 ✅

- [x] 清晰的隱私政策
- [x] 用戶自行配置 API keys（不包含硬編碼密鑰）
- [x] 明確的權限說明
- [x] 功能與描述一致
- [x] 沒有惡意代碼
- [x] 符合所有 Chrome Web Store 政策

### 可能被拒 ❌

- [ ] 包含硬編碼的 API keys
- [ ] 沒有隱私政策
- [ ] 請求不必要的權限
- [ ] 功能不完整或有重大 bug
- [ ] 違反 Reddit/Gemini API 服務條款
- [ ] 誤導性描述或截圖

---

## 📊 發布後

### 1. 監控指標

在開發者控制台可以看到：
- 安裝次數
- 評分和評論
- 崩潰報告

### 2. 回應用戶反饋

- 及時回覆評論
- 在 GitHub 處理問題報告
- 定期更新擴展

### 3. 版本更新

當有新版本時：
1. 更新 `manifest.json` 中的 `version`
2. 創建新的 ZIP 文件
3. 在開發者控制台上傳新版本
4. 提交審核

---

## 🎯 行銷建議

### 發布公告

1. **Reddit**:
   - r/chrome_extensions
   - r/algotrading
   - r/wallstreetbets (謹慎)
   - r/cryptocurrency

2. **社交媒體**:
   - Twitter/X
   - LinkedIn
   - ProductHunt

3. **GitHub**:
   - 添加 topics: `chrome-extension`, `reddit-api`, `sentiment-analysis`
   - 創建 Release

### 文檔連結

確保 README 中包含：
- Chrome Web Store 連結
- 安裝指南
- 使用範例
- 截圖/GIF 演示

---

## 📞 獲取幫助

### 開發者支持

- **Chrome Web Store Help**: https://support.google.com/chrome_webstore/
- **Developer FAQ**: https://developer.chrome.com/docs/webstore/

### 常見問題

**Q: 審核被拒怎麼辦？**
A: 查看拒絕原因，修正問題，重新提交。通常是權限說明不足或隱私政策問題。

**Q: 可以更新已發布的擴展嗎？**
A: 可以。更新 version 號，上傳新 ZIP，再次提交審核。

**Q: 用戶數據安全嗎？**
A: 是的。所有 API keys 存儲在用戶本地 Chrome storage，從不傳輸到外部服務器。

---

## ✅ 最終檢查清單

提交前確認：

- [ ] 已移除 `config.js`
- [ ] `manifest.json` version 為 1.0.0
- [ ] 所有圖標文件存在
- [ ] 準備好截圖（至少 1 張）
- [ ] 隱私政策已托管並可訪問
- [ ] ZIP 文件小於 100 MB
- [ ] 已測試擴展在乾淨環境中工作
- [ ] README 已更新
- [ ] 已支付 $5 註冊費

準備好了？開始提交！🚀

---

**Good luck with your submission!** 🎉
