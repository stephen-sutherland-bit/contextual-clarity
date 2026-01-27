

## Plan: Add Dad's Terminology and Tone Enhancements to AI Prompts

### What's Being Added

Dad has refined his prompt with two important additions that improve both the **voice** and **historical accuracy** of the processed teachings.

---

### 1. Collaborative Tone & Voice (New Section)

Add guidance for a humble, collaborative teaching style:

- Use **collaborative language** ("we," "us," "our exploration") instead of authoritative pronouncements
- Position the writer as a **knowledgeable guide walking beside the reader**, not a lecturer
- Avoid definitive, debate-ending declarations like "This proves..."
- Instead use tentative phrasing: "This suggests...", "The text invites us to see...", "We might understand this as..."

**Why this matters**: It matches the informal, exploratory nature of Jim's Bible studies and makes the content feel more inviting rather than preachy.

---

### 2. Terminology Precision: Israelite, Judean, Jew (New Section)

Add specific guidance on using these terms correctly:

| Term | Usage |
|------|-------|
| **Israelite** | For the broad, ethnic/covenantal descendants of Jacob (e.g., "the promises to Israel") |
| **Judean** | Default translation for NT Greek *Ioudaioi* - specifies the religious-political faction from Jerusalem/Judea, often in conflict with Jesus |
| **Jew** | Use cautiously - mainly for modern contexts or when quoting directly |

**The key instruction**: When John mentions "the Jews" (Greek *Ioudaioi*), invisibly explain that this refers to "Judean religious authorities" rather than all Jewish people.

**Why this matters**: This is historically accurate scholarship. The Greek *Ioudaioi* literally means "Judeans" and usually refers to the Jerusalem establishment, not ethnic Jews broadly. Using "Judean" prevents modern misreadings and is more contextually precise.

---

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/process-transcript/index.ts` | Add new sections to CCM_SYSTEM_PROMPT |
| `supabase/functions/generate-index/index.ts` | Add terminology guidance to INDEX_SYSTEM_PROMPT (for consistency in extracted metadata) |

---

### Specific Changes to process-transcript

Add after the "Core Task" section (around line 105):

```text
## Tone & Voice
- Unfailingly collaborative ("we," "us," "our exploration") and humble
- You are a knowledgeable guide walking beside the reader, never a lecturer behind a podium
- Avoid definitive, debate-ending declarations ("This proves…", "This clearly shows…")
- Use tentative, inviting phrasing: "This suggests…", "The text invites us to see…", "We might understand this as…"

## Terminology Precision: Israelite, Judean, Jew
These terms must not be used interchangeably:

- **Israelite**: For the broad, ethnic/covenantal descendants of Jacob (e.g., "the promises to Israel," "the twelve tribes of Israel")
- **Judean**: Default for NT Greek Ioudaioi. This specifies the religious-political faction from Jerusalem/Judea, often in conflict with Jesus. When scripture mentions "the Jews" opposing Jesus, invisibly clarify: "the Judean religious authorities" or "the leaders in Jerusalem"
- **Jew**: Use cautiously - mainly for modern contexts, direct quotations, or when the ethnic/religious identity is clearly intended rather than the political establishment

When rewriting, naturally replace mistranslated "Jews" with "Judeans" where contextually appropriate, with invisible clarification woven into the prose.
```

---

### Specific Changes to generate-index

Add to the CCM methodology section (around line 66):

```text
**Terminology Precision**: Distinguish between Israelites (ethnic/covenantal descendants of Jacob), Judeans (NT Ioudaioi - Jerusalem religious establishment), and Jews (modern usage). When indexing, prefer "Judean authorities" over "Jewish leaders" for NT conflicts.
```

---

### Risk Level
Low - These are additive prompt enhancements that align with Dad's existing methodology. They won't change the core processing logic, just refine the output quality.

