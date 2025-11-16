# Reddit Quant Signal Analyzer - Chrome Extension

A Chrome extension that analyzes Reddit posts using both web scraping and the Reddit API to fetch complete post data including all comments for quantitative investment signal analysis.

## Features

- **Reddit API Integration**: Fetches complete post data with all comments using OAuth authentication
- **Enhanced Web Scraping**: Falls back to intelligent DOM scraping when API is unavailable
- **LLM Analysis**: Uses Google's Gemini AI for content summarization and sentiment analysis
- **3D Visualization**: Interactive 3D comment tree visualization with semantic analysis (adapted from reddit-3d-app)
- **Signal Analysis**: Calculates Community Dispersion Index (CDI) and Sentiment Inversion Degree (SID)

## Setup Instructions

### 1. Reddit API Credentials

**IMPORTANT: Never commit your API credentials to GitHub!**

1. Copy the example config file:
   ```bash
   cp config.example.js config.js
   ```

2. Edit `config.js` and add your Reddit API credentials:
   ```javascript
   const REDDIT_CONFIG = {
       CLIENT_ID: "YOUR_REDDIT_CLIENT_ID_HERE",
       CLIENT_SECRET: "YOUR_REDDIT_CLIENT_SECRET_HERE",
       USER_AGENT: "chrome:reddit-quant-analyzer:v1.0.0 (by /u/YourUsername)"
   };
   ```

3. Get your Reddit API credentials:
   - Go to https://www.reddit.com/prefs/apps
   - Click "Create App" or "Create Another App"
   - Choose "script" type
   - Fill in the details
   - Copy your `client_id` and `client_secret`

These use OAuth 2.0 client credentials flow for read-only access.

### 2. Google Gemini API Key

**IMPORTANT: The Gemini API key is also stored in `config.js` (gitignored)**

1. If you haven't already, make sure you copied `config.example.js` to `config.js`
2. Open `config.js` and find the `GEMINI_CONFIG` section
3. Add your Gemini API key:
   ```javascript
   const GEMINI_CONFIG = {
       API_KEY: "YOUR_GEMINI_API_KEY_HERE",
       API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent"
   };
   ```

Get a free API key at: https://makersuite.google.com/app/apikey

**Note:** Both Reddit and Gemini credentials are now in the same `config.js` file for easier management.

### 3. Install the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `REDDIT-ANALYZER` folder
5. The extension icon should appear in your toolbar

## How It Works

### Data Fetching Strategy

The extension uses a **fallback approach** to get the most complete data:

1. **Reddit API (Primary)**: When you're on a Reddit post page, the extension automatically:
   - Detects the Reddit URL
   - Uses OAuth to authenticate with Reddit's API
   - Fetches the complete post with ALL comments (not just visible ones)
   - Parses nested comment threads with full depth information

2. **Enhanced Web Scraping (Fallback)**: If the API fails:
   - Scrapes visible content from the page DOM
   - Extracts post title, content, author, scores, etc.
   - Captures up to 50 visible comments
   - Handles Reddit's modern DOM structure (shreddit-post, etc.)

3. **Basic Scraping (Last Resort)**: For non-Reddit pages:
   - Captures page title and body text
   - Limited to 1500 characters

### Usage

1. **Navigate to a Reddit post** (e.g., `https://reddit.com/r/dogecoin/comments/...`)
2. **Click the extension icon** in your toolbar
3. **Data loads automatically** - you'll see a status message:
   - ✓ "Loaded complete Reddit post via API" - Got full data from Reddit API
   - ✓ "Scraped Reddit post from page" - Got visible data from web scraping
   - "Loaded via scripting API" - Basic text extraction

4. **Use the three tabs**:
   - **Page Summary (LLM)**: Click "Generate Summary" to analyze with AI
   - **3D Structure Visualization**: View comment depth/engagement in 3D
   - **Non-Traditional Signal Analysis**: Calculate investment signals

## API vs Web Scraping Comparison

| Feature | Reddit API | Web Scraping |
|---------|-----------|--------------|
| Comments | ALL comments | Only visible (50 max) |
| Speed | Fast | Medium |
| Reliability | Very High | Medium |
| Data Completeness | 100% | ~30-50% |
| Nested Replies | Full tree | Visible only |
| Vote Counts | Accurate | Approximate |
| Requires Auth | Yes (handled) | No |

## Files Overview

- [config.js](config.js) - Reddit API configuration and OAuth handling
- [popup.html](popup.html) - Extension UI
- [popup.js](popup.js) - Main extension logic and Gemini LLM integration
- [content.js](content.js) - Enhanced web scraping for Reddit pages
- [manifest.json](manifest.json) - Extension configuration with permissions

## Permissions Required

- `activeTab` - Access current tab content
- `scripting` - Execute scripts for web scraping
- `tabs` - Query tab information
- Network access to:
  - `reddit.com` - Reddit OAuth token endpoint
  - `oauth.reddit.com` - Reddit API data
  - `generativelanguage.googleapis.com` - Gemini AI

## Troubleshooting

**"API failed, trying web scraping..."**
- The Reddit API request failed (rate limit, network issue, etc.)
- Extension automatically falls back to web scraping
- You'll still get data, just less complete

**"Could not detect the active tab"**
- Extension can't access the current tab
- Try refreshing the page and clicking the extension again

**"LLM summarization failed"**
- Check that you've added your Gemini API key in [config.js](config.js)
- Make sure `config.js` exists (copy from `config.example.js` if needed)
- Verify your API key is valid at https://makersuite.google.com/app/apikey
- Check browser console (F12) for detailed error messages

## Security Notes

**CRITICAL: Protecting Your API Keys**

1. **Never commit config.js or .env to Git**
   - These files are in `.gitignore` to prevent accidental commits
   - Only commit `config.example.js` (the template without credentials)

2. **What's safe to commit:**
   - ✅ `config.example.js` - Template file
   - ✅ `.gitignore` - Protects sensitive files
   - ✅ All other extension files (popup.html, popup.js, etc.)

3. **What to NEVER commit:**
   - ❌ `config.js` - Contains your Reddit AND Gemini API credentials
   - ❌ `.env` - Contains API keys
   - ❌ Any file with actual API keys or secrets
   - ❌ Any file containing passwords, tokens, or authentication data

4. **Before pushing to GitHub:**
   ```bash
   # Check what will be committed
   git status

   # Make sure config.js and .env are NOT listed
   # If they are, add them to .gitignore

   # Verify .gitignore is working
   git check-ignore config.js .env
   # Should output: config.js and .env
   ```

5. **If you accidentally committed credentials:**
   - Immediately revoke your Reddit API credentials at https://www.reddit.com/prefs/apps
   - Regenerate new credentials
   - Use `git filter-branch` or BFG Repo-Cleaner to remove the credentials from Git history
   - Never just delete the file in a new commit - the credentials remain in history!

6. **Alternative: Chrome Storage API (Advanced)**
   - For better security, credentials can be stored in Chrome's storage instead of in files
   - This requires a setup page where users enter their credentials once
   - Credentials are encrypted by Chrome and not visible in the extension files

## Development

To modify the extension:

1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## License

This tool is for educational and research purposes.
