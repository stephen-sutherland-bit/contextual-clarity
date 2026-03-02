

# Add Inline Bold and Italic Support to Teaching Reader

## Problem
Currently, the legacy parser strips ALL markdown bold (`**text**`) and italic (`*text*`) markers from paragraph content via `stripInlineMarkdown()`. This means even if the AI produces nicely formatted text with emphasis, the reader throws it all away. The AI prompt also only instructs bold for headings, not for emphasis within body paragraphs.

## Solution — Two Changes

### 1. Update the AI Rewriting Prompt (`process-transcript`)

Add formatting instructions telling the AI to use bold and italic meaningfully within body text:

- **Bold** for key theological terms on first use, scripture book names, and important concepts (e.g., `**Mosaic Covenant**`, `**chesed**`)
- **Italic** for foreign/transliterated words, book titles, gentle emphasis, and the credit line (e.g., `*mathetes*`, `*ekklesia*`, `*This suggests...*)

Update the FORMATTING section (around line 162) to add these rules alongside the existing heading-bold rule.

### 2. Render Inline Bold/Italic in the Legacy Parser

Instead of stripping markdown with `stripInlineMarkdown()`, convert it to React elements:

- Replace `stripInlineMarkdown(text)` calls on **paragraph**, **bullet**, and **italic-paragraph** content with a new `renderInlineMarkdown(text)` function
- This function splits the text on `**bold**` and `*italic*` patterns and returns an array of React elements (`<strong>`, `<em>`, and plain text spans)
- Headings will continue to use `stripInlineMarkdown` since their formatting comes from CSS

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/process-transcript/index.ts` | Add bold/italic usage rules to the FORMATTING section of the system prompt (~lines 162-168) |
| `src/components/InlineTeachingContent.tsx` | Add `renderInlineMarkdown()` helper that converts `**bold**` to `<strong>` and `*italic*` to `<em>`. Use it for paragraph, bullet, and italic-paragraph content instead of `stripInlineMarkdown`. |

### What This Means

- Existing teachings that already have `**bold**` and `*italic*` in their content will immediately render with proper formatting
- Newly rewritten teachings will have richer formatting from the updated prompt
- Previously rewritten teachings can be re-run through "Rewrite" to pick up the new formatting
- TipTap HTML teachings are unaffected (they use the HTML rendering path)
