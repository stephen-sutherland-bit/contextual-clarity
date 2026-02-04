

## Jim's Feedback: Comprehensive Issue List and Fixes

After reviewing all of Jim's messages, screenshots, and the sample document, I've identified the following issues that need addressing. I'll present them in order of importance as Jim would likely prioritise them.

---

### Issue 1: Inconsistent Bold Headings

**Jim's Observation:**
- "Some of the headings are not bold type but others are"
- "also put a random sentence in bold, making it look like a heading"
- "It has put as a heading (in bold) 'Let's read the verse in its immediate context:'... Well, that isn't a heading"

**Root Cause:**
The parser's heading detection logic in `InlineTeachingContent.tsx` uses heuristics that are too permissive:
- Lines with colons (`:`) get treated as headings regardless of content
- Short sentences that happen to be capitalised and lack periods get detected as subheadings
- "Let's read the verse in its immediate context:" matches because it has a colon and is under 100 characters

**Proposed Fix:**
Refine the heading detection heuristics:
1. Remove the colon-based heading detection (too many false positives)
2. Add a stricter pattern: headings should be short (under 60 chars), not start with common sentence starters, and NOT contain phrases like "Let's", "We", "This", "Here"
3. Only treat lines as headings if they appear to be deliberate section titles (e.g., "The Mosaic Covenant", "Divine Initiative in Salvation")

---

### Issue 2: Broken Paragraph Flow (Weird Line Breaks)

**Jim's Observation:**
Screenshot shows text breaking mid-sentence:
> "actions and into the depths of our hearts,"
> 
> "always knows the true state of a person's belief."

These should be one continuous paragraph but are being split.

**Root Cause:**
The AI is producing output with hard line breaks within paragraphs (likely from PDF processing artifacts or the AI itself), and the parser is treating each line as a separate paragraph.

**Proposed Fix:**
1. Add paragraph joining logic: if a "paragraph" ends with a comma or doesn't end with proper sentence punctuation, join it with the next block
2. Pre-process content to collapse single line breaks within paragraphs before parsing

---

### Issue 3: Unwanted `>` Before Scripture Quotes

**Jim's Observation:**
- "It puts a > before some of the scripture quotes (unnecessary)"

**Root Cause:**
The AI is using markdown blockquote syntax (`>`) for scripture quotes, which the parser doesn't strip.

**Proposed Fix:**
1. Add to `stripInlineMarkdown` function: remove leading `>` characters from lines
2. Add prompt instruction: "Do NOT use > for blockquotes. Quotes should be in regular quotation marks within paragraphs."

---

### Issue 4: Scripture References Not Being Extracted Properly

**Jim's Observation:**
- "It's not picking up on the scripture references properly. I see that it only has 2 scripture references in that last teaching and yet there are several in that teaching"

**Root Cause:**
Scripture extraction happens in the `generate-index` edge function during initial import. The AI may not be comprehensively parsing all scripture references from the content.

**Proposed Fix:**
This is a metadata generation issue, not a display issue. The `generate-index` function needs to be reviewed to ensure it extracts ALL scripture references from the full content. However, since Jim said "I'm good with that" regarding reprocessing, this may be acceptable as-is if reprocessing captures them.

---

### Issue 5: Tone Regression (Lost Gentle Guiding Lead)

**Jim's Observation:**
- "In this reprocess it seems to have lost its gentle guiding lead and gone back to talking like Uncle Reg and I would talk to each other"

**Root Cause:**
Output quality varies between runs. The pedagogical scaffolding additions may need reinforcement, or there's randomness in the AI model's interpretation.

**Proposed Fix:**
This is an AI prompt consistency issue. The current prompt includes the scholarly tone guardrail but may need stronger emphasis on maintaining the "gentle guiding lead" throughout. Consider adding explicit examples of good vs. bad tone in the prompt.

---

### Issue 6: Questions Section Heading Regression

**Jim's Observation:**
- "It also went back to the old way of the questions. It says 'Have you pondered...' instead of 'Reflective Questions' and the same answer headings as old prompt"

**Root Cause:**
The AI prompt specifies "Reflective Questions" in the REQUIRED END-MATTER section, but the AI is ignoring this and using its own phrasing.

**Proposed Fix:**
Strengthen the prompt language:
- Change "Reflective Questions" section to be more explicit: "The section MUST be titled exactly: 'Reflective Questions' - no variations"
- Add: "Do NOT use phrases like 'Have you pondered' or 'Have you ever wondered' as section titles"

---

### Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/components/InlineTeachingContent.tsx` | 1. Fix heading detection heuristics (remove colon-based detection, add stricter rules) 2. Add paragraph joining for broken sentences 3. Strip blockquote markers (`>`) |
| `supabase/functions/process-transcript/index.ts` | 1. Add explicit instruction about no blockquote markers 2. Strengthen "Reflective Questions" title mandate |

---

### Technical Details: Parser Changes

**New `stripInlineMarkdown` function:**
```typescript
const stripInlineMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s*/gm, '');  // Remove blockquote markers
};
```

**New heading detection logic (stricter):**
```typescript
// Only detect as heading if:
// 1. Short (under 60 chars)
// 2. Doesn't end with . or ,
// 3. Starts with capital letter
// 4. Does NOT start with common sentence openers
// 5. Does NOT contain phrases like "Let's", "We will", "Here is"
const isTrueHeading = (text: string): boolean => {
  const trimmed = text.trim();
  if (trimmed.length > 60 || trimmed.length < 5) return false;
  if (trimmed.endsWith('.') || trimmed.endsWith(',')) return false;
  if (!/^[A-Z]/.test(trimmed)) return false;
  
  const sentenceOpeners = /^(The|A|An|This|That|In|On|At|For|To|And|But|Or|If|When|What|How|Why|Where|Let's|Let us|We|Here|It)\s/i;
  if (sentenceOpeners.test(trimmed)) return false;
  
  return true;
};
```

**Paragraph joining logic:**
```typescript
// Join paragraphs that end with comma or don't end with sentence punctuation
const joinBrokenParagraphs = (blocks: string[]): string[] => {
  const joined: string[] = [];
  let accumulator = '';
  
  for (const block of blocks) {
    const trimmed = block.trim();
    if (accumulator) {
      accumulator += ' ' + trimmed;
      if (/[.!?"]$/.test(trimmed)) {
        joined.push(accumulator);
        accumulator = '';
      }
    } else if (/[,]$/.test(trimmed) || !/[.!?"]$/.test(trimmed)) {
      accumulator = trimmed;
    } else {
      joined.push(trimmed);
    }
  }
  if (accumulator) joined.push(accumulator);
  return joined;
};
```

---

### Risk Assessment

**Medium Risk** - These changes affect:
1. How all existing and new teachings display (parser changes)
2. How new reprocessed content is generated (prompt changes)

Recommend testing with several existing teachings to ensure the stricter heading logic doesn't miss legitimate headings.

