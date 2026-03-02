

# Fix Teaching Content Formatting — Hybrid Content Detection

## Problem

The teaching "Bible Time Periods Explained" (and many others) has content that's wrapped in a single `<p>` tag but uses markdown-style formatting inside (`**Bold Headings**`, `*italics*`, plain newlines for paragraph breaks). The current `isHtmlContent()` function detects the `<p>` tag and routes it through the HTML rendering path, which:

1. Renders everything as one giant paragraph (no line breaks in HTML mode)
2. Shows raw `**asterisks**` instead of bold headings
3. Loses all the legacy parser benefits (drop caps, heading detection, flourish dividers, bullet formatting)

Out of ~30+ teachings checked, roughly half have proper TipTap HTML (multiple `<p>` tags + `<h4>` headings — like "Playing in the Garden"), and the other half are plain markdown wrapped in a single `<p>` tag or no HTML at all.

## Solution

Update the HTML detection in `InlineTeachingContent.tsx` to check for **properly structured** HTML — not just the presence of a `<p>` tag. Specifically, require **multiple** `<p>` or heading tags to qualify as real TipTap HTML. Content with a single `<p>` wrapper gets unwrapped and sent through the legacy parser.

### Changes to `src/components/InlineTeachingContent.tsx`

**1. Refine `isHtmlContent()` (lines 25-29)**

Instead of just checking for any block-level tag, check that the content has **at least 2 closing `</p>` tags** or contains heading tags like `<h2>`, `<h3>`, `<h4>`. A single `<p>` wrapping the entire content is not "real" HTML structure.

```text
Before: /<(p|h[1-6]|ul|ol|blockquote|div|section|article)\b/i.test(content)
After:  Check for multiple </p> closings OR any <h2>-<h6> tag
```

**2. Add content unwrapper**

Add a small helper that strips a single outer `<p>...</p>` wrapper so the legacy parser receives clean plain text. This handles the case where the AI processing wrapped the whole teaching in one `<p>` tag.

**3. Remove the Summary and Questions sections from the reader**

Per the user's request, the Summary box (lines 589-603), the flourish divider after it (lines 605-608), and any "Questions This Teaching Answers" section inside the reader should be removed, since these are already shown on the teaching detail page before clicking "Read Full Teaching". The drop cap on the first paragraph is kept.

## What This Preserves

- Properly formatted TipTap teachings (like "Playing in the Garden") continue to render perfectly via the HTML path
- Legacy/markdown teachings get full parsing: bold headings in dark brown, paragraph breaks, drop caps, flourish dividers, bullet points
- All existing textures, colours, and ancient book aesthetic remain untouched
- The drop cap on the first letter stays

## Files Modified

| File | Change |
|------|--------|
| `src/components/InlineTeachingContent.tsx` | (1) Stricter `isHtmlContent` requiring multiple `</p>` or heading tags. (2) Unwrap single-`<p>` content for legacy parser. (3) Remove Summary box and flourish divider from reader. |

