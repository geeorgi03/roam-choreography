# Claude Code: minimal context (token‑economical)

Give **just enough** for a correct change. Skip tutorials, full file dumps, and duplicate docs.

---

## 1. Always include (short)

| Give | Example |
|------|--------|
| **Goal** | One sentence: what must work when done. |
| **Scope** | Files or dirs allowed to touch; say “no unrelated refactors.” |
| **Definition of done** | “`pnpm exec turbo run build --filter=@roam/mobile` passes” or “screen X loads without error.” |
| **Constraints** | Stack facts only if non‑obvious: Expo 51, pnpm, no new deps. |

---

## 2. Include only if relevant

| Give | When |
|------|------|
| **Error text** | Paste the **smallest** block: 5–15 lines around the failure, not whole logs. |
| **One code excerpt** | 10–40 lines: the function or component **to change**, with 2–3 lines context. Use path + line range if the tool can read the repo. |
| **API / type contract** | One interface or endpoint signature if the bug is a mismatch. |
| **Env names** | Variable **names** only, not values (no secrets). |

---

## 3. Usually omit (wastes tokens)

- Entire files or repo trees pasted inline.
- Long PRDs unless the task is product discovery.
- Duplicating what’s already in the open file or `@`-referenced path.
- “Be careful” / “think step by step” unless debugging something subtle.

---

## 4. Good one‑shot template (copy‑paste)

```text
Goal: <one sentence>
Scope: <files or packages, e.g. apps/mobile/components/Foo.tsx only>
Done when: <test command or behavior>
Notes: <optional: 1–2 lines, e.g. “match theme in lib/theme.ts”>
```

If there’s a failure:

```text
Command: <exact command>
Error (excerpt): <paste 5–15 lines>
```

---

## 5. Repo‑specific pointers (Roam)

- Monorepo: **`pnpm`**, **`turbo`** — name the package: `@roam/mobile`, `@roam/api`, `@roam/web`.
- Shared types: **`packages/types`** — don’t restate full types unless changing them.
- Status / gaps: **`docs/IMPLEMENTATION_STATUS_AND_NEXT_STEPS.md`** — link or say “see IMPLEMENTATION_STATUS” instead of pasting it.

---

## 6. Prefer references over pastes

- **@path/to/file** (or your client’s equivalent) so the model reads the file instead of you duplicating it.
- One **grep‑able symbol** (`function saveClip`) beats a paragraph describing location.
