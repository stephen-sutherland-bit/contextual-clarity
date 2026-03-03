

# Plan: Refine Prompt for Accessibility + Fix Logo on GitHub Pages

## What your dad flagged (from screenshots & your call)

1. **Too scholarly** — the rewrite reads like an Oxford lecture; needs to be understandable by anyone, even someone brand new to theology
2. **Missing "Invisible CCM Definitions"** — the first time a CCM/scholarly term appears, it should be seamlessly defined in plain language inline (your dad's exact phrase)
3. **`&gt;` artifacts in scripture quotes** — HTML entities leaking into the rendered text (visible in the screenshot of "Bible Time Periods Explained")
4. **Questions placement** — "Questions This Teaching Answers" should stay as a teaser *before* the full teaching (encouraging people to read), not after — and shouldn't show answers that might deter readers
5. **Logo broken on GitHub Pages** — the logo path `/images/logo-emblem.png` doesn't include the Vite `base` path (`/contextual-clarity/`), so it 404s on the deployed site

## Changes

### 1. Update `process-transcript` system prompt (tone + definitions)

In `supabase/functions/process-transcript/index.ts`, modify the `buildSystemPrompt` function:

**Tone section (line ~152-157)** — Replace the "Scholarly, NOT devotional. Oxford lecture" mandate with:

- "Accessible and warm, like a knowledgeable friend explaining over coffee — NOT an Oxford lecture, NOT a Sunday sermon"
- "Write so that someone with NO theological background can follow every paragraph without needing a dictionary"
- "Prefer short, clear sentences. Break up complex ideas into digestible steps"
- "When a concept is inherently complex, use an everyday analogy before the technical explanation"

**Add new "Invisible CCM Definitions" section** after the terminology mandates (~line 121):

- "INVISIBLE DEFINITIONS: The first time ANY CCM, scholarly, or theological term appears (e.g., *chesed*, *eschaton*, *proleptic*, *instrumental mode*, *covenantal jurisdiction*), seamlessly integrate a one-sentence, plain-language explanation directly into the sentence. Do NOT use footnotes or parenthetical asides that feel academic. Weave the definition naturally: e.g., 'This is what scholars call *proleptic* experience — a genuine foretaste of something that hasn't fully arrived yet.'"

**Add explicit `&gt;` prevention rule** in the FORMATTING section (~line 170):

- "NEVER output HTML entities such as `&gt;`, `&lt;`, `&amp;`, or `&quot;`. Always use plain-text characters: `>`, `<`, `&`, `"`. Scripture quotes must use plain quotation marks and no HTML markup whatsoever."

### 2. Add server-side `&gt;` cleanup in the edge function

After the AI response is streamed, the content is used as-is. But we should also add a defensive cleanup in the `InlineTeachingContent.tsx` renderer and/or the `TeachingEditor` save path to replace any `&gt;` / `&lt;` / `&amp;` entities that slip through:

- In `InlineTeachingContent.tsx`, add a preprocessing step in the content parsing to decode HTML entities before rendering
- This catches existing teachings that already have the artifacts, without needing to reprocess them all

### 3. Move "Questions This Teaching Answers" inside the full teaching view

In `src/pages/TeachingDetail.tsx`:

- Remove the "Questions This Teaching Answers" section from the outer teaching detail page (lines ~368-391)
- In `src/components/InlineTeachingContent.tsx`, ensure the questions list appears at the *top* of the full teaching view (before the main content), as a "What this teaching explores" teaser — questions only, no answers shown

### 4. Fix logo path for GitHub Pages

The logo uses absolute paths (`/images/logo-emblem.png`) but Vite's production `base` is `/contextual-clarity/`. On GitHub Pages this resolves to the wrong location.

- In `Header.tsx` and `HeroSection.tsx`, change the logo `src` to use `import.meta.env.BASE_URL + 'images/logo-emblem.png'` (template literal) so it resolves correctly in both dev and production
- Same fix needed anywhere else that references assets with absolute paths (favicon, textures, etc.)

## What stays the same

- The CCM Methodology Outline stored in `system_documents` remains the single source of truth — no prompt changes touch that
- The 4-Step Guided Discovery Framework structure stays intact
- All terminology mandates, anti-transposition rules, and doctrinal positions remain unchanged
- The Pondered Questions (Q&A with Common Answer vs CCM Answer) remain in their current "Clarifying Common Questions" section inside the full teaching
- Bold/italic formatting rules stay as-is

## Summary of files to change

| File | Change |
|---|---|
| `supabase/functions/process-transcript/index.ts` | Update tone, add invisible definitions rule, add `&gt;` prevention |
| `src/components/InlineTeachingContent.tsx` | Add HTML entity decode step; show questions at top of teaching |
| `src/pages/TeachingDetail.tsx` | Remove "Questions This Teaching Answers" from outer page |
| `src/components/Header.tsx` | Fix logo path with `BASE_URL` |
| `src/components/HeroSection.tsx` | Fix logo path with `BASE_URL` |

