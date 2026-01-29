

## Plan: Fix Audio File Picker Not Showing WhatsApp Audio Files

### The Problem

Your WhatsApp audio file uses the `.opus` format. While the code uses `accept="audio/*"` which should accept all audio, there's a known Windows/browser issue:

- Windows doesn't have `.opus` registered in its MIME type registry by default
- The browser's file picker uses Windows file associations to filter files
- Since Windows doesn't recognize `.opus` as audio, it gets filtered out even though `audio/*` is specified

You can see this in your screenshot - the dialog says "Audio Files" but the WhatsApp audio file isn't visible.

### The Solution

Explicitly list all common audio extensions in the `accept` attribute. This tells the browser exactly which file extensions to allow, bypassing the MIME type issue.

**Current code:**
```tsx
accept="audio/*"
```

**Fixed code:**
```tsx
accept="audio/*,.mp3,.m4a,.wav,.ogg,.opus,.aac,.flac,.wma,.webm"
```

This explicitly includes:
- `.opus` - WhatsApp audio format
- `.ogg` - Alternative WhatsApp format  
- `.m4a` - Common iPhone/Mac format
- `.mp3`, `.wav`, `.aac`, `.flac`, `.wma`, `.webm` - Other common formats

### File to Modify

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Update line 1225: change `accept="audio/*"` to explicitly include `.opus` and other formats |

### Technical Details

Change on line 1225:
```tsx
// Before
accept="audio/*"

// After  
accept="audio/*,.mp3,.m4a,.wav,.ogg,.opus,.aac,.flac,.wma,.webm"
```

### Risk Level
Very Low - This is a simple attribute change that expands file compatibility without affecting any processing logic.

### Result
The file picker will now show your WhatsApp audio file (and any other audio format) when you click "Click to select audio file".

