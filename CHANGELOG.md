# ProTracker V24

## Clean Team Dashboard architecture
- Team Dashboard loads users ONLY by explicit `uplineUid` traversal from the logged-in user.
- `uplinePath` is no longer used to decide Dashboard membership.
- Unrelated platform users cannot enter the Team Dashboard dataset through a stale path.
- Team placement is private: `users/{viewerUid}.teamLayout[memberUid] = {leg, order}`.
- Destra/Sinistra never writes to the member's document and never changes `uplineUid`/`uplinePath`.
- Any member in the authenticated user's downline can be assigned left/right.
- Network Tree remains separate and uses `networkLayout`.
