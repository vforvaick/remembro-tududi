# Article Parser & Knowledge Management Feature Design

**Status**: Design Complete (Ready for Implementation)
**Version**: 1.0
**Date**: 2025-11-24

---

## Overview

Intelligent article parser that extracts content from URLs (articles, threads, social media posts) and creates structured knowledge notes in Obsidian. Includes multi-source support (Medium, Twitter/X, Threads, blogs) with special handling for thread-based content.

---

## Supported Sources

### Fully Supported (Content Extraction)

1. **Blog Articles** (Medium, Substack, dev.to, etc.)
   - Extracts full article text
   - Preserves formatting (headings, lists, emphasis)
   - Captures author, publish date, categories

2. **Twitter/X Threads**
   - Thread starter post
   - Relevant replies (filtered for quality)
   - Conversation flow maintained

3. **Threads.com Threads**
   - Original thread creator's posts
   - Useful replies (user judgment or bot filtering)
   - Full thread context

4. **Long-form articles**
   - Blog posts, news articles, whitepapers
   - Extracts main content (removes ads, sidebars, comments)

### Partial Support (User Assist)

5. **Instagram Reels**
   - Can't extract video content
   - User must describe why interesting
   - Bot stores: URL + user's explanation

6. **TikTok videos**
   - Can't extract video content
   - User must describe why interesting
   - Bot stores: URL + user's explanation

7. **YouTube videos**
   - Can't extract video content
   - Future: transcript extraction if available
   - For now: URL + user's explanation

---

## Article Capture Flow

### Step 1: User Sends Link

```
User sends: "https://medium.com/article-about-bitcoin-timing"
Or: "https://twitter.com/user/status/123456789"
Or: "https://threads.com/@user/post/123456"
```

### Step 2: Bot Fetches Content

Bot attempts to parse content based on domain:

**Success case:**
- Article fetched and parsed
- Content extracted
- Bot understands the content

**Failure case:**
- Bot can't fetch (paywall, blocked, error)
- Bot tells user: "❌ Tidak bisa buka artikel ini. Coba:..."
- Offer: User can describe it manually or paste content

### Step 3: Bot Explains Understanding

Bot summarizes what it understood about the article:

```
Bot response:

📄 Bitcoin Market Timing (Medium article by @trader-xyz)

📌 Summary:
Bitcoin tends to dip before US market open.
Best entry point is ~30 minutes after opening bell.
Strategy tested over 6 months with 78% success rate.
Works best with technical analysis confirmation (RSI, support levels).

👤 Penulisnya: Trader XYZ (author bio)
📅 Dipublikasikan: Nov 20, 2025

Apakah ini yang kamu maksud? Kenapa artikel ini menarik buat kamu?
```

**Components:**
- Article title and author
- Key points/summary (2-4 bullet points)
- Publication date (if available)
- Source information
- Confirmation question

### Step 4: Ask Why Interesting

Bot prompts user to explain why they find this interesting:

```
Kenapa menurut kamu artikel ini menarik?

Bisa:
→ Text: "Karena strategy-nya cocok untuk pattern yang aku lihat"
→ Voice: [send voice message dengan penjelasannya]
→ Skip: "skip" untuk langsung simpan tanpa penjelasan
```

**User options:**
- Write text explanation
- Send voice message (will transcribe)
- Skip and just save article

### Step 5: Determine Topic/Folder

Bot determines which folder to save in based on:
1. Article content (keywords, categories)
2. User's explanation (what they said is interesting)
3. Tags detected (if article has tags)

```
Bot: "Mau aku simpan di Knowledge/Trading atau Knowledge/Crypto?"
User picks or bot decides automatically
```

### Step 6: Create Note with Metadata

Bot creates Obsidian note with:
- Original article content or link
- User's reason for finding it interesting (introduction)
- Original author attribution
- Publication date
- Topic tags
- Links to related notes (wikilinks)

---

## Content Handling Strategies

### For Articles (Medium, blogs, etc.)

**Method: Full Content + Attribution**

```markdown
# Bitcoin Market Timing

> Original article by: Trader XYZ
> Source: https://medium.com/article-about-bitcoin-timing
> Published: Nov 20, 2025

---

## Why I Found This Interesting

Bitcoin dips before US open is a pattern I've noticed too.
This article provides data + strategy testing, which validates my observation.
Plan: Test the 30-min after opening strategy with real capital next week.

---

## Article Content

Bitcoin tends to dip before US market open...

[Full article text preserved]
```

**Components:**
- Original author attribution
- Source URL
- Publication date
- User's reason (why interesting)
- Full article content

### For Threads (Twitter/X, Threads.com)

**Method: Thread Reconstruction**

```markdown
# Bitcoin Market Timing Strategy Discussion

> Original thread by: @trader-xyz
> Source: https://twitter.com/trader-xyz/status/123456789
> Published: Nov 20, 2025

---

## Why I Found This Interesting

Thread discusses Bitcoin entry points with real-time market examples.
Replies add practical perspective from other traders.
Useful for refining my own timing strategy.

---

## Original Thread

**Post 1:**
Bitcoin dips before US open. I've backtested this...

**Post 2:**
Looking at 6 months of data, success rate is about 78%...

**Post 3:**
Best confirmation: combine with RSI and support levels...

---

## Useful Replies

**@analyst-friend:**
I've noticed this pattern in crypto pairs too, not just Bitcoin...

**@trader-veteran:**
Don't forget about Fed announcements which can disrupt pattern...
```

**Components:**
- Original thread starter's posts (in order)
- Selected replies (quality filtered)
- User's reason for finding it valuable
- Attribution to authors
- Source link

### For Video Content (Instagram, TikTok, YouTube)

**Method: Link + User's Explanation**

```markdown
# [User's Title for Video]

> Video: [platform name]
> Posted by: @username
> URL: https://[full video URL]

---

## Why I Found This Interesting

[User's text explanation or voice transcription]

[If voice message: transcribed + timestamped]

---

## Additional Notes

[User can add more context or key takeaways]
```

**Components:**
- Video link (preserved for watching)
- User's explanation (text or voice)
- Platform/creator attribution
- User's notes

---

## Thread Detection & Extraction

### Twitter/X Threads

**Detection:**
- URL format: `twitter.com/username/status/[id]`
- Bot fetches initial post + replies

**Extraction:**
1. Get original tweet
2. Find threaded replies from same author
3. Get quoted tweets/relevant discussion
4. Filter low-quality replies (spam, off-topic)
5. Combine in reading order

**Quality filtering:**
- At least 1 like/retweet (not spam)
- Contains substantive content (not just emoji)
- Related to original thread topic

### Threads.com Threads

**Detection:**
- URL format: `threads.com/@username/post/[id]`

**Extraction:**
1. Get original post from thread creator
2. Find direct replies to that post
3. Filter by relevance (user can help here)
4. Preserve conversation structure

**User control:**
- Bot shows initial thread
- Asks: "Should I include the 5 replies I found?"
- User can approve/reject replies one by one

---

## Error Handling

### Content Extraction Failed

```
❌ Tidak bisa parse artikel ini

Reason: Paywall/blocked access

Gimana:
→ Copy-paste content ke sini
→ Atau kirim screenshot
→ Atau jelasin sendiri apa isinya
```

### Unsupported Domain

```
⚠️ Domain ini belum di-support: [domain]

Bisa coba:
→ Copy-paste konten artikel
→ Atau jelasin singkat apa isinya
→ Atau share screenshot
```

### Transcription Failed (for voice)

```
❌ Tidak bisa transcribe voice message

Gimana:
→ Coba kirim lagi voice message
→ Atau ketik penjelasannya
```

---

## Data Model

### Article Knowledge Note

```javascript
{
  id: "article-bitcoin-timing-20251126",
  type: "article",
  title: "Bitcoin Market Timing",
  topic: "Trading",
  subtopic: "Crypto",

  // Source information
  sourceUrl: "https://medium.com/article-bitcoin-timing",
  sourcePlatform: "medium",
  author: "Trader XYZ",
  publishedDate: "2025-11-20",

  // Content
  originalContent: "[Full article text]",

  // User's input
  userReason: "Pattern matches my observations, has data validation",
  userAddedAt: "2025-11-26T10:30:00Z",
  userNotes: "Test with 14:00-23:00 shift schedule",

  // Metadata
  tags: ["bitcoin", "trading", "timing", "cryptocurrency"],
  relatedNotes: ["trading-strategy", "technical-analysis"],
  obsidianPath: "Knowledge/Trading/Bitcoin-Market-Timing.md",

  // Timestamps
  createdAt: "2025-11-26T10:35:00Z",
  updatedAt: "2025-11-26T10:35:00Z"
}
```

### Thread Knowledge Note

```javascript
{
  id: "thread-bitcoin-discussion-20251120",
  type: "thread",
  title: "Bitcoin Market Timing Strategy Discussion",
  topic: "Trading",

  // Thread source
  sourceUrl: "https://twitter.com/@trader-xyz/status/123456789",
  sourcePlatform: "twitter",
  threadAuthor: "@trader-xyz",
  publishedDate: "2025-11-20",

  // Content
  threadStarter: {
    author: "@trader-xyz",
    content: "[Original tweet text]",
    timestamp: "2025-11-20T10:00:00Z"
  },
  includedReplies: [
    {
      author: "@analyst-friend",
      content: "[Reply text]",
      timestamp: "2025-11-20T10:05:00Z"
    }
  ],

  // User's input
  userReason: "Practical insights from experienced traders",
  userAddedAt: "2025-11-26T10:30:00Z",

  // Metadata
  tags: ["bitcoin", "trading", "discussion"],
  obsidianPath: "Knowledge/Trading/Bitcoin-Timing-Discussion.md"
}
```

---

## Organization Structure

Articles stored in **topic-based folders** (not source-based):

```
Knowledge/
├── Trading/
│   ├── bitcoin-market-timing.md (from Medium article)
│   ├── trading-strategy-discussion.md (from Twitter thread)
│   └── rsi-technical-analysis.md (from blog)
│
├── Crypto/
│   ├── ethereum-2024-update.md (from article)
│   └── defi-risks-analysis.md (from tweet thread)
│
├── ProductDev/
│   ├── startup-growth-strategies.md
│   └── product-market-fit-lessons.md
```

**Why topic-based, not source-based:**
- User can tag articles with multiple topics (e.g., article about trading + AI → both Knowledge/Trading + Knowledge/AI)
- Easier to find all knowledge about a topic regardless of source
- Wikilinks connect articles by concept, not platform

---

## Wikilink Strategy

**Related notes connected via wikilinks:**

```markdown
# Bitcoin Market Timing

...content...

## Related Concepts
- [[Technical-Analysis]] - Support/resistance levels
- [[Trading-Strategy]] - Entry/exit rules
- [[Crypto-Volatility]] - Patterns specific to crypto

## Related Articles
- [[RSI-Indicators]] - Another article on timing
- [[Federal-Reserve-Impact]] - Macro factors affecting price
```

**Wikilinks created by:**
1. Keyword matching (article mentions concepts in existing notes)
2. User's explanation (links they mention)
3. Tag matching (same tags → probably related)

---

## Success Criteria

- [ ] Extracts article content from Medium, blogs, news sites
- [ ] Extracts Twitter/X thread with relevant replies
- [ ] Extracts Threads.com threads with relevant replies
- [ ] Summarizes article for user confirmation
- [ ] Asks why user finds it interesting
- [ ] Captures video URLs for manual explanation
- [ ] Handles paywall/blocked articles gracefully
- [ ] Creates Obsidian notes in correct topic folder
- [ ] Adds proper attribution to original authors
- [ ] Creates relevant wikilinks to related notes
- [ ] Stores source URLs for easy reference
- [ ] Supports text + voice explanations from user

---

## Future Enhancements

1. **YouTube transcript extraction** - Auto-extract transcript from videos
2. **Automatic topic detection** - ML-based topic classification
3. **Article summarization** - Bot generates summary if user doesn't
4. **Citation tracking** - Know which articles cite each other
5. **PDF support** - Upload PDF files directly
6. **Highlight extraction** - If user highlights text on page, capture that
7. **Newsletter support** - Parse email newsletters
8. **Compare versions** - Track if article was updated
