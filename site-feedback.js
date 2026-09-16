/* Public-page feedback only. The creator does not load this file. */
(() => {
  "use strict";
  const trigger = document.querySelector("[data-site-feedback]");
  if (!trigger) return;
  const sourcePage = trigger.dataset.siteFeedback;
  if (!["Homepage", "Educators", "Birthday Problem"].includes(sourcePage)) return;
  const endpoint = "https://script.google.com/macros/s/AKfycbxdUQaPE-yOd4J5QcMTHGXqhHLZrZtqfQsrymHTNWIycJdyit_NgkL3_hYA9BPjazJr/exec";
  const audiences = ["Educator", "Parent or Family", "Student", "Museum or Organization", "Other"];
  const style = document.createElement("style");
  style.textContent = `
    [data-site-feedback]{display:inline-block;background:transparent;color:inherit;border:1px solid currentColor;border-radius:4px;padding:9px 15px;font:14px/1.5 Arial,sans-serif;cursor:pointer}
    [data-site-feedback]:focus-visible{outline:3px solid #ffd700;outline-offset:4px}
    #site-feedback-dialog{box-sizing:border-box;width:min(560px,calc(100% - 28px));max-height:calc(100dvh - 28px);padding:26px;border:1px solid #c4cfdb;border-radius:10px;background:#fff;color:#172943;font:16px/1.55 Arial,sans-serif;text-align:left;overflow:auto}
    #site-feedback-dialog *{box-sizing:border-box}
    #site-feedback-dialog::backdrop{background:rgba(3,13,35,.75)}
    #site-feedback-dialog h2{font:700 28px/1.2 Georgia,serif;color:#071a3b;margin:0 40px 16px 0;text-shadow:none;letter-spacing:normal}
    #site-feedback-dialog p{font-size:16px;margin:0 0 18px;color:#172943;opacity:1}
    #site-feedback-dialog label,#site-feedback-dialog legend{font:700 16px/1.5 Arial,sans-serif;color:#172943}
    #site-feedback-dialog select,#site-feedback-dialog textarea{display:block;width:100%;margin:8px 0 20px;padding:10px;border:1px solid #7385a0;border-radius:4px;background:white;color:#172943;font:16px/1.5 Arial,sans-serif}
    #site-feedback-dialog textarea{min-height:100px;resize:vertical}
    #site-feedback-dialog fieldset{min-width:0;border:0;padding:0;margin:0 0 20px}
    #site-feedback-dialog .sf-ratings{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
    #site-feedback-dialog .sf-ratings label{display:flex;align-items:center;gap:6px;min-height:44px;padding:8px 12px;border:1px solid #a9b7c9;border-radius:4px;cursor:pointer}
    #site-feedback-dialog .sf-help,#site-feedback-dialog .sf-privacy{font:14px/1.5 Arial,sans-serif;color:#4e5e72}
    #site-feedback-dialog button{font:700 15px/1.5 Arial,sans-serif;cursor:pointer;min-height:44px;border-radius:4px}
    #site-feedback-dialog .sf-close{position:absolute;right:15px;top:15px;border:0;background:transparent;color:#172943;width:44px;font-size:26px}
    #site-feedback-dialog .sf-send{background:#071a3b;color:white;border:1px solid #071a3b;padding:10px 20px}
    #site-feedback-dialog button:disabled{opacity:.65;cursor:wait}
    #site-feedback-dialog :focus-visible{outline:3px solid #b22234;outline-offset:3px}
    #site-feedback-dialog .sf-status:not(:empty){padding:12px;background:#edf1f5;margin-bottom:16px}
    @media(max-width:420px){#site-feedback-dialog{padding:22px 18px}.sf-ratings{gap:5px!important}#site-feedback-dialog .sf-ratings label{padding:8px}}
  `;
  document.head.appendChild(style);
  const dialog = document.createElement("dialog");
  dialog.id = "site-feedback-dialog";
  dialog.setAttribute("aria-labelledby", "sf-title");
  dialog.setAttribute("aria-describedby", "sf-intro");
  dialog.innerHTML = `
    <button type="button" class="sf-close" aria-label="Close feedback">×</button>
    <h2 id="sf-title">Share Your Feedback</h2>
    <p id="sf-intro">We’d appreciate your feedback as we continue improving The Great American Star.</p>
    <form>
      <label for="sf-audience">What best describes you? (required)</label>
      <select id="sf-audience" required><option value="">Select an option</option>${audiences.map(a => `<option>${a}</option>`).join("")}</select>
      <fieldset><legend>How useful or interesting did you find this page? (required)</legend>
        <div class="sf-ratings">${[1,2,3,4,5].map(n => `<label><input type="radio" name="sf-rating" value="${n}" required>${n}</label>`).join("")}</div>
        <div class="sf-help">1 = Not very useful or interesting<br>5 = Very useful or interesting</div>
      </fieldset>
      <label for="sf-comments">Comments or suggestions (optional)</label>
      <textarea id="sf-comments" maxlength="2000"></textarea>
      <input type="hidden" name="website" value="">
      <p class="sf-privacy">No name or email is required. Please do not include sensitive personal information.</p>
      <p class="sf-status" role="status" aria-live="polite"></p>
      <button type="submit" class="sf-send">Send Feedback</button>
    </form>`;
  document.body.appendChild(dialog);
  const form = dialog.querySelector("form");
  const send = dialog.querySelector(".sf-send");
  const status = dialog.querySelector(".sf-status");
  let sending = false;
  let submitted = false;
  let anonymousSessionId;
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-controls", dialog.id);
  trigger.addEventListener("click", () => dialog.showModal());
  dialog.querySelector(".sf-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => trigger.focus());

  function submitPayload(payload) {
    return new Promise((resolve, reject) => {
      const receiver = document.createElement("iframe");
      receiver.hidden = true;
      receiver.name = "site-feedback-receiver-" + crypto.randomUUID();
      receiver.title = "Site feedback submission receiver";
      const post = document.createElement("form");
      post.hidden = true;
      post.method = "post";
      post.action = endpoint;
      post.target = receiver.name;
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "payload";
      input.value = JSON.stringify(payload);
      post.appendChild(input);
      document.body.append(receiver, post);
      let timer;
      function finish(error) {
        clearTimeout(timer);
        window.removeEventListener("message", receive);
        post.remove();
        receiver.remove();
        if (error) reject(error); else resolve();
      }
      function receive(event) {
        // Keep the production Google-origin check on localhost too.
        const trusted = event.origin === "https://script.google.com" ||
          /^https:\/\/(?:[a-z0-9-]+\.)?googleusercontent\.com$/i.test(event.origin);
        if (!trusted || !event.data || event.data.type !== "great-american-star-feedback") return;
        // Apps Script may reply from a nested frame: require this submission's frame tree.
        let belongsToSubmission = false;
        try {
          for (let frame = event.source, depth = 0; frame && depth < 12; depth++) {
            if (frame === receiver.contentWindow) { belongsToSubmission = true; break; }
            if (frame === frame.parent) break;
            frame = frame.parent;
          }
        } catch (_) { return; }
        if (!belongsToSubmission) return;
        finish(event.data.ok === true ? null : new Error("Submission failed"));
      }
      window.addEventListener("message", receive);
      timer = setTimeout(() => finish(new Error("Submission timed out")), 30000);
      try { post.submit(); } catch (error) { finish(error); }
    });
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (sending || submitted || !form.reportValidity()) return;
    const audienceType = dialog.querySelector("#sf-audience").value;
    const rating = Number(form.querySelector('input[name="sf-rating"]:checked')?.value);
    if (!audiences.includes(audienceType) || !Number.isInteger(rating) || rating < 1 || rating > 5) return;
    sending = true;
    send.disabled = true;
    send.textContent = "Sending…";
    status.textContent = "Sending your feedback…";
    try {
      if (!anonymousSessionId) anonymousSessionId = "site-" + crypto.randomUUID();
      // Explicit allowlist: never serialize the page, artwork, or unrelated form fields.
      const payload = {
        timestamp: new Date().toISOString(),
        anonymousSessionId,
        rating,
        recommendation: "",
        feedbackText: dialog.querySelector("#sf-comments").value.trim(),
        website: form.elements.website.value,
        feedbackType: "Site Feedback",
        sourcePage,
        audienceType
      };
      await submitPayload(payload);
      submitted = true;
      status.textContent = "Thank you for your feedback.";
      send.textContent = "Feedback sent";
    } catch (_) {
      status.textContent = "We couldn’t confirm your submission. Please try again. Your comments have been kept.";
      send.textContent = "Send Feedback";
    } finally {
      sending = false;
      send.disabled = submitted;
    }
  });
})();
