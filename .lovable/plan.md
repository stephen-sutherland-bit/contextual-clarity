

## Slight Prompt Adjustment: Scholarly Tone Guardrail

### The Problem

Jim loved the output format and structure, but the AI is producing overly devotional opening paragraphs that sound like "the beginning of a super religious church service." 

**What the AI wrote:**
> "Let us begin our journey together by seeking clarity and understanding as we delve into the profound treasures of Scripture. Our shared prayer is that by allowing the original context to illuminate God's enduring message, we can perceive His word with fresh eyes and renewed hearts. We gather as a whānau, a covenant family..."

**What Jim prefers:**
> "Let's continue our journey together by seeking clarity and understanding as we delve into the ancient biblical writings, allowing the original context to illuminate God's enduring message. Our purpose is to honour the text by seeking to understand it as it was first given through its inspired authors."

### The Fix

A **minimal addition** to the existing TONE & VOICE section (lines 185-192) adding one new bullet point with specific guardrails.

### Change Location

`supabase/functions/process-transcript/index.ts` - Lines 185-192

### Current TONE & VOICE Section

```text
## TONE & VOICE

- Unfailingly collaborative: "we," "us," "our exploration"
- Humble and inviting, like a knowledgeable guide walking beside the reader
- Avoid definitive, debate-ending declarations ("This proves...", "This clearly shows...")
- Use tentative phrasing: "This suggests...", "The text invites us to see...", "We might understand this as..."
- Warmth and mercy for those who hold different views: "It's understandable why many read it this way..."
```

### Updated TONE & VOICE Section (One Addition)

```text
## TONE & VOICE

- Unfailingly collaborative: "we," "us," "our exploration"
- Humble and inviting, like a knowledgeable guide walking beside the reader
- Avoid definitive, debate-ending declarations ("This proves...", "This clearly shows...")
- Use tentative phrasing: "This suggests...", "The text invites us to see...", "We might understand this as..."
- Warmth and mercy for those who hold different views: "It's understandable why many read it this way..."
- **Scholarly, not devotional**: Write as a biblical scholar, NOT a pastor leading a prayer service. Avoid liturgical/devotional phrases like "our shared prayer", "fresh eyes and renewed hearts", "treasures of Scripture", or "by the Holy Spirit". Prefer grounded, academic language: "the ancient biblical writings", "the original authors", "the text invites us to consider". The tone should feel like an Oxford lecture, not a Sunday sermon.
```

### Why This Works

1. **Minimal change** - Only adds one bullet point to an existing section
2. **Explicit examples** - Shows the AI exactly what to avoid and what to use instead
3. **Clear mental model** - "Oxford lecture, not Sunday sermon" gives the AI a concrete reference
4. **Preserves everything else** - The 4-Step Framework, analogies, terminology, and structure remain unchanged

### Risk Assessment

**Very Low Risk** - This change:
- Does not alter the document structure
- Does not change the 4-Step Framework
- Does not modify terminology mandates
- Does not affect the required end-matter (Appendix, Questions, Summary)
- Only adjusts the stylistic register of the prose

