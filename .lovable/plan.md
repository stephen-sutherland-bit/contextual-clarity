

# Plan: Bulk Paste Support for Teaching Editor Tag Inputs

## What changes

### `src/components/TeachingEditor.tsx`

**1. Update `addTag` (line 303-312)** to split on newlines, so pasting a list adds each line as a separate tag:

```ts
const addTag = (value, setter, inputSetter) => {
  const items = value.split(/\n/).map(s => s.trim()).filter(Boolean);
  if (items.length > 0) {
    setter(prev => [...prev, ...items]);
    inputSetter("");
  }
};
```

**2. Update `TagInput` (lines 352-371)** — swap `Input` for `Textarea` (2 rows, resizable) and add an `onPaste` handler that auto-processes pasted multi-line content:

- Replace `<Input>` with `<Textarea rows={2}>`
- Add `onPaste` handler: on paste, read clipboard text, if it contains newlines, prevent default, split and add all items immediately
- Keep the Enter key behavior (add single item) and the + button

This applies to all tag fields (Questions Answered, Keywords, Scriptures, Secondary Themes) since they all share `TagInput`.

