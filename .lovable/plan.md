# Plan: Fix Bold Heading Detection - COMPLETED

## Changes Made

### 1. `supabase/functions/process-transcript/index.ts`
- Updated STRUCTURE & FORMATTING section to instruct AI to use `**Heading Title Here**` format
- Provided explicit examples: `**The Mosaic Covenant**`, `**The Binding of the Adversary: A Legal Victory**`
- Updated FINAL FORMATTING NOTES to clarify: use `**bold markers**` ONLY for section headings
- Removed the blanket "no asterisks" rule

### 2. `src/components/InlineTeachingContent.tsx`
- Relaxed `isTrueHeading` function by removing the overly aggressive `sentenceOpeners` regex
- Lines starting with "The", "A", "In" etc. are now allowed as headings (for legacy content)
- Kept conversational phrase detection to avoid bolding actual sentences
- The primary detection method is now the explicit `**Heading**` regex match at lines 153-162

## Why This Works

1. **Explicit control**: AI outputs `**Heading Title Here**` format
2. **Reliable detection**: Parser detects `^\*\*(.+?)\*\*$` pattern
3. **Clean output**: Markers get stripped via `stripInlineMarkdown()`
4. **Fallback exists**: Legacy content can still use heuristics, but less aggressively
