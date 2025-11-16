// API Configuration Template
// INSTRUCTIONS:
// 1. Copy this file: cp config.example.js config.js
// 2. Edit config.js and add your actual API credentials
// 3. NEVER commit config.js to Git (it's in .gitignore)

const REDDIT_CONFIG = {
    CLIENT_ID: "YOUR_REDDIT_CLIENT_ID_HERE",
    CLIENT_SECRET: "YOUR_REDDIT_CLIENT_SECRET_HERE",
    USER_AGENT: "chrome:reddit-quant-analyzer:v1.0.0 (by /u/YourUsername)"
};

// Google Gemini API Configuration
const GEMINI_CONFIG = {
    API_KEY: "YOUR_GEMINI_API_KEY_HERE", // Get from https://makersuite.google.com/app/apikey
    API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent"
};

// Reddit API OAuth token management
let redditAccessToken = null;
let tokenExpiry = null;

/**
 * Get Reddit OAuth access token
 * @returns {Promise<string>} Access token
 */
async function getRedditAccessToken() {
    // Check if we have a valid token
    if (redditAccessToken && tokenExpiry && Date.now() < tokenExpiry) {
        return redditAccessToken;
    }

    // Get new token
    const auth = btoa(`${REDDIT_CONFIG.CLIENT_ID}:${REDDIT_CONFIG.CLIENT_SECRET}`);

    try {
        const response = await fetch('https://www.reddit.com/api/v1/access_token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': REDDIT_CONFIG.USER_AGENT
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            throw new Error(`Failed to get access token: ${response.status}`);
        }

        const data = await response.json();
        redditAccessToken = data.access_token;
        tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Expire 1 min early

        return redditAccessToken;
    } catch (error) {
        console.error('Reddit OAuth error:', error);
        throw error;
    }
}

/**
 * Fetch Reddit post data using the official API
 * @param {string} url - Reddit URL (e.g., https://reddit.com/r/dogecoin/comments/abc123/...)
 * @returns {Promise<Object>} Post data with comments
 */
async function fetchRedditPost(url) {
    try {
        // Extract post info from URL
        const urlMatch = url.match(/reddit\.com\/r\/([^\/]+)\/comments\/([^\/]+)/);
        if (!urlMatch) {
            throw new Error('Invalid Reddit URL format');
        }

        const [, subreddit, postId] = urlMatch;

        // Get access token
        const token = await getRedditAccessToken();

        // Fetch post data using Reddit API
        const apiUrl = `https://oauth.reddit.com/r/${subreddit}/comments/${postId}`;

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': REDDIT_CONFIG.USER_AGENT
            }
        });

        if (!response.ok) {
            throw new Error(`Reddit API error: ${response.status}`);
        }

        const data = await response.json();

        // Parse the response
        const postData = data[0].data.children[0].data;
        const comments = data[1].data.children;

        return {
            title: postData.title,
            selftext: postData.selftext,
            author: postData.author,
            subreddit: postData.subreddit,
            score: postData.score,
            upvote_ratio: postData.upvote_ratio,
            num_comments: postData.num_comments,
            created_utc: postData.created_utc,
            url: postData.url,
            permalink: postData.permalink,
            comments: parseComments(comments),
            full_data: postData
        };
    } catch (error) {
        console.error('Error fetching Reddit post:', error);
        throw error;
    }
}

/**
 * Parse comments recursively
 * @param {Array} commentsList - Reddit comments array
 * @param {number} depth - Current depth level
 * @returns {Array} Parsed comments
 */
function parseComments(commentsList, depth = 0) {
    const parsed = [];

    for (const item of commentsList) {
        if (item.kind === 't1') { // Comment
            const comment = item.data;
            parsed.push({
                id: comment.id,
                author: comment.author,
                body: comment.body,
                score: comment.score,
                depth: depth,
                created_utc: comment.created_utc,
                replies: comment.replies ? parseComments(comment.replies.data.children, depth + 1) : []
            });
        }
    }

    return parsed;
}

/**
 * Fetch subreddit posts
 * @param {string} subreddit - Subreddit name
 * @param {string} sort - Sort method (hot, new, top, rising)
 * @param {number} limit - Number of posts to fetch
 * @returns {Promise<Array>} List of posts
 */
async function fetchSubredditPosts(subreddit, sort = 'hot', limit = 25) {
    try {
        const token = await getRedditAccessToken();

        const apiUrl = `https://oauth.reddit.com/r/${subreddit}/${sort}?limit=${limit}`;

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': REDDIT_CONFIG.USER_AGENT
            }
        });

        if (!response.ok) {
            throw new Error(`Reddit API error: ${response.status}`);
        }

        const data = await response.json();

        return data.data.children.map(post => ({
            title: post.data.title,
            author: post.data.author,
            subreddit: post.data.subreddit,
            score: post.data.score,
            upvote_ratio: post.data.upvote_ratio,
            num_comments: post.data.num_comments,
            created_utc: post.data.created_utc,
            url: post.data.url,
            permalink: post.data.permalink,
            selftext: post.data.selftext,
            id: post.data.id
        }));
    } catch (error) {
        console.error('Error fetching subreddit posts:', error);
        throw error;
    }
}
