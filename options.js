/**
 * Options page script for Reddit Quant Signal Analyzer
 * Manages API key configuration and usage statistics
 */

// Load existing settings when page opens
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await updateUsageStats();
});

/**
 * Load saved settings from Chrome storage
 */
async function loadSettings() {
    const result = await chrome.storage.local.get([
        'redditClientId',
        'redditClientSecret',
        'geminiApiKey'
    ]);

    if (result.redditClientId) {
        document.getElementById('reddit-client-id').value = result.redditClientId;
    }
    if (result.redditClientSecret) {
        document.getElementById('reddit-client-secret').value = result.redditClientSecret;
    }
    if (result.geminiApiKey) {
        document.getElementById('gemini-api-key').value = result.geminiApiKey;
    }
}

/**
 * Update usage statistics display
 */
async function updateUsageStats() {
    const today = new Date().toDateString();
    const result = await chrome.storage.local.get(['usageDate', 'usageCount']);

    // Get today's usage count
    let usageToday = 0;
    if (result.usageDate === today) {
        usageToday = result.usageCount || 0;
    }

    const dailyLimit = 10;
    const remaining = Math.max(0, dailyLimit - usageToday);

    document.getElementById('usage-today').textContent = usageToday;
    document.getElementById('remaining-today').textContent = remaining;

    // Count cached posts
    const allData = await chrome.storage.local.get(null);
    const cacheCount = Object.keys(allData).filter(key => key.startsWith('cache_')).length;
    document.getElementById('cache-count').textContent = cacheCount;
}

/**
 * Save settings button handler
 */
document.getElementById('save-btn').addEventListener('click', async () => {
    const redditClientId = document.getElementById('reddit-client-id').value.trim();
    const redditClientSecret = document.getElementById('reddit-client-secret').value.trim();
    const geminiApiKey = document.getElementById('gemini-api-key').value.trim();

    // Validation
    if (!redditClientId || !redditClientSecret || !geminiApiKey) {
        showError();
        return;
    }

    // Save to Chrome storage
    await chrome.storage.local.set({
        redditClientId,
        redditClientSecret,
        geminiApiKey
    });

    showSuccess();
});

/**
 * Test connection button handler
 */
document.getElementById('test-btn').addEventListener('click', async () => {
    const statusDiv = document.getElementById('status');
    const errorDiv = document.getElementById('error');

    // Hide previous messages
    statusDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');

    const redditClientId = document.getElementById('reddit-client-id').value.trim();
    const redditClientSecret = document.getElementById('reddit-client-secret').value.trim();
    const geminiApiKey = document.getElementById('gemini-api-key').value.trim();

    if (!redditClientId || !redditClientSecret || !geminiApiKey) {
        errorDiv.querySelector('span').textContent = '✗ Please fill in all fields before testing';
        errorDiv.classList.remove('hidden');
        return;
    }

    // Test Reddit API
    const btn = document.getElementById('test-btn');
    btn.textContent = '🔄 Testing...';
    btn.disabled = true;

    try {
        // Test Reddit OAuth
        const authString = btoa(`${redditClientId}:${redditClientSecret}`);
        const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        if (!tokenResponse.ok) {
            throw new Error('Reddit API authentication failed');
        }

        // Test Gemini API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'test' }] }]
                })
            }
        );

        if (!geminiResponse.ok) {
            throw new Error('Gemini API authentication failed');
        }

        // Both tests passed
        statusDiv.querySelector('span').textContent = '✓ All API connections successful!';
        statusDiv.classList.remove('hidden');

    } catch (error) {
        errorDiv.querySelector('span').textContent = `✗ Connection failed: ${error.message}`;
        errorDiv.classList.remove('hidden');
    } finally {
        btn.textContent = '🧪 Test Connection';
        btn.disabled = false;
    }
});

/**
 * Clear cache button handler
 */
document.getElementById('clear-cache-btn').addEventListener('click', async () => {
    if (!confirm('Clear all cached analyses? This will require re-analyzing posts.')) {
        return;
    }

    const allData = await chrome.storage.local.get(null);
    const cacheKeys = Object.keys(allData).filter(key => key.startsWith('cache_'));

    for (const key of cacheKeys) {
        await chrome.storage.local.remove(key);
    }

    await updateUsageStats();
    alert(`Cleared ${cacheKeys.length} cached analyses`);
});

/**
 * Reset usage count button handler (for development)
 */
document.getElementById('reset-usage-btn').addEventListener('click', async () => {
    await chrome.storage.local.set({
        usageDate: new Date().toDateString(),
        usageCount: 0
    });

    await updateUsageStats();
    alert('Daily usage count reset to 0');
});

/**
 * Show success message
 */
function showSuccess() {
    const statusDiv = document.getElementById('status');
    const errorDiv = document.getElementById('error');

    errorDiv.classList.add('hidden');
    statusDiv.classList.remove('hidden');

    setTimeout(() => {
        statusDiv.classList.add('hidden');
    }, 3000);
}

/**
 * Show error message
 */
function showError() {
    const statusDiv = document.getElementById('status');
    const errorDiv = document.getElementById('error');

    statusDiv.classList.add('hidden');
    errorDiv.classList.remove('hidden');

    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 3000);
}

// Auto-update stats every 5 seconds
setInterval(updateUsageStats, 5000);
