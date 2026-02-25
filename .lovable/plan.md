

# Fix: Teaching Reader Not Showing Formatted Content

## The Problem

The "Full Teaching" reader always shows plain text because `TeachingDetail.tsx` passes `strippedContent` (which strips ALL HTML tags) to `InlineTeachingContent`, instead of the original `fullContent`. The HTML detection logic we added to the reader never triggers because it receives pre-stripped text.

## The Fix

One line change in `src/pages/TeachingDetail.tsx`:

Change line 506 from:
```
content={strippedContent}
```
to:
```
content={teaching.fullContent || ""}
```

This passes the original HTML content to the reader, which already has the dual-path rendering logic (HTML detection + fallback parser) to handle it correctly.

The `strippedContent` memo is still used by the BookPreview component elsewhere, so it stays in place -- it just shouldn't be fed to the main reader.

## What Dad Will See

After this fix, the "Full Teaching" view will display headings, bold, italics, lists, and blockquotes exactly as they appear in the editor.

---

## Technical Details

### File Changed: `src/pages/TeachingDetail.tsx`
- **Line 506**: Replace `content={strippedContent}` with `content={teaching.fullContent || ""}`

### Why This Is Safe
- `InlineTeachingContent` already has `isHtmlContent()` detection and the `.prose-teaching-html` rendering path
- Legacy plain-text teachings will still fall through to the existing `parseContentWithHeadings` parser
- The `strippedContent` memo remains for the BookPreview (page-flip) component
- No database or styling changes needed

