// content.js
// This script runs in the context of the currently open webpage.

console.log("Content Script Loaded: Ready to scrape page content.");

// Listener for messages from the extension popup (popup.html)
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "scrapeContent") {
            // --- 只抓取核心内容：帖子标题 + 帖子正文 ---
            // 1) 标题优先使用 og:title，其次 Reddit 常见标题结构，再次首个 <h1>
            const ogTitle = document.querySelector('meta[property="og:title"]')?.content?.trim();
            const redditTitle = document.querySelector('h1[data-test-id="post-content-title"], h1[data-testid="post-title"]')?.innerText?.trim();
            const h1Title = document.querySelector('h1')?.innerText?.trim();
            const pageTitle = ogTitle || redditTitle || h1Title || document.title || 'Untitled';

            // 2) 只拿主体内容，优先 Reddit 主体区域，避免侧栏和评论
            const mainContainer =
                document.querySelector('[data-test-id="post-content"] article') ||
                document.querySelector('[data-test-id="post-content"]') ||
                document.querySelector('main article') ||
                document.querySelector('article') ||
                document.querySelector('main') ||
                document.body;

            // 只抽取 <p> 和 <blockquote>，避免菜单/侧边栏
            const paras = Array.from(mainContainer.querySelectorAll('p, blockquote'))
                .map(el => el.innerText.trim())
                .filter(Boolean);
            const bodyText = (paras.length ? paras.join('\n\n') : mainContainer.innerText || '').trim();

            // 控制长度，避免过长
            const snippet = bodyText.substring(0, 1500);

            const scrapedData = {
                title: pageTitle,
                content: snippet
            };

            // 将抓取到的数据发送回 popup.html
            sendResponse({ status: "success", data: scrapedData });
            
            return true; // Indicates asynchronous response
        }
    }
);
