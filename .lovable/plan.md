

# Prompt Rework and Dynamic CCM Outline System

## The Problem

Dad uses two separate prompts with DeepSeek -- a rewrite prompt (11 pages) and an examination prompt (5 pages). These are extremely verbose, with repeated content between them and so many detailed instructions that the AI frequently ignores parts, apologises, and has to redo work. Our current `process-transcript` edge function has a ~330-line system prompt that is similarly dense.

Meanwhile, the CCM methodology itself has evolved (new outline uploaded), and there's no way to update the rules without a code change.

## The Solution: Three Changes

### 1. Store the CCM Outline as a Living Document (Database + Admin Tab)

Instead of baking CCM rules into the prompt, store the CCM Outline text in the database so the AI references it dynamically. Dad can update it from the Admin panel without touching code.

**Database**: Create a new `system_documents` table with columns:
- `id` (uuid, primary key)
- `document_key` (text, unique) -- e.g. `"ccm_outline"`
- `title` (text) -- e.g. `"CCM Methodology Outline"`
- `content` (text) -- the full extracted text of the PDF
- `updated_at` (timestamptz)
- `updated_by` (uuid, nullable)

This table stores the parsed text content, not the raw PDF. When Dad uploads a new PDF, we parse it and store the text.

**Admin Tab**: Add a 4th tab "CCM Outline" next to Cover Art. It will show:
- The current outline's last-updated date
- A preview of the stored content
- A drag-and-drop zone to upload a replacement PDF
- A confirmation dialog warning that this will replace the existing outline
- Uses the existing `parse-pdf` edge function to extract text from the uploaded PDF

### 2. Redesign the Rewrite Prompt (Shorter, Reference-Based)

Replace the current ~330-line system prompt with a much shorter one (~80-100 lines) that:

- States the AI's role and tone in 3-4 sentences
- References the CCM Outline document (injected at runtime from the database) as "THE RULES" rather than repeating them inline
- Keeps the 4-Step Guided Discovery Framework as a compact list (not pages of examples)
- Keeps the terminology mandates as a compact correction table
- Keeps the formatting rules (bold headings, NZ English, no meta-commentary, no questions section)
- Removes all the "failure mode" examples, "required language patterns," and verbose tables that duplicate what's already in the CCM Outline
- Removes the mandatory verification checklist (the AI wastes tokens on this instead of writing)

The key insight: Dad's two-prompt workflow (rewrite then examine) fails because each prompt is too long. A single shorter prompt that says "follow the attached CCM Outline as your governing rules" will be more effective because:
- The AI has more context window for the actual teaching content
- Fewer competing instructions means fewer ignored instructions
- The CCM Outline itself is well-structured and concise (5 pages vs 11+5 pages of prompts)

### 3. Add a Post-Rewrite CCM Compliance Check (Optional Second Pass)

After the rewrite completes, add an optional "Verify CCM Compliance" button that runs a second, shorter AI pass using the examination logic. This replaces Dad's manual second-prompt workflow. The check will:

- Take the rewritten output + the stored CCM Outline
- Use a compact examination prompt (~30 lines) that asks the AI to identify anomalies only
- Return a simple report: consistencies, anomalies, and verdict
- Display the results in the Admin UI so Dad can see if anything needs fixing

This is a new edge function (`verify-ccm-compliance`).

## What Changes

### Files Created
| File | Purpose |
|------|---------|
| `supabase/functions/verify-ccm-compliance/index.ts` | New edge function for the CCM compliance check |

### Files Modified
| File | What Changes |
|------|-------------|
| `supabase/functions/process-transcript/index.ts` | Replace the 330-line prompt with a ~100-line version that injects the CCM Outline from the database at runtime |
| `src/pages/Admin.tsx` | Add 4th "CCM Outline" tab with PDF upload, preview, and replace functionality. Add "Verify CCM" button to Audio Import results |

### Database Migration
- Create `system_documents` table with RLS (admin-only write, public read for edge functions)
- Seed with the current CCM Outline content from the uploaded PDF

## Technical Details

### How the Prompt Injection Works

When `process-transcript` runs:
1. Fetch the `ccm_outline` document from `system_documents`
2. Construct the system prompt as: compact instructions + `\n\n---\n\nCCM METHODOLOGY RULES (You MUST follow these):\n\n` + outline content
3. Send to Gemini 2.5 Pro as before

### The New Compact Rewrite Prompt (Approximate Structure)

```text
You are a pedagogical editor rewriting theological transcripts using Covenantal-Contextual Methodology (CCM).

RULES: The CCM Outline below is your governing methodology. Every interpretive decision must align with it.

TASK: Expand and enrich the transcript through guided discovery. Output must be >= input length.

FRAMEWORK: For each concept, follow: (1) Common question/assumption, (2) CCM principle as lens, (3) Walk through evidence, (4) State the CCM understanding clearly.

TONE: Collaborative ("we", "us"), scholarly not devotional, humble, invitational.

TERMINOLOGY: [compact correction table - 10 rows]

FORMATTING: Bold headings only. NZ English. ESV quotes. No markdown ##. No meta-commentary. No questions section. End with Appendix + Key Takeaways + credit line.

DO NOT: Summarise, extract "timeless principles", use Trinitarian language, present NT offices as permanent, add reflective questions.

---
CCM METHODOLOGY OUTLINE:
[injected from database]
```

This is dramatically shorter while preserving all the critical rules -- because the CCM Outline itself contains the methodology details.

### Admin "CCM Outline" Tab Flow

1. Dad clicks "CCM Outline" tab
2. Sees current outline with last-updated date and a text preview
3. Drags a new PDF into the drop zone
4. Confirmation dialog: "This will replace the current CCM Outline. The AI will use the new version for all future rewrites. Continue?"
5. On confirm: PDF parsed via `parse-pdf`, text stored in `system_documents`, UI updates

## Risk Assessment

**Medium.** The prompt redesign changes how the AI processes teachings. However:
- The CCM Outline document is well-written and comprehensive
- A shorter prompt with clear rules tends to perform better than a verbose one
- The compliance check provides a safety net
- Dad can always update the outline if results need tuning
- No existing teachings are affected -- only future rewrites

