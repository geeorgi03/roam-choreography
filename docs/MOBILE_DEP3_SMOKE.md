# Mobile DEP-3 device smoke checklist

Human sign-off for soft launch. Mirror of [DEPLOYMENT.md](../DEPLOYMENT.md) § DEP-3 with mobile-specific notes.

**Environment:** production API, Supabase auth redirect `roam://**`, physical iPhone or iPad (not simulator-only for final sign-off).

| # | Flow | Steps | Expected | Tester | Date | Pass |
|---|------|-------|----------|--------|------|------|
| 1 | Auth sign-up | Create account | No paywall (beta unlock) | | | [ ] |
| 2 | Email confirm | Open link | `roam://auth/callback`, signed in | | | [ ] |
| 3 | Sign-in | Credentials | Home sessions list | | | [ ] |
| 4 | Create session | + New session | Appears in list | | | [ ] |
| 5 | Music YouTube | Session → add URL | Beat grid / sections | | | [ ] |
| 6 | Music upload | File upload (if Mux live) | Analysis completes | | | [ ] |
| 7 | Capture | Record → save | Clip uploads to ready | | | [ ] |
| 8 | Gallery import | Import video | Same as capture | | | [ ] |
| 9 | Tag clip | Open clip → tags | Saved on card | | | [ ] |
| 10 | Share link | Share → copy | Production `SHARE_BASE_URL` | | | [ ] |
| 11 | Public share | Browser open URL | Renders without auth | | | [ ] |
| 12 | Revoke share | Revoke | 404 on reload | | | [ ] |
| 13 | Dev settings | Profile badge 5× | API override works | | | [ ] |
| 14 | API health | GET production `/` | `{ name, version }` | | | [ ] |
| 15 | **Group collab** | Choreographer invite → dancer joins Group tab | Live dots + broadcasts | | | [ ] |
| 16 | **iPad landscape** | Rotate iPad, open session | Split layout: tabs left, section/loop/takes right | | | [ ] |
| 17 | **Spatial pen** | Spatial → Pen → draw → undo | Stroke persists on moment switch | | | [ ] |
| 18 | **Loop experiment** | Set loop → Record take → compare in clip sheet | Other takes row switches clips | | | [ ] |

Attach screenshots or screen recording for rows 15–18 when marking PRD matrix evidence.
