# Specification

## Summary
**Goal:** Add a fullscreen mode to the GamePlayPage so users can play games in an immersive, full-browser-viewport experience.

**Planned changes:**
- Add a fullscreen toggle button to the GamePlayPage toolbar that uses the browser Fullscreen API (`document.documentElement.requestFullscreen`)
- Show an "Enter Fullscreen" icon when not in fullscreen and an "Exit Fullscreen" icon when active
- Listen to the `fullscreenchange` event to keep the button state in sync with the actual fullscreen state
- Hide the Header and Footer components when fullscreen is active
- Stretch the game canvas to fill the entire screen with no dead space when in fullscreen mode
- Restore Header, Footer, and normal layout when exiting fullscreen (via Escape or button click)

**User-visible outcome:** Players can click a fullscreen button on the game page to expand the game to fill their entire screen, with the header and footer hidden, and exit fullscreen by pressing Escape or clicking the button again.
