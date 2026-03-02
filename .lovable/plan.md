

# Ancient Leather-Bound Bible Redesign

## Vision

Transform the entire website from its current "warm scholarly" aesthetic into a rich, aged leather-bound Bible feel -- like discovering an ancient manuscript for the first time. The AI-generated cover images on teachings already have this golden, heavenly warmth; we're extending that across everything.

## What Changes

### 1. Color System Overhaul (index.css)

Shift the palette from "warm ivory/parchment" to deeper, richer tones that evoke aged leather and yellowed pages:

- **Background**: Deeper parchment/vellum tone (more saturated, slightly darker ivory)
- **Cards**: Aged paper with subtle warmth, like pages from an old book
- **Primary**: Richer, deeper leather brown (less amber, more saddle-leather)
- **Secondary**: Warm sepia tones instead of sage
- **Borders**: Leather-stitch style -- darker, more defined
- **Accents**: Antique gold leaf instead of bright amber
- **Muted tones**: Aged, foxed-paper quality

The dark mode will shift to deep, rich mahogany/espresso tones.

### 2. Texture and Atmosphere (index.css + components)

- Enhance the existing `texture-paper` utility to feel more like aged vellum/leather grain
- Add a new `texture-leather` utility for header areas and hero sections
- Subtle inner shadows on cards to create a "recessed page" feeling
- Slightly more rounded corners with visible "binding" borders on card edges

### 3. Hero Section Redesign (HeroSection.tsx)

- Deeper, richer gradient background evoking a leather book cover
- Add decorative corner flourishes (CSS-based ornamental borders)
- Title text with a slightly embossed/letterpress quality
- The badge becomes a gold-leaf ribbon style element

### 4. Teaching Reader -- "Page" Feel (InlineTeachingContent.tsx)

This is the biggest visual change. Instead of flowing text in a white container:

- **Page sections**: Each major content block (summary, paragraphs, scripture refs) gets subtle "page edge" styling -- a faint shadow on the left edge and slight cream background variation between sections, creating a visual rhythm like turning pages
- **Section dividers**: Replace plain `border-b` lines with decorative flourish dividers (a simple CSS ornament like `~***~` or a small cross/book icon)
- **Drop caps**: First paragraph of the teaching gets a large decorative initial letter (CSS `::first-letter` styling) -- classic old-book feel
- **Margins and gutters**: Wider left margin to suggest a book binding gutter
- **Background**: Alternating very subtle background tints between sections to create a "page stack" effect

### 5. Cards Throughout the Site (card.tsx, TeachingCard, QuestionCard)

- Teaching cards get an "old book cover" feel: slightly darker border-bottom to simulate depth, subtle leather-like shadow
- On hover, cards lift slightly with a warm gold inner glow instead of blue/gray shadows
- Question cards get a parchment background with a faint "ink on paper" feel

### 6. Header and Footer (Header.tsx, Footer.tsx)

- Header gets a darker leather-brown top bar
- Footer styled like the back cover or endpapers of a leather book
- Navigation links styled to look like a table of contents

### 7. Typography Refinements

- Slightly adjust heading weight and letter-spacing for a more "printed letterpress" feel
- Section headers get subtle small-caps treatment where appropriate

## What Stays the Same

- The overall layout and navigation structure
- All functionality (editor, book preview, search, etc.)
- The AI-generated cover images (they already match perfectly)
- The dual-path HTML/legacy rendering in the teaching reader
- Mobile responsiveness

## Files Modified

| File | What Changes |
|------|-------------|
| `src/index.css` | Color variables, textures, new utilities, prose styling |
| `src/components/HeroSection.tsx` | Richer background, decorative elements |
| `src/components/InlineTeachingContent.tsx` | Page-edge styling, drop caps, section dividers |
| `src/components/ui/card.tsx` | Leather-book card variants |
| `src/components/TeachingCard.tsx` | Styling tweaks for old-book feel |
| `src/components/QuestionCard.tsx` | Parchment styling |
| `src/components/Header.tsx` | Leather-tone header bar |
| `src/components/Footer.tsx` | Endpaper-style footer |
| `src/components/FeaturedQuestions.tsx` | Section styling |
| `src/components/MethodologyPreview.tsx` | Section styling |
| `src/components/PhaseOverview.tsx` | Section styling |
| `tailwind.config.ts` | Any new animation keyframes or utilities |

## Risk

**Low-medium.** This is purely visual -- no database, API, or logic changes. All changes are CSS variables, Tailwind classes, and component styling. The teaching reader content rendering (HTML/legacy paths) remains untouched.

