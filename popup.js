// --- Global Configuration and Utilities ---
// API keys are now loaded from config.js (which is gitignored for security)
// Make sure you've created config.js from config.example.js and added your API keys

// Load API configuration from config.js
const apiKey = GEMINI_CONFIG?.API_KEY || "";
const llmApiUrl = GEMINI_CONFIG?.API_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

function openTab(tabId) {
    // Toggle tab content visibility
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active-tab');
    });
    document.getElementById(tabId).classList.add('active-tab');
    
    // Toggle button styles
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-700');
        btn.classList.add('text-gray-600', 'hover:text-gray-900');
    });
    const activeBtn = document.getElementById(`tab-${tabId}-btn`);
    activeBtn.classList.remove('text-gray-600', 'hover:text-gray-900');
    activeBtn.classList.add('bg-blue-600', 'text-white', 'hover:bg-blue-700');

    // For the 3D page, ensure re-initialization
    if (tabId === '3d') {
        setTimeout(init3D, 50); // Delay to ensure container is rendered
    }
}

/**
 * Simulates base index calculation
 * @param {string} title Post title
 * @param {number} pScore Community Professionalism Score (1-10)
 * @param {number} votes Votes count
 * @param {number} comments Comments count
 * @param {number} priceDrop Price drop (%) (negative value)
 */
function calculateMetricSet(title, pScore, votes, comments, priceDrop) {
    // 1. Confidence Erosion Index (CEI) - Simplified: uses specific keywords
    const doubtKeywords = ['factor', 'still', 'dead', 'relevance', 'fade'];
    let titleWordCount = title.split(/\s+/).length;
    let doubtCount = doubtKeywords.filter(keyword => title.toLowerCase().includes(keyword)).length;
    const CEI = (doubtCount / titleWordCount) * (pScore / 10); // Combines with professionalism

    // 2. Sentiment Inversion Degree (SID) - Dark Humor
    // Assuming the literal optimism of terms like "Black Friday Sale" is 0.8
    let S_literal = 0.0;
    if (title.toLowerCase().includes('sale') || title.toLowerCase().includes('black friday')) {
        S_literal = 0.8; 
    } else if (title.toLowerCase().includes('waiting')) {
        S_literal = 0.1; // Slightly positive, but more of a complaint
    }

    // Market background pessimism B_market: Price drop percentage / 20 (normalized)
    const B_market = Math.max(-1, priceDrop / 20); 
    const SID = Math.abs(S_literal - B_market); // Absolute difference

    // 3. Interaction Efficiency (Comment/Vote Ratio)
    const CVR = votes > 0 ? comments / votes : comments;

    return { CEI, SID, CVR };
}

// --- 1. LLM Page Summary ---

/**
 * Calls Gemini API to generate a summary of the page content
 */
async function summarizePage() {
    const content = document.getElementById('page-content').value;
    const resultDiv = document.getElementById('summary-text');
    const button = document.getElementById('summarize-btn');

    if (!content) {
        resultDiv.innerHTML = '<span class="text-red-500">Please enter text content for summarization.</span>';
        return;
    }

    resultDiv.innerHTML = '<span class="text-blue-500">Calling LLM for summary, please wait...</span>';
    button.disabled = true;

    const systemPrompt = "You are a senior financial market analyst. Based on the Reddit content provided by the user, briefly summarize the core discussion points, market sentiment (positive/negative/sarcastic), and potential information value in English. The summary should be concise.";
    const userQuery = `Summarize the following Reddit content:\n\n"${content}"`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    // Exponential backoff retry logic
    for (let i = 0; i < 3; i++) {
        try {
            const response = await fetch(llmApiUrl + `?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "LLM returned empty result.";
            resultDiv.textContent = text;
            break; 

        } catch (error) {
            console.error("LLM API call failed:", error);
            if (i === 2) {
                resultDiv.innerHTML = `<span class="text-red-500">LLM summarization failed. Error: ${error.message}</span>`;
            }
            await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, i))); // Exponential backoff
        }
    }
    button.disabled = false;
}

// --- 2. 3D Structure Visualization ---

let reddit3DRenderer = null;
let currentPostData = null;

/**
 * Initialize 3D visualization
 */
function init3D() {
    const container = document.getElementById('visualization-container');
    if (!container) return;

    // Clean up existing renderer
    if (reddit3DRenderer) {
        reddit3DRenderer.destroy();
    }

    // Create new renderer
    reddit3DRenderer = new Reddit3DRenderer(container);

    // Listen for node selection events
    window.addEventListener('nodeSelected', handleNodeSelection);

    // Try to load data from current tab if available
    load3DData();
}

/**
 * Load Reddit data and create 3D visualization
 */
async function load3DData() {
    const statusEl = document.getElementById('3d-status');

    // Check if we have data from the Summary tab
    if (currentPostData && currentPostData.comments) {
        statusEl.textContent = 'Building 3D visualization...';
        statusEl.className = 'text-xs text-blue-600 mb-2';

        try {
            // Build comment tree
            const tree = buildCommentTree(currentPostData);

            // Transform to 3D graph
            const { nodes, edges } = transformTreeTo3DGraph(tree);

            // Load into renderer
            reddit3DRenderer.loadGraph(nodes, edges);

            statusEl.textContent = `✓ Visualization loaded: ${nodes.length} nodes, ${edges.length} connections`;
            statusEl.className = 'text-xs text-green-600 mb-2';
        } catch (error) {
            console.error('3D visualization error:', error);
            statusEl.textContent = '✗ Error creating visualization: ' + error.message;
            statusEl.className = 'text-xs text-red-600 mb-2';
        }
    } else {
        statusEl.textContent = 'No data loaded. Go to "Page Summary" tab and load a Reddit post first.';
        statusEl.className = 'text-xs text-gray-500 mb-2';
    }
}

/**
 * Handle node selection from 3D renderer
 */
function handleNodeSelection(event) {
    const node = event.detail;
    if (!node) return;

    // Show node info panel
    const panel = document.getElementById('node-info-panel');
    panel.classList.remove('hidden');

    // Update panel content
    document.getElementById('node-type-badge').textContent = getNodeTypeLabel(node);
    document.getElementById('node-author').textContent = 'u/' + node.author;
    document.getElementById('node-score').textContent = formatScore(node.score);
    document.getElementById('node-depth').textContent = node.depth;
    document.getElementById('node-replies').textContent = node.childrenCount;
    document.getElementById('node-time').textContent = formatTimestamp(node.timestamp);
    document.getElementById('node-text').textContent = node.text;

    // Update badge color based on type
    const badge = document.getElementById('node-type-badge');
    badge.className = 'px-2 py-1 text-xs rounded';

    if (node.isSolution) {
        badge.classList.add('bg-green-100', 'text-green-800');
    } else if (node.isQuestion) {
        badge.classList.add('bg-yellow-100', 'text-yellow-800');
    } else if (node.isDebate) {
        badge.classList.add('bg-orange-100', 'text-orange-800');
    } else if (node.depth >= 5) {
        badge.classList.add('bg-blue-100', 'text-blue-800');
    } else {
        badge.classList.add('bg-gray-100', 'text-gray-800');
    }
}

// --- 3. Non-Traditional Signal Analysis ---

/**
 * Calculates and displays non-traditional investment signals
 */
function calculateSignals() {
    const dataInput = document.getElementById('signal-data').value;
    const lines = dataInput.trim().split('\n');

    let totalCDI = 0;
    let totalSID = 0;
    let count = 0;

    // Mock data for Community Dispersion Index (CDI)
    const subreddits = [
        { name: 'r/dogecoin', isCore: true, professional: 4 },
        { name: 'r/Accenture_AFS', isCore: false, professional: 9 },
        { name: 'r/WallStreetBetsCrypto', isCore: false, professional: 7 },
        { name: 'r/DJT_Uncensored', isCore: false, professional: 3 },
        { name: 'r/BlueskySkeets', isCore: false, professional: 3 },
    ];
    // P_score in mock data is used as a proxy for subreddits[i].professional
    const allPscores = lines.map(line => parseFloat(line.split(',')[1].trim()));
    const uniquePscores = [...new Set(allPscores)].filter(p => p > 0);
    
    // 1. Community Dispersion Index (CDI) - Based on unique Professionalism Scores
    const P_core = lines.filter(line => parseFloat(line.split(',')[1].trim()) <= 4).length / lines.length;
    const CDI = uniquePscores.length * (1 - P_core);
    
    document.getElementById('cdi-value').textContent = CDI.toFixed(2);
    if (CDI > 2.5) {
        document.getElementById('cdi-desc').textContent = "High Dispersion: Discussion spills over into multiple professional communities. Signal of rising mainstream attention.";
        document.getElementById('result-cdi').classList.add('bg-green-100', 'border-green-300');
    } else {
        document.getElementById('cdi-desc').textContent = "Low Dispersion: Discussion is concentrated in core communities, low signal spillover.";
        document.getElementById('result-cdi').classList.remove('bg-green-100', 'border-green-300');
    }

    // 2. Sentiment Inversion Degree (SID)
    lines.forEach(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length === 5) {
            const [title, pScoreStr, votesStr, commentsStr, priceDropStr] = parts;
            const pScore = parseFloat(pScoreStr);
            const votes = parseInt(votesStr);
            const comments = parseInt(commentsStr);
            const priceDrop = parseFloat(priceDropStr);

            const metrics = calculateMetricSet(title, pScore, votes, comments, priceDrop);
            totalSID += metrics.SID;
            count++;
        }
    });

    const avgSID = count > 0 ? totalSID / count : 0;
    document.getElementById('sid-value').textContent = avgSID.toFixed(2);

    let finalSignal = "";
    if (avgSID > 1.2 && CDI < 2.5) {
        finalSignal = "Strong Capitulation Sarcasm Signal: Market is extremely pessimistic, but discussion is concentrated among retail, possibly indicating a short-term bottom.";
        document.getElementById('result-final').classList.add('bg-red-100', 'border-red-300');
        document.getElementById('result-sid').classList.add('bg-red-100', 'border-red-300');
    } else if (CDI > 2.5 && avgSID < 0.5) {
        finalSignal = "Mainstream Attention Shift Signal: Professional communities are involved, lacking dark humor, potentially indicating a narrative shift towards fundamentals.";
        document.getElementById('result-final').classList.add('bg-green-100', 'border-green-300');
        document.getElementById('result-sid').classList.remove('bg-red-100', 'border-red-300');
    } else {
        finalSignal = "Neutral/High Volatility Warning: Ambiguous signal metrics, dispersed market view, recommended observation.";
        document.getElementById('result-final').classList.remove('bg-red-100', 'border-red-300', 'bg-green-100', 'border-green-300');
        document.getElementById('result-sid').classList.remove('bg-red-100', 'border-red-300');
    }

    document.getElementById('final-signal').textContent = finalSignal;
}

/**
 * Binds event listeners after the DOM is fully loaded.
 */
function setupEventListeners() {
    // Tab buttons
    document.getElementById('tab-summary-btn').addEventListener('click', () => openTab('summary'));
    document.getElementById('tab-3d-btn').addEventListener('click', () => openTab('3d'));
    document.getElementById('tab-signal-btn').addEventListener('click', () => openTab('signal'));

    // Action buttons
    document.getElementById('summarize-btn').addEventListener('click', summarizePage);
    document.getElementById('calculate-signals-btn').addEventListener('click', calculateSignals);
}

// Default to open the first Tab and setup listeners
window.onload = () => {
    setupEventListeners();
    preloadActiveTabContent();
    openTab('summary');
};

/**
 * Attempts to pull the active tab's page text via the content script and fill the textarea.
 * Falls back silently if the page disallows scripts (e.g., Chrome Web Store/Extensions page).
 * Now enhanced with Reddit API support for complete data fetching.
 */
async function preloadActiveTabContent() {
    const statusEl = document.getElementById('summary-status');
    const textarea = document.getElementById('page-content');
    if (!textarea) return;

    const setStatus = (msg, color = 'text-gray-500') => {
        if (!statusEl) return;
        statusEl.className = `text-xs mb-2 ${color}`;
        statusEl.textContent = msg;
    };

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
            setStatus('Could not detect the active tab. Paste content manually.', 'text-red-500');
            return;
        }

        const url = tab.url;

        // Check if this is a Reddit URL and try API first
        if (url && url.includes('reddit.com/r/') && url.includes('/comments/')) {
            setStatus('Detected Reddit post. Fetching full data via API...', 'text-blue-600');

            try {
                const postData = await fetchRedditPost(url);

                // Format the data comprehensively
                let formattedContent = `Reddit Post Analysis (via API)\n`;
                formattedContent += `================================\n\n`;
                formattedContent += `Title: ${postData.title}\n`;
                formattedContent += `Subreddit: r/${postData.subreddit}\n`;
                formattedContent += `Author: u/${postData.author}\n`;
                formattedContent += `Score: ${postData.score} upvotes (${Math.round(postData.upvote_ratio * 100)}% upvoted)\n`;
                formattedContent += `Comments: ${postData.num_comments}\n`;
                formattedContent += `Posted: ${new Date(postData.created_utc * 1000).toLocaleString()}\n`;
                formattedContent += `URL: ${url}\n\n`;

                if (postData.selftext) {
                    formattedContent += `Post Content:\n${postData.selftext}\n\n`;
                }

                if (postData.comments && postData.comments.length > 0) {
                    formattedContent += `Comments (${postData.comments.length} loaded):\n`;
                    formattedContent += `================================\n`;
                    postData.comments.slice(0, 20).forEach((comment, i) => {
                        formattedContent += `\n[${i + 1}] u/${comment.author} (${comment.score} points, depth: ${comment.depth}):\n`;
                        formattedContent += `${comment.body}\n`;

                        // Include top replies
                        if (comment.replies && comment.replies.length > 0) {
                            comment.replies.slice(0, 3).forEach(reply => {
                                formattedContent += `  └─ u/${reply.author} (${reply.score} points): ${reply.body.substring(0, 150)}...\n`;
                            });
                        }
                    });
                }

                textarea.value = formattedContent;
                setStatus(`✓ Loaded complete Reddit post via API (${postData.num_comments} comments, ${postData.comments.length} fetched)`, 'text-green-600');

                // Store post data globally for 3D visualization
                currentPostData = postData;

                return;

            } catch (apiErr) {
                console.error('Reddit API failed, falling back to scraping:', apiErr);
                setStatus('API failed, trying web scraping...', 'text-yellow-600');
            }
        }

        // Try the content script for enhanced web scraping
        let response;
        try {
            response = await chrome.tabs.sendMessage(tab.id, { action: 'scrapeContent' });
        } catch (msgErr) {
            console.warn('No content script response, trying direct scripting API:', msgErr);
        }

        if (response?.status === 'success' && response.data) {
            const { content } = response.data;
            textarea.value = content;

            if (response.data.structured?.isRedditPost) {
                setStatus(`✓ Scraped Reddit post from page (${response.data.structured.comments.length} comments visible)`, 'text-green-600');
            } else {
                setStatus('✓ Loaded content from the active tab.', 'text-green-600');
            }
            return;
        }

        // Fallback: directly execute a script to grab the page text
        try {
            const [result] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    const title = document.title || '';
                    const bodyText = (document.body?.innerText || '').slice(0, 1500);
                    return { title, content: bodyText };
                },
            });
            if (result?.result) {
                const { title, content } = result.result;
                textarea.value = `${title}\n\n${content}`;
                setStatus('Loaded via scripting API.', 'text-green-600');
                return;
            }
        } catch (scriptErr) {
            console.warn('Direct scripting read failed:', scriptErr);
        }

        setStatus('No content returned. You can paste manually.', 'text-gray-500');
    } catch (err) {
        console.error('Failed to load tab content:', err);
        setStatus('The page content cannot be read automatically. Please paste it manually.', 'text-red-500');
    }
}
