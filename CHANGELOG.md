# V18 — Privacy fix + independent Network Tree

Base: V15, preserving the Spanish translation, White/Light theme and existing UI.

- Network Tree now loads only the logged-in user's own profile and real downline.
- Unrelated leaders, members and their prospects are not downloaded into the Network Tree.
- The position picker is limited to the current viewer's downline.
- The Network Tree remains a private visual layout stored on the current viewer's `networkLayout`.
- `uplineUid`, `uplinePath` and the real Team Dashboard structure are not modified by Network Tree actions.
- Existing Spanish selector and White/Light visual theme are preserved from V15.
- JavaScript syntax verified with `node --check`.
