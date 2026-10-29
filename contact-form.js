// Kontaktní formulář 10men.cz: odesílá na vlastní server (Firebase funkce contactForm), ne přes třetí stranu.
// Ochrana: skrytá past, serverem vydaná výzva s časem, proof-of-work (SHA-256), reCAPTCHA v3 jen po souhlasu s cookies.
(function () {
  var ENDPOINT = 'https://europe-west1-base-39f52.cloudfunctions.net/contactForm';
  var RECAPTCHA_SITE_KEY = '6Leh1AUuAAAAAC8-MfGKaIXUv62_Q0GShOKZD_Z2';   // veřejný klíč reCAPTCHA v3; prázdný = formulář běží bez ní (přísnější limity na serveru)
  var POW_BITS = 16;
  var MSG = {
    cs: { sending: 'Odesílám…', invalid: 'Zkontrolujte prosím vyplněné údaje (e-mail, předmět, zpráva alespoň 10 znaků).', rate: 'Odesíláte příliš často. Zkuste to prosím později nebo napište na info@10men.cz.', spam: 'Zprávu se nepodařilo odeslat, vypadá jako nevyžádaná pošta. Napište nám prosím přímo na info@10men.cz.', captcha: 'Ověření proti robotům se nezdařilo. Obnovte stránku a zkuste to znovu, nebo napište na info@10men.cz.', token: 'Platnost formuláře vypršela. Zkuste to prosím znovu.', generic: 'Něco se pokazilo. Zkuste to prosím znovu nebo nás kontaktujte přímo na info@10men.cz' },
    en: { sending: 'Sending…', invalid: 'Please check your details (e-mail, subject, message of at least 10 characters).', rate: 'You are sending too often. Please try later or write to info@10men.cz.', spam: 'The message could not be sent because it looks like spam. Please write to us directly at info@10men.cz.', captcha: 'Bot verification failed. Reload the page and try again, or write to info@10men.cz.', token: 'The form has expired. Please try again.', generic: 'Something went wrong. Please try again or contact us directly at info@10men.cz' },
    de: { sending: 'Wird gesendet…', invalid: 'Bitte prüfen Sie Ihre Angaben (E-Mail, Betreff, Nachricht mit mindestens 10 Zeichen).', rate: 'Sie senden zu häufig. Bitte versuchen Sie es später oder schreiben Sie an info@10men.cz.', spam: 'Die Nachricht konnte nicht gesendet werden, da sie wie Spam aussieht. Schreiben Sie uns bitte direkt an info@10men.cz.', captcha: 'Die Bot-Prüfung ist fehlgeschlagen. Laden Sie die Seite neu und versuchen Sie es erneut oder schreiben Sie an info@10men.cz.', token: 'Das Formular ist abgelaufen. Bitte versuchen Sie es erneut.', generic: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt unter info@10men.cz' },
    es: { sending: 'Enviando…', invalid: 'Revisa los datos (correo, asunto, mensaje de al menos 10 caracteres).', rate: 'Estás enviando demasiado a menudo. Inténtalo más tarde o escribe a info@10men.cz.', spam: 'No se pudo enviar el mensaje porque parece spam. Escríbenos directamente a info@10men.cz.', captcha: 'Falló la verificación anti-bots. Recarga la página e inténtalo de nuevo, o escribe a info@10men.cz.', token: 'El formulario ha caducado. Inténtalo de nuevo.', generic: 'Algo salió mal. Inténtalo de nuevo o contáctanos directamente en info@10men.cz' }
  };
  var lang = (document.documentElement.lang || 'cs').slice(0, 2); if (!MSG[lang]) lang = 'cs';
  var form = document.getElementById('contact-form'); if (!form) return;
  var errBox = document.getElementById('form-error'), errP = errBox.querySelector('p');
  var challenge = null;   // {token, nonce}, připravuje se na pozadí po prvním doteku formuláře

  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function zeroBits(bytes) { var n = 0; for (var i = 0; i < bytes.length; i++) { if (bytes[i] === 0) { n += 8; continue; } n += Math.clz32(bytes[i]) - 24; break; } return n; }
  async function solve(token, bits) {
    var enc = new TextEncoder(), n = 0;
    for (;;) {
      var h = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(token + ':' + n)));
      if (zeroBits(h) >= bits) return String(n);
      n++; if (n % 2000 === 0) await new Promise(function (r) { setTimeout(r, 0); });   // nezamrazit stránku
    }
  }
  function prepare() {
    if (challenge) return challenge;
    challenge = fetch(ENDPOINT, { method: 'GET' }).then(function (r) { if (!r.ok) throw new Error('chal'); return r.json(); })
      .then(function (c) { return solve(c.token, c.bits || POW_BITS).then(function (nonce) { return { token: c.token, nonce: nonce, at: Date.now() }; }); });
    challenge.catch(function () { challenge = null; });
    return challenge;
  }
  ['focusin', 'pointerdown', 'keydown'].forEach(function (ev) { form.addEventListener(ev, function once() { form.removeEventListener(ev, once); prepare(); }, { passive: true }); });

  function consented() { try { return localStorage.getItem('10men-cookie-consent') === 'accepted'; } catch (e) { return false; } }
  function recaptcha() {
    if (!RECAPTCHA_SITE_KEY || !consented()) return Promise.resolve(null);
    return new Promise(function (resolve) {
      var done = function () { try { grecaptcha.ready(function () { grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'contact' }).then(resolve, function () { resolve(null); }); }); } catch (e) { resolve(null); } };
      if (window.grecaptcha && grecaptcha.ready) return done();
      var s = document.createElement('script'); s.src = 'https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(RECAPTCHA_SITE_KEY); s.async = true; s.onload = done; s.onerror = function () { resolve(null); };
      document.head.appendChild(s);
    });
  }
  function showError(code) { errP.textContent = MSG[lang][code] || MSG[lang].generic; errBox.style.display = 'block'; }

  form.addEventListener('submit', async function (e) {
    e.preventDefault(); errBox.style.display = 'none';
    var btn = form.querySelector('button[type="submit"]'), orig = btn.textContent; btn.textContent = MSG[lang].sending; btn.disabled = true;
    try {
      var c = await prepare(); var wait = 5600 - (Date.now() - c.at); if (wait > 0) await new Promise(function (r) { setTimeout(r, wait); });   // server odmítá odeslání dřív než za 5 s
      var rc = await recaptcha(), v = function (n) { return form.elements[n] ? form.elements[n].value : ''; };
      var res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: v('name'), email: v('email'), subject: v('subject'), message: v('message'), consent: form.elements.gdpr.checked, website: v('website'), token: c.token, nonce: c.nonce, rc: rc || undefined, lang: lang }) });
      var j = {}; try { j = await res.json(); } catch (x) {}
      if (res.ok && j.ok) { form.style.display = 'none'; document.getElementById('form-success').style.display = 'block'; return; }
      challenge = null; showError(j.code);
    } catch (x) { challenge = null; showError('generic'); }
    btn.textContent = orig; btn.disabled = false;
  });
})();
