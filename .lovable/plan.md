
## Comprehensive Plan: CCM Methodology and Rewrite Prompt Update

### Overview

Your dad has provided two important documents from Jim that need to be integrated into the platform:

1. **CCM Methodology Simplified** - Enhanced explanatory content for the public Methodology page
2. **Possible New Prompt for CCM Rewrites** - A completely restructured system prompt for the AI transcript processing

---

### Part 1: Update the Methodology Page Content

The current Methodology page has good foundations but lacks the depth and key concepts from Jim's document. We will add:

| New Concept | Description |
|-------------|-------------|
| **Covenantal Mislocation** | The core problem - applying commands from one covenant to those in another |
| **Instrumental Mode** | How covenants function differently (material/external vs spiritual/internal) |
| **Transition Literature** | The New Testament was written during the Mosaic age, not after it ended |
| **The Two Covenants** | Mosaic (material/external) vs New (spiritual/internal) with clear distinctions |
| **Imminent Horizon** | AD 70 as the "Covenant Eschaton" - the terminus of the Mosaic system |
| **5 Diagnostic Questions** | Practical application framework for analysing any passage |

**Files to Modify:**
- `src/pages/Methodology.tsx` - Major content expansion with new sections
- `src/components/MethodologyPreview.tsx` - Update preview card content to reflect new terminology

---

### Part 2: Replace the CCM System Prompt for Transcript Rewrites

The new prompt from Jim introduces a fundamentally different approach: the **4-Step Guided Discovery Framework**. This is a pedagogical method, not just formatting rules.

**The 4 Steps:**
1. **Begin with the Sincere Question** - Start by articulating what a modern reader would assume
2. **Introduce the Guiding CCM Principle** - Pivot using CCM as the lens
3. **Walk the Path of Discovery** - The "Core Expansion Zone" with deep unpacking
4. **Articulate the Covenantal-Contextual Understanding** - Synthesise and resolve

**Key New Elements:**

| Element | Description |
|---------|-------------|
| Core Analogies | Nation-State (Mosaic), Global Whānau (New), Passport Transition (NT period) |
| Invisible Definitions | Instrumental Mode, Jurisdictional Reading, Intra-Covenantal, Transition Literature |
| Strategic Repetition | Intentional restatement of concepts for reinforcement |
| "Mercy" not "Love" | Avoid emotionalising God - use mercy/merciful instead of love |
| New End-Matter Format | Appendix with Core Focus, Purpose, and Reflective Questions format |

**Critical Doctrinal Positions (from Jim):**
- The Trinity is not recognised by biblical writers
- Satan (ha satan) is a position, not a person
- Demons are not real (introduced during exile)
- Hell is metaphor, not a real place
- Resurrection is spiritual and occurred at AD 70
- Synagogues, Pharisees, Sadducees were NOT part of the Mosaic Covenant

**File to Modify:**
- `supabase/functions/process-transcript/index.ts` - Replace CCM_SYSTEM_PROMPT with new comprehensive prompt

---

### Part 3: Update Related Edge Functions

The `suggest-phase` edge function also references CCM methodology and should be updated to align with the new terminology (Covenantal Mislocation, Instrumental Mode, etc.).

**File to Modify:**
- `supabase/functions/suggest-phase/index.ts` - Update PHASE_SYSTEM_PROMPT with new CCM terminology

---

### Implementation Order

| Step | Task | Risk Level |
|------|------|------------|
| 1 | Update `process-transcript` system prompt with new 4-Step Framework | Medium |
| 2 | Update `suggest-phase` system prompt for consistency | Low |
| 3 | Expand Methodology page with new content sections | Low |
| 4 | Update MethodologyPreview with refined terminology | Low |

---

### Technical Details

**1. New System Prompt Structure (process-transcript):**

The new prompt will be approximately 4,000-5,000 words and include:

```text
Part 1: The 4-Step Guided Discovery Framework
- Step 1: Begin with the Sincere Question/Perception
- Step 2: Introduce the Guiding CCM Principle  
- Step 3: Walk the Path of Discovery (Core Expansion Zone)
- Step 4: Articulate the Covenantal-Contextual Understanding

Part 2: Foundational Editorial Commands
- Expansion Mandate (existing)
- Tone & Voice (updated)
- Terminology Precision (enhanced with new terms)
- CCM Integration (enhanced with new doctrinal positions)
- Structure & Style requirements
- Strict Avoidances (updated with new items)

Part 3: Required End-Matter Format
- Appendix: Core Focus and Purpose
- Reflective Questions format
- Summary section
- Attribution line
```

**2. Methodology Page New Sections:**

```text
- "Our Method: Seeing Scripture Through Its Own Lens" (intro)
- "The Core Problem: Covenantal Mislocation" (new section)
- "The Two Covenants: Different Modes of Operation" (expanded)
- "Reading the NT as Transition Literature" (new section)
- "The Imminent Horizon: AD 70 as Covenant Eschaton" (new section)  
- "How This Changes Our Reading" (5 diagnostic questions)
- "The Result: Clarity, Coherence, and Consolation" (new conclusion)
```

---

### Risk Assessment

| Risk | Mitigation |
|------|------------|
| Prompt too long for token limits | Gemini 2.5 Pro handles large context; existing prompt is already substantial |
| Doctrinal positions may be controversial | These are Jim's stated CCM positions - they will be included as specified |
| Existing teachings may not match new format | This affects future rewrites only; existing content remains unchanged |
| "Mercy not Love" rule may feel awkward | AI will apply contextually as instructed |

---

### Expected Outcome

After implementation:

1. **Methodology Page** - Comprehensive explanation of CCM with the steam locomotive analogy, covenantal mislocation concept, and practical 5-question diagnostic framework

2. **AI Rewrites** - Will now follow the 4-Step Guided Discovery Framework:
   - Start with what readers commonly assume
   - Introduce the CCM principle as a lens
   - Walk through evidence with deep unpacking
   - Synthesise with explicit covenantal resolution

3. **Consistent Terminology** - All AI functions and public pages will use aligned CCM vocabulary (Instrumental Mode, Jurisdictional Reading, Intra-Covenantal, etc.)

4. **Proper End-Matter** - Teachings will conclude with Core Focus, Purpose, Reflective Questions, and attribution

---

### Files Changed Summary

| File | Changes |
|------|---------|
| `supabase/functions/process-transcript/index.ts` | Replace CCM_SYSTEM_PROMPT with new 4-Step Guided Discovery Framework prompt |
| `supabase/functions/suggest-phase/index.ts` | Update PHASE_SYSTEM_PROMPT with new CCM terminology |
| `src/pages/Methodology.tsx` | Add new sections: Covenantal Mislocation, Instrumental Mode, Transition Literature, 5 Diagnostic Questions |
| `src/components/MethodologyPreview.tsx` | Update preview cards with refined terminology and new concepts |
