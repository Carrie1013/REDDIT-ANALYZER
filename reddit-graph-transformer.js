/**
 * Reddit Comment Tree to 3D Graph Transformer
 * Adapted from reddit-3d-app for Chrome Extension use
 * Pure JavaScript implementation (no React dependencies)
 */

/**
 * Configuration for classification method
 * Set to 'regex' (fast, free) or 'llm' (accurate, <1¢/thread)
 */
const CLASSIFICATION_CONFIG = {
  method: 'regex', // 'regex' or 'llm'
  llmBatchSize: 20, // Classify 20 comments per API call
  useCache: true // Cache LLM results
};

/**
 * Extract keywords from text for highlighting special nodes (IMPROVED)
 * @param {string} text - Comment text
 * @returns {Object} Keywords found
 */
function extractKeywords(text) {
  const lowerText = text.toLowerCase();
  const trimmedText = text.trim();

  // IMPROVED: More precise question detection
  // Only match question patterns, not isolated question words
  const isQuestion =
    /\?[\s]*$/.test(trimmedText) || // Ends with question mark
    /\b(how do|how to|how can|how should|why is|why does|why would|what should|what is the best|where can|where should|when should|which one|who can|can someone|does anyone|is there a way)\b/i.test(lowerText) ||
    /^(how|why|what|where|when|which|who|can|does|is|are|should|could|would|will)\s/i.test(trimmedText); // Starts with question word

  // IMPROVED: Expanded solution detection
  // Match common solution patterns
  const isSolution =
    /\b(solved|fixed|resolved|solution|answer|here's how|here is how|this worked|worked for me|managed to|got it working|figured it out|turns out|try this|try using|use this|you can|you should|do this|install|run this|replace with|change to|i did|i used)\b/i.test(lowerText) ||
    /^(try|use|install|run|change|replace|update|upgrade|download|set|add|remove)\s/i.test(trimmedText); // Command/instruction starters

  // Debate detection (unchanged - works well)
  const isDebate = /\b(but|however|disagree|wrong|actually|technically|not really|incorrect|no that's|that's not|you're wrong|i don't think)\b/i.test(lowerText);

  return {
    isSolution,
    isQuestion,
    isDebate
  };
}

/**
 * LLM-based classification using Gemini Flash (optional, more accurate)
 * @param {Array} comments - Array of comment texts to classify
 * @returns {Promise<Array>} Array of classification results
 */
async function classifyCommentsWithLLM(comments) {
  if (!GEMINI_CONFIG?.API_KEY) {
    console.warn('Gemini API key not configured, falling back to regex classification');
    return comments.map(text => extractKeywords(text));
  }

  const apiKey = GEMINI_CONFIG.API_KEY;
  const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

  // Batch comments for efficiency
  const batches = [];
  for (let i = 0; i < comments.length; i += CLASSIFICATION_CONFIG.llmBatchSize) {
    batches.push(comments.slice(i, i + CLASSIFICATION_CONFIG.llmBatchSize));
  }

  const allResults = [];

  for (const batch of batches) {
    const prompt = `Classify each of the following Reddit comments into ONE category: "solution", "question", "debate", or "neutral".

A "solution" provides an answer, fix, workaround, or actionable advice.
A "question" asks for help, information, or clarification (must be genuinely asking, not rhetorical).
A "debate" expresses disagreement, correction, or counterargument.
"neutral" is everything else (general discussion, agreement, thanks, etc.).

Output ONLY a JSON array with the same number of elements as input comments, like: ["solution", "neutral", "question", "debate", ...]

Comments:
${batch.map((text, idx) => `${idx + 1}. ${text.substring(0, 200)}`).join('\n')}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent classification
        maxOutputTokens: 100
      }
    };

    try {
      const response = await fetch(apiUrl + `?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

      // Extract JSON array from response
      const jsonMatch = text.match(/\[(.*?)\]/s);
      if (jsonMatch) {
        const classifications = JSON.parse('[' + jsonMatch[1] + ']');

        // Convert to boolean flags
        const batchResults = classifications.map(type => ({
          isSolution: type === 'solution',
          isQuestion: type === 'question',
          isDebate: type === 'debate'
        }));

        allResults.push(...batchResults);
      } else {
        // Fallback to regex if parsing fails
        console.warn('Failed to parse LLM response, using regex fallback');
        allResults.push(...batch.map(text => extractKeywords(text)));
      }

      // Rate limiting: wait 250ms between batches (max 4 requests/second)
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 250));
      }

    } catch (error) {
      console.error('LLM classification error:', error);
      // Fallback to regex classification
      allResults.push(...batch.map(text => extractKeywords(text)));
    }
  }

  return allResults;
}

/**
 * Transform Reddit API comment data into tree structure
 * @param {Object} postData - Reddit post data from API
 * @returns {Object} Tree structure with root node
 */
function buildCommentTree(postData) {
  // Root node is the post itself
  const root = {
    id: 'post_' + postData.id || 'root',
    depth: 0,
    text: postData.selftext || postData.title,
    author: postData.author || 'unknown',
    score: postData.score || 0,
    timestamp: postData.created_utc || Date.now() / 1000,
    children: []
  };

  // Parse comments if available
  if (postData.comments && Array.isArray(postData.comments)) {
    root.children = parseCommentsRecursive(postData.comments, 1);
  }

  return root;
}

/**
 * Recursively parse comments into tree structure
 * @param {Array} comments - Array of comment objects
 * @param {number} depth - Current depth level
 * @returns {Array} Parsed comment nodes
 */
function parseCommentsRecursive(comments, depth) {
  const nodes = [];

  for (const comment of comments) {
    // Skip invalid comments
    if (!comment || comment.author === 'unknown' || !comment.body) {
      continue;
    }

    const node = {
      id: comment.id,
      depth,
      text: comment.body,
      author: comment.author,
      score: comment.score || 0,
      timestamp: comment.created_utc || Date.now() / 1000,
      children: []
    };

    // Recursively parse replies
    if (comment.replies && Array.isArray(comment.replies)) {
      node.children = parseCommentsRecursive(comment.replies, depth + 1);
    }

    nodes.push(node);
  }

  return nodes;
}

/**
 * Transform tree structure into 3D graph nodes and edges (SYNC VERSION)
 * Uses regex-based classification (fast, free)
 * @param {Object} root - Root node of the thread tree
 * @returns {Object} Object containing nodes and edges arrays
 */
function transformTreeTo3DGraph(root) {
  const nodes = [];
  const edges = [];
  let maxScore = 0;

  // First pass: collect all nodes and find max score
  function collectNodes(node, parent = null, xOffset = 0) {
    maxScore = Math.max(maxScore, node.score);

    // Calculate position
    const position = {
      x: parent ? parent.position.x + xOffset : 0,
      y: -node.depth * 0.8,
      z: (Math.random() - 0.5) * 0.6
    };

    const keywords = extractKeywords(node.text);

    const graphNode = {
      id: node.id,
      depth: node.depth,
      text: node.text,
      author: node.author,
      score: node.score,
      timestamp: node.timestamp,
      childrenCount: node.children.length,
      position,
      ...keywords
    };

    nodes.push(graphNode);

    // Create edge from parent
    if (parent) {
      edges.push({
        source: parent.id,
        target: node.id,
        sourcePos: parent.position,
        targetPos: position
      });
    }

    // Process children with spread positioning
    if (node.children.length > 0) {
      const spread = Math.min(node.children.length * 0.3, 2);
      const startOffset = -spread / 2;

      node.children.forEach((child, index) => {
        const childOffset = startOffset + (spread / node.children.length) * index;
        collectNodes(child, graphNode, childOffset);
      });
    }
  }

  collectNodes(root);

  // Second pass: compute visual properties based on max score
  nodes.forEach(node => {
    node.size = computeNodeSize(node.childrenCount);
    node.color = computeNodeColor(node);
    node.opacity = computeNodeOpacity(node.score, maxScore);
  });

  return { nodes, edges, maxScore };
}

/**
 * Transform tree structure into 3D graph nodes and edges (ASYNC VERSION)
 * Uses LLM-based classification (accurate, <1¢/thread)
 * @param {Object} root - Root node of the thread tree
 * @returns {Promise<Object>} Object containing nodes and edges arrays
 */
async function transformTreeTo3DGraphAsync(root) {
  const nodes = [];
  const edges = [];
  let maxScore = 0;

  // First pass: collect all nodes WITHOUT classification
  function collectNodes(node, parent = null, xOffset = 0) {
    maxScore = Math.max(maxScore, node.score);

    const position = {
      x: parent ? parent.position.x + xOffset : 0,
      y: -node.depth * 0.8,
      z: (Math.random() - 0.5) * 0.6
    };

    const graphNode = {
      id: node.id,
      depth: node.depth,
      text: node.text,
      author: node.author,
      score: node.score,
      timestamp: node.timestamp,
      childrenCount: node.children.length,
      position,
      // Classifications will be added later
      isSolution: false,
      isQuestion: false,
      isDebate: false
    };

    nodes.push(graphNode);

    if (parent) {
      edges.push({
        source: parent.id,
        target: node.id,
        sourcePos: parent.position,
        targetPos: position
      });
    }

    if (node.children.length > 0) {
      const spread = Math.min(node.children.length * 0.3, 2);
      const startOffset = -spread / 2;

      node.children.forEach((child, index) => {
        const childOffset = startOffset + (spread / node.children.length) * index;
        collectNodes(child, graphNode, childOffset);
      });
    }
  }

  collectNodes(root);

  // Second pass: LLM classification in batches
  const commentTexts = nodes.map(n => n.text);
  const classifications = await classifyCommentsWithLLM(commentTexts);

  // Apply classifications to nodes
  nodes.forEach((node, idx) => {
    if (classifications[idx]) {
      node.isSolution = classifications[idx].isSolution;
      node.isQuestion = classifications[idx].isQuestion;
      node.isDebate = classifications[idx].isDebate;
    }
  });

  // Third pass: compute visual properties
  nodes.forEach(node => {
    node.size = computeNodeSize(node.childrenCount);
    node.color = computeNodeColor(node);
    node.opacity = computeNodeOpacity(node.score, maxScore);
  });

  return { nodes, edges, maxScore };
}

/**
 * Compute node size based on children count
 * @param {number} childrenCount - Number of children
 * @returns {number} Node size
 */
function computeNodeSize(childrenCount) {
  return Math.min(Math.max(1 + Math.log(childrenCount + 1), 1), 4) * 0.05;
}

/**
 * Compute node color based on properties
 * Vibrant color palette optimized for bright background
 * @param {Object} node - Graph node
 * @returns {string} Color hex code
 */
function computeNodeColor(node) {
  // Solution nodes - Rich emerald green
  if (node.isSolution) {
    return '#059669';
  }

  // Question nodes - Bold amber/orange
  if (node.isQuestion) {
    return '#d97706';
  }

  // Debate nodes - Vibrant red-orange
  if (node.isDebate) {
    return '#dc2626';
  }

  // Deep nodes (depth >= 5) - Deep violet
  if (node.depth >= 5) {
    return '#7c3aed';
  }

  // Default color gradient based on depth (vibrant blues to purples)
  if (node.depth === 0) {
    return '#2563eb'; // Bold blue for root post
  } else if (node.depth === 1) {
    return '#3b82f6'; // Bright blue for top-level comments
  } else if (node.depth === 2) {
    return '#6366f1'; // Indigo for second level
  } else if (node.depth === 3) {
    return '#8b5cf6'; // Purple for third level
  } else {
    return '#a855f7'; // Bright purple for 4th level
  }
}

/**
 * Compute node opacity based on score
 * @param {number} score - Node score
 * @param {number} maxScore - Maximum score in the graph
 * @returns {number} Opacity value between 0.4 and 1
 */
function computeNodeOpacity(score, maxScore) {
  if (maxScore === 0) return 0.7;

  const normalized = score / maxScore;
  return 0.4 + (normalized * 0.6);
}

/**
 * Check if node is a branch point (3+ children)
 * @param {Object} node - Graph node
 * @returns {boolean} True if branch point
 */
function isBranchNode(node) {
  return node.childrenCount > 3;
}

/**
 * Get node type label
 * @param {Object} node - Graph node
 * @returns {string} Node type label
 */
function getNodeTypeLabel(node) {
  if (node.isSolution) return 'Solution';
  if (node.isQuestion) return 'Question';
  if (node.isDebate) return 'Debate';
  if (node.depth >= 5) return 'Deep Discussion';
  if (node.childrenCount > 3) return 'Branch Point';
  return 'Comment';
}

/**
 * Format score with K/M suffixes
 * @param {number} score - Score value
 * @returns {string} Formatted score
 */
function formatScore(score) {
  if (score >= 1000000) {
    return (score / 1000000).toFixed(1) + 'M';
  }
  if (score >= 1000) {
    return (score / 1000).toFixed(1) + 'K';
  }
  return score.toString();
}

/**
 * Format timestamp to readable date
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now - date;

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }

  // Less than 30 days
  if (diff < 2592000000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }

  // Default format
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// ============================================================================
// ADVANCED METRICS CALCULATION MODULE
// ============================================================================

/**
 * Calculate comprehensive thread structure metrics
 * @param {Object} graphData - Graph data with nodes and edges
 * @param {Object} postData - Original post data with metadata
 * @returns {Object} Comprehensive metrics object
 */
function calculateThreadMetrics(graphData, postData) {
  const { nodes, edges } = graphData;

  if (!nodes || nodes.length === 0) {
    return getEmptyMetrics();
  }

  return {
    structure: calculateStructureMetrics(nodes, edges),
    content: calculateContentMetrics(nodes),
    temporal: calculateTemporalMetrics(nodes, postData),
    social: calculateSocialMetrics(nodes, postData),
    engagement: calculateEngagementMetrics(nodes, postData)
  };
}

/**
 * Calculate thread structure metrics
 */
function calculateStructureMetrics(nodes, edges) {
  const depths = nodes.map(n => n.depth);
  const maxDepth = Math.max(...depths);

  // Calculate breadth at each level
  const breadthByLevel = {};
  nodes.forEach(n => {
    breadthByLevel[n.depth] = (breadthByLevel[n.depth] || 0) + 1;
  });
  const maxBreadth = Math.max(...Object.values(breadthByLevel));

  // Branch points (nodes with 3+ children)
  const branchPoints = nodes.filter(n => n.childrenCount >= 3).length;

  // Thread Divergence Score: horizontal spread vs vertical depth
  const divergenceScore = maxDepth > 0 ? (maxBreadth / maxDepth) * Math.log(branchPoints + 1) : 0;

  // Longest path (maximum depth)
  const longestPath = maxDepth;

  // Graph density
  const possibleEdges = nodes.length > 1 ? (nodes.length * (nodes.length - 1)) / 2 : 1;
  const density = edges.length / possibleEdges;

  // Subtree weight variance
  const childrenCounts = nodes.map(n => n.childrenCount);
  const avgChildren = childrenCounts.reduce((a, b) => a + b, 0) / childrenCounts.length;
  const variance = childrenCounts.reduce((sum, c) => sum + Math.pow(c - avgChildren, 2), 0) / childrenCounts.length;
  const subtreeBalance = Math.sqrt(variance);

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    maxDepth,
    maxBreadth,
    branchPoints,
    divergenceScore: divergenceScore.toFixed(2),
    longestPath,
    density: density.toFixed(4),
    subtreeBalance: subtreeBalance.toFixed(2),
    breadthByLevel
  };
}

/**
 * Calculate content and sentiment metrics
 */
function calculateContentMetrics(nodes) {
  let solutionNodes = 0;
  let questionNodes = 0;
  let debateNodes = 0;
  let deepThreadNodes = 0;

  nodes.forEach(n => {
    if (n.isSolution) solutionNodes++;
    if (n.isQuestion) questionNodes++;
    if (n.isDebate) debateNodes++;
    if (n.depth >= 5) deepThreadNodes++;
  });

  const totalNodes = nodes.length;

  // Conversation Balance Index: constructive vs argumentative
  const constructive = solutionNodes + questionNodes;
  const argumentative = debateNodes + (totalNodes - constructive - deepThreadNodes);
  const balanceIndex = argumentative > 0 ? (constructive / argumentative) : constructive;

  // Solution Density: solutions per 100 comments
  const solutionDensity = (solutionNodes / totalNodes) * 100;

  // Controversy Score: debate prevalence weighted by score variance
  const scores = nodes.map(n => n.score);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const scoreVariance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
  const controversyScore = (debateNodes / totalNodes) * Math.sqrt(scoreVariance);

  return {
    solutionNodes,
    questionNodes,
    debateNodes,
    deepThreadNodes,
    neutralNodes: totalNodes - solutionNodes - questionNodes - debateNodes,
    balanceIndex: balanceIndex.toFixed(2),
    solutionDensity: solutionDensity.toFixed(1),
    controversyScore: controversyScore.toFixed(2),
    distribution: {
      solutions: ((solutionNodes / totalNodes) * 100).toFixed(1) + '%',
      questions: ((questionNodes / totalNodes) * 100).toFixed(1) + '%',
      debates: ((debateNodes / totalNodes) * 100).toFixed(1) + '%'
    }
  };
}

/**
 * Calculate temporal metrics
 */
function calculateTemporalMetrics(nodes, postData) {
  if (!postData || !postData.created_utc) {
    return {
      activityVelocity: 0,
      lifecycleStage: 'Unknown',
      avgResponseTime: 0,
      peakActivityPeriod: 'N/A'
    };
  }

  const now = Date.now() / 1000;
  const postAge = now - postData.created_utc;
  const postAgeHours = postAge / 3600;

  // Activity Velocity: comments per hour
  const activityVelocity = postAgeHours > 0 ? (nodes.length / postAgeHours) : 0;

  // Lifecycle Stage
  let lifecycleStage;
  if (postAgeHours < 2) lifecycleStage = 'Early';
  else if (postAgeHours < 24) lifecycleStage = 'Active';
  else if (postAgeHours < 168) lifecycleStage = 'Mature'; // 7 days
  else lifecycleStage = 'Archive';

  // Response time distribution (simplified: average time between consecutive nodes)
  const timestamps = nodes.map(n => n.timestamp).filter(t => t > 0).sort();
  let totalGap = 0;
  let gapCount = 0;
  for (let i = 1; i < timestamps.length; i++) {
    totalGap += timestamps[i] - timestamps[i - 1];
    gapCount++;
  }
  const avgResponseTime = gapCount > 0 ? (totalGap / gapCount) / 60 : 0; // in minutes

  return {
    activityVelocity: activityVelocity.toFixed(2),
    lifecycleStage,
    avgResponseTime: avgResponseTime.toFixed(1) + ' min',
    postAgeHours: postAgeHours.toFixed(1)
  };
}

/**
 * Calculate social network metrics
 */
function calculateSocialMetrics(nodes, postData) {
  const authors = new Set(nodes.map(n => n.author).filter(a => a && a !== 'unknown'));
  const totalComments = nodes.length;

  // Author Diversity
  const authorDiversity = totalComments > 0 ? (authors.size / totalComments) : 0;

  // OP Engagement Ratio
  const opAuthor = postData?.author || '';
  const opComments = opAuthor ? nodes.filter(n => n.author === opAuthor).length : 0;
  const opEngagement = totalComments > 0 ? (opComments / totalComments) : 0;

  // Expert Concentration (top 10% authors' comment share)
  const authorCounts = {};
  nodes.forEach(n => {
    if (n.author && n.author !== 'unknown') {
      authorCounts[n.author] = (authorCounts[n.author] || 0) + 1;
    }
  });

  const sortedAuthors = Object.entries(authorCounts).sort((a, b) => b[1] - a[1]);
  const top10Percent = Math.max(1, Math.ceil(sortedAuthors.length * 0.1));
  const topAuthorComments = sortedAuthors.slice(0, top10Percent).reduce((sum, [_, count]) => sum + count, 0);
  const expertConcentration = totalComments > 0 ? (topAuthorComments / totalComments) : 0;

  return {
    uniqueAuthors: authors.size,
    authorDiversity: authorDiversity.toFixed(2),
    opEngagement: (opEngagement * 100).toFixed(1) + '%',
    expertConcentration: (expertConcentration * 100).toFixed(1) + '%',
    topContributors: sortedAuthors.slice(0, 5).map(([author, count]) => ({
      author,
      comments: count,
      percentage: ((count / totalComments) * 100).toFixed(1) + '%'
    }))
  };
}

/**
 * Calculate engagement metrics
 */
function calculateEngagementMetrics(nodes, postData) {
  const scores = nodes.map(n => n.score);
  const totalScore = scores.reduce((a, b) => a + b, 0);
  const avgScore = scores.length > 0 ? (totalScore / scores.length) : 0;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);

  // Thread Health Score: combines avg score, reply rate, depth distribution
  const avgChildren = nodes.reduce((sum, n) => sum + n.childrenCount, 0) / nodes.length;
  const deepThreadCount = nodes.filter(n => n.depth >= 5).length;
  const healthScore = avgChildren > 0 ? (avgScore * avgChildren) / (1 + deepThreadCount) : avgScore;

  return {
    avgScore: avgScore.toFixed(1),
    maxScore,
    minScore,
    totalScore,
    avgReplies: avgChildren.toFixed(1),
    healthScore: healthScore.toFixed(2)
  };
}

/**
 * Get empty metrics object
 */
function getEmptyMetrics() {
  return {
    structure: {},
    content: {},
    temporal: {},
    social: {},
    engagement: {}
  };
}

/**
 * Format metrics for display
 * @param {Object} metrics - Metrics object
 * @returns {string} Formatted HTML string
 */
function formatMetricsForDisplay(metrics) {
  if (!metrics || !metrics.structure) {
    return '<p class="text-gray-500">No metrics available</p>';
  }

  let html = '<div class="space-y-3 text-xs">';

  // Structure Metrics
  html += '<div class="border-b pb-2">';
  html += '<h4 class="font-semibold text-gray-800 mb-1">📐 Structure</h4>';
  html += `<div class="grid grid-cols-2 gap-1 text-gray-600">`;
  html += `<div>Nodes: ${metrics.structure.totalNodes}</div>`;
  html += `<div>Max Depth: ${metrics.structure.maxDepth}</div>`;
  html += `<div>Breadth: ${metrics.structure.maxBreadth}</div>`;
  html += `<div>Branches: ${metrics.structure.branchPoints}</div>`;
  html += `<div>Divergence: ${metrics.structure.divergenceScore}</div>`;
  html += `<div>Balance: ${metrics.structure.subtreeBalance}</div>`;
  html += `</div></div>`;

  // Content Metrics
  html += '<div class="border-b pb-2">';
  html += '<h4 class="font-semibold text-gray-800 mb-1">💬 Content</h4>';
  html += `<div class="grid grid-cols-2 gap-1 text-gray-600">`;
  html += `<div>Solutions: ${metrics.content.solutionNodes}</div>`;
  html += `<div>Questions: ${metrics.content.questionNodes}</div>`;
  html += `<div>Debates: ${metrics.content.debateNodes}</div>`;
  html += `<div>Balance: ${metrics.content.balanceIndex}</div>`;
  html += `<div>Sol. Density: ${metrics.content.solutionDensity}%</div>`;
  html += `<div>Controversy: ${metrics.content.controversyScore}</div>`;
  html += `</div></div>`;

  // Temporal Metrics
  html += '<div class="border-b pb-2">';
  html += '<h4 class="font-semibold text-gray-800 mb-1">⏱️ Temporal</h4>';
  html += `<div class="grid grid-cols-2 gap-1 text-gray-600">`;
  html += `<div>Stage: ${metrics.temporal.lifecycleStage}</div>`;
  html += `<div>Age: ${metrics.temporal.postAgeHours}h</div>`;
  html += `<div>Velocity: ${metrics.temporal.activityVelocity}/h</div>`;
  html += `<div>Avg Response: ${metrics.temporal.avgResponseTime}</div>`;
  html += `</div></div>`;

  // Social Metrics
  html += '<div class="border-b pb-2">';
  html += '<h4 class="font-semibold text-gray-800 mb-1">👥 Social</h4>';
  html += `<div class="grid grid-cols-2 gap-1 text-gray-600">`;
  html += `<div>Authors: ${metrics.social.uniqueAuthors}</div>`;
  html += `<div>Diversity: ${metrics.social.authorDiversity}</div>`;
  html += `<div>OP Engage: ${metrics.social.opEngagement}</div>`;
  html += `<div>Expert Con: ${metrics.social.expertConcentration}</div>`;
  html += `</div></div>`;

  // Engagement Metrics
  html += '<div>';
  html += '<h4 class="font-semibold text-gray-800 mb-1">🎯 Engagement</h4>';
  html += `<div class="grid grid-cols-2 gap-1 text-gray-600">`;
  html += `<div>Avg Score: ${metrics.engagement.avgScore}</div>`;
  html += `<div>Max Score: ${metrics.engagement.maxScore}</div>`;
  html += `<div>Avg Replies: ${metrics.engagement.avgReplies}</div>`;
  html += `<div>Health: ${metrics.engagement.healthScore}</div>`;
  html += `</div></div>`;

  html += '</div>';
  return html;
}
