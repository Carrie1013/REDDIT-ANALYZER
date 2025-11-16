/**
 * Reddit Comment Tree to 3D Graph Transformer
 * Adapted from reddit-3d-app for Chrome Extension use
 * Pure JavaScript implementation (no React dependencies)
 */

/**
 * Extract keywords from text for highlighting special nodes
 * @param {string} text - Comment text
 * @returns {Object} Keywords found
 */
function extractKeywords(text) {
  const lowerText = text.toLowerCase();

  return {
    isSolution: /\b(solve|solved|fix|fixed|replaced|solution|answer|resolved)\b/.test(lowerText),
    isQuestion: /\b(how|why|what|when|where|who|\?)\b/.test(lowerText),
    isDebate: /\b(but|however|disagree|wrong|actually|technically)\b/.test(lowerText)
  };
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
 * Transform tree structure into 3D graph nodes and edges
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
