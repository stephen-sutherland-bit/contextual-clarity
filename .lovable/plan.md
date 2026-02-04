

## Plan: Fix Bold Heading Detection (Restore Reliable Markers)

### The Core Problem

You're absolutely right - this iteration broke heading detection. Here's what happened:

1. **Previously**: The AI output headings with markdown markers (`**Heading**` or `## Heading`)
2. **Parser detected these markers** and rendered them as bold headings
3. **We changed the prompt** to say "NO markdown symbols, output plain text headings"
4. **The parser's fallback heuristics** now have to GUESS which lines are headings
5. **The `isTrueHeading` function excludes lines starting with "The", "A", "In"** - but real headings often start with these words!

For example, "The Binding of the Adversary: A Legal Victory" gets excluded because it starts with "The".

### The Solution: Restore Markers (But Clean Them Up)

The most reliable fix is to **tell the AI to use markdown markers for headings, and have the parser detect AND strip them**. This gives explicit control over what becomes bold.

---

### Changes to Make

**File 1: `supabase/functions/process-transcript/index.ts`**

Change the STRUCTURE & FORMATTING section to tell the AI to use bold markers for headings:

```text
## STRUCTURE & FORMATTING

Bold Headings
Use **bold markers** around section headings so the rendering system can identify them.

FORMAT: **Heading Title Here**

Example:
**The Mosaic Covenant**
**Divine Initiative in Salvation**
**The Binding of the Adversary: A Legal Victory**

The bold markers will be stripped during rendering - they are only used for detection.

Do NOT use ## or ### markdown heading syntax.
Do NOT make regular sentences bold - only true section titles that introduce new topics.

Relational Transitions
Maintain full essay-style paragraphs with transitions...
```

Update FINAL FORMATTING NOTES:

```text
- Use **bold markers** ONLY for section headings (the parser will strip them)
- Do NOT use ## or ### for headings
- Do NOT use * for bullet points - use plain hyphens (-)
- Do NOT use > for blockquotes
```

---

**File 2: `src/components/InlineTeachingContent.tsx`**

The parser already handles `**Heading**` detection at lines 153-162:

```typescript
// Check for markdown bold headings (**Heading**)
const boldMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
if (boldMatch && boldMatch[1].length < 80) {
  results.push({
    type: "heading",
    content: stripInlineMarkdown(boldMatch[1]),
    key: index * 100,
  });
  return;
}
```

This is already there! The issue is the AI stopped outputting `**Heading**` format because we told it not to use asterisks.

We should also **remove or relax** the `isTrueHeading` function since it's causing false negatives. With explicit `**markers**`, we don't need to guess.

---

### Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/process-transcript/index.ts` | Restore `**Heading**` format instruction; remove "no asterisks" blanket rule; keep "no ## or > symbols" |
| `src/components/InlineTeachingContent.tsx` | Keep existing `**Heading**` detection (it works); optionally simplify/remove the unreliable `isTrueHeading` heuristics |

---

### Why This Works

1. **Explicit control**: The AI knows EXACTLY which lines should be headings
2. **Reliable detection**: The parser can reliably detect `**...**` pattern
3. **Clean output**: The markers get stripped, so readers see bold text without asterisks
4. **No guessing**: We don't need heuristics that might miss "The Mosaic Covenant"

---

### Technical Details

The key regex that already exists in the parser:

```typescript
const boldMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
```

This matches lines that are ONLY a bold marker, like `**The Mosaic Covenant**`, and extracts the text inside. The `stripInlineMarkdown` function then removes any remaining markers.

### Risk Assessment

**Low Risk** - This restores previous working behaviour while keeping the other cleanup improvements (no `>` blockquotes, no `##` headers, paragraph joining, horizontal rule filtering).

