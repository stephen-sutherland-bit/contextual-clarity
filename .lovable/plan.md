

# Plan: Format Key Takeaways with Bullet Points and Italic Answers

## What You're Asking For

Looking at your screenshot of the Key Takeaways section:
- Questions like `- Is the thousand-year reign in Revelation a literal future event?` should have a proper bullet point (•) instead of `-`
- Answers like "No, it is a symbolic number representing..." should be rendered in *italic*

## Current Behaviour

The parser currently treats all content as either `heading` or `paragraph`. Lines starting with `-` are just rendered as regular paragraphs with the hyphen visible.

## Proposed Solution

Modify the **parser** in `InlineTeachingContent.tsx` to:
1. Track when we're inside the "Key Takeaways" or "Appendix" section
2. Detect lines starting with `- ` and render them as proper bullet points
3. Make non-bullet paragraphs in the Key Takeaways section italic (these are the answers)

**No changes to the rewrite process/edge function** - this is purely a display change.

---

## Technical Changes

### File: `src/components/InlineTeachingContent.tsx`

**1. Add new item types to the parser results:**

```typescript
const results: Array<{
  type: 'heading' | 'subheading' | 'paragraph' | 'bullet' | 'italic-paragraph', 
  content: string, 
  key: number
}> = [];
```

**2. Track when we're in the Key Takeaways or Appendix section:**

```typescript
// Track if we're in Key Takeaways or Appendix section (for special formatting)
let inKeyTakeawaysSection = false;
```

**3. Detect section entry:**

```typescript
// When we hit "Key Takeaways" or "Appendix" heading, enable special mode
if (trimmed.match(/^\*\*(key takeaways|appendix)\*\*$/i) || 
    trimmed.match(/^(key takeaways|appendix)$/i)) {
  inKeyTakeawaysSection = true;
  // Still add the heading
  results.push({ type: "heading", content: "Key Takeaways" or "Appendix", ... });
  return;
}

// Exit special mode when we hit another major heading
if (inKeyTakeawaysSection && /* is a different heading */) {
  inKeyTakeawaysSection = false;
}
```

**4. Convert `- ` lines to bullet points:**

```typescript
// Check for bullet point lines (- Something)
if (trimmed.startsWith("- ")) {
  results.push({
    type: "bullet",
    content: stripInlineMarkdown(trimmed.slice(2)), // Remove the "- "
    key: index * 100,
  });
  return;
}
```

**5. Make answers italic in Key Takeaways:**

```typescript
// In Key Takeaways section, non-bullet paragraphs are answers (italic)
if (inKeyTakeawaysSection) {
  results.push({
    type: "italic-paragraph",
    content: stripInlineMarkdown(trimmed),
    key: index * 100,
  });
  return;
}
```

**6. Add rendering for new types:**

```typescript
{parsedContent.map((item) => {
  if (item.type === "bullet") {
    return (
      <p key={item.key} className="text-base md:text-[17px] leading-[1.75] text-foreground/90 mb-3 text-left flex">
        <span className="mr-3 text-primary">•</span>
        <span>{item.content}</span>
      </p>
    );
  }
  if (item.type === "italic-paragraph") {
    return (
      <p key={item.key} className="text-base md:text-[17px] leading-[1.75] text-foreground/90 mb-5 text-left italic">
        {item.content}
      </p>
    );
  }
  // ... existing heading/paragraph rendering
})}
```

---

## Summary

| Change | Description |
|--------|-------------|
| Parser logic | Track when inside Key Takeaways/Appendix section |
| Bullet detection | Convert `- text` into proper bullet point (•) |
| Answer formatting | Non-bullet paragraphs in Key Takeaways become italic |
| No edge function changes | Display-only change, no rewrite process modifications |

---

## Expected Result

**Before:**
```
- Is the thousand-year reign in Revelation a literal future event?

No, it is a symbolic number representing the perfect and complete reign of Christ...
```

**After:**
```
• Is the thousand-year reign in Revelation a literal future event?

No, it is a symbolic number representing the perfect and complete reign of Christ...
(in italic)
```

