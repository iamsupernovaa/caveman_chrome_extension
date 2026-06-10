# Contributing to Caveman

Thanks for considering a contribution.

Caveman is a small Chrome extension that makes ChatGPT and Claude answer in shorter, cleaner replies by injecting a brevity instruction at send time.

Caveman like simple.

Small focused PR > big rewrite.

---

## Quick Orientation

Caveman is a Manifest V3 Chrome extension.

It works on:

```text
chatgpt.com
chat.openai.com
claude.ai
```

Main behavior:

```text
User selects mode → user sends prompt → Caveman prepends brevity instruction → message sends normally
```

The extension is local-only.

It does not:

- use API keys
- call external servers
- read chat history
- export conversations
- track users

It only uses Chrome storage to remember the selected mode.

---

## Repo Structure

```text
caveman-extension/
  manifest.json
  content.js
  style.css
  README.md
  CONTRIBUTING.md
  icons/
    icon16.png
    icon32.png
    icon48.png
    icon128.png
  tests/
    helpers/
    live-ab-reduction.spec.ts
    live-response-budget.spec.ts
```

---

## What To Edit

| I want to change... | Edit this |
|---|---|
| Caveman modes / injected text | `content.js` |
| ChatGPT / Claude selectors | `content.js` |
| Pill placement | `content.js` |
| Pill styling | `style.css` |
| Extension permissions / version / supported URLs | `manifest.json` |
| Icons | `icons/` |
| Usage docs | `README.md` |
| A/B benchmark tests | `tests/live-ab-reduction.spec.ts` |
| Test helpers | `tests/helpers/` |

---

## Main Files

### `content.js`

Core extension logic.

Contains:

- mode definitions
- prompt prefix text
- ChatGPT / Claude site detection
- composer detection
- send interception
- no-double-prefix guard
- inline pill mounting
- per-site mode storage

Most feature changes happen here.

---

### `style.css`

Controls the Caveman pill style.

Current design:

- subtle inline pill
- ChatGPT teal accent
- Claude coral accent
- OFF mode faded
- Ultra mode filled

Keep it small. The pill should feel native, not noisy.

---

### `manifest.json`

Chrome extension config.

Controls:

- extension name
- version
- permissions
- supported sites
- content script injection
- icons

Keep permissions minimal.

Current goal:

```text
Only storage permission.
No unnecessary access.
No network permission.
```

---

### `README.md`

User-facing documentation.

Update it when changing:

- install steps
- supported sites
- modes
- benchmark method
- privacy statement
- known limitations

---

## Contribution Types

Most contributions fall into these buckets:

### 1. Fix broken selectors

ChatGPT and Claude change their UI often.

If the pill disappears or injection fails, update:

```text
getComposer()
getSendButton()
findMount()
```

in `content.js`.

---

### 2. Improve Caveman wording

Mode prompts live in:

```text
MODES
```

inside `content.js`.

Current modes:

```text
OFF
Lite
Full
Ultra
```

Keep wording short and clear.

Do not make the injected prefix too long, because the prefix itself costs tokens.

---

### 3. Improve pill UX

Pill behavior lives in:

```text
buildPill()
ensurePill()
renderPill()
findMount()
```

Good changes:

- better placement
- more stable mounting
- less layout shift
- better keyboard support
- better dark/light theme handling

Bad changes:

- floating over important UI
- blocking buttons
- stealing focus
- adding visual noise

---

### 4. Improve tests

Tests should verify:

- pill appears
- mode cycles correctly
- prompt is prefixed
- prefix is not duplicated
- OFF mode does nothing
- Shift+Enter does not send
- IME input is safe
- ChatGPT and Claude modes are independent
- A/B benchmark waits for full response before measuring

---

## Testing

Install dependencies:

```bash
npm install
npx playwright install chromium
```

Run local tests:

```bash
npm test
```

Run live ChatGPT A/B benchmark:

```bash
RUN_LIVE=1 CDP_URL=http://127.0.0.1:9222 npx playwright test tests/live-ab-reduction.spec.ts -g ChatGPT --headed
```

Run one mode only:

```bash
RUN_LIVE=1 COMPARE_MODES=Ultra CDP_URL=http://127.0.0.1:9222 npx playwright test tests/live-ab-reduction.spec.ts -g ChatGPT --headed
```

---

## Live Test Setup

Live tests attach to your real Chrome session.

Start Chrome with remote debugging:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --remote-debugging-port=9222 `
  --user-data-dir="$env:USERPROFILE\caveman-live-chrome"
```

Then manually log in to:

```text
chatgpt.com
claude.ai
```

Keep Chrome open.

The live tests should attach through:

```text
http://127.0.0.1:9222
```

Do not use Playwright’s fresh browser for live tests. It may trigger Cloudflare/login issues.

---

## Benchmark Rules

Caveman benchmarks compare:

```text
OFF response vs Caveman response
```

Measured:

- word count
- estimated visible-output token count
- percentage reduction

Important:

```text
Estimated visible-output tokens are not provider billing tokens.
```

Do not claim:

```text
actual OpenAI token reduction
actual Claude token reduction
billing token reduction
```

unless the benchmark uses real API usage fields.

Correct wording:

```text
estimated visible-output token reduction
```

---

## Pull Request Guidelines

Keep PRs small.

Good PRs:

- fix one selector issue
- improve one mode prompt
- update one test
- improve one README section
- fix one browser-specific bug

Avoid:

- huge rewrites
- unrelated formatting churn
- new permissions without strong reason
- adding tracking/analytics
- claiming real token savings without real API data

PR description should include:

```text
What changed
Why changed
How tested
```

Example:

```text
Changed ChatGPT composer selector because new UI hides fallback textarea.
Tested with live ChatGPT A/B test and local pill injection test.
```

---

## Code Style

### Keep permissions minimal

Do not add permissions unless required.

Preferred:

```json
"permissions": ["storage"]
```

Avoid:

```json
"permissions": ["tabs", "history", "webRequest"]
```

unless there is a very strong reason.

---

### Keep it local

No analytics.

No telemetry.

No remote logging.

No API calls.

No chat export.

---

### Do not inject into wrong fields

Caveman should only touch the main chat composer.

Do not inject into:

- feedback forms
- message edit boxes
- search boxes
- settings text fields
- login fields

---

### IME safety matters

Do not break Japanese, Chinese, Korean, or other IME input.

Keep checks like:

```js
if (e.isComposing || e.keyCode === 229) return;
```

---

### Avoid double-prefix

Never inject Caveman text twice.

Keep and update the prefix guard if modes change:

```js
PREFIX_RE
```

---

### Do not make the pill annoying

The pill should:

- stay inside composer toolbar
- not cover text
- not block send button
- not steal focus
- not create layout jumps
- survive SPA re-renders

---

## Adding A New Mode

To add a mode:

1. Add it to `MODES` in `content.js`
2. Add its key to `ORDER`
3. Update `PREFIX_RE` if needed
4. Update README mode table
5. Add/update tests

Example:

```js
brief: {
  label: "Brief",
  prefix:
    "Answer briefly.\n" +
    "Keep only necessary details.\n\n"
}
```

Then:

```js
const ORDER = ["off", "lite", "full", "ultra", "brief"];
```

---

## Versioning

Use simple semantic versioning:

```text
1.5.0
```

Suggested meaning:

- patch: bug fix / selector fix
- minor: new mode / new test / UI improvement
- major: big architecture change

Update version in:

```text
manifest.json
```

---

## Reporting Bugs

Open an issue with:

```text
Browser:
Site: ChatGPT / Claude
Extension version:
Mode:
What happened:
Expected behavior:
Screenshot:
Console error, if any:
```

Good bug report:

```text
ChatGPT new chat page does not show pill until text is typed.
Chrome 126.
Caveman 1.5.0.
Pill appears after typing.
```

---

## Good First Issues

Good starter tasks:

- improve README examples
- add Edge install note
- add Firefox investigation note
- improve benchmark CSV formatting
- add screenshot to README
- add custom prompt mode idea
- improve Claude answer selector
- improve ChatGPT composer selector

---

## Philosophy

Caveman should stay:

```text
small
local
safe
simple
useful
```

No bloat.

No tracking.

No fake benchmark claims.

No huge mouth.

Brain still big.
