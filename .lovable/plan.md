

# Redesign Logo as Old Wooden Printing Press

## Overview
Replace the current open-book emblem with a new logo depicting an old wooden printing press, rendered in antique gold tones with a fully transparent background so the leather texture shows through seamlessly.

## Approach

### 1. Generate the new logo via a temporary edge function
- Create `supabase/functions/generate-logo/index.ts` using the `google/gemini-2.5-flash-image` model
- Prompt: an antique wooden printing press (Gutenberg-style) rendered as a gold-leaf emblem/seal, monochrome antique gold on a fully transparent background, no frame, no rectangle, detailed woodcut/engraving style
- Extract the base64 PNG and upload it to the `assets` storage bucket

### 2. Replace the local asset
- Download the generated image and overwrite `public/images/logo-emblem.png`
- No code changes needed in Header or HeroSection since they already reference this file path

### 3. Clean up
- Delete the temporary edge function after the image is saved

## What stays the same
- Header logo size (40x40px) and placement
- Hero section large animated logo and its framer-motion entrance
- Favicon (already uses the same emblem file)
- All navigation links remain untouched

