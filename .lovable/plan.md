

## Plan: Add Usage Disclaimer to API Cost Tracker

### Problem
Dad has seen $120 in OpenAI charges but the in-app tracker only shows $28.01. This is because:
1. The tracker only logs API calls made through the Lovable app
2. Direct OpenAI API usage (DeepSeek, ChatGPT web, other tools using the same key) is not tracked
3. Dad needs to understand this limitation to avoid confusion

### Solution
Add a clear disclaimer to the API Usage card explaining what is and is not tracked.

---

### Changes

**File:** `src/components/ApiUsageCard.tsx`

Add an info note below the usage statistics:

```text
┌─────────────────────────────────────────────────────────────┐
│ 💵 API Usage - January                                      │
├─────────────────────────────────────────────────────────────┤
│ Total    Transcription    Processing    Indexing    AI Gen  │
│ $28.01   $12.50           $8.00         $6.01       $1.50   │
├─────────────────────────────────────────────────────────────┤
│ 📊 156 operations this month                                │
├─────────────────────────────────────────────────────────────┤
│ ℹ️ This only tracks API usage within this app.              │
│    Direct OpenAI/AssemblyAI usage (e.g., ChatGPT,           │
│    DeepSeek) is not included. Check your OpenAI             │
│    dashboard for total account charges.                     │
└─────────────────────────────────────────────────────────────┘
```

### Technical Implementation

1. Add an `Alert` component with `variant="default"` below the operations count
2. Include an `Info` icon from lucide-react
3. Use muted styling to keep it subtle but visible
4. Link text could optionally point to OpenAI usage dashboard

### Code Changes

```tsx
// Add import
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

// Add after the operations count div (around line 95)
<Alert variant="default" className="mt-3 bg-muted/30 border-muted">
  <Info className="h-4 w-4" />
  <AlertDescription className="text-xs text-muted-foreground">
    This only tracks API usage within this app. Direct OpenAI or AssemblyAI 
    usage (e.g., ChatGPT, DeepSeek) is not included.
  </AlertDescription>
</Alert>
```

### Files to Modify

| File | Change |
|------|--------|
| `src/components/ApiUsageCard.tsx` | Add disclaimer Alert below operations count |

### What This Does NOT Change
- The actual cost tracking logic
- Any edge functions
- Database schema
- Other admin features

### Risk Level
Very Low - purely additive UI change with no functional impact.

