# Knowledge Search Feature Design

**Status**: Design Complete (Ready for Implementation)
**Version**: 1.0
**Date**: 2025-11-24

---

## Overview

Natural language search across Obsidian vault with AI-powered answer synthesis. Allows users to query their own knowledge base and get relevant notes with semantic understanding, not just keyword matching.

---

## Search Intent Detection

Bot recognizes **search intent** from phrases and distinguishes it from **knowledge capture**.

### Search Intent Keywords

Phrases that trigger knowledge search:
- "dulu aku pernah baca tentang..."
- "apa aja yang aku tulis tentang..."
- "ada note tentang..."
- "summarize semua [topic]"
- "remind me about..."
- "cari [keyword]"
- "gimana cara..."
- "apa bedanya..."

### Capture Intent (vs Search)

Messages that trigger knowledge CAPTURE (not search):
- User stating facts/insights: "Bitcoin dips before US open..."
- User reporting learnings: "Beli saham preferable sebelum earnings announcement..."
- Unstructured information sharing

---

## Search Flow

### Step 1: Parse Query

Extract search intent and topic from user message:
```
Input: "dulu aku pernah baca tentang bitcoin timing, apa aja?"
Parsed:
  - intent: search
  - topic: "bitcoin timing"
  - type: retrieve_all
```

### Step 2: Search Knowledge Base

Search Obsidian vault for matching notes:
- Full-text search (keyword matching)
- Tag-based search (#bitcoin, #timing, #trading)
- Semantic similarity (if embeddings available, Phase 2)

Return top 3-5 most relevant notes with relevance scores.

### Step 3: Display Results

Show ranked results with snippets and metadata.

### Step 4: User Selection

User picks which note to view, or asks for summary of all.

---

## Search Output Format

### Results List (after searching)

```
🔍 Mencari: bitcoin timing

Hasil (3 catatan ditemukan):

1️⃣ Bitcoin Market Timing (Nov 26)
   📌 dip sebelum US open, best entry 30min
   🏷️ #bitcoin #trading #timing
   ⭐ Relevance: 0.95

2️⃣ Trading Strategy Notes (Nov 20)
   📌 Technical analysis for crypto entries...
   🏷️ #trading #strategy
   ⭐ Relevance: 0.78

3️⃣ Crypto Entry Points (Nov 15)
   📌 Market patterns and optimal entry times...
   🏷️ #crypto #analysis
   ⭐ Relevance: 0.72

💡 Options:
→ Reply with number (1/2/3) untuk lihat full note
→ "summarize all" untuk synthesis
→ "more results" untuk lanjut cari
```

**Components:**
- Rank number
- Note title + creation date
- Snippet (first 50-100 chars of content)
- Tags (shows topic classification)
- Relevance score (0.0-1.0)
- Action buttons/options

### Full Note Display

When user selects a specific note:

```
📖 Bitcoin Market Timing (Nov 26)

Bitcoin biasanya dip sebelum US open,
best entry 30 min setelah opening.
Tested dengan data 6 bulan terakhir,
accuracy 78% untuk entry point prediction.

[Full note content...]

🔗 Related notes: [[Trading-Strategy]], [[Crypto-Analysis]]
📎 Article source: https://medium.com/...
🏷️ Tags: #bitcoin #trading #timing #technical-analysis

💡 Next steps:
→ "summarize all bitcoin notes"
→ "show related concepts"
→ "save this for later"
```

**Components:**
- Full note content (original markdown)
- Related note links (wikilinks)
- Source/article links (if captured from article)
- Tags for topic classification
- Context options for deeper exploration

### Summarize All Option

When user asks for summary across multiple notes:

```
📚 Summary: Bitcoin Timing (3 notes combined)

KEY FINDINGS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• US open timing creates predictable dips
  (Found in: Bitcoin-Market-Timing, Crypto-Entry-Points)

• Best entry: 30min after open
  (Accuracy: 78%, tested 6 months)

• Works with technical analysis confirmation
  (From: Trading-Strategy)

• Low win rate before earnings announcements
  (From: Crypto-Entry-Points)

ACTIONABLE:
→ Test Bitcoin 30-min strategy (task created)
→ Combine with RSI confirmation

SOURCES:
📄 Bitcoin-Market-Timing (Nov 26)
📄 Trading-Strategy (Nov 20)
📄 Crypto-Entry-Points (Nov 15)

💡 Options:
→ "test bitcoin strategy" (create task)
→ "show all trading notes" (broader search)
→ "compare with gold timing" (cross-topic)
```

**Components:**
- Synthesized key findings
- Source attribution for each finding
- Cross-references showing where info came from
- Actionable recommendations
- Links to source notes
- Related search suggestions

---

## Search Algorithm

### Full-Text Search (Phase 1)

1. **Tokenize query** - "bitcoin timing" → ["bitcoin", "timing"]
2. **Search all notes** - Find notes containing any token
3. **Score by:**
   - Exact phrase match (highest score)
   - All tokens present (high score)
   - Some tokens present (medium score)
   - Tag matches (medium-high score)
4. **Rank by score** - Return top 5

### Semantic Search (Phase 2 - Future)

1. **Generate embedding** for user query
2. **Compare with note embeddings** using vector similarity
3. **Rank by semantic relevance** (not just keywords)
4. **Combine with full-text** results for best of both

---

## No Results Handling

**If no notes found:**

```
🔍 Mencari: "quantum computing applications"

❌ Tidak ada catatan ditemukan

💡 Suggestions:
→ Coba cari dengan keyword lain
→ Check tags: #quantum, #computing, #technology
→ "show all notes" untuk browse manual
→ Mau capture artikel tentang ini?
```

---

## Related Notes Detection

When displaying a note, bot suggests related notes:

**Method:**
- Same tags
- Same topic folder
- Wikilinks in note content
- Similar keywords

```
🔗 Related notes:
   • [[Trading-Strategy]]
   • [[Technical-Analysis]]
   • [[Crypto-Markets]]

(User dapat klik untuk explore related content)
```

---

## Data Model

**Search Request:**
```javascript
{
  userId: "telegram-id",
  query: "bitcoin timing",
  timestamp: "2025-11-24T10:30:00Z",
  intent: "retrieve_all",
  searchType: "semantic" // or "keyword"
}
```

**Search Result:**
```javascript
{
  noteId: "bitcoin-market-timing-20251126",
  title: "Bitcoin Market Timing",
  filePath: "Knowledge/Trading/Bitcoin-Market-Timing.md",
  createdDate: "2025-11-26",
  tags: ["bitcoin", "trading", "timing"],
  snippet: "Bitcoin biasanya dip sebelum US open...",
  relevanceScore: 0.95,
  relatedNotes: ["trading-strategy", "crypto-entry-points"]
}
```

---

## Success Criteria

- [ ] Search intent recognized 90%+ accuracy
- [ ] Capture vs Search distinction correct 95%+
- [ ] Search returns relevant results (top 1 is correct 80%+)
- [ ] Full-text search works within 3 seconds
- [ ] Related notes suggested correctly
- [ ] Summarize all synthesizes information coherently
- [ ] No false positives (doesn't search when capturing)
- [ ] Handles 1000+ notes without slowdown

---

## Future Enhancements

1. **Semantic search** - Embedding-based similarity (Phase 2)
2. **Cross-topic synthesis** - Connect concepts across folders
3. **Temporal search** - "What did I learn last month about trading?"
4. **Source tracking** - "Which articles mention this concept?"
5. **Search history** - "Show me previous searches about X"
6. **Saved searches** - User can save frequent queries
