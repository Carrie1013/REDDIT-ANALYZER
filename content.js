// content.js
// This script runs in the context of the currently open webpage.

console.log("Content Script Loaded: Ready to scrape page content.");

// Listener for messages from the extension popup (popup.html)
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "scrapeContent") {
            // --- 模拟抓取逻辑 ---
            // 在实际应用中，您会在这里编写复杂的 DOM 遍历代码来抓取Reddit标题、评论、投票等
            
            // 抓取页面的标题和主要文本内容（简化为body文本）
            const pageTitle = document.title;
            const pageText = document.body.innerText.substring(0, 1500) + '... [Rest of the page text truncated for demo]';

            const scrapedData = {
                title: pageTitle,
                content: pageText
            };

            // 将抓取到的数据发送回 popup.html
            sendResponse({ status: "success", data: scrapedData });
            
            return true; // Indicates asynchronous response
        }
    }
);