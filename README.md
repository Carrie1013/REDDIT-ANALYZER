# Reddit Quant Signal Analyzer

> A Chrome extension that transforms Reddit discussion threads into quantitative investment signals through AI-powered sentiment analysis, 3D comment tree visualization, and behavioral metrics calculation.

---

## The Problem

Traditional investment analysis often overlooks the behavioral signals and community sentiment embedded in social media discussions, particularly on platforms like Reddit where retail investors congregate. Existing tools fail to combine quantitative metrics, AI-powered sentiment analysis, and interactive visualization to extract actionable investment signals from Reddit's complex comment threads and community dynamics.

## The Solution

Reddit Quant Signal Analyzer bridges this gap by providing a comprehensive Chrome extension that analyzes Reddit posts using both the Reddit API and advanced web scraping to fetch complete post data including all comments. It combines AI-powered analysis, interactive 3D visualization, and quantitative metrics to generate investment signals from community discussions.

---

## Key Features

### 1. Multi-Source Data Acquisition
- **Reddit API Integration**: Fetches complete post data with ALL comments using OAuth authentication
- **Enhanced Web Scraping**: Intelligent fallback DOM scraping when API is unavailable
- **Complete Coverage**: Captures nested comment threads with full depth information

### 2. AI-Powered Analysis
- **LLM Integration**: Uses Google's Gemini AI for content summarization and sentiment analysis
- **Automated Insights**: Generates summaries highlighting key discussion points and sentiment
- **Technical Depth Analysis**: Evaluates discussion quality and evidence volume

### 3. Interactive 3D Visualization
- **Comment Tree Rendering**: Interactive 3D visualization of Reddit comment threads
- **Semantic Classification**: Color-coded nodes for solutions, questions, and debates
- **Engagement Metrics**: Visual encoding of comment depth, score, and reply count
- **Real-Time Interaction**: Click, drag, and zoom to explore discussion structure

### 4. Quantitative Signal Analysis
- **Behavioral Metrics**:
  - Community Dispersion Index (CDI)
  - Sentiment Inversion Degree (SID)
  - Comment/Score ratios
  - Punctuation chaos indicators
  - Emoji density analysis

- **LLM-Generated Core Metrics**:
  - Technical Density (academic terms / total words)
  - Contextual Depth (analysis quality level)
  - Evidence Volume (data/sources cited)
  - Meme/Frivolity Index
  - False Optimism Signal
  - Capitulation Signal

- **Investment Signal Generation**: Automated confidence scoring and recommendations

---

## Quick Start

### Prerequisites

- Google Chrome browser
- Reddit API credentials (free)
- Google Gemini API key (free tier available)

### Installation

#### Step 1: Clone the Repository

```bash
git clone https://github.com/Carrie1013/REDDIT-ANALYZER.git
cd REDDIT-ANALYZER
```

#### Step 2: Configure API Credentials

1. Copy the example configuration file:
   ```bash
   cp config.example.js config.js
   ```

2. Edit `config.js` and add your credentials:
   ```javascript
   const REDDIT_CONFIG = {
       CLIENT_ID: "YOUR_REDDIT_CLIENT_ID_HERE",
       CLIENT_SECRET: "YOUR_REDDIT_CLIENT_SECRET_HERE",
       USER_AGENT: "chrome:reddit-quant-analyzer:v1.0.0 (by /u/YourUsername)"
   };

   const GEMINI_CONFIG = {
       API_KEY: "YOUR_GEMINI_API_KEY_HERE",
       API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent"
   };
   ```

3. **Get Reddit API Credentials**:
   - Go to https://www.reddit.com/prefs/apps
   - Click "Create App" or "Create Another App"
   - Choose "script" type
   - Fill in the details
   - Copy your `client_id` and `client_secret`

4. **Get Gemini API Key**:
   - Visit https://makersuite.google.com/app/apikey
   - Generate a free API key
   - Copy the key to your `config.js`

#### Step 3: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `REDDIT-ANALYZER` folder
5. The extension icon should appear in your toolbar

---

## How to Use

### Basic Workflow

1. **Navigate to a Reddit post** (e.g., `https://reddit.com/r/wallstreetbets/comments/...`)
2. **Click the extension icon** in your Chrome toolbar
3. **Data loads automatically** with a status indicator:
   - ✅ "Loaded complete Reddit post via API" - Full data from Reddit API
   - ✅ "Scraped Reddit post from page" - Visible data from web scraping
   - ⚠️ "Loaded via scripting API" - Basic text extraction

### Feature Tabs

#### Tab 1: Page Summary (LLM)
- Automatically generates AI-powered summary of the Reddit thread
- Highlights key points, sentiment, and discussion trends
- Displays data source (API vs. web scraping)

#### Tab 2: 3D Structure Visualization
- **Interactive 3D View**: Explore comment hierarchy in three dimensions
- **Semantic Classification**:
  - 🟢 Green (Solutions/Answers)
  - 🟠 Orange (Questions)
  - 🔴 Red (Debates/Disagreements)
  - 🟣 Purple (Deep threads, 5+ levels)
- **Visual Encoding**:
  - Node size → More replies
  - Opacity → Higher score
  - Pulsing → Branch points (3+ replies)
  - Glow → Selected node
- **Controls**:
  - Left-drag: Rotate camera
  - Right-drag: Pan view
  - Scroll: Zoom in/out
  - Click: Select & center node
- **Classification Method Toggle**:
  - Regex (Fast, Free)
  - LLM (Accurate, ~$0.01/thread)

#### Tab 3: Non-Traditional Signal Analysis
- Click "Analyze Thread Signals" to generate metrics
- View behavioral rhythm metrics (comment length, punctuation, emoji density, etc.)
- Review LLM-generated core sentiment metrics
- Get automated investment signal with confidence score

---

## Architecture Overview

### Data Fetching Strategy

The extension uses a **multi-tier fallback approach** for maximum reliability:

```
┌─────────────────────────┐
│   Reddit API (OAuth)    │  ← Primary: Complete data, all comments
└────────────┬────────────┘
             │ (If fails)
             ↓
┌─────────────────────────┐
│  Enhanced Web Scraping  │  ← Fallback: Visible content (~50 comments)
└────────────┬────────────┘
             │ (If fails)
             ↓
┌─────────────────────────┐
│    Basic Scraping       │  ← Last Resort: Page text only
└─────────────────────────┘
```

#### Reddit API (Primary)
- Uses OAuth 2.0 client credentials flow
- Fetches complete post with ALL comments (not just visible)
- Parses nested comment threads with full depth
- 100% data completeness

#### Enhanced Web Scraping (Fallback)
- Scrapes visible content from page DOM
- Extracts post metadata, content, scores
- Captures up to 50 visible comments
- Handles modern Reddit DOM structure (shreddit-post, etc.)
- ~30-50% data completeness

#### Basic Scraping (Last Resort)
- For non-Reddit pages or severe failures
- Captures page title and body text
- Limited to 1500 characters

### API vs Web Scraping Comparison

| Feature | Reddit API | Web Scraping |
|---------|-----------|--------------|
| Comments | ALL comments | Only visible (50 max) |
| Speed | Fast | Medium |
| Reliability | Very High | Medium |
| Data Completeness | 100% | ~30-50% |
| Nested Replies | Full tree | Visible only |
| Vote Counts | Accurate | Approximate |
| Requires Auth | Yes (automated) | No |

---

## File Structure

```
REDDIT-ANALYZER/
├── manifest.json              # Chrome extension configuration
├── config.js                  # API credentials (gitignored, create from example)
├── config.example.js          # Template for API configuration
├── popup.html                 # Extension UI layout
├── popup.js                   # Main extension logic & Gemini LLM integration
├── content.js                 # Enhanced web scraping for Reddit pages
├── reddit-graph-transformer.js # Comment tree data processing
├── reddit-3d-renderer.js      # Three.js 3D visualization engine
├── three.min.js               # Three.js library
├── tailwind.min.css           # Tailwind CSS for UI styling
├── icon*.png                  # Extension icons
├── README.md                  # This file
├── METRICS_GUIDE.md           # Detailed metrics documentation
├── CLASSIFICATION_COMPARISON.md # LLM vs Regex classification guide
├── SECURITY_NOTICE.md         # Security best practices
└── SETUP_GUIDE.md             # Detailed setup instructions
```

---

## Permissions Required

The extension requires the following Chrome permissions:

- `activeTab` - Access current tab content
- `scripting` - Execute scripts for web scraping
- `tabs` - Query tab information
- Network access to:
  - `reddit.com` - Reddit OAuth token endpoint
  - `oauth.reddit.com` - Reddit API data
  - `generativelanguage.googleapis.com` - Gemini AI API

All permissions are used exclusively for the stated functionality. No data is collected, stored remotely, or transmitted to third parties.

---

## Troubleshooting

### Common Issues

#### "API failed, trying web scraping..."
**Cause**: Reddit API request failed (rate limit, network issue, invalid credentials)
**Solution**:
- Extension automatically falls back to web scraping
- You'll still get data, just less complete
- Check `config.js` for valid Reddit API credentials
- Wait a few minutes if rate-limited

#### "Could not detect the active tab"
**Cause**: Extension can't access the current tab
**Solution**:
- Refresh the page and click the extension again
- Make sure you're on a Reddit post page
- Check that the extension has proper permissions

#### "LLM summarization failed"
**Cause**: Gemini API key issue or network problem
**Solution**:
- Verify you've added your Gemini API key in `config.js`
- Make sure `config.js` exists (copy from `config.example.js` if needed)
- Verify your API key is valid at https://makersuite.google.com/app/apikey
- Check browser console (F12) for detailed error messages

#### 3D Visualization Not Loading
**Cause**: Data not loaded or rendering issue
**Solution**:
- Make sure you're on a Reddit post with comments
- Try switching to another tab and back to "3D Structure Visualization"
- Check browser console for JavaScript errors
- Refresh the extension (chrome://extensions/ → reload button)

#### Metrics Show "--" or Empty Values
**Cause**: Insufficient data or API failure
**Solution**:
- Make sure the Reddit post has loaded successfully
- Click "Analyze Thread Signals" button in the Signal Analysis tab
- Verify Gemini API key is configured for LLM-based metrics
- Check that the post has comments to analyze

---

## Security & Privacy

### Critical Security Practices

**NEVER commit API credentials to Git!**

#### What's Safe to Commit
- ✅ `config.example.js` - Template file without credentials
- ✅ `.gitignore` - Protects sensitive files
- ✅ All extension source files (popup.html, popup.js, etc.)

#### What to NEVER Commit
- ❌ `config.js` - Contains your Reddit AND Gemini API credentials
- ❌ `.env` - Contains API keys
- ❌ Any file with actual API keys, secrets, or passwords

#### Before Pushing to GitHub

```bash
# Check what will be committed
git status

# Verify config.js and .env are NOT listed
# If they are, add them to .gitignore immediately

# Verify .gitignore is working
git check-ignore config.js
# Should output: config.js
```

#### If You Accidentally Committed Credentials

1. **Immediately revoke your credentials**:
   - Reddit: https://www.reddit.com/prefs/apps
   - Gemini: https://makersuite.google.com/app/apikey

2. **Remove from Git history**:
   - Use `git filter-branch` or BFG Repo-Cleaner
   - Never just delete in a new commit - credentials remain in history!

3. **Generate new credentials** and add to `config.js`

### Privacy Notes

- All API calls are made directly from your browser to Reddit/Gemini
- No data is collected, stored, or transmitted to third-party servers
- Your API keys are stored locally in `config.js` (gitignored)
- Extension operates entirely client-side

### Alternative: Chrome Storage API (Advanced)

For enhanced security, credentials can be stored in Chrome's encrypted storage:
- Requires implementing a setup page for one-time credential entry
- Credentials are encrypted by Chrome
- Not visible in extension files
- See Chrome Extension Storage API documentation for implementation

---

## Development

### Modifying the Extension

1. Edit the source files in your preferred editor
2. Go to `chrome://extensions/`
3. Find "Reddit Quant Signal Analyzer"
4. Click the refresh/reload icon
5. Test your changes

### Debugging

- Open browser console (F12) while extension popup is open
- Check console for error messages and API responses
- Use `console.log()` statements in source files
- Test with different Reddit posts (vary comment count, structure, etc.)

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

**Remember**: Never commit `config.js` or any files with API credentials!

---

## Technical Stack

- **Frontend**: Vanilla JavaScript, HTML5, Tailwind CSS
- **3D Rendering**: Three.js
- **APIs**:
  - Reddit API (OAuth 2.0)
  - Google Gemini AI API
- **Platform**: Chrome Extensions Manifest V3

---

## Use Cases

### For Retail Investors
- Gauge community sentiment on specific stocks/cryptocurrencies
- Identify conviction levels through behavioral metrics
- Detect false optimism or capitulation signals
- Visualize discussion structure to find quality analysis

### For Researchers
- Study social media influence on market behavior
- Analyze community dynamics and information flow
- Extract sentiment data for academic research
- Quantify discussion quality and engagement patterns

### For Traders
- Generate alternative data signals from Reddit discussions
- Identify emerging trends through semantic analysis
- Assess community confidence through multiple metrics
- Monitor sentiment shifts in real-time

---

## Metrics Documentation

For detailed information about all metrics and their calculations, see:
- [METRICS_GUIDE.md](METRICS_GUIDE.md) - Complete metrics documentation
- [CLASSIFICATION_COMPARISON.md](CLASSIFICATION_COMPARISON.md) - LLM vs Regex comparison

---

## Acknowledgments

- 3D visualization adapted from reddit-3d-app project
- Powered by Google's Gemini AI
- Built on Reddit's public API
- Uses Three.js for 3D rendering

---

## License

This tool is for educational and research purposes only. Use responsibly and in accordance with:
- Reddit API Terms of Service
- Google Gemini API Terms of Service
- Applicable securities laws and regulations

**Disclaimer**: This tool provides analysis for informational purposes only and should not be considered financial advice. Always conduct your own research and consult with financial professionals before making investment decisions.

---

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation (METRICS_GUIDE.md, SETUP_GUIDE.md, etc.)
- Review troubleshooting section above

---

**Version**: 1.0
**Last Updated**: 2024
**Status**: Active Development
