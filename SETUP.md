# Setup Guide for Chrome Web Store Version

Welcome! This guide will help you set up the Reddit Quant Signal Analyzer extension.

## 📋 Prerequisites

You'll need **free API keys** from two services:

1. **Reddit API** (for fetching complete post data)
2. **Google Gemini API** (for AI-powered analysis)

Don't worry - both are free and take just a few minutes to set up!

---

## 🔑 Step 1: Get Reddit API Credentials

### 1.1 Visit Reddit Apps Page

Go to: **https://www.reddit.com/prefs/apps**

(You'll need to be logged into your Reddit account)

### 1.2 Create a New App

1. Click the **"Create App"** or **"Create Another App"** button at the bottom
2. Fill in the form:
   - **Name**: `Reddit Analyzer` (or any name you like)
   - **App type**: Select **"script"** (important!)
   - **Description**: `Personal Reddit analysis tool` (or leave blank)
   - **About URL**: Leave blank
   - **Redirect URI**: Enter `http://localhost:8080`
   - **Permissions**: Default is fine (read-only)

3. Click **"Create app"**

### 1.3 Copy Your Credentials

After creating the app, you'll see:

```
personal use script
[random string of characters]  ← This is your CLIENT ID

secret
[another random string]        ← This is your CLIENT SECRET
```

**Keep this page open!** You'll need these values in Step 3.

---

## 🤖 Step 2: Get Google Gemini API Key

### 2.1 Visit Google AI Studio

Go to: **https://makersuite.google.com/app/apikey**

(Sign in with your Google account)

### 2.2 Create API Key

1. Click **"Create API Key"**
2. Select your Google Cloud project (or create a new one)
3. Click **"Create API key in new project"** if you don't have one
4. **Copy the generated API key** (it starts with `AIza...`)

**Important**: Save this key somewhere safe! You won't be able to see it again.

### 2.3 Verify Free Tier

- Gemini API offers a generous **free tier**: 15 requests per minute
- More than enough for this extension's daily limit (10 analyses/day)
- No credit card required!

---

## ⚙️ Step 3: Configure the Extension

### 3.1 Open Extension Settings

After installing the extension from Chrome Web Store:

1. Click the extension icon in your Chrome toolbar
2. Click **"Open Settings"** button (or right-click extension → Options)

### 3.2 Enter Your API Keys

In the settings page:

1. **Reddit Client ID**: Paste the value from Step 1.3 (the string under "personal use script")
2. **Reddit Client Secret**: Paste the secret from Step 1.3
3. **Gemini API Key**: Paste the key from Step 2.2

### 3.3 Save and Test

1. Click **"💾 Save Settings"**
2. Click **"🧪 Test Connection"** to verify everything works
3. You should see: **"✓ All API connections successful!"**

If you see errors, double-check that you copied the keys correctly (no extra spaces).

---

## 🚀 Step 4: Start Analyzing!

### 4.1 Navigate to a Reddit Post

Visit any Reddit discussion thread, for example:
- https://reddit.com/r/wallstreetbets/
- https://reddit.com/r/cryptocurrency/
- https://reddit.com/r/stocks/

Click on any post with comments.

### 4.2 Open the Extension

Click the **Reddit Quant Analyzer** icon in your toolbar.

### 4.3 View Results

The extension will automatically:
- ✅ Fetch complete post data via Reddit API
- ✅ Generate AI-powered summary
- ✅ Build 3D comment tree visualization
- ✅ Calculate investment signal metrics

---

## 📊 Understanding Usage Limits

### Daily Limits

- **10 analyses per day** (resets at midnight)
- Prevents excessive API costs
- **Cached posts don't count** - revisit analyzed posts for free!

### Cache System

- Each analyzed post is cached for **24 hours**
- Return to the same post = instant results, no API usage
- Cache automatically cleans entries older than 7 days

### Viewing Your Usage

Open extension settings to see:
- Today's analysis count
- Remaining analyses
- Number of cached posts

---

## 🔒 Privacy & Security

### Your Data is Safe

✅ **Local Storage Only**: API keys stored securely in Chrome's local storage
✅ **No Third Parties**: Direct communication with Reddit and Gemini APIs
✅ **No Data Collection**: We don't collect, store, or transmit your data
✅ **Open Source**: Full code available on [GitHub](https://github.com/Carrie1013/REDDIT-ANALYZER)

### API Key Security

- Keys are **never** sent to our servers (we don't have any!)
- Keys are **never** visible in the extension files
- Keys are **encrypted** by Chrome's storage system
- Only **you** have access to your keys

---

## ❓ Troubleshooting

### "API Keys Not Configured"

**Solution**: Go to extension settings and enter your API keys.

### "Daily Limit Reached"

**Solutions**:
1. Wait until midnight (resets automatically)
2. Visit previously analyzed posts (uses cache, doesn't count toward limit)
3. Use the "Reset Daily Count" button in settings (development only)

### "Reddit API Authentication Failed"

**Possible Causes**:
- Wrong Client ID or Secret
- Didn't select "script" type when creating Reddit app
- Copy-paste error (extra spaces)

**Solution**: Double-check your credentials in Reddit apps page, re-enter them carefully.

### "Gemini API Authentication Failed"

**Possible Causes**:
- Invalid API key
- API key quota exceeded (very rare on free tier)
- Network connectivity issues

**Solution**:
1. Verify your API key at https://makersuite.google.com/app/apikey
2. If key is expired, generate a new one
3. Check your internet connection

### Extension Shows Blank/White Screen

**Solution**:
1. Refresh the Reddit page
2. Close and reopen the extension popup
3. Try reloading the extension: `chrome://extensions/` → Reload button

### 3D Visualization Not Loading

**Solution**:
1. Click on the "3D Structure Visualization" tab
2. Make sure you're on a Reddit post with comments
3. Wait a few seconds for data to load
4. Check browser console (F12) for errors

---

## 🎯 Tips for Best Results

### Choose the Right Posts

✅ **Good for analysis**:
- Discussion threads with 20+ comments
- Stock/crypto-specific subreddits
- Posts about specific companies/assets
- Debate/Q&A threads

❌ **Not ideal**:
- Link posts with no comments
- Image-only posts
- Very new posts (< 5 comments)

### Maximize Your 10 Daily Analyses

1. **Prioritize important posts** - save your daily quota for key discussions
2. **Revisit analyzed posts** - cached results are instant and free
3. **Use 3D visualization** - explore comment structure without using API calls
4. **Clear cache strategically** - only clear when you need fresh data

### Understanding the Metrics

- **High Confidence Score (75+)**: Reliable signal, informed discussion
- **High Controversy Score**: Polarized opinions, risky topic
- **High Solution Density**: Helpful community, problem-solving focus
- **Low Author Diversity**: Potential echo chamber

---

## 📚 Additional Resources

- **Full Documentation**: [README.md](README.md)
- **Metrics Guide**: [METRICS_GUIDE.md](METRICS_GUIDE.md)
- **Classification Comparison**: [CLASSIFICATION_COMPARISON.md](CLASSIFICATION_COMPARISON.md)
- **Security Notice**: [SECURITY_NOTICE.md](SECURITY_NOTICE.md)
- **GitHub Repository**: https://github.com/Carrie1013/REDDIT-ANALYZER
- **Report Issues**: https://github.com/Carrie1013/REDDIT-ANALYZER/issues

---

## 🆘 Need Help?

1. **Check troubleshooting** section above
2. **Review documentation** in the repository
3. **Open an issue** on GitHub with:
   - What you were trying to do
   - What happened instead
   - Any error messages you saw
   - Browser console output (F12 → Console tab)

---

## 🎉 You're All Set!

Congratulations! You're ready to analyze Reddit discussions for investment signals.

**Quick Start Checklist**:
- ✅ Reddit API credentials configured
- ✅ Gemini API key configured
- ✅ Connection test passed
- ✅ Ready to analyze posts!

Happy analyzing! 🚀📊

---

**Version**: 1.0.0
**Last Updated**: 2024
**License**: Educational and research purposes
