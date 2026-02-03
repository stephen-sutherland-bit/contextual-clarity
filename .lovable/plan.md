

## Plan: Fix Markdown Formatting Output

### The Problem

Jim's feedback shows the AI is outputting raw markdown symbols that appear in the rendered content:
- `**Common Understanding**:` showing as literal asterisks instead of bold text
- `### Summary` and `## Heading` sometimes showing raw
- Bullet points with `*` markers appearing as text

The prompt already says "NO asterisks" but the AI is still using markdown syntax.

### Root Cause Analysis

**Prompt Issue**: The current instructions are scattered and inconsistent:
- Line 229-230: "Do NOT use markdown symbols"
- Line 272: "NO asterisks (*) in output"
- BUT: The REQUIRED END-MATTER section shows examples WITH markdown: `**The Question**:`, `**Common Understanding**:`

The AI sees markdown in the examples and mimics that format.

**Parser Issue**: The `InlineTeachingContent` parser handles standalone markdown headings but doesn't strip inline markdown from paragraphs.

### The Fix (Two Parts)

---

**Part 1: Update Prompt (process-transcript/index.ts)**

Replace the STRUCTURE & FORMATTING and FINAL FORMATTING sections with clearer, absolute instructions:

```text
## STRUCTURE & FORMATTING

**Bold Headings**
Use clear, bold headings to introduce major new topics. Output these as PLAIN TEXT on their own line—the rendering system will style them. Do NOT include any markdown symbols whatsoever.

WRONG: "## The Mosaic Covenant" or "**The Mosaic Covenant**"
RIGHT: "The Mosaic Covenant" (on its own line, the system recognises it as a heading)

**Relational Transitions**
Maintain full essay-style paragraphs with transitions: "Therefore...", "As we see...", "This leads us to consider..."

**Bullet Points**
ONLY permitted for:
- Diagnostic questions
- Summary lists  
- Step-by-step frameworks
NOT for regular teaching paragraphs.

Use plain hyphens (-) for bullets, never asterisks.

**Questions Handling**
Do NOT create a separate questions section at the end. The app has a dedicated "Have You Ever Pondered?" section managed separately.
```

Update the REQUIRED END-MATTER section to remove markdown from examples:

```text
## REQUIRED END-MATTER

Every rewritten teaching MUST conclude with these three sections:

Appendix
At the very end, include:
- Core Focus: A single sentence stating the central topic explored
- Purpose: A single sentence stating what the teaching aimed to help readers understand or experience

Reflective Questions
Provide 3–5 questions in this format:
- The Question: A sincere question a reader might ask
- Common Understanding: How mainstream Christianity typically answers
- Covenantal-Contextual Answer: How CCM invites us to reconsider

Summary
A bulleted list of the key questions the teaching addressed, each with a one-sentence answer.
```

Update FINAL FORMATTING NOTES to be more explicit:

```text
## FINAL FORMATTING NOTES

- All Bible references: ESV translation, quoted in full (not abbreviated)
- Use New Zealand English: fulfilment, baptise, judgement, honour, neighbour, realisation, organise, colour
- Occasionally integrate Māori words: whānau (covenant family), whakapapa (genealogy), aroha (compassion). Provide translation.
- ABSOLUTELY NO markdown symbols in output: no #, ##, ###, *, **, _
- Use plain text only. The rendering system handles all styling.
- For emphasis, use phrasing rather than formatting: "This is crucial:" not "**This is crucial:**"
- NO compressing arguments for brevity
- NO mentioning "redundancy," "repetition," or pedagogical justification to readers
```

---

**Part 2: Update Parser (InlineTeachingContent.tsx)**

Add a cleanup step to strip any remaining markdown from content before rendering:

```typescript
// Add helper function to strip inline markdown
const stripInlineMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // **bold** → bold
    .replace(/\*(.+?)\*/g, '$1')       // *italic* → italic
    .replace(/__(.+?)__/g, '$1')       // __bold__ → bold
    .replace(/_(.+?)_/g, '$1');        // _italic_ → italic
};

// Apply to heading content and paragraph content
```

Update the `parseContentWithHeadings` function to strip markdown from all content, and apply cleanup when rendering paragraphs.

---

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/process-transcript/index.ts` | Rewrite STRUCTURE & FORMATTING, REQUIRED END-MATTER, and FINAL FORMATTING sections with zero-markdown examples |
| `src/components/InlineTeachingContent.tsx` | Add `stripInlineMarkdown` helper and apply to all rendered content |

### Risk Assessment

**Low Risk**:
- Prompt changes only affect new transcripts (existing content unchanged)
- Parser changes add cleanup without breaking existing functionality
- Both changes work together as belt-and-suspenders solution

### Expected Outcome

After these changes:
- New AI outputs will have no markdown symbols
- Any residual markdown that slips through will be cleaned by the parser
- Headings appear as styled text, not raw `##` symbols
- Bold labels like "Common Understanding:" appear as bold text, not `**Common Understanding**:`

