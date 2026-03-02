

# Fix Teaching Reader Content Formatting

## Problem
The teaching content is rendering as one continuous block of text with raw `**bold**` markdown markers visible. This happens because:

1. The `isHtmlContent()` detector finds a stray HTML-like tag in the content (e.g., `<em>`, `<strong>`, or even something like `<aion>` in theological text)
2. This triggers the HTML rendering path (`dangerouslySetInnerHTML`), which treats the content as raw HTML
3. In HTML, newline characters are collapsed to spaces — so all paragraphs merge into one block
4. Markdown `**bold**` markers are not processed — they display as literal asterisks

## Solution

Two changes to `src/components/InlineTeachingContent.tsx`:

### 1. Improve `isHtmlContent()` detection (line 26-28)
Make the check stricter — require actual block-level HTML structure (like `<p>` tags wrapping content), not just the presence of any inline tag. A content string with a few stray `<em>` or `<strong>` tags but no `<p>` paragraph structure is still legacy/markdown content and should use the parser.

Change the regex to require block-level tags like `<p>`, `<h2>`, `<h3>`, `<div>`, `<ul>`, `<ol>`, or `<blockquote>` — these indicate TipTap-generated HTML. Skip `<strong>` and `<em>` from the detection since those can appear in otherwise plain-text content.

### 2. Add fallback: if HTML path produces no visible paragraphs, use legacy parser
As a safety net, if content is detected as HTML but doesn't contain `<p>` tags, pre-process it by converting newlines to `<p>` tags and `**bold**` markers to `<strong>` tags before rendering with `dangerouslySetInnerHTML`.

## Files Modified

| File | Change |
|------|--------|
| `src/components/InlineTeachingContent.tsx` | Fix `isHtmlContent()` to only match true TipTap HTML (block-level tags), not stray inline tags. Add markdown-to-HTML preprocessor as fallback. |

## What This Preserves
- All existing texture/colour styling (leather, parchment, burnt edges)
- The legacy parser path for plain-text content (headings, bullets, drop caps, flourish dividers)
- The HTML path for properly structured TipTap content
- All other reader layout (summary box, scripture references, pondered questions)
