# Quick Setup Guide

## For New Users (Setting up from scratch)

### Step 1: Create Your Config File

```bash
# Navigate to the extension directory
cd REDDIT-ANALYZER

# Copy the example config to create your own
cp config.example.js config.js
```

### Step 2: Add Your API Credentials

Open `config.js` in your text editor and add your credentials:

```javascript
const REDDIT_CONFIG = {
    CLIENT_ID: "your_reddit_client_id",
    CLIENT_SECRET: "your_reddit_client_secret",
    USER_AGENT: "chrome:reddit-quant-analyzer:v1.0.0 (by /u/YourRedditUsername)"
};

const GEMINI_CONFIG = {
    API_KEY: "your_gemini_api_key",
    API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent"
};
```

### Step 3: Get Your API Keys

**Reddit API:**
1. Go to https://www.reddit.com/prefs/apps
2. Scroll to the bottom and click "Create App" or "Create Another App"
3. Fill in:
   - **name**: Reddit Quant Analyzer (or any name)
   - **type**: Select "script"
   - **description**: (optional)
   - **about url**: (optional)
   - **redirect uri**: http://localhost:8080 (required but not used)
4. Click "Create app"
5. Copy the values:
   - **CLIENT_ID**: The string under "personal use script" (looks like: `I_iFOvxSZ8xklMWJT5cF1w`)
   - **CLIENT_SECRET**: The "secret" field (looks like: `_FYBqOVx4zyiafoCxCZ7zcpCYeb4tg`)

**Google Gemini API:**
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Select a Google Cloud project or create a new one
4. Copy the generated API key

### Step 4: Install the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Navigate to and select the `REDDIT-ANALYZER` folder
5. The extension should appear in your extensions list

### Step 5: Verify It Works

1. Go to any Reddit post (e.g., https://reddit.com/r/dogecoin/comments/...)
2. Click the extension icon in your Chrome toolbar
3. You should see:
   - "Detected Reddit post. Fetching full data via API..." (status message)
   - The textarea should fill with complete post data
4. Click "Generate Summary" to test the Gemini API

## For Existing Users (Already have credentials)

Your credentials are already in `config.js`! Just make sure:

1. ✅ `config.js` exists with your Reddit credentials
2. ✅ Add your Gemini API key to `config.js` in the `GEMINI_CONFIG` section
3. ✅ Load/reload the extension in Chrome

## Troubleshooting

### "config.js not found" error
- Make sure you copied `config.example.js` to `config.js`
- Check that `config.js` is in the same directory as `popup.html`

### "Reddit API failed"
- Verify your CLIENT_ID and CLIENT_SECRET are correct
- Check that you didn't include any extra spaces or quotes
- Make sure your Reddit app is type "script"

### "LLM summarization failed"
- Verify your Gemini API key is added to `config.js`
- Check that the API key is valid at https://makersuite.google.com/app/apikey
- Open browser console (F12) for detailed error messages

### Extension not loading
- Make sure all files are in the REDDIT-ANALYZER directory
- Check that `manifest.json` exists
- Reload the extension: go to `chrome://extensions/` and click the refresh icon

## Security Reminder

**NEVER commit `config.js` to Git!**

Before pushing to GitHub:
```bash
# Verify config.js is ignored
git status

# config.js should NOT appear in "Changes to be committed"
# If it does, it means .gitignore is not working!
```

Only commit:
- ✅ `config.example.js` (template)
- ✅ All other extension files
- ❌ NOT `config.js` (contains your keys)
- ❌ NOT `.env` (contains your keys)

## File Structure

```
REDDIT-ANALYZER/
├── config.js              ← YOUR credentials (gitignored, DO NOT commit)
├── config.example.js      ← Template (SAFE to commit)
├── .gitignore            ← Protects config.js
├── .env                  ← Original credentials (gitignored)
├── manifest.json         ← Extension config
├── popup.html           ← UI
├── popup.js             ← Logic (loads from config.js)
├── content.js           ← Web scraping
├── README.md            ← Full documentation
├── SECURITY_NOTICE.md   ← Security warnings
└── SETUP_GUIDE.md       ← This file
```

## Next Steps

Once installed and working:
1. Visit Reddit posts to analyze them
2. Use the 3D visualization tab to see comment structure
3. Use the signal analysis tab to calculate investment metrics
4. Customize the extension to your needs

Happy analyzing! 🚀
