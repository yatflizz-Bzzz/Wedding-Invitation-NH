# Security Specification: Wedding RSVP & Visitor Feedback Tracker

## 1. Data Invariants

1. **PII Isolation (Split Collection Invariant)**:
   - Public visitors can read aggregate attendance metrics and the guestbook from `/public_wishes/{rsvpId}`, which **never** stores `phone`, `email`, `dietaryNotes`, `feedbackComment`, or `organizerNotes`.
   - Private guest contact details and private feedback live strictly in `/rsvp_submissions/{rsvpId}`, readable and mutable **only** by the verified organizer (`mnorhidayat2000@gmail.com` with `email_verified == true` or trusted `/admins/{uid}`).
2. **Atomic Batch Consistency (`existsAfter` / `getAfter`)**:
   - Creating `/rsvp_submissions/{rsvpId}` MUST atomically create `/public_wishes/{rsvpId}` in the same Firestore batch with identical `id`, `fullName`, `side`, `status`, `guestCount`, `sessionTime`, `wishes`, `feedbackRating`, and `createdAt`.
   - Conversely, creating `/public_wishes/{rsvpId}` MUST atomically create `/rsvp_submissions/{rsvpId}` in the same batch so orphan public records cannot be spammed out-of-band.
3. **Immutable Visitor Audit Fields & Server Time**:
   - `createdAt` (and `updatedAt` on create) MUST equal `request.time`.
   - On visitor create, `checkedIn` MUST be `false` and `organizerNotes` MUST be `""`.
   - On organizer update, `id` and `createdAt` MUST remain unchanged (`incoming().id == existing().id && incoming().createdAt == existing().createdAt`).
4. **Strict Field Allowlisting & Volumetric Bounds**:
   - Every string enforces explicit `.size()` min/max bounds matching `firebase-blueprint.json`.
   - Unknown/ghost keys are rejected via combined `hasAll(...)` and `hasOnly(...)`.
   - Document IDs must match `^[a-zA-Z0-9_\-]+$` and length `4..128`.
5. **Verified Organizer Access Only**:
   - Any email-based organizer check strictly requires `request.auth.token.email_verified == true`.
   - Client-only `update`/`delete` on `/public_wishes/{rsvpId}` is restricted to verified admins (`isAdmin()`).

---

## 2. The "Dirty Dozen" Adversarial Payloads

| # | Attack Vector | Target Collection | Expected Outcome |
|---|---------------|-------------------|------------------|
| 1 | **PII Blanket Read** — Unauthenticated or non-organizer signed-in user executes `get`/`list` on `/rsvp_submissions` | `rsvp_submissions` | `PERMISSION_DENIED` |
| 2 | **Email Spoofing Attack** — Signed-in user with `email == "mnorhidayat2000@gmail.com"` and `email_verified: false` reads `/rsvp_submissions` | `rsvp_submissions` | `PERMISSION_DENIED` |
| 3 | **Shadow / Ghost Field Injection** — Visitor creates RSVP with extra field `{ isAdmin: true }` or `{ verified: true }` | `rsvp_submissions` / `public_wishes` | `PERMISSION_DENIED` |
| 4 | **Orphaned Public Wish Write** — Visitor writes to `/public_wishes/{id}` without matching `/rsvp_submissions/{id}` in same batch | `public_wishes` | `PERMISSION_DENIED` |
| 5 | **Orphaned Private RSVP Write** — Visitor writes to `/rsvp_submissions/{id}` without matching `/public_wishes/{id}` in same batch | `rsvp_submissions` | `PERMISSION_DENIED` |
| 6 | **Forged Check-In / Organizer Notes on Create** — Visitor submits `{ checkedIn: true, organizerNotes: "VIP" }` on initial RSVP | `rsvp_submissions` | `PERMISSION_DENIED` |
| 7 | **Timestamp Spoofing** — Visitor submits backdated `createdAt` instead of `request.time` | `rsvp_submissions` / `public_wishes` | `PERMISSION_DENIED` |
| 8 | **Path ID Poisoning** — Visitor writes to `/rsvp_submissions/` with ID containing invalid chars (`foo$bar`) or length `> 128` | `rsvp_submissions` | `PERMISSION_DENIED` |
| 9 | **Denial of Wallet String Flood** — Visitor submits 50KB string in `wishes` or `feedbackComment` (`> 400` chars) | `rsvp_submissions` / `public_wishes` | `PERMISSION_DENIED` |
| 10 | **Cross-Doc Mismatch in Batch** — Batch creates `public_wishes/id1` with `fullName: "A"` and `rsvp_submissions/id1` with `fullName: "B"` | `rsvp_submissions` | `PERMISSION_DENIED` |
| 11 | **Immutable Timestamp Tampering** — Update attempts to mutate `createdAt` or `id` on `/rsvp_submissions/{id}` | `rsvp_submissions` | `PERMISSION_DENIED` |
| 12 | **Self-Assigned Admin Escalation** — Non-organizer signed-in user attempts to create `/admins/{uid}` with `{ role: "admin" }` | `admins` | `PERMISSION_DENIED` |
