
# Remove Theme Filter Badges from Teachings Page

## Problem
The theme filter badges (Covenant Theology, Biblical Language, Prophetic Literature, etc.) don't match any teaching data -- clicking them filters to zero results every time. They add clutter without functionality.

## Solution
Strip out the theme filter badges and related state/logic, keeping only the search bar.

## Changes

**File: `src/pages/Teachings.tsx`**

1. **Remove imports**: Remove `Filter`, `X` icons (if unused elsewhere), and `themes` from the data import
2. **Remove state**: Delete `selectedTheme` state variable
3. **Remove filter logic**: Remove the `matchesTheme` check from `filteredTeachings`
4. **Remove `clearFilters`**: Simplify or remove since only search remains
5. **Simplify the search/filter bar**: Remove the entire row of theme badges, the Filter icon, and the Clear button. Keep just the search input. Add a small "Clear" action inside/beside the search input when a query is active
6. **Update description text**: Change "Filter by phase, theme, or search" to just "Filter by phase or search for specific topics"

This is a straightforward UI cleanup -- no backend or data changes needed.
