

## Slight Prompt Adjustment: Enhanced Pedagogical Scaffolding

### The Problem

Jim tested both outputs and found our app's version lacks the "pedagogical feel" of the DeepSeek version. He asked DeepSeek to compare the two, and the analysis revealed specific differences:

**Our output**: Excellent thematic exposition ("a lecture")
**DeepSeek's output**: Pedagogical guided discovery ("an invitational workshop")

The key difference: DeepSeek's version makes the **method of discovery visible** to the reader, introducing CCM concepts as **tools they can learn to use themselves**.

### Root Cause

Our current prompt describes the 4-Step Framework but doesn't emphasise:
1. **Explicit methodology labelling** - Naming CCM principles as "keys" or "tools" the reader can pick up
2. **First-use definitions** - Seamlessly defining terms when first introduced
3. **Guidepost transitions** - More investigative language ("Let's examine...", "To discover this...")
4. **Process visibility** - Making the journey of discovery as important as the destination

### The Fix

Add a new section **PEDAGOGICAL SCAFFOLDING** immediately after the 4-Step Framework (after line 121) that explicitly instructs the AI to:
- Name CCM principles as explicit "keys" or "tools" for the reader
- Define terms seamlessly at first use
- Use investigative guidepost language
- Return explicitly to initial questions when resolving

This is a **minimal, targeted addition** that doesn't alter:
- The 4-Step Framework structure
- The terminology mandates
- The doctrinal positions
- The required end-matter format
- Any other existing sections

### Change Location

`supabase/functions/process-transcript/index.ts` - Insert new section after line 121 (after the 4-Step Framework closes)

### New Section to Add

```text
---

## PEDAGOGICAL SCAFFOLDING (Make the Method Visible)

The goal is not just to teach conclusions, but to model HOW to discover them. Readers should finish feeling equipped to apply CCM themselves.

**Name the Tools Explicitly**
Introduce CCM principles as "keys" or "tools" for the reader to pick up:
- "A helpful key from Covenantal-Contextual reading is to first identify the operative covenant..."
- "This requires a jurisdictional reading—asking: who is being addressed here?"
- "We can apply another contextual principle by asking..."

**Define Terms Seamlessly at First Use**
When introducing terminology, embed the definition naturally:
- "A covenant, which we can understand as a sacred, binding agreement between God and His people..."
- "This is intra-covenantal discourse—that is, teaching directed at the internal condition of the covenant community..."
- "The instrumental mode—that is, HOW the covenant functioned..."

**Use Investigative Guidepost Language**
Guide readers through the discovery process with exploratory phrases:
- "Let's examine the specific language..."
- "To discover this, we must turn to..."
- "What would this have meant to a first-century Judean?"
- "Notice the precise audience and the specific timeline..."

**Return Explicitly to Initial Questions**
When synthesising (Step 4), explicitly connect back to the sincere question from Step 1:
- "Therefore, within its Mosaic Covenant jurisdiction, the treasure was..."
- "Seen as intra-covenantal discourse, Jesus's teaching on the heart..."
- "This reframing answers our initial question: the command was not..."
```

### Why This Works

1. **Minimal addition** - Only adds one new section (~200 words) without changing anything else
2. **Addresses the exact gap** - The comparison document identified these specific differences
3. **Preserves everything Jim loves** - Structure, end-matter, terminology, doctrinal integration all stay intact
4. **Clear examples** - Shows the AI exactly what phrases to use
5. **Aligns with Jim's vision** - Transforms output from "lecture" to "invitational workshop"

### Risk Assessment

**Very Low Risk** - This change:
- Does not alter the 4-Step Framework (only supplements it)
- Does not modify terminology mandates
- Does not change doctrinal positions
- Does not affect required end-matter format
- Adds guidance without removing any existing instructions

### Summary of Adjustment

| Aspect | Current | After Adjustment |
|--------|---------|------------------|
| CCM Principles | Described but not named as tools | Explicitly named as "keys" and "tools" |
| Term Definitions | Expected but not mandated style | First-use seamless definitions mandated |
| Transitional Language | "Therefore...", "As we see..." | + "Let's examine...", "To discover this..." |
| Step 4 Synthesis | General resolution | Explicit return to initial question |

