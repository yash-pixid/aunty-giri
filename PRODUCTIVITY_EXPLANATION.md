# Productivity Score Calculation - Explanation

## 📊 How Productivity is Calculated

The productivity score is calculated based on **time spent in different categories of applications/websites**.

### **Step 1: Activity Categorization**

Activities are categorized into three groups:

#### **1. Productive Apps** (Positive Impact)
- Development tools: `vscode`, `terminal`
- Communication: `slack`
- Browsers: `chrome`, `firefox`, `safari`, `edge`

#### **2. Neutral Apps** (No Impact)
- System tools: `finder`, `explorer`, `settings`, `system preferences`

#### **3. Distracting Apps** (Negative Impact)
- Social media: `youtube`, `facebook`, `twitter`, `instagram`
- Entertainment: `netflix`, `spotify`, `games`

### **Step 2: Time Calculation**

For each activity log:
1. Extract `app_name` and convert to lowercase
2. Check which category it belongs to
3. Add `duration` (in seconds) to the corresponding category:
   - `productiveTime` += duration (if productive)
   - `distractingTime` += duration (if distracting)
   - `neutralTime` += duration (if neutral)

### **Step 3: Score Calculation**

```javascript
totalTime = productiveTime + neutralTime + distractingTime

productivityScore = (productiveTime / totalTime) * 100
```

**Formula:**
- Score ranges from **0 to 100**
- **100** = All time spent on productive apps
- **0** = All time spent on distracting apps
- Neutral time doesn't affect the score (neither positive nor negative)

### **Example:**

If a user has:
- **Productive time**: 2 hours (7200 seconds)
- **Neutral time**: 30 minutes (1800 seconds)
- **Distracting time**: 30 minutes (1800 seconds)
- **Total time**: 3 hours (10800 seconds)

**Productivity Score** = (7200 / 10800) × 100 = **66.67**

### **API Endpoint:**

```
GET /api/v1/dashboard/productivity-score?startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "score": 66,
    "breakdown": {
      "productive": 7200,
      "neutral": 1800,
      "distracting": 1800
    },
    "totalTime": 10800
  }
}
```

### **Limitations:**

1. **Simple categorization** - Apps are hardcoded into categories
2. **No context awareness** - Doesn't consider what user is doing in the app
3. **Time-based only** - Doesn't consider quality of work or outcomes
4. **Browser ambiguity** - Chrome could be used for work or entertainment

### **Future Improvements:**

- Machine learning-based categorization
- Context-aware analysis (what tabs/sites in browser)
- Quality metrics (keystrokes, code commits, etc.)
- Time-of-day patterns
- Goal-based productivity tracking
