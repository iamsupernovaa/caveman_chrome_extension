// 🪨 Caveman — content script
// Prepends a brevity instruction to your prompt at send time.
// Local only. No network calls. No chat reading/exporting.

(() => {
  "use strict";

  // ---------------------------------------------------------------
  // Modes — edit prefixes here if you want different wording
  // ---------------------------------------------------------------
  const MODES = {
    off: {
      label: "OFF",
      prefix: ""
    },
    lite: {
      label: "Lite",
      prefix:
        "Caveman Lite mode:\n" +
        "Be concise. Skip intros, outros, and repeated summaries. Get to the point.\n\n"
    },
    full: {
      label: "Full",
      prefix:
        "Use Caveman Full mode:\n" +
        "Answer directly.\n" +
        "No filler.\n" +
        "No long intros.\n" +
        "No repeated summaries.\n" +
        "Use minimum tokens.\n" +
        "Ask only if blocked.\n\n"
    },
    ultra: {
      label: "Ultra",
      prefix:
        "Caveman Ultra mode:\n" +
        "Shortest correct answer possible.\n" +
        "No explanations unless asked.\n" +
        "No formatting unless essential.\n" +
        "If blocked, ask one question max.\n\n"
    }
  };
  const ORDER = ["off", "lite", "full", "ultra"];

  // Detects a prefix we already inserted, so we never double-apply.
  const PREFIX_RE = /^(use\s+)?caveman\s+(lite|full|ultra)\s+mode/i;

  const SITE = location.hostname.includes("claude.ai") ? "claude" : "chatgpt";

  // Per-site mode: Claude tabs and ChatGPT tabs are fully independent.
  // (Tabs of the SAME site still stay in sync, which is what you want.)
  const STORAGE_KEY = "cavemanMode_" + SITE;

  let mode = "off";
  let resending = false; // re-entrancy guard while we re-trigger send

  // ---------------------------------------------------------------
  // DOM lookups (these are the bits most likely to break when
  // OpenAI / Anthropic redesign their pages — fix selectors here)
  // ---------------------------------------------------------------
  function getComposer() {
    if (SITE === "claude") {
      // Scoped to the chat input grid first, so dialog textareas and
      // message-edit boxes never get picked up as "the composer"
      return (
        document.querySelector(
          '[data-testid="chat-input-grid-area"] div[contenteditable="true"].ProseMirror'
        ) ||
        document.querySelector(
          '[data-testid="chat-input-grid-container"] div[contenteditable="true"].ProseMirror'
        ) ||
        document.querySelector(
          'fieldset div[contenteditable="true"].ProseMirror'
        ) ||
        document.querySelector('div[contenteditable="true"].ProseMirror')
      );
    }
    // ChatGPT — #prompt-textarea is unique to the main composer
    return (
      document.querySelector("#prompt-textarea") ||
      document.querySelector('form[data-type="unified-composer"] div[contenteditable="true"].ProseMirror') ||
      document.querySelector("main textarea")
    );
  }

  function getSendButton(root) {
    const r = root || document;
    if (SITE === "claude") {
      return r.querySelector('button[aria-label*="send" i]');
    }
    return (
      r.querySelector('button[data-testid="send-button"]') ||
      r.querySelector("#composer-submit-button") ||
      r.querySelector('button[aria-label*="send" i]')
    );
  }

  // ---------------------------------------------------------------
  // Editor helpers
  // ---------------------------------------------------------------
  function isTextarea(el) {
    return el && el.tagName === "TEXTAREA";
  }

  function editorText(el) {
    if (!el) return "";
    return (isTextarea(el) ? el.value : el.innerText) || "";
  }

  function prependPrefix(el, prefix) {
    el.focus();

    if (isTextarea(el)) {
      // Use the native setter so React notices the change
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      ).set;
      setter.call(el, prefix + el.value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

    // contenteditable / ProseMirror: put caret at the very start,
    // then insertText so the editor's own state updates correctly.
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    const ok = document.execCommand("insertText", false, prefix);
    if (!ok) {
      // Fallback for editors that ignore execCommand
      el.dispatchEvent(
        new InputEvent("beforeinput", {
          inputType: "insertText",
          data: prefix,
          bubbles: true,
          cancelable: true
        })
      );
    }
  }

  // ---------------------------------------------------------------
  // Send interception
  // ---------------------------------------------------------------
  function interceptAndResend(e, editable, viaButton) {
    const text = editorText(editable).trim();
    if (!text) return;                // empty composer → let the site handle it
    if (PREFIX_RE.test(text)) return; // already prefixed → pass through

    e.preventDefault();
    e.stopImmediatePropagation();

    prependPrefix(editable, MODES[mode].prefix);

    resending = true;
    setTimeout(() => {
      const btn = viaButton || getSendButton();
      if (btn && !btn.disabled) {
        btn.click();
      } else {
        // send button briefly disabled/re-rendering → re-dispatch Enter
        editable.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            bubbles: true,
            cancelable: true
          })
        );
      }
      setTimeout(() => (resending = false), 400);
    }, 60);
  }

  // Enter inside the MAIN CHAT COMPOSER only (IME-safe: ignores
  // composition Enter, so Japanese input conversion is never hijacked).
  // Any other editable on the page — feedback dialogs, message-edit
  // boxes, search fields — is deliberately left untouched.
  document.addEventListener(
    "keydown",
    (e) => {
      if (mode === "off" || resending) return;
      if (e.key !== "Enter" || e.shiftKey) return;
      if (e.isComposing || e.keyCode === 229) return;
      const editable = e.target.closest?.(
        '[contenteditable="true"], textarea'
      );
      if (!editable) return;
      const composer = getComposer();
      if (!composer) return;
      if (editable !== composer && !composer.contains(editable)) return;
      interceptAndResend(e, composer, null);
    },
    true
  );

  // Click on the send button
  document.addEventListener(
    "click",
    (e) => {
      if (mode === "off" || resending) return;
      const btn = e.target.closest?.("button");
      if (!btn || btn.id === "caveman-pill") return;
      const send = getSendButton();
      if (!send || (btn !== send && !send.contains(btn))) return;
      const composer = getComposer();
      if (!composer) return;
      interceptAndResend(e, composer, send);
    },
    true
  );

  // ---------------------------------------------------------------
  // Inline pill — mounted INSIDE the composer toolbar.
  // Same technique as the Claude Counter extension: start from a
  // known control and walk up to the first flex row that holds
  // more than one button. That's the toolbar row, and it survives
  // class-name churn because it checks computed styles, not classes.
  // ---------------------------------------------------------------
  function findToolbarRow(el, stopAt) {
    let cur = el;
    while (cur && cur !== document.body) {
      if (stopAt && cur === stopAt) break;
      if (cur !== el && cur.nodeType === 1) {
        const cs = window.getComputedStyle(cur);
        if (
          cs.display === "flex" &&
          cs.flexDirection === "row" &&
          cur.querySelectorAll("button").length > 1
        ) {
          return cur;
        }
      }
      cur = cur.parentElement;
    }
    return null;
  }

  // Returns { parent, before }: insert the pill into `parent`,
  // immediately before `before` (null → append at the end).
  function findMount() {
    if (SITE === "claude") {
      // Target: just LEFT of the model selector ("Opus 4.7 ...")
      const model = document.querySelector(
        '[data-testid="model-selector-dropdown"]'
      );
      if (model) {
        const grid = model.closest(
          '[data-testid="chat-input-grid-area"], [data-testid="chat-input-grid-container"]'
        );
        const row = findToolbarRow(model, grid) || findToolbarRow(model);
        if (row) {
          // climb from the model selector to its direct child of the row
          let child = model;
          while (child.parentElement && child.parentElement !== row) {
            child = child.parentElement;
          }
          if (child.parentElement === row) {
            return { parent: row, before: child };
          }
        }
        return { parent: model.parentElement, before: model };
      }
      return null;
    }

    // ChatGPT — target: just LEFT of "Extended" in the trailing cluster.
    // Everything is scoped to the composer's own <form>, so the pill can
    // never mount into the sidebar or any other stray flex row on startup.
    const composer = getComposer();
    const form =
      (composer && composer.closest("form")) ||
      document.querySelector('form[data-type="unified-composer"]');
    if (!form) return null; // composer not rendered yet → observer retries

    const trailing = form.querySelector(
      '[data-testid="composer-trailing-actions"]'
    );
    if (trailing) {
      return { parent: trailing, before: trailing.firstElementChild };
    }
    const send = getSendButton(form);
    if (send) {
      const row = findToolbarRow(send, form);
      if (row && form.contains(row)) {
        return { parent: row, before: row.firstElementChild };
      }
    }
    return null;
  }

  function cycleMode() {
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    setMode(next, true);
  }

  function buildPill() {
    const pill = document.createElement("button");
    pill.id = "caveman-pill";
    pill.type = "button"; // critical: it lives inside the composer <form>
    pill.title = "Caveman: click to cycle mode";

    // Commit on pointerdown: the sites re-render their toolbars between
    // press and release, which cancels normal `click` events on injected
    // nodes. pointerdown fires before any of that can happen.
    pill.addEventListener(
      "pointerdown",
      (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        cycleMode();
      },
      true
    );

    // Swallow the follow-up events so the host page never sees them
    // (no editor focus-steal, no form side effects, no double-cycle).
    ["pointerup", "mousedown", "mouseup", "click"].forEach((type) =>
      pill.addEventListener(
        type,
        (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
        },
        true
      )
    );

    // Keyboard access, since `click` is suppressed
    pill.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopImmediatePropagation();
          cycleMode();
        }
      },
      true
    );

    return pill;
  }

  // Idempotent: only touches the DOM when the pill is missing or
  // misplaced, so the MutationObserver below can't loop on itself.
  // The pill lives ONLY in the composer toolbar: if no valid mount
  // exists yet (page still loading, or not a chat view), it stays
  // detached/invisible until the observer can place it.
  function ensurePill() {
    let pill = document.getElementById("caveman-pill") || buildPill();
    const mount = findMount();

    if (mount && mount.parent) {
      if (
        pill.parentElement !== mount.parent ||
        pill.nextElementSibling !== mount.before
      ) {
        try {
          mount.parent.insertBefore(pill, mount.before);
        } catch (_) {
          /* row re-rendered mid-insert; next mutation retries */
        }
      }
    } else if (pill.isConnected) {
      pill.remove(); // stale spot (e.g. navigated away) → hide until remounted
    }
    renderPill(pill);
  }

  function renderPill(pill) {
    pill = pill || document.getElementById("caveman-pill");
    if (!pill) return;
    // Guarded writes: identical writes still emit mutation records, which
    // would re-trigger the observer in an endless loop and replace the
    // pill's text node mid-press (cancelling clicks). Only touch the DOM
    // when the value really changed.
    const label = "\u{1FAA8} " + MODES[mode].label; // 🪨
    if (pill.textContent !== label) pill.textContent = label;
    if (pill.dataset.mode !== mode) pill.dataset.mode = mode;
    if (pill.dataset.site !== SITE) pill.dataset.site = SITE;
  }

  function setMode(next, persist) {
    if (!MODES[next]) next = "off";
    mode = next;
    renderPill();
    if (persist) chrome.storage.sync.set({ [STORAGE_KEY]: next });
  }

  // ---------------------------------------------------------------
  // Init + keep the pill alive across SPA navigation / re-renders.
  // React wipes injected nodes when the toolbar re-renders; the
  // observer re-inserts (rAF-debounced so it stays cheap).
  // ---------------------------------------------------------------
  chrome.storage.sync.get({ [STORAGE_KEY]: "off" }, (v) =>
    setMode(v[STORAGE_KEY], false)
  );

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[STORAGE_KEY]) {
      setMode(changes[STORAGE_KEY].newValue, false);
    }
  });

  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      ensurePill();
    });
  }).observe(document.documentElement, { childList: true, subtree: true });

  ensurePill();
})();
