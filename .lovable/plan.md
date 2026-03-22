

# Custom Cover Image Manager in Teaching Editor

## What we're building

A new "Cover Image" section in the Teaching Editor that gives your dad full control over cover art:

1. **See current cover** — thumbnail preview of the existing cover image
2. **Auto-generate** — same as now, generates based on title/theme/scriptures
3. **Custom AI generation** — "Describe Your Image" text box where he types what he wants, and it generates from that description
4. **Upload own image** — drag-and-drop or file picker to use his own photo/image
5. **Preview before accepting** — generated/uploaded images show as a preview with Accept/Reject buttons before saving
6. **Reference image** — optionally attach an image alongside the description so the AI can use it as inspiration

## Changes

### 1. Update `generate-illustration` edge function

Add support for a `customPrompt` field in the request body. When provided, use it as the main prompt instead of the auto-generated one (still append the style/format rules). Also add support for a `referenceImage` field (base64) to pass to the AI as visual reference.

**File**: `supabase/functions/generate-illustration/index.ts`

### 2. Add Cover Image section to TeachingEditor

**File**: `src/components/TeachingEditor.tsx`

Add a new section between "Summary" and "Full Content" with:

- Current cover thumbnail (if exists)
- Three action buttons: "Auto-Generate", "Custom AI Image", "Upload Image"
- When "Custom AI Image" is clicked: show a textarea for the description + optional drag-and-drop for a reference image + "Generate" button
- When "Upload Image" is clicked: file input accepting image types
- Preview panel: shows the candidate image with "Accept" and "Cancel" buttons
- On Accept: saves to database and updates state
- On Cancel: discards the candidate

### 3. Wire up the TeachingEditor props

Pass `teaching.id` and the session token through so the editor can call the edge function and save directly. The TeachingEditor already has access to supabase client and toast.

**New state variables**: `coverImage`, `candidateImage`, `coverMode` (idle/custom/uploading/generating), `customPrompt`, `referenceImage`

### 4. Update TeachingEditorProps

Add `coverImage?: string` to the teaching prop interface so the current cover is passed in from TeachingDetail.

## Files to change

| File | Change |
|---|---|
| `supabase/functions/generate-illustration/index.ts` | Accept `customPrompt` and `referenceImage` fields |
| `src/components/TeachingEditor.tsx` | Add Cover Image management section with preview/accept flow |
| `src/pages/TeachingDetail.tsx` | Pass `coverImage` into TeachingEditor props |

