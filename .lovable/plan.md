

## Plan: Remove Confusing "Start Here" Badges

### Problem
Teaching cards display "Start Here: #234" badges that show the database `readingOrder` field. These numbers are:
- Meaningless to users (e.g., #234, #114 are not helpful sequence indicators)
- Confusing - "Start Here" implies first teaching, but high numbers contradict this
- Redundant now that teachings are grouped by Module (which already shows reading order)

### Solution
Remove the `showReadingOrder` feature entirely since Module grouping now provides the reading order context.

---

### Changes

| File | Change |
|------|--------|
| `src/components/TeachingCard.tsx` | Remove the `showReadingOrder` prop and badge rendering code (lines 25-31) |
| `src/pages/Teachings.tsx` | Remove `showReadingOrder` prop from TeachingCard calls (lines 56-61) |
| `src/components/RecommendedPath.tsx` | Remove `showReadingOrder` prop from TeachingCard calls |

### Technical Details

**TeachingCard.tsx** - Remove lines 25-31:
```tsx
// DELETE THIS BLOCK:
{showReadingOrder && teaching.readingOrder && (
  <div className="flex items-center gap-2 mb-2">
    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
      Start Here: #{teaching.readingOrder}
    </span>
  </div>
)}
```

Also remove `showReadingOrder` from the props interface.

**Teachings.tsx** - Line 60: Remove `showReadingOrder` prop

**RecommendedPath.tsx** - Line 44: Remove `showReadingOrder` prop

### Result
- Clean teaching cards without confusing badges
- Module grouping continues to provide reading order context
- Simpler component with less props to manage

### Risk Level
Very Low - purely removes UI clutter, no functional impact on data or navigation.

