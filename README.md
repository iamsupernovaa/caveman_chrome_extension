# 🪨 Caveman — AI Brevity Injector

**why use many word when few do trick**

A tiny Chrome extension for **ChatGPT** and **Claude** that adds a Caveman mode inside the chat box.

It prepends a brevity instruction to your prompt at send time, so the model answers shorter without you typing the same instruction again and again.

Brain still big. Mouth small.

---
------ ChatGPT ------
<img width="1002" height="285" alt="image" src="https://github.com/user-attachments/assets/48b943a3-8112-4135-808a-f9bf80a6a246" />
<img width="995" height="288" alt="image" src="https://github.com/user-attachments/assets/ff855197-b144-48af-a581-d0a10456e2a9" />
<img width="1042" height="297" alt="image" src="https://github.com/user-attachments/assets/d8e067be-e170-4299-af74-eb8f1d95993e" />
<img width="992" height="276" alt="image" src="https://github.com/user-attachments/assets/903ffa1e-423c-460b-adfa-180bbac07e4a" />
------------------------

------- Claude ---------
<img width="868" height="365" alt="image" src="https://github.com/user-attachments/assets/cc558e74-34dc-4e57-a8f2-557c43d293a3" />
<img width="890" height="377" alt="image" src="https://github.com/user-attachments/assets/dea67fad-4d8c-4680-9ec6-175f34096874" />
<img width="875" height="370" alt="image" src="https://github.com/user-attachments/assets/7d101641-62db-44cf-971f-7e8e2d1ac577" />
<img width="877" height="382" alt="image" src="https://github.com/user-attachments/assets/54761505-24ec-43cf-a83d-04c1bc04d715" />
-------------------------


## What It Does

Caveman adds a small pill inside the composer toolbar:

- ChatGPT: near the model/tools area
- Claude: near the model selector

Click the pill to cycle:

```text
OFF → Lite → Full → Ultra
```

When you send a prompt, Caveman silently adds the selected brevity instruction at the start of your message.

Example:

```text
Caveman Ultra mode:
Shortest correct answer possible.
No explanations unless asked.
No formatting unless essential.
If blocked, ask one question max.

Explain AUTOSAR.
```

---

## Before / After

### Normal

```text
AUTOSAR, which stands for Automotive Open System Architecture, is a standardized software architecture used in the automotive industry. It helps vehicle manufacturers and suppliers develop reusable software components across different electronic control units.
```

### Caveman

```text
AUTOSAR = standard software architecture for vehicle ECUs.

It separates app logic from hardware.

Helps reuse and integrate automotive software.
```

Same idea. Fewer words.

---

## Modes

| Mode | Meaning |
|---|---|
| OFF | No injection |
| Lite | Removes filler and long intros |
| Full | Direct, concise, minimum tokens |
| Ultra | Shortest correct answer possible |

---

## Why Use It?

Modern AI chats often over-explain.

Caveman helps with:

- shorter replies
- faster reading
- cleaner technical answers
- less copy-paste editing
- lower visible output token count
- better focus during coding, study, and debugging

Useful for:

- ChatGPT
- Claude
- coding help
- study notes
- debugging
- quick technical explanations
- daily productivity

---

## Important Token Note

Caveman reduces **visible output length**.

Current tests measure:

```text
visible response words
estimated visible response tokens
```

This is not the same as provider billing tokens.

It does **not** measure:

- hidden reasoning tokens
- cached tokens
- total backend tokens
- OpenAI billing tokens
- Anthropic billing tokens

For real API token usage, use:

```text
OpenAI API: usage.output_tokens / completion_tokens
Anthropic API: usage.output_tokens
```

This extension is for the web UI, so benchmark numbers should be described as:

```text
estimated visible-output token reduction
```

not:

```text
actual billing token reduction
```

---

## Privacy

Caveman is local-only.

It does not:

- use API keys
- make network calls
- read your chat history
- export conversations
- track usage
- send data anywhere

It only uses Chrome `storage` to remember the selected mode.

---

## Install

### 1. Download or clone this repo

```bash
https://github.com/iamsupernovaa/caveman_chrome_extension.git
```

### 2. Open Chrome Extensions

Go to:

```text
chrome://extensions
```

### 3. Enable Developer Mode

Toggle **Developer mode** in the top-right.

### 4. Load Extension

Click:

```text
Load unpacked
```

Select the extension folder.

### 5. Open ChatGPT or Claude

Supported sites:

```text
https://chatgpt.com/*
https://chat.openai.com/*
https://claude.ai/*
```

You should see the 🪨 Caveman pill inside the chat box.

---

## Usage

1. Open ChatGPT or Claude
2. Click the 🪨 pill
3. Choose OFF / Lite / Full / Ultra
4. Type normally
5. Send

Caveman injects the brevity instruction automatically.

---

## Features

- Works on ChatGPT web
- Works on Claude web
- Inline composer pill
- Per-site mode memory
- ChatGPT and Claude modes stay independent
- No popup needed
- No double-prefix injection
- Empty prompts ignored
- IME-safe for Japanese input
- Only touches the main chat composer
- Feedback forms, edit boxes, and search boxes are ignored
- Local-only
- MV3 Chrome extension
- Minimal permissions

---

## How It Works

Caveman watches the main chat composer.

When you press send:

1. It checks the current mode.
2. It checks that the message is not empty.
3. It checks that Caveman text is not already present.
4. It prepends the selected instruction.
5. It sends the message.

The model receives your normal prompt plus the brevity instruction.

---

## Example Prefixes

### Lite

```text
Caveman Lite mode:
Be concise. Skip intros, outros, and repeated summaries. Get to the point.
```

### Full

```text
Use Caveman Full mode:
Answer directly.
No filler.
No long intros.
No repeated summaries.
Use minimum tokens.
Ask only if blocked.
```

### Ultra

```text
Caveman Ultra mode:
Shortest correct answer possible.
No explanations unless asked.
No formatting unless essential.
If blocked, ask one question max.
```

---

## Testing

The repo includes Playwright tests for:

- pill rendering
- mode switching
- prompt injection
- no double-prefix
- Enter key send
- send button click
- Shift+Enter safety
- IME safety
- per-site mode storage
- ChatGPT live A/B testing
- Claude live A/B testing

---

## Install Test Dependencies

```bash
npm install
npx playwright install chromium
```

---

## Run Local Tests

```bash
npm test
```

---

## Live A/B Benchmark

The live benchmark compares:

```text
OFF response vs Caveman response
```

It measures:

```text
word count
estimated visible-output tokens
percentage reduction
```

### Start Chrome with Remote Debugging

Close Chrome first.

Then run on Windows PowerShell:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --remote-debugging-port=9222 `
  --user-data-dir="$env:USERPROFILE\caveman-live-chrome"
```

Login manually to:

```text
chatgpt.com
claude.ai
```

Keep the browser open.

---

## Run ChatGPT A/B Test

```bash
RUN_LIVE=1 CDP_URL=http://127.0.0.1:9222 npx playwright test tests/live-ab-reduction.spec.ts -g ChatGPT --headed
```

---

## Run One Mode Only

```bash
RUN_LIVE=1 COMPARE_MODES=Ultra CDP_URL=http://127.0.0.1:9222 npx playwright test tests/live-ab-reduction.spec.ts -g ChatGPT --headed
```

Available values:

```text
Lite
Full
Ultra
```

---

## Benchmark Output

Results are saved to:

```text
test-results/caveman-ab/chatgpt-ab-results.json
test-results/caveman-ab/chatgpt-ab-results.csv
```

Example format:

```text
Prompt 2 | OFF -> Lite:
26.41% estimated token reduction
29.68% word reduction
```

---

## Known Limitation

ChatGPT and Claude update their web UI often.

If the pill disappears or injection stops, update selectors in:

```text
content.js
```

Main areas:

```text
getComposer()
getSendButton()
findMount()
```

---

## Files

```text
caveman-extension/
  manifest.json
  content.js
  style.css
  icons/
    icon16.png
    icon32.png
    icon48.png
    icon128.png
```

---

## Roadmap

Possible future work:

- Firefox support
- Edge support
- optional popup UI
- custom user prefixes
- export benchmark report
- real API benchmark mode
- Anthropic-tokenizer estimate for Claude
- README badge generation

---

## Philosophy

Use AI for answers, not essays.

Less filler.  
More signal.  
Small mouth.  
Big brain.

---

## License

MIT
