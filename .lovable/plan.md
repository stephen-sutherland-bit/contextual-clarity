

# Improve Search Functionality Across All Pages

## Problems Found

1. **Questions page** -- search only matches the exact question text. Typing a topic like "covenant" or "trinity" returns nothing unless that word appears verbatim in the question. Users expect to search by topic and find relevant questions. Also missing a clear button.

2. **Search page** -- the "Themes" results section links to `/teachings?theme=...`, but theme filtering was just removed from the Teachings page, so those links are dead ends.

3. **Teachings page** -- search doesn't check `quickAnswer` (the teaching summary) or `primaryTheme`, so topical searches miss relevant results.

## Plan

### 1. Improve Questions page search (src/pages/Questions.tsx)

- Expand filtering to also match against `teachingTitle` and `quickAnswer`, not just `question`
- Add word-level matching: split the search query into individual words and match if ALL words appear somewhere across the question, teaching title, or quick answer (so "what is trinity" finds questions about the trinity even if the exact phrase isn't there)
- Add a clear (X) button to the search input, consistent with the Teachings page
- Update placeholder to "Search questions, topics, answers..." to hint at broader search

### 2. Fix Search page dead theme links (src/pages/Search.tsx)

- Remove the hardcoded `themes` import and the "Themes" results section entirely, since theme filtering no longer exists on the Teachings page
- Clean up the unused import

### 3. Broaden Teachings page search (src/pages/Teachings.tsx)

- Add `quickAnswer` and `primaryTheme` to the search filter logic so topical searches surface more relevant teachings

## Technical Details

**src/pages/Questions.tsx**:
- Change `filteredQuestions` filter from single-field exact substring to multi-field word matching
- Add `X` icon import and clear button UI next to search input
- Update search placeholder text

**src/pages/Search.tsx**:
- Remove `themes` import from `@/data/teachings`
- Remove `matchedThemes` computation from the `results` useMemo
- Remove the "Themes" results section from JSX
- Remove `Tag` icon import

**src/pages/Teachings.tsx**:
- Add two lines to the `matchesSearch` filter: `teaching.quickAnswer.toLowerCase().includes(...)` and `teaching.primaryTheme.toLowerCase().includes(...)`

