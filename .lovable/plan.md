

# Plan: Align the Rewrite Prompt with Jim's CCM Outline and DeepSeek Analysis

## Background

Dad fed the latest reprocessed teaching ("Church Reform") into DeepSeek for a CCM consistency check. DeepSeek identified eight anomalies where the AI's output drifted from strict CCM. Jim also sent two updates to the CCM Outline document with specific wording changes. This plan incorporates all of these corrections into the system prompt.

## What Stays the Same

- All formatting, layout, heading detection, bullet point rendering, italic answers
- The 4-Step Guided Discovery Framework
- Pedagogical scaffolding, tone, voice, analogies
- End-matter structure (Appendix, Key Takeaways, Credit Line)
- All NZ English, Maori terms, and formatting rules
- No frontend or parser changes whatsoever

## What Changes (Prompt Text Only)

Seven specific corrections to the `CCM_SYSTEM_PROMPT` string in `supabase/functions/process-transcript/index.ts`:

---

### 1. Jim's Section I Wording Update

**Current prompt text (in the methodology descriptions):**
References to "the covenant in effect at the time of a text's production"

**Change to:**
"The covenant that pertains to the external and internal contexts of a text" -- this shifts from a purely temporal definition to a broader contextual one, per Jim's second email.

---

### 2. Jim's Updated 3rd and 4th Foundational Presuppositions

Add Jim's precise wording to the doctrinal positions section:

**3rd Presupposition (updated):**
"The eschaton is understood as historically completed in the first century. It culminated in the events surrounding the destruction of Jerusalem and the Second Temple in AD 70, the physical manifestation of the Lord's Parousia. The Parousia marks the replacement of the temporal Mosaic Covenant as an operative covenantal system with the eternal New Covenant."

**4th Presupposition (updated):**
"The New Testament texts hold primacy within the biblical canon for interpretation. The New Testament is the inspired record of the earthly ministry of Jesus and the last days of the Mosaic Covenant. As such, they provide the contextual lens through which the meaning and trajectory of the Old Testament texts are re-situated in redemptive history."

---

### 3. "Semper Reditus" Not "Semper Reformanda"

DeepSeek identified that the AI used the Protestant concept of "always reforming" when CCM's position is "always returning" to the completed apostolic foundation.

**Add to the Anti-Transposition Rules:**
- NEVER frame the process of understanding Scripture as "ongoing reformation" or "Semper Reformanda." CCM's position is "Semper Reditus" (always returning) -- the apostolic testimony was delivered once for all (Jude 3, hapax). Our task is not to reform, develop, or progress beyond the apostles but to return to what they actually taught in their specific covenantal context. The faith is not progressively refined through history; it was complete in the first century and has been departed from.

---

### 4. Strengthen the Disciple/Believer Distinction

The existing "Disciple" lexicon entry is too brief. DeepSeek's analysis and the corrected teaching show this is a major CCM position.

**Replace the current "Disciple" entry with:**

**Disciple (mathetes) vs. Believer (pistos)**
- "Disciple" (mathetes) means a learner or adherent attached to a rabbi/teacher. This described a relationship that existed exclusively during the Mosaic age and the AD 30-70 transition. Jesus was a rabbi operating within the Mosaic administration; He had disciples. This was appropriate to that covenantal setting.
- Post-AD 70, the New Covenant does NOT have disciples. It has believers (pistoi -- faithful ones, trusting ones). The New Covenant promise (Jeremiah 31/Hebrews 8) explicitly announces the end of the master-student mode: "They shall not teach, each one his neighbour... for they shall all know me."
- NEVER use "discipleship" as a current identity or activity. Do NOT speak of "being disciples" or "making disciples" as if these were post-AD 70 mandates. Modern "discipleship programmes" are covenantal mislocation -- they project a first-century rabbi-student relationship across a covenantal boundary.
- When the source transcript uses "disciple" language about modern believers, reframe it: we are not disciples (mathetes); we are believers (pistoi) in whom the Spirit dwells, who know God directly.

---

### 5. Nuance the Great Commission / Evangelism Entry

DeepSeek noted the AI either over-applies or under-applies the Great Commission's fulfillment. The corrected position distinguishes between horizon and content.

**Replace the current "Evangelism's Completed Purpose" doctrinal position with:**

**The Great Commission: Horizon vs. Content**
- The Great Commission (Matthew 28:19-20) was given to first-century disciples living under the Mosaic Covenant. Its eschatological horizon was "the end of the age" -- the AD 70 terminus of the Mosaic system. That transitional generation fulfilled it.
- However, the content of the commission (teaching, forming communities of believers) describes the natural character of New Covenant life -- now operating WITHOUT the urgency of imminent judgement and WITHOUT the institutional scaffolding of the transitional period.
- Do NOT present the Great Commission as an ongoing institutional mandate requiring organised outreach programmes, missions budgets, or "evangelism strategies." These are modern corporate projections onto a first-century transitional command.
- Do NOT present the Great Commission as completely irrelevant either. The mode of New Covenant community (mutual edification, teaching, hospitality) naturally flows from the Spirit's work, but it is not "obeying the Great Commission" -- it is living as believers (pistoi) in the New Covenant age.

---

### 6. Eliminate "Timeless Truth" Language

DeepSeek flagged this as a core methodological inconsistency. CCM's entire point is that truths are covenantally situated, not "timeless."

**Add to the Anti-Transposition Rules:**
- NEVER describe any biblical teaching as a "timeless truth," "timeless principle," or "universal principle that transcends covenantal boundaries." This language directly contradicts CCM's insistence that meaning is determined by covenantal jurisdiction. Instead, explain how understanding God's completed covenantal work shapes our present reality -- this is transformative application, not the extraction of timeless abstractions.

---

### 7. No First-Century Forms as Normative Blueprint

DeepSeek identified that the AI treated house churches and Acts 2:42 practices as normative while correctly treating pastoral offices as transitional. This is inconsistent.

**Add to the Anti-Transposition Rules:**
- Do NOT treat first-century ecclesial FORMS (house churches, shared meals, the fourfold devotion of Acts 2:42) as normative blueprints for post-AD 70 life. These descriptions are ALSO part of transition literature. The New Covenant provides NO external blueprint for community structure, worship format, or gathering style. Post-AD 70 believers are free to organise communal life as the Spirit guides, since the New Covenant operates through internal transformation, not external codification.
- When critiquing modern institutional church practices, do so on the basis that they import Mosaic-era external/material modes into New Covenant life -- NOT on the basis that they fail to replicate first-century transitional forms. The error is the instrumental mode (external vs. internal), not the specific historical form.

---

## Technical Details

### File Changed
`supabase/functions/process-transcript/index.ts` -- only the `CCM_SYSTEM_PROMPT` string constant. No code logic, streaming, auth, or structural changes.

### Specific Locations in the Prompt

1. **Covenantal Mislocation section** (line ~203): Update the covenant definition wording per Jim's change
2. **CCM Lexicon - Disciple entry** (line ~230-231): Replace with expanded mathetes/pistos distinction
3. **Anti-Transposition Rules section** (lines ~238-246): Add three new rules (Semper Reditus, no timeless truth, no first-century forms as normative)
4. **Doctrinal Positions section** (lines ~263-283): Update the AD 70 and NT Primacy positions with Jim's exact wording; replace the Evangelism entry with the nuanced Great Commission position

### Risk Assessment

**Low risk.** Only prompt text changes. All formatting, structure, and code logic remain untouched. Existing teachings are unaffected; only new rewrites will use the updated prompt.

