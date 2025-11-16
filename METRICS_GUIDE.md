# Reddit Thread Metrics & Visualization Guide

## 📊 Overview

This guide explains all the metrics, visual encodings, and analysis capabilities available in the Reddit 3D Analyzer tool.

---

## 🎨 Visual Legend

### Semantic Classification (Priority Order)

These colors override depth-based colors when specific keywords are detected:

| Color | Type | Detection Pattern | Use Case |
|-------|------|-------------------|----------|
| 🟢 **Emerald** `#059669` | **Solution/Answer** | `solve`, `solved`, `fix`, `fixed`, `replaced`, `solution`, `answer`, `resolved` | Identify helpful responses and actual solutions |
| 🟠 **Amber** `#d97706` | **Question** | `how`, `why`, `what`, `when`, `where`, `who`, `?` | Highlight information requests and confusion points |
| 🔴 **Red** `#dc2626` | **Debate/Disagreement** | `but`, `however`, `disagree`, `wrong`, `actually`, `technically` | Mark controversial or argumentative discussions |
| 🟣 **Violet** `#7c3aed` | **Deep Thread** | `depth >= 5` | Show extended, rabbit-hole conversations |

### Depth-Based Gradient (Default)

When no semantic keywords match:

| Depth Level | Color Name | Hex Code | Description |
|-------------|------------|----------|-------------|
| 0 | **Bold Blue** | `#2563eb` | Root post (original submission) |
| 1 | **Bright Blue** | `#3b82f6` | Top-level comments (direct replies to post) |
| 2 | **Indigo** | `#6366f1` | Second-level replies |
| 3 | **Purple** | `#8b5cf6` | Third-level replies |
| 4+ | **Bright Purple** | `#a855f7` | Fourth level and deeper |

### Visual Encoding Properties

| Property | Formula | Interpretation |
|----------|---------|----------------|
| **Node Size** | `min(max(1 + log(childrenCount + 1), 1), 4) × 0.05` | Larger spheres = More child comments |
| **Opacity** | `0.4 + (score / maxScore) × 0.6` | Higher opacity = Higher score (more upvotes) |
| **Pulsing** | Animated at 2Hz | Branch points with 3+ children |
| **Glow** | Emissive light | Currently selected node |

### 3D Controls

- **Left-drag**: Rotate camera (orbit view)
- **Right-drag**: Pan camera position
- **Scroll**: Zoom in/out (distance: 2-20 units)
- **Click**: Select node and center camera with smooth animation

---

## 📈 Advanced Thread Metrics

### A. Structure Metrics (`structure`)

Analyze the geometric and topological properties of the discussion tree.

#### 1. **Total Nodes**
- Count of all comments in the thread
- **Use**: Thread size indicator

#### 2. **Max Depth**
- Maximum nesting level reached
- **Use**: Identify deep rabbit holes vs shallow discussions

#### 3. **Max Breadth**
- Maximum number of comments at any single depth level
- **Use**: Measure horizontal spread of discussion

#### 4. **Branch Points**
- Nodes with 3+ children
- **Use**: Identify pivotal comments that spark multiple conversations

#### 5. **Thread Divergence Score**
- Formula: `(maxBreadth / maxDepth) × log(branchPoints + 1)`
- **High score**: Broad discussion with multiple viewpoints
- **Low score**: Focused debate chains
- **Use**: Understand discussion structure pattern

#### 6. **Graph Density**
- Formula: `edges / possibleEdges`
- **Use**: How interconnected the discussion is (for future threading features)

#### 7. **Subtree Balance**
- Standard deviation of children counts
- **High value**: Imbalanced tree (some comments get many replies, others none)
- **Low value**: Balanced participation
- **Use**: Measure distribution equity

### B. Content Metrics (`content`)

Analyze semantic types and conversation quality.

#### 1. **Solution Nodes**
- Count of solution/answer comments
- **Use**: Practical value assessment

#### 2. **Question Nodes**
- Count of question comments
- **Use**: Confusion/curiosity level

#### 3. **Debate Nodes**
- Count of debate/disagreement comments
- **Use**: Controversy indicator

#### 4. **Conversation Balance Index**
- Formula: `(solutions + questions) / (debates + neutral)`
- **> 1**: Constructive discussion
- **< 1**: Argumentative discussion
- **Use**: Overall thread tone assessment

#### 5. **Solution Density**
- Solutions per 100 comments
- **High**: Very helpful thread
- **Low**: Lots of discussion, few answers
- **Use**: Determine if thread solves problems

#### 6. **Controversy Score**
- Formula: `(debateNodes / totalNodes) × sqrt(scoreVariance)`
- **High**: Polarized opinions with varied upvotes
- **Low**: Consensus or neutral discussion
- **Use**: Detect hot-button topics

### C. Temporal Metrics (`temporal`)

Analyze time-based patterns and lifecycle.

#### 1. **Activity Velocity**
- Formula: `totalComments / postAgeHours`
- Comments per hour since post creation
- **High**: Trending, active discussion
- **Low**: Dying or slow-burn discussion
- **Use**: Virality indicator

#### 2. **Lifecycle Stage**
- **Early** (0-2h): Just posted, initial reactions
- **Active** (2-24h): Peak engagement period
- **Mature** (1-7d): Slowing down, established opinions
- **Archive** (7d+): Historical, minimal new activity
- **Use**: Context for current engagement patterns

#### 3. **Average Response Time**
- Average time gap between consecutive comments
- **Low**: Rapid-fire, heated conversation
- **High**: Thoughtful, slow discussion
- **Use**: Conversation pace indicator

#### 4. **Post Age**
- Hours since original post
- **Use**: Time context

### D. Social Network Metrics (`social`)

Analyze participation patterns and community dynamics.

#### 1. **Unique Authors**
- Count of distinct commenters
- **Use**: Participation breadth

#### 2. **Author Diversity**
- Formula: `uniqueAuthors / totalComments`
- **< 0.3**: Dominated by few users (echo chamber)
- **0.3-0.7**: Moderate diversity
- **> 0.7**: Very diverse participation
- **Use**: Measure echo chamber vs open discussion

#### 3. **OP Engagement Ratio**
- Formula: `opComments / totalComments`
- **High**: OP is very active in discussion
- **Low**: OP posted and left
- **Use**: Assess OP involvement

#### 4. **Expert Concentration**
- Percentage of comments from top 10% most active authors
- **High**: Few "experts" dominate
- **Low**: Distributed expertise
- **Use**: Identify expert-driven vs crowd discussions

#### 5. **Top Contributors**
- Top 5 most active commenters with percentages
- **Use**: Identify key discussion drivers

### E. Engagement Metrics (`engagement`)

Analyze upvote patterns and thread health.

#### 1. **Average Score**
- Mean upvotes per comment
- **Use**: Overall quality/interest level

#### 2. **Max Score**
- Highest upvoted comment
- **Use**: Find the "winner" comment

#### 3. **Min Score**
- Lowest score (may be negative)
- **Use**: Identify downvoted/controversial takes

#### 4. **Total Score**
- Sum of all comment scores
- **Use**: Aggregate community approval

#### 5. **Average Replies**
- Mean children per node
- **Use**: Conversation depth indicator

#### 6. **Thread Health Score**
- Formula: `(avgScore × avgReplies) / (1 + deepThreadCount)`
- Combines quality, engagement, and depth
- **High**: Healthy, engaging discussion
- **Low**: Low-quality or fragmented discussion
- **Use**: Overall thread quality metric

---

## 🎯 Practical Use Cases

### Investment Signal Analysis

1. **Sentiment Shifts**: Track `controversyScore` and `balanceIndex` over time
2. **Community Growth**: Monitor `authorDiversity` and `activityVelocity`
3. **Viral Potential**: High `divergenceScore` + High `activityVelocity` = Trending topic

### Content Moderation

1. **Toxic Threads**: High `debateNodes` + Low `balanceIndex`
2. **Helpful Threads**: High `solutionDensity` + High `healthScore`
3. **Dead Threads**: Low `activityVelocity` + `lifecycleStage === 'Archive'`

### Research & Analysis

1. **Discussion Patterns**: Compare `divergenceScore` across subreddits
2. **Expert Communities**: High `expertConcentration` + High `solutionDensity`
3. **Engagement Quality**: `healthScore` vs `totalNodes` correlation

### Community Management

1. **OP Best Practices**: Optimal `opEngagement` ratio (aim for 10-20%)
2. **Thread Structure**: Monitor `subtreeBalance` for equitable participation
3. **Response Times**: Track `avgResponseTime` for community responsiveness

---

## 🔧 Technical Implementation

### Data Flow

```
Reddit API/Scraper
    ↓
buildCommentTree() → Tree structure
    ↓
transformTreeTo3DGraph() → Graph with nodes/edges
    ↓
calculateThreadMetrics() → Comprehensive metrics
    ↓
Three.js Renderer + Metrics Display
```

### Metric Calculation Functions

Located in `reddit-graph-transformer.js`:

- `calculateThreadMetrics(graphData, postData)` - Main entry point
- `calculateStructureMetrics(nodes, edges)` - Tree topology
- `calculateContentMetrics(nodes)` - Semantic analysis
- `calculateTemporalMetrics(nodes, postData)` - Time-based patterns
- `calculateSocialMetrics(nodes, postData)` - Author participation
- `calculateEngagementMetrics(nodes, postData)` - Upvote patterns
- `formatMetricsForDisplay(metrics)` - HTML formatter

### Performance Considerations

- Metrics calculation: O(n) where n = number of nodes
- Memory usage: ~500 bytes per node
- Real-time updates: Supported for dynamic threads
- Max recommended thread size: 10,000 nodes

---

## 📚 Future Enhancements

### Planned Metrics

1. **Sentiment Analysis**: ML-based positive/negative scoring
2. **Topic Clustering**: LDA/LSA for theme detection
3. **Influence Scores**: PageRank-style author ranking
4. **Prediction Models**: Comment velocity forecasting
5. **Cross-thread Analysis**: Subreddit comparison tools

### Visualization Improvements

1. **Heat maps**: Color by score/activity
2. **Time slider**: Scrub through thread history
3. **Filter controls**: Hide/show by type
4. **Export options**: PNG/SVG/JSON downloads
5. **VR mode**: Immersive 3D navigation

---

## 🤝 Contributing

To add new metrics:

1. Add calculation function to `reddit-graph-transformer.js`
2. Integrate into `calculateThreadMetrics()`
3. Update `formatMetricsForDisplay()` for UI
4. Document in this guide
5. Add test cases

---

## 📖 References

- **Graph Theory**: Newman, M. (2018). *Networks* (2nd ed.)
- **Social Network Analysis**: Wasserman & Faust (1994)
- **Reddit API**: https://www.reddit.com/dev/api
- **Three.js**: https://threejs.org/docs/

---

## 📄 License

This metrics system is part of the Reddit Quantitative Signal Analysis Tool.
See LICENSE file for details.

---

**Last Updated**: 2025-11-16
**Version**: 2.0 (Enhanced Metrics Edition)
