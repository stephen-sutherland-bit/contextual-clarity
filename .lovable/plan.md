

# Real Leather-Bound Texture Overhaul

## What We're Doing

The current "leather" and "paper" textures are built from CSS gradients -- they look flat and fake. To get the real look from your reference photos (that beautiful aged leather cover with the clasp, the burnt/foxed pages inside), we need **actual texture images** as tiled backgrounds.

We'll generate two seamless, tileable texture images using AI image generation and apply them across the site, so it genuinely looks and feels like you're reading from an ancient leather-bound book.

## The Two Textures

1. **Leather texture** -- Rich, brown leather grain with subtle wear marks. Applied to: header bar, hero section, footer, teaching reader header/footer. This replaces the current flat brown gradient.

2. **Aged parchment/vellum texture** -- Yellowed, slightly crinkled paper with foxing marks and burnt/darkened edges. Applied to: all page backgrounds, card backgrounds, the teaching reader content area. This replaces the current almost-invisible CSS gradient paper texture.

## What Changes

### Step 1: Generate Texture Images
- Use the AI image generation endpoint to create two seamless tileable textures (1024x1024):
  - `public/textures/leather-grain.png` -- dark brown leather grain
  - `public/textures/aged-parchment.png` -- warm, aged paper with foxing
- These will be small, optimised files that tile seamlessly

### Step 2: Update CSS Textures (src/index.css)
- Replace `.texture-leather::before` gradient mess with a simple `background-image: url('/textures/leather-grain.png')` tiled repeat
- Replace `.texture-paper::before` gradient mess with `background-image: url('/textures/aged-parchment.png')` tiled repeat
- Add a new `.texture-page-burnt` utility that overlays a vignette/burnt-edge effect on content areas (using CSS radial gradients for the darkened corners, like in the reference photo)
- Adjust color variables slightly -- the parchment background should be warmer/more golden to match the aged paper in the reference photos

### Step 3: Apply Burnt-Edge Page Effect to Teaching Reader (InlineTeachingContent.tsx)
- Add burnt/darkened edge vignette around the content area using CSS box-shadow and radial gradients
- Each content section (summary, full teaching, questions, scriptures) gets a subtle "page" background with the parchment texture and darkened edges
- The overall reader background gets a slightly darker parchment to create depth between the "pages" and the background

### Step 4: Update Header, Footer, Hero (Header.tsx, Footer.tsx, HeroSection.tsx)
- These already use `texture-leather` -- the new real texture will automatically apply
- Minor adjustments to ensure the leather texture image tiles properly with the existing overlay colours

### Step 5: Cards and Content Areas (card.tsx, TeachingCard.tsx, QuestionCard.tsx)
- Teaching cards get the parchment background texture
- Add subtle darkened-edge vignette to cards for that "aged page" feel

### Step 6: All Page Wrappers (Index.tsx, Teachings.tsx, Questions.tsx, etc.)
- These already use `texture-paper` -- the new texture image will automatically flow through
- No component changes needed for these

## Files Modified

| File | What Changes |
|------|-------------|
| `src/index.css` | Replace CSS gradient textures with real image-based textures, add burnt-edge utility, adjust parchment colours |
| `src/components/InlineTeachingContent.tsx` | Add burnt-edge vignette to content sections for "aged page" look |
| `src/components/ui/card.tsx` | Add parchment texture class to card variants |
| `src/components/TeachingCard.tsx` | Minor styling for aged-page feel |
| `src/components/QuestionCard.tsx` | Minor styling for aged-page feel |

## Files Created

| File | What |
|------|------|
| `public/textures/leather-grain.png` | AI-generated tileable leather texture |
| `public/textures/aged-parchment.png` | AI-generated tileable aged paper texture |

## What Stays the Same

- All layout, navigation, and functionality
- The teaching reader's content rendering logic
- Dark mode (textures will be overlaid with opacity adjustments)
- All existing component structure

## Technical Note

The texture images are generated once and stored as static assets in `public/textures/`. They're small tileable images (~50-100KB each) that repeat seamlessly. This approach is how professional sites achieve realistic material textures -- CSS gradients simply cannot replicate real leather grain or paper crinkle.

