# Specification

## Summary
**Goal:** Add six new games (Fortnite, Brawl Stars, Clash of Clans, Minecraft, FIFA 26, Geometry Dash) to the Arcade Hub game library.

**Planned changes:**
- Add six new game cards to the GameLibrary grid, each with a thumbnail, genre badge, title, short description, and "Play Now" button styled with the neon arcade theme
- Add dedicated play pages at `/play/$gameId` for each new game, embedding their respective URLs in a full-width iframe consistent with the existing GamePlayPage pattern
- Update the Header game count badge to show 10 games and expand the Footer game list to include all ten games

**User-visible outcome:** Users can browse and play all ten games in the Arcade Hub, with the six new titles appearing as styled cards in the library and launching in their own full-screen iframe play pages.
