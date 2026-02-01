

## Implementation Plan: CCM Rewrite Prompt Overhaul

### Overview

This plan implements the complete CCM methodology update across four files, replacing the existing AI rewrite prompt with the new 4-Step Guided Discovery Framework and updating related components.

---

### Files to Modify

| File | Purpose |
|------|---------|
| `supabase/functions/process-transcript/index.ts` | Replace CCM_SYSTEM_PROMPT with new 4-Step Framework (~4,500 words) |
| `supabase/functions/suggest-phase/index.ts` | Update PHASE_SYSTEM_PROMPT with new CCM terminology |
| `src/pages/Methodology.tsx` | Expand content with 6 new sections from Jim's document |
| `src/components/MethodologyPreview.tsx` | Update preview cards with refined CCM concepts |

---

### 1. Process-Transcript Edge Function

**Location:** `supabase/functions/process-transcript/index.ts` (lines 58-185)

**Change:** Replace the entire `CCM_SYSTEM_PROMPT` constant with the new comprehensive prompt including:

- **Expansion Mandate** - Output must match or exceed input length
- **4-Step Guided Discovery Framework**:
  1. Begin with Sincere Question/Common Perception
  2. Introduce Guiding CCM Principle
  3. Walk the Path of Discovery (Core Expansion Zone)
  4. Articulate Covenantal-Contextual Understanding
- **Core Analogies**: Nation-State (Mosaic), Global Whānau (New), Passport Transition
- **Terminology Mandates**: "Mercy" not "love", Judean/Israelite precision, Instrumental Mode
- **Doctrinal Positions**: Non-Trinitarian biblical perspective, ha satan as role, AD 70 spiritual resurrection
- **Required End-Matter**: Appendix (Core Focus/Purpose), Reflective Questions, Summary
- **Formatting**: Bold headings, no markdown symbols in output, NZ English

---

### 2. Suggest-Phase Edge Function

**Location:** `supabase/functions/suggest-phase/index.ts` (lines 47-98)

**Change:** Update `PHASE_SYSTEM_PROMPT` to include:

- Covenantal Mislocation concept
- Instrumental Mode terminology
- Transition Literature understanding
- Intra-Covenantal language
- Updated phase descriptions with new CCM vocabulary

---

### 3. Methodology Page Expansion

**Location:** `src/pages/Methodology.tsx`

**New Sections to Add:**

1. **The Core Problem: Covenantal Mislocation**
   - Steam locomotive analogy (coal stoker vs diesel engineer)
   - Definition of applying wrong covenant commands

2. **The Two Covenants: Different Modes of Operation**
   - Mosaic: Material/External/National (Israel as Nation-State)
   - New: Spiritual/Internal/Universal (Global Whānau)
   - Instrumental Mode explanation

3. **Reading the NT as Transition Literature**
   - NT written during Mosaic age, not after it ended
   - Passport Transition analogy
   - Implications for interpretation

4. **The Imminent Horizon: AD 70 as Covenant Eschaton**
   - The terminus of the Mosaic system
   - Prophetic fulfilment framework

5. **How This Changes Our Reading: 5 Diagnostic Questions**
   - Which covenant governs this passage?
   - Who is the original audience?
   - What is the instrumental mode?
   - Where are we in covenant history?
   - What is the fulfilment horizon?

6. **The Result: Clarity, Coherence, and Consolation**
   - Benefits of CCM approach
   - Avoiding futurist speculation

---

### 4. Methodology Preview Component

**Location:** `src/components/MethodologyPreview.tsx`

**Update the four principle cards:**

| Current | Updated |
|---------|---------|
| Context is King | Covenantal Location |
| Fulfilment Horizon | The Imminent Horizon |
| Law vs Grace | Two Instrumental Modes |
| Literal vs Symbolic | Transition Literature |

---

### Expected Outcomes

**AI Rewrite Output Will Now Include:**
- Collaborative, humble tone throughout
- Clear bold headings for major sections
- Full Appendix with Core Focus and Purpose fields
- Reflective Questions in structured format (Common Understanding vs CCM Answer)
- Summary section with bulleted key questions answered
- Strategic repetition for pedagogical reinforcement
- All doctrinal positions integrated invisibly

**Methodology Page Will Feature:**
- Comprehensive explanation of CCM framework
- Steam locomotive analogy for Covenantal Mislocation
- Clear distinction between covenant modes
- Practical 5-question diagnostic framework

---

### Deployment

After implementation:
1. Edge functions will auto-deploy with preview build
2. Test by processing a sample transcript
3. Verify output matches expected format with Appendix, Reflective Questions, and Summary

