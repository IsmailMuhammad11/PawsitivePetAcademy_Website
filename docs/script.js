/* Pawsitive Pet Academy - site behaviour */
(function () {
  'use strict';
  var KEY = 'ppa_quote';

  /* ---------- safe storage (error handling: storage may be blocked) ---------- */
  function loadQuote() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function saveQuote(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; }
    catch (e) { return false; }
  }
  function discountPct(n) { return n >= 4 ? 15 : n === 3 ? 10 : n === 2 ? 5 : 0; }
  function money(n) { return 'R' + n.toFixed(2); }

  function toast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- navigation: burger + drop-down menu ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('mainNav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
    });
  }
  document.querySelectorAll('.drop-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.parentElement.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown.open').forEach(function (d) { d.classList.remove('open'); });
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.dropdown.open').forEach(function (d) { d.classList.remove('open'); });
  });

  /* ---------- "Add to quote" buttons on course pages ---------- */
  document.querySelectorAll('.add-quote').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var name = btn.dataset.course, fee = parseFloat(btn.dataset.fee);
      if (!name || isNaN(fee)) { toast('Sorry, that course could not be added.'); return; }
      var list = loadQuote();
      if (list.some(function (c) { return c.name === name; })) { toast(name + ' is already in your quote.'); return; }
      list.push({ name: name, fee: fee });
      toast(saveQuote(list) ? name + ' added to your quote' : 'Could not save your quote (storage blocked).');
    });
  });

  /* ---------- fees page: live discount calculator ---------- */
  var checks = document.querySelectorAll('.course-check');
  if (checks.length) {
    var saved = loadQuote().map(function (c) { return c.name; });
    checks.forEach(function (cb) {
      if (saved.indexOf(cb.value) !== -1) cb.checked = true;
      cb.addEventListener('change', calc);
    });
    var clear = document.getElementById('clearQuote');
    if (clear) clear.addEventListener('click', function () {
      checks.forEach(function (cb) { cb.checked = false; }); calc();
    });
    calc();
  }
  function calc() {
    var sel = Array.prototype.filter.call(checks, function (cb) { return cb.checked; });
    var sub = sel.reduce(function (s, cb) { return s + parseFloat(cb.dataset.fee); }, 0);
    var pct = discountPct(sel.length), amt = sub * pct / 100;
    document.getElementById('count').textContent = sel.length;
    document.getElementById('subtotal').textContent = money(sub);
    document.getElementById('discountPct').textContent = pct;
    document.getElementById('discountAmt').textContent = '-' + money(amt);
    document.getElementById('total').textContent = money(sub - amt);
    saveQuote(sel.map(function (cb) { return { name: cb.value, fee: parseFloat(cb.dataset.fee) }; }));
  }

  /* ---------- contact page: summary + validation ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var q = loadQuote(), box = document.getElementById('quoteSummary');
    if (box) {
      if (q.length) {
        var sub = q.reduce(function (s, c) { return s + c.fee; }, 0), pct = discountPct(q.length);
        box.innerHTML = '<strong>Your selected courses:</strong><br>' + q.map(function (c) { return c.name; }).join(', ') +
          '<br>Total after ' + pct + '% discount: <strong>' + money(sub - sub * pct / 100) + '</strong>';
      } else {
        box.innerHTML = 'No courses selected yet. <a href="fees.html">Choose courses on the Fees page</a> to include a quote.';
      }
    }

    var rules = {
      name:    { test: function (v) { return /^[A-Za-z][A-Za-z\s'\-]{1,59}$/.test(v); }, msg: 'Please enter your full name (letters only, at least 2 characters).' },
      email:   { test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }, msg: 'Please enter a valid email address, e.g. name@example.com.' },
      phone:   { test: function (v) { return /^(\+27|0)[0-9]{9}$/.test(v.replace(/[\s\-]/g, '')); }, msg: 'Please enter a valid South African number, e.g. 031 123 4567 or +27 31 123 4567.' },
      message: { test: function (v) { return v.trim().length >= 10; }, msg: 'Your message must be at least 10 characters long.' }
    };

    function check(id) {
      var el = document.getElementById(id), err = document.getElementById(id + 'Error');
      var ok = rules[id].test(el.value.trim());
      el.classList.toggle('invalid', !ok);
      err.textContent = ok ? '' : rules[id].msg;
      el.setAttribute('aria-invalid', !ok);
      return ok;
    }
    Object.keys(rules).forEach(function (id) {
      document.getElementById(id).addEventListener('blur', function () { check(id); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var banner = document.getElementById('formBanner');
      banner.className = 'alert';
      try {
        var allOk = Object.keys(rules).map(check).every(Boolean);
        if (!allOk) {
          banner.className = 'alert error';
          banner.textContent = 'Please fix the highlighted fields and try again.';
          var first = form.querySelector('.invalid'); if (first) first.focus();
          return;
        }
        /* Demo only: connect to a backend (e.g. Formspree) to really send enquiries. */
        banner.className = 'alert success';
        banner.textContent = 'Thank you, ' + document.getElementById('name').value.trim() + '! Your enquiry has been received and we will be in touch shortly.';
        form.reset();
      } catch (err) {
        banner.className = 'alert error';
        banner.textContent = 'Something went wrong while sending your enquiry. Please try again.';
      }
    });
  }
})();
