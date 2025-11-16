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
    const methodSelect = document.getElementById('classification-method');
    const useLLM = methodSelect?.value === 'llm';

    // Check if we have data from the Summary tab
    if (currentPostData && currentPostData.comments) {
        const methodLabel = useLLM ? 'LLM classification' : 'regex classification';
        statusEl.textContent = `Building 3D visualization with ${methodLabel}...`;
        statusEl.className = 'text-xs text-blue-600 mb-2';

        try {
            // Build comment tree
            const tree = buildCommentTree(currentPostData);

            // Transform to 3D graph (choose method based on user selection)
            let graphData;
            if (useLLM) {
                statusEl.textContent = `Classifying comments with LLM (this may take a few seconds)...`;
                graphData = await transformTreeTo3DGraphAsync(tree);
            } else {
                graphData = transformTreeTo3DGraph(tree);
            }

            const { nodes, edges } = graphData;

            // Load into renderer
            reddit3DRenderer.loadGraph(nodes, edges);

            // Calculate and display metrics
            const metrics = calculateThreadMetrics(graphData, currentPostData);
            displayThreadMetrics(metrics);

            // Show classification statistics
            displayClassificationStats(nodes);

            const successMsg = useLLM
                ? `✓ LLM classification complete: ${nodes.length} nodes, ${edges.length} connections`
                : `✓ Visualization loaded: ${nodes.length} nodes, ${edges.length} connections`;
            statusEl.textContent = successMsg;
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
 * Display classification statistics
 */
function displayClassificationStats(nodes) {
    const statsEl = document.getElementById('classification-stats');
    if (!statsEl) return;

    const solutionCount = nodes.filter(n => n.isSolution).length;
    const questionCount = nodes.filter(n => n.isQuestion).length;
    const debateCount = nodes.filter(n => n.isDebate).length;
    const total = nodes.length;

    document.getElementById('stats-solutions').textContent =
        `${solutionCount} (${((solutionCount/total)*100).toFixed(0)}%)`;
    document.getElementById('stats-questions').textContent =
        `${questionCount} (${((questionCount/total)*100).toFixed(0)}%)`;
    document.getElementById('stats-debates').textContent =
        `${debateCount} (${((debateCount/total)*100).toFixed(0)}%)`;

    statsEl.classList.remove('hidden');
}

/**
 * Display thread metrics in the metrics panel
 */
function displayThreadMetrics(metrics) {
    const metricsPanel = document.getElementById('metrics-panel');
    const metricsContent = document.getElementById('metrics-content');

    if (!metricsPanel || !metricsContent) return;

    // Show the metrics panel
    metricsPanel.classList.remove('hidden');

    // Format and display metrics
    metricsContent.innerHTML = formatMetricsForDisplay(metrics);

    // Setup toggle button
    const toggleBtn = document.getElementById('toggle-metrics-btn');
    if (toggleBtn) {
        toggleBtn.onclick = () => {
            if (metricsContent.style.display === 'none') {
                metricsContent.style.display = 'block';
                toggleBtn.textContent = 'Hide';
            } else {
                metricsContent.style.display = 'none';
                toggleBtn.textContent = 'Show';
            }
        };
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
 * Calculate behavior rhythm metrics from Reddit thread data
 */
function calculateBehaviorRhythm(postData) {
    const comments = collectAllComments(postData.comments || []);
    const totalComments = comments.length;

    if (totalComments === 0) {
        return {
            avgCommentLength: 0,
            punctuationChaos: 0,
            emojiDensity: 0,
            commentScoreRatio: 0,
            mediaRatio: 0,
            capsIntensity: 0,
            editFrequency: 0,
            deletedRatio: 0
        };
    }

    // 1. Average Comment Length
    const totalLength = comments.reduce((sum, c) => sum + (c.body?.length || 0), 0);
    const avgCommentLength = totalLength / totalComments;

    // 2. Punctuation Chaos (variance in punctuation usage)
    const punctuationCounts = comments.map(c => {
        const text = c.body || '';
        return (text.match(/[!?.,;:]/g) || []).length / Math.max(text.length, 1);
    });
    const avgPunct = punctuationCounts.reduce((a, b) => a + b, 0) / punctuationCounts.length;
    const variance = punctuationCounts.reduce((sum, p) => sum + Math.pow(p - avgPunct, 2), 0) / punctuationCounts.length;
    const punctuationChaos = Math.sqrt(variance);

    // 3. Emoji Density
    const emojiCount = comments.reduce((sum, c) => {
        const text = c.body || '';
        // Count common emoji patterns
        const emojis = text.match(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}|😀-🙏|🌀-🗿|🚀-🛿|☀-⛿|✀-➿]/gu) || [];
        return sum + emojis.length;
    }, 0);
    const totalWords = comments.reduce((sum, c) => sum + (c.body?.split(/\s+/).length || 0), 0);
    const emojiDensity = (emojiCount / Math.max(totalWords, 1)) * 100;

    // 4. Comments/Score Ratio
    const totalScore = postData.score || 0;
    const commentScoreRatio = totalScore > 0 ? totalComments / totalScore : totalComments;

    // 5. Image/Video Ratio (estimate from URLs)
    const mediaCount = comments.reduce((sum, c) => {
        const text = c.body || '';
        const hasMedia = /\.(jpg|jpeg|png|gif|webp|mp4|webm|youtube\.com|youtu\.be|imgur\.com|gfycat\.com)/i.test(text);
        return sum + (hasMedia ? 1 : 0);
    }, 0);
    const mediaRatio = (mediaCount / totalComments) * 100;

    // 6. Capitalization Intensity
    const capsCount = comments.reduce((sum, c) => {
        const text = c.body || '';
        const upperChars = (text.match(/[A-Z]/g) || []).length;
        const letters = (text.match(/[A-Za-z]/g) || []).length;
        return sum + (letters > 0 ? upperChars / letters : 0);
    }, 0);
    const capsIntensity = (capsCount / totalComments) * 100;

    // 7. Edit Frequency (estimate from "edited" field if available)
    const editedCount = comments.filter(c => c.edited || (c.body && c.body.includes('*edit'))).length;
    const editFrequency = (editedCount / totalComments) * 100;

    // 8. Deleted Comment Ratio (detect [deleted] or [removed])
    const deletedCount = comments.filter(c => {
        const text = c.body || '';
        return text === '[deleted]' || text === '[removed]' || c.author === '[deleted]';
    }).length;
    const deletedRatio = (deletedCount / totalComments) * 100;

    return {
        avgCommentLength: avgCommentLength.toFixed(1),
        punctuationChaos: punctuationChaos.toFixed(3),
        emojiDensity: emojiDensity.toFixed(2) + '%',
        commentScoreRatio: commentScoreRatio.toFixed(2),
        mediaRatio: mediaRatio.toFixed(1) + '%',
        capsIntensity: capsIntensity.toFixed(1) + '%',
        editFrequency: editFrequency.toFixed(1) + '%',
        deletedRatio: deletedRatio.toFixed(1) + '%'
    };
}

/**
 * Helper: Collect all comments recursively
 */
function collectAllComments(comments) {
    const result = [];
    for (const comment of comments) {
        result.push(comment);
        if (comment.replies && Array.isArray(comment.replies)) {
            result.push(...collectAllComments(comment.replies));
        }
    }
    return result;
}

/**
 * Calculate core sentiment metrics using LLM
 */
async function calculateCoreMetrics(postData) {
    if (!GEMINI_CONFIG?.API_KEY) {
        console.warn('Gemini API key not configured for core metrics');
        return {
            technicalDensity: 'N/A',
            contextualDepth: 'N/A',
            evidenceVolume: 'N/A',
            mfi: 'N/A',
            falseOptimism: 'N/A',
            capitulation: 'N/A'
        };
    }

    // Define API credentials locally
    const apiKey = GEMINI_CONFIG.API_KEY;
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

    const comments = collectAllComments(postData.comments || []);
    const sampleSize = Math.min(50, comments.length);
    const sampleComments = comments.slice(0, sampleSize).map(c => c.body).join('\n---\n');

    const prompt = `Analyze the following Reddit discussion and provide quantitative metrics (0-10 scale or percentage):

DISCUSSION TITLE: ${postData.title}
SUBREDDIT: r/${postData.subreddit}

SAMPLE COMMENTS (${sampleSize} of ${comments.length}):
${sampleComments.substring(0, 3000)}

Provide ONLY a JSON object with these exact keys and numeric values:
{
  "technicalDensity": <0-10 score for academic/technical terms density>,
  "contextualDepth": <0-10 score for analysis quality and depth>,
  "evidenceVolume": <0-10 score for data/sources/evidence cited>,
  "mfi": <0-10 score where 0=serious, 10=pure memes/jokes>,
  "falseOptimism": <0-10 score for artificial/forced positivity>,
  "capitulation": <0-10 score for despair/surrender sentiment>
}

Consider:
- Technical density: Financial jargon, technical analysis terms, academic language
- Contextual depth: Nuanced analysis vs surface-level reactions
- Evidence: Links, data points, charts, research citations
- MFI: Memes, emojis, jokes, sarcasm vs serious discussion
- False optimism: "Hopium", forced positivity, denial
- Capitulation: "It's over", surrender, despair, selling pressure

Output ONLY the JSON, no explanation.`;

    try {
        const response = await fetch(apiUrl + `?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 200
                }
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
            const metrics = JSON.parse(jsonMatch[0]);
            return {
                technicalDensity: metrics.technicalDensity?.toFixed(1) || 'N/A',
                contextualDepth: metrics.contextualDepth?.toFixed(1) || 'N/A',
                evidenceVolume: metrics.evidenceVolume?.toFixed(1) || 'N/A',
                mfi: metrics.mfi?.toFixed(1) || 'N/A',
                falseOptimism: metrics.falseOptimism?.toFixed(1) || 'N/A',
                capitulation: metrics.capitulation?.toFixed(1) || 'N/A'
            };
        }
    } catch (error) {
        console.error('Core metrics LLM error:', error);
    }

    return {
        technicalDensity: 'Error',
        contextualDepth: 'Error',
        evidenceVolume: 'Error',
        mfi: 'Error',
        falseOptimism: 'Error',
        capitulation: 'Error'
    };
}

/**
 * Calculate overall confidence score
 */
function calculateConfidenceScore(behaviorMetrics, coreMetrics) {
    // Parse numeric values
    const parseMetric = (val) => {
        if (typeof val === 'string') {
            return parseFloat(val.replace('%', '')) || 0;
        }
        return parseFloat(val) || 0;
    };

    // Behavior scoring (0-50 points)
    let behaviorScore = 0;

    // Low emoji = more serious (+10)
    const emojiVal = parseMetric(behaviorMetrics.emojiDensity);
    behaviorScore += Math.max(0, 10 - emojiVal);

    // Moderate comment length is good (+10)
    const lengthVal = parseMetric(behaviorMetrics.avgCommentLength);
    behaviorScore += lengthVal > 100 && lengthVal < 500 ? 10 : 5;

    // Low caps = more serious (+10)
    const capsVal = parseMetric(behaviorMetrics.capsIntensity);
    behaviorScore += Math.max(0, 10 - capsVal / 2);

    // Higher punctuation chaos = more emotional (-5 to +10)
    const punctVal = parseMetric(behaviorMetrics.punctuationChaos);
    behaviorScore += punctVal < 0.05 ? 10 : 5;

    // Low deleted/edit = authentic (+10)
    const deletedVal = parseMetric(behaviorMetrics.deletedRatio);
    behaviorScore += Math.max(0, 10 - deletedVal);

    // Core metrics scoring (0-50 points)
    let coreScore = 0;

    const technical = parseMetric(coreMetrics.technicalDensity);
    const depth = parseMetric(coreMetrics.contextualDepth);
    const evidence = parseMetric(coreMetrics.evidenceVolume);
    const mfi = parseMetric(coreMetrics.mfi);

    // High technical + depth + evidence = good
    coreScore += (technical * 2); // 0-20
    coreScore += (depth * 1.5);   // 0-15
    coreScore += (evidence * 1.5); // 0-15

    // Low MFI = more serious (inverse)
    coreScore += Math.max(0, 10 - mfi);

    // Total score (0-100)
    const totalScore = Math.min(100, Math.round(behaviorScore + coreScore));

    // Interpretation
    let description = '';
    let signalClass = '';
    if (totalScore >= 75) {
        description = 'High Confidence: Strong analytical discussion, low noise. Reliable signal.';
        signalClass = 'bullish';
    } else if (totalScore >= 50) {
        description = 'Moderate Confidence: Mixed signals, some quality analysis present.';
        signalClass = 'neutral';
    } else {
        description = 'Low Confidence: High noise, meme-heavy, lacks depth. Unreliable signal.';
        signalClass = 'bearish';
    }

    return { score: totalScore, description, signalClass };
}

/**
 * Main signal analysis function
 */
async function analyzeSignals() {
    const statusEl = document.getElementById('signal-status');
    const resultsDiv = document.getElementById('signal-results');
    const analyzeBtn = document.getElementById('analyze-signals-btn');

    if (!currentPostData || !currentPostData.comments) {
        statusEl.textContent = 'No Reddit post loaded. Go to "Page Summary" tab first.';
        statusEl.className = 'text-xs text-red-500 mb-3';
        return;
    }

    analyzeBtn.disabled = true;
    statusEl.textContent = 'Analyzing thread signals...';
    statusEl.className = 'text-xs text-blue-600 mb-3';

    try {
        // Step 1: Calculate behavior rhythm metrics
        statusEl.textContent = 'Calculating behavior rhythm metrics...';
        const behaviorMetrics = calculateBehaviorRhythm(currentPostData);

        // Display behavior metrics
        document.getElementById('metric-comment-length').textContent = behaviorMetrics.avgCommentLength;
        document.getElementById('metric-punctuation').textContent = behaviorMetrics.punctuationChaos;
        document.getElementById('metric-emoji').textContent = behaviorMetrics.emojiDensity;
        document.getElementById('metric-comment-score').textContent = behaviorMetrics.commentScoreRatio;
        document.getElementById('metric-media').textContent = behaviorMetrics.mediaRatio;
        document.getElementById('metric-caps').textContent = behaviorMetrics.capsIntensity;
        document.getElementById('metric-edits').textContent = behaviorMetrics.editFrequency;
        document.getElementById('metric-deleted').textContent = behaviorMetrics.deletedRatio;

        // Step 2: Calculate core metrics with LLM
        statusEl.textContent = 'Analyzing sentiment with LLM (this may take a few seconds)...';
        const coreMetrics = await calculateCoreMetrics(currentPostData);

        // Display core metrics
        document.getElementById('metric-technical').textContent = coreMetrics.technicalDensity;
        document.getElementById('metric-context').textContent = coreMetrics.contextualDepth;
        document.getElementById('metric-evidence').textContent = coreMetrics.evidenceVolume;
        document.getElementById('metric-mfi').textContent = coreMetrics.mfi;
        document.getElementById('metric-optimism').textContent = coreMetrics.falseOptimism;
        document.getElementById('metric-capitulation').textContent = coreMetrics.capitulation;

        // Step 3: Calculate confidence score
        const confidence = calculateConfidenceScore(behaviorMetrics, coreMetrics);

        // Display confidence score
        document.getElementById('confidence-score').textContent = confidence.score;
        document.getElementById('confidence-bar').style.width = confidence.score + '%';
        document.getElementById('confidence-desc').textContent = confidence.description;

        // Investment signal summary
        const signalPanel = document.getElementById('investment-signal');
        const signalRec = document.getElementById('signal-recommendation');

        if (confidence.signalClass === 'bullish') {
            signalPanel.className = 'p-3 rounded-lg border-2 bg-green-50 border-green-300';
            signalRec.className = 'text-sm text-green-800';
            signalRec.textContent = `✅ ${confidence.description} Consider as actionable market intelligence.`;
        } else if (confidence.signalClass === 'neutral') {
            signalPanel.className = 'p-3 rounded-lg border-2 bg-yellow-50 border-yellow-300';
            signalRec.className = 'text-sm text-yellow-800';
            signalRec.textContent = `⚠️ ${confidence.description} Use with caution and cross-reference.`;
        } else {
            signalPanel.className = 'p-3 rounded-lg border-2 bg-red-50 border-red-300';
            signalRec.className = 'text-sm text-red-800';
            signalRec.textContent = `❌ ${confidence.description} Avoid using for investment decisions.`;
        }

        // Show results
        resultsDiv.classList.remove('hidden');
        statusEl.textContent = '✓ Analysis complete!';
        statusEl.className = 'text-xs text-green-600 mb-3';

    } catch (error) {
        console.error('Signal analysis error:', error);
        statusEl.textContent = '✗ Analysis failed: ' + error.message;
        statusEl.className = 'text-xs text-red-500 mb-3';
    } finally {
        analyzeBtn.disabled = false;
    }
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
    document.getElementById('analyze-signals-btn').addEventListener('click', analyzeSignals);

    // Classification method change - re-render visualization
    const methodSelect = document.getElementById('classification-method');
    if (methodSelect) {
        methodSelect.addEventListener('change', () => {
            // Re-load 3D data with new classification method
            if (currentPostData && currentPostData.comments) {
                load3DData();
            }
        });
    }
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
