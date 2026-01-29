

## Plan: Fix Dad's Audio Import Issues and Improve the App

Based on the WhatsApp conversation, I've identified **6 issues** that need to be resolved. Here's the complete plan:

---

## Summary of Issues

| # | Issue | Priority |
|---|-------|----------|
| 1 | Large audio files fail (104MB+) - needs file size limits and guidance | High |
| 2 | Duplicate document_id error on save | High |
| 3 | Missing "Add New Question" button for manual Q&A entry | High |
| 4 | AI processing outputs as one long block without headings | Medium |
| 5 | Duplicate questions (original + AI-generated) | Medium |
| 6 | Preview app access | Immediate |

---

## Fix 1: Large Audio File Handling

**Problem**: Dad's 104MB Zoom recording was too large for the browser/edge function to process. The current system tries to read the entire file into memory as base64, which can crash browsers or hit edge function limits.

**Solution**: Add file size validation with helpful guidance

**Changes to `src/pages/Admin.tsx`**:
- Add a maximum file size check (50MB recommended limit)
- Display friendly error with compression tips if file is too large
- Show file size in the UI when audio is selected

```text
[Audio Import Tab]

Upload Audio File
┌─────────────────────────────────────────┐
│ Recording.m4a (52MB)                    │
│                                         │
│ ⚠️ Large file! Consider compressing to  │
│ reduce upload time and costs.           │
└─────────────────────────────────────────┘

Note: Files over 50MB may fail to upload. For long recordings,
compress to 64kbps mono MP3 to reduce file size by ~80%.
```

---

## Fix 2: Duplicate Document ID Error

**Problem**: When saving, error "duplicate key value violates unique constraint 'teachings_document_id_key'" appears. This happens because the `document_id` generator uses a count-based approach that can collide.

**Solution**: Use UUID-based document IDs to guarantee uniqueness

**Changes to `src/pages/Admin.tsx`** (Audio import save function):
- Change from: `D-${String((count || 0) + 1).padStart(3, "0")}`
- Change to: `D-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

This ensures unique IDs every time, preventing collisions.

---

## Fix 3: Add Manual Question Entry Button

**Problem**: Dad wants to manually add questions and answers to the "Have You Ever Pondered?" section, not just generate them via AI. Currently there's only a "Generate Questions" button.

**Solution**: Add an "Add Question" button next to the "Generate Questions" button

**Changes to `src/components/TeachingEditor.tsx`**:
- Add a new button "+ Add Question" that creates an empty question form
- Users can then fill in topic, question, common answer, and CBS answer manually

```text
Have You Ever Pondered?
[+ Add Question]  [✨ Generate Questions]

┌─────────────────────────────────────┐
│ Question 1                       [x]│
│ Topic: [___________________________]│
│ Question: [________________________]│
│ Common Answer: [___________________]│
│ CBS Answer: [______________________]│
└─────────────────────────────────────┘
```

---

## Fix 4: Improve AI Output Formatting

**Problem**: The processed transcript came out as "one long piece of talk" without proper headings and paragraph breaks. Dad had to use DeepSeek to add formatting.

**Solution**: Strengthen the system prompt to require structured headings

**Changes to `supabase/functions/process-transcript/index.ts`**:
Add explicit formatting instructions to the CCM_SYSTEM_PROMPT:

```text
**Structure:** 
- Maintain full essay-style paragraphs with relational transitions
- Use clear, bold headings to introduce major new topics or sections
- Numbered headings are appropriate for sequential concepts
- Bullet points are permitted for diagnostic questions and summary lists
- Avoid fragmented sentence phrasing outside of lists
```

This will ensure the AI produces well-structured output with proper headings.

---

## Fix 5: Handle Duplicate Questions

**Problem**: When processing audio, the AI generates a separate "questions" section, but Dad's original teaching content already includes questions. This leads to 2 sets of questions.

**Solution**: Update the system prompt to NOT generate a questions section in the processed content

**Changes to `supabase/functions/process-transcript/index.ts`**:
Add to CCM_SYSTEM_PROMPT:

```text
**Questions Handling:**
- Do NOT create a separate questions section at the end of the teaching
- If the original transcript contains Q&A segments, integrate them naturally 
  into the teaching prose or preserve them in their original location
- The app has a dedicated "Have You Ever Pondered?" section for structured 
  Q&A which is managed separately
```

This prevents duplication since questions are handled via the dedicated pondered_questions feature.

---

## Fix 6: Preview Access

I'll provide the preview URL so you can test the app with Dad's audio file.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Admin.tsx` | Add file size validation, fix document_id generation |
| `src/components/TeachingEditor.tsx` | Add "Add Question" button for manual entry |
| `supabase/functions/process-transcript/index.ts` | Add structure/formatting rules, prevent duplicate questions |

---

## Technical Details

### File Size Validation (Admin.tsx)

```tsx
const MAX_AUDIO_SIZE_MB = 50;
const MAX_AUDIO_SIZE_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024;

const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      toast({
        title: "File too large",
        description: `Maximum size is ${MAX_AUDIO_SIZE_MB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB. Try compressing to 64kbps mono MP3.`,
        variant: "destructive"
      });
      return;
    }
    setAudioFile(file);
    // ... rest of function
  }
};
```

### UUID-based Document ID (Admin.tsx)

```tsx
// Old (collision-prone):
const documentId = `D-${String((count || 0) + 1).padStart(3, "0")}`;

// New (unique):
const documentId = `D-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
```

### Add Question Button (TeachingEditor.tsx)

```tsx
<div className="flex items-center justify-between">
  <div>
    <Label className="text-base">Have You Ever Pondered?</Label>
    <p className="text-xs text-muted-foreground">Q&A section</p>
  </div>
  <div className="flex gap-2">
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setPonderedQuestions(prev => [...prev, {
        topic: "",
        question: "",
        commonAnswer: "",
        cbsAnswer: ""
      }])}
    >
      <Plus className="h-3.5 w-3.5 mr-1" />
      Add Question
    </Button>
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGeneratePondered}
      disabled={isGeneratingPondered}
    >
      {isGeneratingPondered ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
      Generate
    </Button>
  </div>
</div>
```

---

## Expected Results After Fixes

1. Large audio files get a clear error message with compression tips
2. Saving teachings never fails due to duplicate document IDs
3. Dad can manually add Q&A entries without using AI generation
4. Processed transcripts have proper headings and structure
5. No more duplicate questions sections

