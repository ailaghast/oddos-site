// Mail window signup: sends the address to Kit's "Odd Pixel – Website" form and answers inside the window
// (bitmap text) instead of leaving the page. Kit's form endpoint allows cross-site posts and replies in JSON:
// { status: "success" | "quarantined" | "failed", errors: { messages: [...] } }.
// Without JavaScript the form still posts to Kit and the visitor lands on Kit's own page.
(function () {
  const form = document.querySelector('#w-mail form.signup'); if (!form) return;
  const input = form.querySelector('input'), btn = form.querySelector('button'), msg = form.parentElement.querySelector('.formmsg');

  // bitmap text keeps the real words in a hidden .sr span (see bitmap-text.js); change those and redraw
  function say(text, kind) {
    msg.hidden = false; msg.classList.toggle('err', kind === 'err'); msg.classList.toggle('dim', kind === 'wait');
    const sr = msg.querySelector(':scope > .sr'); (sr || msg).textContent = text;
    requestAnimationFrame(() => BT.render(msg));
  }
  const busy = on => { input.disabled = on; btn.disabled = on; };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!input.value.trim() || !input.checkValidity()) return say("That doesn't look like an email address.", 'err');
    const body = new FormData(form); body.append('referrer', location.href);   // before busy(): disabled fields aren't sent
    busy(true); say('Sending…', 'wait');
    try {
      const res = await fetch(form.action, { method: 'POST', body, headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (data.status === 'success') {
        form.hidden = true;
        say('Almost there! Check your inbox and click the link to confirm. No email? Look in Spam or Promotions.');
      } else if (data.status === 'quarantined') {
        busy(false); form.submit();   // Kit wants a bot check: hand over to Kit's own page, which runs it (re-enabled first: disabled fields aren't sent)
      } else {
        busy(false); say((data.errors && data.errors.messages && data.errors.messages[0]) || 'That didn’t work. Try again?', 'err');
      }
    } catch {
      busy(false); say('Couldn’t reach the mail server. Try again in a moment.', 'err');
    }
  });
})();
