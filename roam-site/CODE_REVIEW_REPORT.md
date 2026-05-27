# Roam App — Production Code Review Report

**Reviewer:** Claude (automated deep review)  
**Date:** 2026-05-13  
**Scope:** `app.js`, `index.html`, `styles.css`, `scripts/check-static-site.mjs`, `tests/`  
**Check results:** `npm run check` ✅ passed | E2E requires browser install (not run in sandbox)

---

## Pre-Review: Static Check Results

```
npm run check → Static site check passed. ✅
```

The check script confirms `index.html`, `vercel.json`, doctype, title, `app.js`, and `styles.css` references are all present. The five E2E test files exist and cover: core-flows, cloud-queue, growth-validation, media-smart-handling, and share-pack.

---

## 1. CRITICAL ISSUES (must-fix before release)

---

### C-1 · XSS via `javascript:` Protocol in Reference URLs

**Severity:** Critical — Remote code execution in user's browser  
**Files:** `app.js` L614–620, L1762, L1556–1563  

**Why it matters:**  
The `importSharePack()` function pushes reference URLs from a decoded payload directly into `state.references` without any URL validation (L614–621). `hydrateFromPayload()` (cloud pull path, L1762) does the same via `normalizeReferences()`. Neither path calls `isLikelyUrl()`. These references are then rendered in `renderReferences()` as:

```js
<a class="muted-link" href="${escapeAttr(row.url)}" target="_blank" rel="noopener">Open</a>
```

`escapeAttr()` only HTML-encodes `&`, `<`, `>`, `"`, `'`, and backtick. It does **not** block the `javascript:` protocol. A malicious share pack or a compromised cloud record containing `javascript:alert(document.cookie)` will be rendered as a clickable anchor that executes in the page's origin context.

**Attack vector:** Someone sends a crafted base64 share pack. The recipient imports it. One tap on "Open" in the references list executes attacker-controlled JS with full access to `localStorage` (containing Supabase URL and anon key).

**Concrete fix:**

```js
// In normalizeReferences(), add URL sanitization:
function normalizeReferences(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    id: row.id || uid(),
    sectionId: row.sectionId,
    url: isSafeUrl(row.url) ? (row.url || "") : "",
    timestamp: row.timestamp || "00:00"
  }));
}

// Add this helper:
function isSafeUrl(value) {
  if (!value || typeof value !== "string") return false;
  return value.startsWith("http://") || value.startsWith("https://");
}
```

Apply the same guard inside `importSharePack()` at L616 and in `addReference` (already has `isLikelyUrl()` — unify to `isSafeUrl()`). Render empty string for bad URLs or omit the link entirely.

---

### C-2 · Media Loop Guards Always Pass (Wrong Property Checked)

**Severity:** Critical — Silent user-facing malfunction  
**Files:** `app.js` L1077, L1083, L1188, L1194  

**Why it matters:**  
The guards for "Set A" and "Set B" on both music and video check `el.musicPlayer.src` / `el.videoPlayer.src`. In browsers, `HTMLMediaElement.src` **returns the current document's full URL** (not an empty string) when no `src` attribute has been set. This means `!el.musicPlayer.src` is always `false` — the guard never fires. Users clicking "Set A" or "Set B" without loading any media silently set a loop point at `currentTime = 0`, then are told "Music loop A set at 00:00" even though nothing is loaded.

**Concrete fix:**

```js
// setMusicLoopA / setMusicLoopB — replace src check:
if (!mediaRuntime.musicObjectUrl) return setFeedback("Load a music file first.", "error");

// setVideoLoopA / setVideoLoopB — replace src check:
if (!mediaRuntime.loadedVideoUrl && !el.videoUrlInput.value.trim()) {
  return setFeedback("Load a video first.", "error");
}
```

---

### C-3 · No SRI Hash on Supabase CDN Script

**Severity:** Critical — Supply-chain code injection  
**Files:** `index.html` L241  

**Why it matters:**  
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```
No `integrity` attribute means any CDN-level compromise injects arbitrary JS into every user session. This script has access to the entire page, including the Supabase URL and anon key the user has entered in plaintext form fields, plus the full `localStorage` state.

**Concrete fix:** Pin to an exact version and add SRI hash:

```html
<script
  src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/dist/umd/supabase.min.js"
  integrity="sha384-<hash>"
  crossorigin="anonymous">
</script>
```

Generate the hash: `openssl dgst -sha384 -binary supabase.min.js | openssl base64 -A`  
Alternatively, vendor the file locally (single static site, no build step needed).

---

## 2. HIGH-PRIORITY ISSUES (fix in next sprint)

---

### H-1 · `flushInProgress` Can Deadlock If Outer Exception Escapes

**Severity:** High — Queue permanently locked  
**Files:** `app.js` L819–852, L902–931  

**Why it matters:**  
Both `flushPendingCloudWrites()` and `tryAutoFlushPendingWrites()` set `flushInProgress = true` at the start and `false` at the end, but without a `try/finally`. The inner `catch {}` handles per-item Supabase errors, but if anything outside that loop throws unexpectedly (e.g., `supabaseClient.from` not being a function due to re-initialization, a network error surfacing at a different level, or a future refactor), `flushInProgress` is never reset. The user's retry queue becomes permanently locked for the session — auto-flush, manual flush, and the "online" event handler all bail out silently.

**Concrete fix:**

```js
async function flushPendingCloudWrites() {
  if (flushInProgress) return;
  // ... guard checks ...
  flushInProgress = true;
  const remaining = [];
  try {
    for (const item of state.growth.pendingCloudWrites) {
      // ... per-item try/catch unchanged ...
    }
    state.growth.pendingCloudWrites = remaining;
  } finally {
    flushInProgress = false;
  }
  persist();
  renderCloud();
  // ... feedback ...
}
```

Apply the same `try/finally` pattern to `tryAutoFlushPendingWrites()`.

---

### H-2 · `state.growth.events` Array Grows Without Bound → localStorage Overflow

**Severity:** High — Silent data loss after extended use  
**Files:** `app.js` L737–743, L1948–1950  

**Why it matters:**  
`trackEvent()` appends a new object to `state.growth.events` on 19 different action types. There is no trim, cap, or rotation. A choreographer using the app daily for a month could accumulate tens of thousands of entries. Browser `localStorage` has a 5 MB limit. When `persist()` overflows, `localStorage.setItem()` throws a `QuotaExceededError` that is completely uncaught — the call is bare with no try/catch. The app continues running but **all subsequent state changes are silently lost**. The user has no indication their data stopped saving.

**Concrete fix — two parts:**

1. Cap the events array (retain last 500 events, which is ample for weekly stats):

```js
function trackEvent(name, meta) {
  state.growth.events.push({ id: uid(), name, at: new Date().toISOString(), ...(meta && { meta }) });
  if (state.growth.events.length > 500) {
    state.growth.events = state.growth.events.slice(-500);
  }
}
```

2. Add quota error handling to `persist()`:

```js
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    if (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED") {
      // Trim events aggressively and retry once
      state.growth.events = state.growth.events.slice(-100);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setFeedback("Storage full — event log trimmed to save state.", "info");
      } catch {
        setFeedback("Storage full. Export an ops snapshot and clear old data.", "error");
      }
    }
  }
}
```

---

### H-3 · Cloud Pull Overwrites Local Data Without Confirmation or Merge

**Severity:** High — Data loss risk  
**Files:** `app.js` L511–527  

**Why it matters:**  
`cloudPullSync()` calls `hydrateFromPayload()` which replaces `state.dancers`, `state.sections`, `state.assignments`, `state.references`, and `state.takes` entirely with the cloud version, then immediately calls `persist()`. If the user made local changes since the last push (offline session, forgotten push), all local work is silently overwritten. There is no confirmation dialog, no timestamp comparison, and no merge strategy.

**Concrete fix — minimum viable protection:**

```js
async function cloudPullSync() {
  // ... existing guards ...
  const { data, error } = await supabaseClient
    .from(CLOUD_STATE_TABLE)
    .select("app_state, updated_at")
    .eq("user_id", state.cloud.user.id)
    .maybeSingle();

  if (error) return setFeedback(`Pull sync failed: ${error.message}`, "error");
  if (!data?.app_state) return setFeedback("No cloud state found for this user yet.", "info");

  const cloudUpdatedAt = data.updated_at ? new Date(data.updated_at) : null;
  const hasLocalData = state.sections.length > 0 || state.dancers.length > 0;
  
  if (hasLocalData) {
    const msg = cloudUpdatedAt
      ? `Pull will replace local data with cloud state from ${toLocalTime(cloudUpdatedAt.toISOString())}. Continue?`
      : "Pull will replace all local data with cloud state. Continue?";
    if (!window.confirm(msg)) return setFeedback("Pull cancelled.", "info");
  }

  hydrateFromPayload(data.app_state);
  persist();
  renderAll();
  setFeedback("Cloud state pulled.", "success");
}
```

---

### H-4 · `renderGrowth()` Mutates State Without Persisting

**Severity:** High — Referral code lost on reload  
**Files:** `app.js` L1622–1625  

**Why it matters:**  
If `state.growth.referralCode` is falsy (corrupted state, partial import), `renderGrowth()` silently generates a new code and assigns it to `state.growth.referralCode`. However, `renderGrowth()` never calls `persist()`. On the next reload, the code is gone again. The user could share a code that doesn't match what they see on reload.

**Concrete fix:**

```js
function renderGrowth() {
  if (!state.growth.referralCode) {
    state.growth.referralCode = makeReferralCode();
    persist(); // ← add this
  }
  // ... rest unchanged
```

---

### H-5 · Anonymous Waitlist Writes Bypass User Sign-In Requirement

**Severity:** High — Potential abuse vector / RLS assumption mismatch  
**Files:** `app.js` L766–786  

**Why it matters:**  
`syncWaitlistLeadToCloud()` checks only `if (!supabaseClient) return` — it does **not** require `state.cloud.user?.id`. It inserts with `owner_user_id: state.cloud.user?.id || null`. If Supabase RLS on `roam_growth_waitlist` allows inserts with `null` owner (likely, since waitlist is designed for pre-auth leads), any user who has merely configured the Supabase URL (without signing in) can write to this table. Combined with the lack of rate limiting noted in `PRODUCTION_READINESS.md`, this is a trivial spam vector. `syncFeedbackToCloud()` has the same pattern.

**Concrete fix:** If anonymous waitlist writes are intentional (for leads before sign-in), document it explicitly and ensure RLS has a rate-limiting strategy. If they should require auth, add the same guard as the invite sync:

```js
async function syncWaitlistLeadToCloud(lead) {
  if (!supabaseClient || !state.cloud.user?.id) return; // require auth
  // ...
}
```

---

## 3. MEDIUM IMPROVEMENTS (quality / reliability / maintainability)

---

### M-1 · `window.prompt()` Used for Edit Flows — Breaks Tablet UX

**Severity:** Medium — UX friction, broken in PWA/kiosk contexts  
**Files:** `app.js` L1305–1316, L1333–1340, L1366–1373  

Prompts are blocking, unstyled, and non-functional in fullscreen/kiosk deployments. On tablets they also open in a small system dialog inconsistent with the app's dark theme. Replace with inline edit rows that expand in place within each list item:

```html
<!-- When Edit is clicked, swap the display div for an inline form: -->
<input class="inline-edit" value="${escapeAttr(dancer.name)}" data-field="name">
<button data-action="save-edit" data-id="${dancer.id}">Save</button>
<button data-action="cancel-edit">Cancel</button>
```

This is a moderate refactor but dramatically improves choreography-session UX.

---

### M-2 · `timeupdate` on Video Player Does DOM Writes Every Frame

**Severity:** Medium — Performance, especially on low-end tablets  
**Files:** `app.js` L1199–1214  

When `syncVideoToReference` is checked, the `timeupdate` handler (firing 4–15 Hz) writes to `el.refUrl.value`, `el.refTimestamp.value`, and calls `updateExternalVideoButtonLabel()` (which reads `el.videoUrlInput.value`, calls `parseTimestampFromUrl()`, `formatSeconds()`, and writes `el.openVideoExternally.textContent`) on every single frame. This is unnecessary — the reference fields only need to update when the user pauses or scrubs.

**Concrete fix:** Throttle or debounce the sync:

```js
let _lastRefSyncSec = -1;
el.videoPlayer.addEventListener("timeupdate", () => {
  // A-B loop logic unchanged ...

  // Throttle reference sync to once per second
  const currentSec = Math.floor(el.videoPlayer.currentTime || 0);
  if (el.syncVideoToReference.checked && mediaRuntime.loadedVideoUrl && currentSec !== _lastRefSyncSec) {
    _lastRefSyncSec = currentSec;
    el.refUrl.value = mediaRuntime.loadedVideoUrl;
    el.refTimestamp.value = formatSeconds(currentSec);
    updateExternalVideoButtonLabel();
  }
});
```

---

### M-3 · `renderAll()` Called on Every Mutation — Full Re-Render

**Severity:** Medium — Performance + list scroll position reset  
**Files:** `app.js` L412–1426  

`renderAll()` rebuilds 13 DOM subtrees on every single user action (18 call sites). On a session with 20 dancers, 30 sections, and 200 assignments this becomes noticeably slow. It also resets scroll position inside lists.

**Concrete fix (incremental, low-risk):** Scope renders to the affected sections. For example, adding a dancer only needs `renderDancers()` + `renderSelectors()` + `renderMySections()` + `renderAnalytics()`. Add a targeted render helper:

```js
function renderDancerScope() {
  renderDancers();
  renderSelectors();
  renderMySections();
  renderAnalytics();
  renderGrowth();  // updates funnel counts
}
```

Apply per-action scoped renders as a follow-on refactor, leaving `renderAll()` for cloud pull and page load.

---

### M-4 · `renderText()` Calls `renderSession()` Internally, Then `renderAll()` Calls It Again

**Severity:** Medium — Redundant double render  
**Files:** `app.js` L1450, L1414  

`renderText()` ends with a call to `renderSession()` (L1450). `renderAll()` calls `renderText()` first, then calls `renderSession()` again (L1414). This means every `renderAll()` call re-renders the session element twice.

**Concrete fix:** Remove the explicit `renderSession()` call from `renderAll()`:

```js
function renderAll() {
  renderText();          // already calls renderSession() internally
  // renderSession();   // ← remove this duplicate
  renderSelectors();
  // ...
}
```

---

### M-5 · `appendTimestampToUrl()` Has Identical Dead-Code Branches

**Severity:** Medium — Maintainability / future XHS bug  
**Files:** `app.js` L1972–1989  

All three branches of `appendTimestampToUrl()` (YouTube, Bilibili, fallback) do exactly the same thing. The platform-specific branches are dead code. Additionally, XHS/Xiaohongshu links are correctly detected by `detectVideoPlatform()` but not handled in `appendTimestampToUrl()` — appending `?t=N` to an XHS link has no effect.

**Concrete fix:** Collapse the function and add an XHS note:

```js
function appendTimestampToUrl(rawUrl, seconds) {
  try {
    const url = new URL(rawUrl);
    // XHS/Xiaohongshu does not support URL-based timestamps — 
    // users should seek manually after opening externally.
    url.searchParams.set("t", String(seconds));
    return url.toString();
  } catch {
    return rawUrl;
  }
}
```

---

### M-6 · `invitesSent` Counter Can Drift from `inviteLog.length`

**Severity:** Medium — Analytics accuracy  
**Files:** `app.js` L667–668, L1628  

`state.growth.invitesSent` is a manually-incremented integer, while `state.growth.inviteLog` is the actual array. They're always written together in `sendInvite()`, but after a cloud pull or share pack import, a partially-restored state could desync them. The UI displays `invitesSent`, while the weekly report counts from `inviteLog`.

**Concrete fix:** Derive from the single source of truth:

```js
// In renderGrowth():
el.inviteStatus.textContent = state.growth.inviteLog.length > 0
  ? `${state.growth.inviteLog.length} invite(s) sent`
  : "No invites sent yet";
```

Remove `invitesSent` counter and derive from `inviteLog.length` everywhere.

---

### M-7 · `check-static-site.mjs` Doesn't Verify `app.js` File Existence

**Severity:** Medium — CI gap  
**Files:** `scripts/check-static-site.mjs`  

The check verifies that `"app.js"` appears as a substring in `index.html`, but does not verify the file `app.js` actually exists on disk. A broken rename would pass CI.

**Concrete fix:**

```js
const requiredFiles = ["index.html", "vercel.json", "app.js", "styles.css"];
// ...check all of them with exists()
```

---

### M-8 · `mediaLabTitle` Not Translated

**Severity:** Medium — i18n regression  
**Files:** `app.js` L1428–1450, `index.html` L123  

`el.mediaLabTitle` is returned from `getEls()` (the element exists in HTML) but is never updated in `renderText()`. The "Media Lab (Music + Video)" heading stays in English regardless of language selection. All other section titles are translated.

**Concrete fix:** Add the key to each I18N locale object and update `renderText()`:

```js
// In each locale:
mediaLabTitle: "Media Lab (Music + Video)",  // zh-CN: "媒体实验室（音乐+视频）", etc.

// In renderText():
el.mediaLabTitle.textContent = t.mediaLabTitle;
```

---

## 4. LOW POLISH ITEMS

---

### L-1 · Reference Links Missing `noreferrer`

**Severity:** Low — Privacy  
**Files:** `app.js` L1560  

```html
<a ... target="_blank" rel="noopener">Open</a>
```

Missing `noreferrer`. External sites receive the Referer header, which can reveal the app URL (including any `?ref=ROAM-...` query params) to third-party video hosts.

**Fix:** `rel="noopener noreferrer"`

---

### L-2 · `input[type=checkbox]` Inherits 44px `min-height`

**Severity:** Low — Visual glitch on some browsers  
**Files:** `styles.css` L67–74  

The global `input, select, button { min-height: 44px; }` rule applies to checkboxes and range sliders, which display as oversized squares on Chromium/WebKit.

**Fix:**
```css
input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
select, button {
  min-height: 44px;
}
```

---

### L-3 · `uid()` Not Collision-Resistant for Bulk Imports

**Severity:** Low — Edge-case data corruption  
**Files:** `app.js` L1960–1962  

```js
function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
```

During a bulk import loop that runs synchronously, `Date.now()` can return the same millisecond for multiple iterations. The 5-character base36 suffix adds ~1.6 billion combinations so collisions are astronomically rare, but `crypto.randomUUID()` is available in all modern browsers and is genuinely collision-free.

**Fix:** `return crypto.randomUUID();`

---

### L-4 · `supabaseAnonKey` Stored in `localStorage` in Plaintext

**Severity:** Low — Accept as known risk, worth documenting  
**Files:** `app.js` L1857, `index.html` L38  

The anon key is stored in `localStorage` and persisted alongside all app state. This is the same as the published anon key in most Supabase client apps (it's designed to be public-facing), but the combination of URL + key + user email in `localStorage` warrants a note in the UI: "The anon key is safe to store here — it only enables access per your Supabase RLS rules."

---

### L-5 · `window.prompt()` for Due Date Accepts Non-Date Strings

**Severity:** Low  
**Files:** `app.js` L1367–1373  

The due date prompt accepts any string. A user entering "next Friday" produces an invalid date that is stored and displayed verbatim. Since assignment cards just display the raw string via `escapeHtml(item.dueDate)`, there's no runtime error — but downstream date comparisons or sorting would silently fail.

**Fix:** Add a format validation before accepting:

```js
if (nextDueDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(nextDueDate.trim())) {
  return setFeedback("Due date must be in YYYY-MM-DD format.", "error");
}
```

---

### L-6 · `hydrateFromPayload` Does Not Sanitize `state.dancers` Array

**Severity:** Low  
**Files:** `app.js` L1759  

```js
state.dancers = Array.isArray(payload.dancers) ? payload.dancers : [];
```

Unlike sections, assignments, and takes, the dancers array has no normalization step — malformed dancer objects (missing `id`, `name`, or `role`) from a cloud pull are stored as-is. Downstream `.find()` calls would still work but extra properties (potential prototype pollution if `__proto__` is present) are not stripped.

**Fix:** Add `normalizeDancers()` mirroring the other normalizers, trimming to `{id, name, role}`.

---

## 5. SUGGESTED PATCH PLAN (ordered implementation steps)

Priority order minimizes risk at each step:

**Step 1 — C-1: XSS Fix (1–2 hours)**
- Add `isSafeUrl()` helper (replaces `isLikelyUrl()` — same logic, more descriptive name)
- Apply in `normalizeReferences()`, inside `importSharePack()` references loop, and to `renderReferences()` anchor rendering (add a fallback "URL removed" display for invalid URLs)
- Write a test: import a pack with `javascript:alert(1)` as a URL; verify it renders as empty or is omitted

**Step 2 — C-2: Media Guard Fix (30 minutes)**
- Replace `el.musicPlayer.src` → `mediaRuntime.musicObjectUrl` in setMusicLoopA/B
- Replace `el.videoPlayer.src` → `mediaRuntime.loadedVideoUrl` in setVideoLoopA/B
- Add E2E test: click Set A without loading media → verify error feedback

**Step 3 — C-3: SRI Hash (30 minutes)**
- Pin Supabase to exact version, generate SRI hash, add `integrity` + `crossorigin` attributes
- Optionally: download and vendor as `./vendor/supabase.min.js`

**Step 4 — H-1: `flushInProgress` try/finally (30 minutes)**
- Wrap loop body in `try/finally` in both flush functions
- Tests: existing cloud-queue spec covers basic path; add a spec that simulates mid-flush network error

**Step 5 — H-2: Event log cap + `persist()` quota guard (1 hour)**
- Add trim in `trackEvent()` (cap at 500)
- Add try/catch to `persist()` with graceful degradation

**Step 6 — H-3: Cloud pull confirmation (45 minutes)**
- Add `window.confirm()` guard before `hydrateFromPayload()` when local data exists
- Include cloud record timestamp in the prompt message

**Step 7 — H-4 + H-5: Minor state mutation fixes (30 minutes)**
- Add `persist()` after auto-generating referral code in `renderGrowth()`
- Document waitlist anonymous write behavior or add auth guard

**Step 8 — M-1: Inline editing (half-day)**
- Replace `window.prompt()` for dancer edit, section edit, and due date edit with inline form rows
- Highest UX impact for tablet-primary users

**Step 9 — M-7 + check-static-site.mjs (30 minutes)**
- Add `app.js` and `styles.css` to the required file existence check

**Step 10 — M-2: `timeupdate` throttle (30 minutes)**
- Add per-second deduplication for reference sync and external button label

**Step 11 — M-3/M-4: Scoped renders + double renderSession (1–2 hours)**
- Remove redundant `renderSession()` from `renderAll()`
- Add per-action scoped render helpers for the most common mutations

**Step 12 — M-5/M-6/M-8: Cleanup pass (1 hour)**
- Collapse `appendTimestampToUrl()` dead branches
- Remove `invitesSent` integer, derive from `inviteLog.length`
- Add `mediaLabTitle` to i18n and `renderText()`

**Step 13 — L-1 through L-6: Polish pass (1 hour)**
- `noreferrer` on reference links
- CSS checkbox min-height fix
- `crypto.randomUUID()` for uid()
- `normalizeDancers()` 
- Due date format validation

---

## 6. TEST PLAN ADDITIONS

### New E2E Tests

**File: `tests/media-loop-guards.spec.js`** (new)

```js
test("Set A button shows error without music loaded", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click("#setMusicLoopA");
  await expect(page.locator("#feedback")).toContainText("Load a music file first.");
});

test("Set Video A button shows error without video loaded", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click("#setVideoLoopA");
  await expect(page.locator("#feedback")).toContainText("Load a video first.");
});

test("Music A-B loop: setting B before A shows no loop trigger", async ({ page }) => {
  // Inject audio src via page.evaluate to bypass file picker
  await page.evaluate(() => {
    const audio = document.getElementById("musicPlayer");
    audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAA=="; // 1-frame wav
    window.mediaRuntime = window.mediaRuntime || {};
    window.mediaRuntime.musicObjectUrl = "data:audio/wav;base64,test";
  });
  await page.click("#setMusicLoopB");  // Set B first
  await page.click("#setMusicLoopA");  // Set A after B
  await expect(page.locator("#feedback")).toContainText("Music loop A set");
  // Loop should not fire because B <= A — verify no error state
});
```

**File: `tests/security.spec.js`** (new)

```js
test("import share pack with javascript: URL does not render as link", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Build a malicious share pack
  const maliciousPack = await page.evaluate(() => {
    const payload = {
      v: 1,
      generatedAt: new Date().toISOString(),
      section: { id: "s1", name: "Test", status: "empty" },
      assignments: [],
      references: [{ id: "r1", sectionId: "s1", url: "javascript:alert(1)", timestamp: "00:00" }],
      takes: []
    };
    const json = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  });

  await page.fill("#sharePayload", maliciousPack);
  await page.click("#importSharePack");

  // Verify the anchor does NOT have href="javascript:alert(1)"
  const href = await page.locator("#referenceList a.muted-link").getAttribute("href");
  expect(href).not.toContain("javascript:");
  expect(href === null || href === "" || href.startsWith("http")).toBeTruthy();
});

test("manually added reference validates protocol", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.fill("#sectionName", "Sec");
  await page.click("#addSection");
  await page.selectOption("#refSection", { label: "Sec" });
  await page.fill("#refUrl", "javascript:alert(1)");
  await page.click("#addReference");
  await expect(page.locator("#feedback")).toContainText("http");  // validation error
  await expect(page.locator("#referenceList")).not.toContainText("javascript:");
});
```

**File: `tests/cloud-queue.spec.js`** (additions)

```js
test("flush does not deadlock if flush already in progress", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  // Simulate double-click on flush — second call should be silently ignored
  await page.fill("#supabaseUrl", "https://example.supabase.co");
  await page.fill("#supabaseAnonKey", "key");
  await page.click("#saveCloudConfig");
  // Click twice rapidly — no crash/hang
  await Promise.all([
    page.click("#flushCloudQueue"),
    page.click("#flushCloudQueue")
  ]);
  await expect(page.locator("#feedback")).toContainText(/Sign in|No pending/);
});

test("persist() survives localStorage quota error gracefully", async ({ page }) => {
  await page.goto("/");
  // Monkey-patch localStorage.setItem to throw QuotaExceededError
  await page.evaluate(() => {
    const original = localStorage.setItem.bind(localStorage);
    let throwCount = 3;
    localStorage.setItem = (key, value) => {
      if (throwCount-- > 0) {
        const err = new DOMException("QuotaExceededError", "QuotaExceededError");
        throw err;
      }
      original(key, value);
    };
  });
  await page.fill("#sessionName", "Test");
  await page.click("#createSession");
  // App should not crash; may show storage warning
  await expect(page.locator("#activeSessionText")).toContainText("Test");
});
```

**File: `tests/cloud-pull.spec.js`** (new)

```js
test("cloud pull prompts confirmation before overwriting local data", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Add local data
  await page.fill("#dancerName", "Local Dancer");
  await page.click("#addDancer");

  // Configure cloud
  await page.fill("#supabaseUrl", "https://example.supabase.co");
  await page.fill("#supabaseAnonKey", "key");
  await page.click("#saveCloudConfig");

  // Attempt pull — expect a confirm dialog
  page.once("dialog", dialog => dialog.dismiss());  // cancel
  await page.click("#pullCloud");
  
  // Local data should still be present after cancel
  await expect(page.locator("#dancerList")).toContainText("Local Dancer");
});
```

**File: `tests/core-flows.spec.js`** (additions to existing test)

```js
test("deleting a dancer clears all their assignments and selector entries", async ({ page }) => {
  // Setup: session + dancer + section + assignment
  // ... create via UI ...
  await page.click("button[data-action='delete'][data-id]");  // delete dancer
  await expect(page.locator("#assignmentList")).not.toContainText(dancerName);
  // Verify assignDancer select no longer contains deleted dancer
  const options = await page.locator("#assignDancer option").allTextContents();
  expect(options).not.toContain(dancerName);
});

test("referral attribution is not overwritten on second visit", async ({ page }) => {
  await page.goto("/?ref=FIRST");
  await expect(page.locator("#growthFunnel")).toContainText("FIRST");
  // Navigate again with a different ref code
  await page.goto("/?ref=SECOND");
  // Should still show FIRST (once captured, attribution is locked)
  await expect(page.locator("#growthFunnel")).toContainText("FIRST");
});
```

**File: `tests/media-smart-handling.spec.js`** (additions)

```js
test("switching video URL resets loop points", async ({ page }) => {
  await page.fill("#videoUrlInput", "https://example.com/video.mp4");
  await page.click("#loadVideoUrl");
  // Load a second video
  await page.fill("#videoUrlInput", "https://example.com/video2.mp4");
  await page.click("#loadVideoUrl");
  // Loop points should be reset (verify via mediaRuntime)
  const loopA = await page.evaluate(() => window.mediaRuntime.videoLoopA);
  expect(loopA).toBeNull();
});

test("invalid direct video URL shows feedback, does not set src", async ({ page }) => {
  await page.fill("#videoUrlInput", "not-a-url");
  await page.click("#loadVideoUrl");
  await expect(page.locator("#feedback")).toContainText("http");
  const src = await page.locator("#videoPlayer").getAttribute("src");
  expect(src === null || src === "").toBeTruthy();
});
```

---

## Summary Table

| ID | Area | Severity | Effort |
|----|------|----------|--------|
| C-1 | XSS via `javascript:` in imported reference URLs | 🔴 Critical | 2h |
| C-2 | Media loop guards always pass (wrong `.src` check) | 🔴 Critical | 30m |
| C-3 | No SRI hash on Supabase CDN script | 🔴 Critical | 30m |
| H-1 | `flushInProgress` deadlock on outer exception | 🟠 High | 30m |
| H-2 | Events array overflows localStorage unboundedly | 🟠 High | 1h |
| H-3 | Cloud pull silently overwrites local data | 🟠 High | 45m |
| H-4 | `renderGrowth()` mutates state without `persist()` | 🟠 High | 15m |
| H-5 | Anonymous waitlist writes bypass auth guard | 🟠 High | 20m |
| M-1 | `window.prompt()` editor on tablet | 🟡 Medium | 4h |
| M-2 | `timeupdate` DOM writes every frame | 🟡 Medium | 30m |
| M-3 | `renderAll()` on every mutation | 🟡 Medium | 2h |
| M-4 | Double `renderSession()` in `renderAll()` | 🟡 Medium | 5m |
| M-5 | `appendTimestampToUrl()` dead code branches | 🟡 Medium | 15m |
| M-6 | `invitesSent` can drift from `inviteLog.length` | 🟡 Medium | 20m |
| M-7 | Static check doesn't verify `app.js` file exists | 🟡 Medium | 20m |
| M-8 | `mediaLabTitle` not translated | 🟡 Medium | 30m |
| L-1 | Reference links missing `noreferrer` | 🟢 Low | 5m |
| L-2 | Checkboxes inherit 44px min-height | 🟢 Low | 10m |
| L-3 | `uid()` not collision-resistant | 🟢 Low | 5m |
| L-4 | Due date prompt accepts non-date strings | 🟢 Low | 20m |
| L-5 | `hydrateFromPayload` doesn't normalize dancers | 🟢 Low | 20m |

**Top 3 risk items blocking release: C-1, C-2, C-3.**  
These three can be fixed in under 3 hours total and eliminate the only active security and correctness bugs that affect all users at launch.
