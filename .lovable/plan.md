

# Plan: Add Rich Text Editing to the Teaching Editor

## What This Does

Replace the plain text `<Textarea>` for the "Full Content" field in the Teaching Editor with a proper rich text editor that gives Dad formatting controls like bold, italic, headings, and more.

## Approach

Install **TipTap** -- a modern, lightweight rich text editor built for React. It works natively with HTML (which is exactly how `fullContent` is already stored in the database), so no data migration is needed.

## What Dad Will See

A formatting toolbar above the content editor with buttons for:
- **Bold** and *Italic*
- Heading sizes (H2, H3)
- Bullet lists and numbered lists
- Blockquote
- Undo / Redo

The editor will show formatted text as he types (WYSIWYG), not raw HTML.

## What Stays the Same

- All other fields in the Teaching Editor (title, themes, scriptures, tags, pondered questions)
- The save/delete/reprocess logic -- `fullContent` is still stored as HTML
- The reader/frontend rendering in `InlineTeachingContent` -- it already parses HTML
- No database changes needed

---

## Technical Details

### New Dependencies
- `@tiptap/react` -- React integration
- `@tiptap/starter-kit` -- Bundle of common extensions (bold, italic, headings, lists, blockquote, history)

### New File: `src/components/RichTextEditor.tsx`
A reusable component wrapping TipTap with:
- A toolbar row with icon buttons (using existing Lucide icons)
- The editable content area styled to match the existing editor theme
- Props: `content` (HTML string), `onChange` (callback), `disabled` (boolean)

### Modified File: `src/components/TeachingEditor.tsx`
- Replace the `<Textarea>` at lines 520-527 with the new `<RichTextEditor>` component
- Wire up `content={fullContent}` and `onChange={setFullContent}`
- When reprocessing completes, update the editor content programmatically

### Styling
- Toolbar buttons styled with the existing `Button` component (ghost/outline variants)
- Active formatting states highlighted (e.g., bold button appears pressed when cursor is in bold text)
- Editor area matches the current textarea appearance (border, padding, font)
- Minimum height matches current `rows={12}` textarea

