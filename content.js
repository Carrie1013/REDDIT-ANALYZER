// content.js
// This script runs in the context of the currently open webpage.

console.log("Content Script Loaded: Ready to scrape page content from Reddit.");

/**
 * Check if current page is a Reddit page
 */
function isRedditPage() {
    return window.location.hostname.includes('reddit.com');
}

/**
 * Extract comprehensive Reddit post data from the DOM
 */
function scrapeRedditPost() {
    const data = {
        isRedditPost: false,
        title: '',
        selftext: '',
        author: '',
        subreddit: '',
        score: 0,
        num_comments: 0,
        comments: [],
        url: window.location.href,
        timestamp: Date.now()
    };

    // Check if we're on a Reddit post page
    if (!isRedditPage()) {
        return data;
    }

    // Try to scrape from Reddit's DOM structure
    try {
        // Title
        const titleElement = document.querySelector('h1, [data-test-id="post-content"] h1, shreddit-post h1');
        data.title = titleElement ? titleElement.textContent.trim() : document.title;

        // Post text content (selftext)
        const selftextElement = document.querySelector('[data-test-id="post-content"] div[slot="text-body"], .expando, shreddit-post div[slot="text-body"]');
        data.selftext = selftextElement ? selftextElement.textContent.trim() : '';

        // Author
        const authorElement = document.querySelector('a[href*="/user/"], shreddit-post [slot="author"]');
        data.author = authorElement ? authorElement.textContent.trim().replace('u/', '') : '';

        // Subreddit
        const subredditElement = document.querySelector('a[href*="/r/"]');
        if (subredditElement) {
            const match = subredditElement.href.match(/\/r\/([^\/]+)/);
            data.subreddit = match ? match[1] : '';
        }

        // Score (upvotes)
        const scoreElement = document.querySelector('[id*="vote-arrows"] div, shreddit-post [slot="score"]');
        if (scoreElement) {
            const scoreText = scoreElement.textContent.trim();
            data.score = parseRedditNumber(scoreText);
        }

        // Comments count
        const commentsElement = document.querySelector('a[href*="comments"] span, [data-click-id="comments"]');
        if (commentsElement) {
            const commentsText = commentsElement.textContent;
            data.num_comments = parseRedditNumber(commentsText);
        }

        // Scrape visible comments
        data.comments = scrapeComments();

        // Mark as valid Reddit post if we found key data
        data.isRedditPost = !!(data.title && (data.subreddit || data.author));

    } catch (error) {
        console.error('Error scraping Reddit post:', error);
    }

    return data;
}

/**
 * Parse Reddit numbers (handles k, m suffixes)
 */
function parseRedditNumber(text) {
    if (!text) return 0;

    const cleaned = text.replace(/[^0-9.km]/gi, '');
    const num = parseFloat(cleaned);

    if (text.toLowerCase().includes('k')) return num * 1000;
    if (text.toLowerCase().includes('m')) return num * 1000000;

    return num || 0;
}

/**
 * Scrape comments from the page
 */
function scrapeComments() {
    const comments = [];

    // Try to find comment elements (Reddit's structure varies)
    const commentElements = document.querySelectorAll('shreddit-comment, [data-testid="comment"], .Comment');

    commentElements.forEach((element, index) => {
        if (index >= 50) return; // Limit to 50 comments to avoid performance issues

        try {
            const authorEl = element.querySelector('[slot="author"], a[href*="/user/"]');
            const bodyEl = element.querySelector('[slot="comment"], .md, [data-testid="comment-body"]');
            const scoreEl = element.querySelector('[slot="score"], .score');

            const comment = {
                author: authorEl ? authorEl.textContent.trim().replace('u/', '') : 'unknown',
                body: bodyEl ? bodyEl.textContent.trim() : '',
                score: scoreEl ? parseRedditNumber(scoreEl.textContent) : 0,
                depth: 0 // Could be enhanced to detect nesting
            };

            if (comment.body) {
                comments.push(comment);
            }
        } catch (err) {
            console.error('Error parsing comment:', err);
        }
    });

    return comments;
}

/**
 * Format scraped data into readable text for LLM analysis
 */
function formatDataForAnalysis(data) {
    if (!data.isRedditPost) {
        return `Page Title: ${document.title}\n\n${document.body.innerText.substring(0, 1500)}... [truncated]`;
    }

    let formatted = `Reddit Post Analysis\n`;
    formatted += `========================\n\n`;
    formatted += `Title: ${data.title}\n`;
    formatted += `Subreddit: r/${data.subreddit}\n`;
    formatted += `Author: u/${data.author}\n`;
    formatted += `Score: ${data.score} upvotes\n`;
    formatted += `Comments: ${data.num_comments}\n`;
    formatted += `URL: ${data.url}\n\n`;

    if (data.selftext) {
        formatted += `Post Content:\n${data.selftext}\n\n`;
    }

    if (data.comments.length > 0) {
        formatted += `Top Comments (${data.comments.length}):\n`;
        formatted += `========================\n`;
        data.comments.forEach((comment, i) => {
            formatted += `\n[${i + 1}] ${comment.author} (${comment.score} points):\n`;
            formatted += `${comment.body.substring(0, 300)}${comment.body.length > 300 ? '...' : ''}\n`;
        });
    }

    return formatted;
}

// Listener for messages from the extension popup (popup.html)
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "scrapeContent") {
            // Scrape Reddit post data
            const scrapedData = scrapeRedditPost();
            const formattedContent = formatDataForAnalysis(scrapedData);

            // Send back both structured data and formatted text
            sendResponse({
                status: "success",
                data: {
                    title: scrapedData.title || document.title,
                    content: formattedContent,
                    structured: scrapedData
                }
            });

            return true; // Indicates asynchronous response
        } else if (request.action === "getRedditUrl") {
            // Just return the current URL for API fetching
            sendResponse({
                status: "success",
                url: window.location.href,
                isReddit: isRedditPage()
            });
            return true;
        }
    }
);
