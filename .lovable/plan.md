

# Plan: Strengthen CCM Theological Accuracy in the Rewrite Prompt

## The Problem

The AI rewrite process produces well-structured, beautifully formatted teachings, but the theological content is not consistently aligned with CCM. The AI starts with **consensus/modern definitions** of biblical terms (like "love") and then tries to conform them to CCM, rather than using the correct lexical and covenantal definitions from the outset. This results in teachings that look CCM on the surface but contain subtle theological errors Jim and Dad have identified.

The Word document Dad sent shows a detailed analysis where DeepSeek was used to check our AI's output against strict CCM standards. The key issues are:

1. **"Love" used with modern emotional meaning** instead of its covenantal definition (love-as-mercy downward, love-as-gratitude upward)
2. **Transpositional application** -- the AI takes first-century transitional commands and applies them as timeless blueprints for today, instead of grounding them in their specific covenantal jurisdiction
3. **Inconsistent covenant location** -- AD 70 context is applied to some passages (like Ananias and Sapphira) but not others (like household codes in Ephesians 5)
4. **Pastor/Elder offices treated as permanent** when CCM sees them as transitional structures for the AD 30-70 period
5. **NT ecclesial instructions read as permanent blueprints** instead of transition-era guidance

## What We Keep (No Changes)

- All formatting, layout, heading detection, and rendering logic stays exactly as it is
- The 4-Step Guided Discovery Framework structure
- The pedagogical scaffolding approach
- The tone and voice guidelines
- The expansion mandate
- The end-matter format (Appendix, Key Takeaways, Credit Line)
- All the formatting rules (bold markers, NZ English, Maori terms, etc.)

## What Changes (Prompt Content Only)

We add a new section to the system prompt called **"CCM LEXICON: WORDS THE AI MUST NOT USE WITH MODERN DEFINITIONS"** that teaches the AI the correct covenantal definitions of commonly misused biblical terms BEFORE it processes any content. This addresses Jim's core concern: the AI needs to understand these definitions before it can write CCM-consistent content.

### New Section: CCM Lexicon

This section will define the correct usage of terms the AI consistently gets wrong because it defaults to consensus theology:

**Love (Hebrew: chesed / ahav; Greek: agape / eleos)**
- NOT a universal emotion or feeling of warmth/affection
- In covenant context, "love" is a directional action defined by the relationship structure:
  - Love-as-mercy: flows DOWNWARD from authority/ability to those under care (husband to wife, parent to child, God to humanity). It is intentional charitable action, not sentiment.
  - Love-as-gratitude: flows UPWARD from the recipient of mercy toward the giver (humanity to God, child to parent). Often expressed as honour and obedience.
- Hebrew/Aramaic has no specific word for "gratitude" -- words like love, praise, bless, glorify were used to express thanks (Stein, Luke, NAC, 237)
- Hebrew chesed fluctuates between covenant faithfulness, obligation, and mercy -- the LXX translates it as eleos (mercy), not agape (love)
- When the text says "love your neighbour," it means: show covenantal mercy/gratitude depending on the directional relationship
- NEVER describe God's character as "loving" in the modern emotional sense. God shows MERCY downward. Humanity responds with GRATITUDE upward.

**Neighbour**
- NOT anyone geographically nearby or any fellow human
- A covenantal term: a fellow member of the covenant community who has obligations toward you and you toward them
- The Good Samaritan parable redefines "neighbour" by action (the one who shows mercy), not by proximity or ethnicity

**Church / Ekklesia**
- NOT a permanent institutional structure with offices, buildings, and programmes
- In the NT: the transitional gathering of believers during the AD 30-70 covenant shift
- Post-AD 70: the spiritual whanau (family) of God -- organic, led by Christ alone, no mediating human clergy class
- Do NOT prescribe modern church structures, programmes, or offices as normative

**Pastors / Elders / Overseers**
- These offices are detailed ONLY in transition literature (Pastoral Epistles, c. AD 50-70)
- Their function was intra-covenantal: to provide order during the unstable final years of the Mosaic Covenant
- They are NOT permanent offices for the post-AD 70 New Covenant community
- The New Covenant community has Christ as sole overseer; teaching emerges organically from maturity and gifting

**Spirit / Holy Spirit**
- Do not use Trinitarian language (e.g., "third person of the Trinity")
- The Spirit is God's power and presence at work, not a separate divine person

**Disciple**
- In the Gospels: specifically a follower of Jesus during His earthly ministry, within the Mosaic Covenant context
- Do NOT transpose "discipleship" as a permanent programme or modern church activity

**Evangelism / Great Commission**
- The Great Commission (Matthew 28:19-20) was a specific charge to the apostles to proclaim the gospel to all nations BEFORE the end of the Mosaic age
- This was accomplished before AD 70
- "Evangelism" as modern organised outreach is NOT a New Covenant command

**Sheep / Lost / Wolves**
- These are intra-covenantal Israelite metaphors, not universal categories
- "Lost sheep" = unfaithful Israel, not modern unbelievers
- "Wolves" = false teachers within the transitional covenant community

### Enhanced Section: Strict Anti-Transposition Rules

Add explicit rules to prevent the AI from extracting "timeless principles" from transitional texts:

- EVERY NT command must first be located in its covenantal jurisdiction (Mosaic transition period, AD 30-70)
- Application to post-AD 70 believers is TRANSFORMATIVE (understanding how God's completed work shapes our reality), NEVER TRANSPOSITIONAL (directly copying transitional-era instructions as permanent rules)
- When discussing NT household codes (Ephesians 5, Colossians 3, 1 Peter 3), ALWAYS note these were given to believers navigating Greco-Roman social structures during the covenant transition -- they are NOT timeless blueprints for marriage, parenting, or employment
- When discussing church structure, NEVER present first-century organisational models as normative for today
- The AD 70 covenantal lens must be applied CONSISTENTLY to ALL passages, not selectively to "difficult" ones

### Enhanced Section: The Five Diagnostic Questions

Before interpreting ANY passage, the AI must explicitly (but invisibly in the prose) answer these five questions:

1. **Governance**: Which covenant governs this text? (Mosaic, Transitional, or New?)
2. **Audience**: Who specifically is being addressed? (Israelites, Judeans, transition-era believers, or post-AD 70 believers?)
3. **Instrumental Mode**: How does the operative covenant function here? (Material/External/National or Spiritual/Internal/Universal?)
4. **Covenant History Location**: Where does this sit on the biblical timeline? (Pre-Christ, AD 30-70 transition, or post-AD 70?)
5. **Fulfilment Horizon**: When was/is this fulfilled? (In the original audience's lifetime, at AD 70, or ongoing?)

---

## Technical Details

### File Changed: `supabase/functions/process-transcript/index.ts`

Only the `CCM_SYSTEM_PROMPT` string will be modified. No structural, formatting, or code logic changes.

**Additions to the prompt (inserted after the existing TERMINOLOGY MANDATES section):**

1. A new "CCM LEXICON" section (~400 words) defining love, neighbour, church, pastors/elders, spirit, disciple, evangelism, and sheep/lost/wolves with their correct CCM meanings
2. A new "ANTI-TRANSPOSITION RULES" section (~150 words) with explicit instructions to prevent extracting timeless principles from transitional texts
3. Enhancement of the existing "5 Diagnostic Questions" to make them more prominent and mandatory
4. Strengthening of the existing doctrinal positions section to add the pastor/elder transitional nature and the church-as-whanau post-AD 70 understanding

**Modifications to existing sections:**

- The "Mercy not Love" terminology mandate will be expanded with Jim's scholarly definitions (chesed/eleos, the directional love framework from the Substack article)
- The "Covenantal Mislocation" section will be strengthened with explicit examples of transposition the AI must avoid
- The existing doctrinal positions will add "NT Ecclesial Structures as Transitional" as a new invisible doctrine

### What This Does NOT Change

- No changes to `InlineTeachingContent.tsx` or any other frontend file
- No changes to the edge function's code logic, streaming, auth, or error handling
- No changes to the end-matter format, heading format, or any rendering rules
- The prompt's structure and formatting instructions remain identical
- The 4-Step Framework, pedagogical scaffolding, tone/voice, and analogies all stay the same

### Risk Assessment

**Low risk** -- we are only adding theological precision to the system prompt. The formatting, structure, and all code remain untouched. Existing teachings are unaffected; only new rewrites will use the updated prompt.

The main risk is that the prompt becomes quite long, but Gemini 2.5 Pro handles large context windows well and the existing prompt is already substantial.

