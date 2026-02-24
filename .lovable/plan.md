

# Plan: Make the Teaching Reader Honour HTML Formatting from the Editor

## The Problem

Dad edits a teaching in the rich text editor and sees proper headings, bold, and italics. He saves. But when the "Full Teaching" reader displays it, everything comes out as plain text because the reader component strips all HTML and tries to guess formatting from plain text patterns. The editor and reader are completely disconnected in how they handle formatting.

## Root Cause

`InlineTeachingContent.tsx` has a function called `parseContentWithHeadings` that:
1. Splits the content by newlines
2. Strips all HTML tags and markdown symbols
3. Tries to heuristically detect headings by checking line length, capitalisation, etc.

This was designed for plain-text or markdown content from the AI. Now that the editor saves proper HTML (`<h2>`, `<strong>`, `<em>`, `<ul>`, etc.), this parser destroys all of it.

## The Fix

Add an **HTML detection check** to `InlineTeachingContent`. When the content contains real HTML tags (from the TipTap editor), render it directly with proper styling instead of running it through the text parser. Keep the old parser as a fallback for any legacy plain-text teachings.

## What Dad Will See

- Headings he sets in the editor will appear as headings in the reader
- Bold text will appear bold
- Italic text will appear italic
- Bullet lists will render as bullet lists
- Blockquotes will render as blockquotes
- What You See Is What You Get -- the editor preview matches the final output

## What Changes

### File: `src/components/InlineTeachingContent.tsx`

**1. Add an HTML detection function**
A simple check: if the content contains tags like `<p>`, `<h2>`, `<strong>`, etc., treat it as HTML.

**2. Add an HTML rendering path in the "Full Teaching" section**
When HTML is detected, render the content using `dangerouslySetInnerHTML` inside a styled container with CSS classes that match the existing reader aesthetic (heading fonts, paragraph spacing, bullet styles, blockquote borders).

**3. Keep the existing text parser as fallback**
Legacy teachings that were saved as plain text or markdown will continue to use the current `parseContentWithHeadings` logic unchanged.

**4. Style the HTML content to match the reader design**
Add Tailwind/CSS classes to ensure:
- `<h2>` and `<h3>` use the Playfair Display heading font with correct sizes and spacing
- `<p>` tags get the same line-height and margin as the current paragraph rendering
- `<strong>` and `<em>` render naturally (they already do in HTML)
- `<ul>` and `<ol>` get proper list styling with bullets/numbers
- `<blockquote>` gets the left border and italic styling

### File: `src/pages/TeachingDetail.tsx`

**5. Update the `strippedContent` memo for BookPreview**
The existing HTML-to-text stripping for the book preview already handles HTML tags (lines 100-134), so this should continue working. No changes expected here.

---

## Technical Details

### HTML Detection Logic
```text
function isHtmlContent(content: string): boolean
  - Returns true if content contains common HTML block tags
  - e.g. /<(p|h[1-6]|ul|ol|blockquote|div|strong|em)\b/i
```

### Rendering Branch (lines ~596-648)
```text
Current:
  parsedContent.map(item => ...)  // always uses text parser

New:
  if (isHtml) {
    render <div dangerouslySetInnerHTML={{ __html: content }}
           className="prose-teaching-html ..." />
  } else {
    parsedContent.map(item => ...)  // existing fallback
  }
```

### CSS Classes for HTML Content
Added to the component or to `src/index.css`:
- `.prose-teaching-html h2` -- Playfair Display, xl size, bold, top margin
- `.prose-teaching-html h3` -- Playfair Display, lg size, semibold
- `.prose-teaching-html p` -- base/17px size, 1.75 line-height, bottom margin
- `.prose-teaching-html ul` -- disc bullets, left padding
- `.prose-teaching-html ol` -- decimal numbers, left padding
- `.prose-teaching-html blockquote` -- left border, italic, muted colour
- `.prose-teaching-html strong` -- bold (browser default, but explicit)
- `.prose-teaching-html em` -- italic (browser default, but explicit)

### Print Support
The print function already clones the rendered DOM (`contentRef.current.innerHTML`), so HTML-rendered content will automatically print correctly with the existing print styles.

### Risk Assessment
**Low risk.** The old parser remains as a fallback. Only teachings with HTML content (from the new editor) will use the new rendering path. No database changes. No edge function changes.

