/* Unimark — interakcije strani */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.remove("no-js");
  window.addEventListener("load", function () { doc.classList.add("is-loaded"); });

  /* ---------- Glava ob drsenju ---------- */
  var header = document.querySelector("[data-header]");
  var mobileBar = document.querySelector("[data-mobile-bar]");
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (mobileBar) mobileBar.classList.toggle("is-visible", y > 480);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  if (mobileBar) document.body.classList.add("has-mobile-bar");

  /* ---------- Mobilni meni ---------- */
  var toggle = document.querySelector("[data-menu-toggle]");
  var mobileMenu = document.getElementById("mobile-menu");
  function setMenu(open) {
    if (open && header) mobileMenu.style.setProperty("--mm-top", Math.max(0, header.getBoundingClientRect().bottom) + "px");
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Zapri meni" : "Odpri meni");
    if (mobileMenu) mobileMenu.inert = !open;
  }
  if (toggle && mobileMenu) {
    mobileMenu.inert = true;
    toggle.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-open"));
    });
    mobileMenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) { setMenu(false); toggle.focus(); }
    });
    window.matchMedia("(min-width: 1101px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------- Spustni meni Storitve (tipkovnica, dotik) ---------- */
  document.querySelectorAll(".has-menu").forEach(function (item) {
    var btn = item.querySelector(".nav-btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var open = !item.classList.contains("is-open");
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
    item.addEventListener("focusout", function (e) {
      if (!item.contains(e.relatedTarget)) { item.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); }
    });
    item.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { item.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); btn.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!item.contains(e.target)) { item.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); }
    });
  });

  /* ---------- Pojavljanje ob drsenju ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Prej / potem drsnik ---------- */
  document.querySelectorAll("[data-ba]").forEach(function (ba) {
    var range = ba.querySelector("input[type=range]");
    function set(v) { ba.style.setProperty("--pos", v + "%"); }
    range.addEventListener("input", function () { set(range.value); });
    set(range.value);
  });

  /* ---------- pH zavihki ---------- */
  document.querySelectorAll("[data-ph]").forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll("[role=tab]"));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") n = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") n = tabs[0];
        if (e.key === "End") n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* ---------- Današnji delovni čas ---------- */
  var day = new Date().getDay(); // 0 = nedelja
  document.querySelectorAll("[data-day]").forEach(function (row) {
    if (row.getAttribute("data-day").split(",").indexOf(String(day)) > -1) row.classList.add("today");
  });

  /* ---------- Leto v nogi ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Predizbira storitve iz URL (?storitev=...) ---------- */
  var params = new URLSearchParams(location.search);
  var pre = params.get("storitev");
  if (pre) {
    document.querySelectorAll("select[name=storitev]").forEach(function (s) {
      Array.prototype.forEach.call(s.options, function (o) { if (o.dataset.slug === pre) s.value = o.value; });
    });
  }

  /* ---------- Obrazec za povpraševanje ---------- */
  document.querySelectorAll("[data-inquiry]").forEach(function (form) {
    var wrap = form.closest(".form-card");
    var status = form.querySelector(".form-status");
    var messages = {
      valueMissing: "To polje je obvezno.",
      typeMismatch: "Vnesite veljaven e-poštni naslov.",
      patternMismatch: "Vnesite veljavno telefonsko številko.",
      consent: "Za oddajo se morate strinjati s politiko zasebnosti."
    };

    function validateField(input) {
      var field = input.closest(".field") || input.closest(".consent");
      if (!field) return true;
      var err = field.querySelector(".err");
      var ok = input.checkValidity();
      field.classList.toggle("has-error", !ok);
      input.setAttribute("aria-invalid", String(!ok));
      if (err && !ok) {
        var v = input.validity;
        err.textContent = input.type === "checkbox" ? messages.consent
          : v.valueMissing ? messages.valueMissing
          : v.typeMismatch ? messages.typeMismatch
          : v.patternMismatch ? messages.patternMismatch : messages.valueMissing;
      }
      return ok;
    }

    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (el.type === "hidden" || el.name === "_honey") return;
      el.addEventListener("blur", function () { if (el.value || el.closest(".has-error")) validateField(el); });
      el.addEventListener("input", function () { if (el.closest(".has-error")) validateField(el); });
      el.addEventListener("change", function () { if (el.closest(".has-error")) validateField(el); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.className = "form-status";
      var firstBad = null;
      form.querySelectorAll("[required]").forEach(function (el) {
        if (!validateField(el) && !firstBad) firstBad = el;
      });
      if (firstBad) { firstBad.focus(); return; }

      form.classList.add("is-sending");
      var btn = form.querySelector("[type=submit]");
      btn.disabled = true;
      var data = Object.fromEntries(new FormData(form));

      // FormSubmit: AJAX različica istega naslova vrne JSON namesto preusmeritve
      fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (!res.ok || String(res.body.success) === "false") throw new Error(res.body.message || "Napaka");
          wrap.classList.add("is-sent");
          wrap.querySelector(".form-success").focus();
          form.reset();
        })
        .catch(function (err) {
          var msg = (err && err.message) || "";
          if (window.console) console.error("FormSubmit:", msg);
          status.textContent = /activat/i.test(msg)
            ? "Obrazec še ni aktiviran. Na info.unimark@gmail.com je bil poslan potrditveni e-mail FormSubmit (preverite tudi vsiljeno pošto) – kliknite »Activate Form« in pošljite znova."
            : "Sporočila ni bilo mogoče poslati. Poskusite znova ali nas pokličite na 070 325 039." + (msg ? " (" + msg + ")" : "");
          status.className = "form-status is-error";
        })
        .finally(function () {
          form.classList.remove("is-sending");
          btn.disabled = false;
        });
    });
  });

  /* ---------- Piškotki in soglasje ---------- */
  var KEY = "unimark_consent";
  var VERSION = 1;
  var banner = document.getElementById("cookie-banner");
  var modal = document.getElementById("cookie-modal");

  function readConsent() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      return c && c.v === VERSION ? c : null;
    } catch (e) { return null; }
  }
  function saveConsent(prefs) {
    var c = { v: VERSION, date: new Date().toISOString(), necessary: true, external: !!prefs.external, analytics: !!prefs.analytics };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    apply(c);
    hideBanner();
    closeModal();
    document.dispatchEvent(new CustomEvent("unimark:consent", { detail: c }));
  }
  function apply(c) {
    window.unimarkConsent = c;
    if (c && c.external) loadMaps();
    /* Analitika: ko jo boste dodali (npr. Google Analytics), jo naložite tukaj:
       if (c && c.analytics) { ... } */
  }
  function showBanner() { if (banner) { banner.hidden = false; requestAnimationFrame(function () { banner.classList.add("is-visible"); }); } }
  function hideBanner() { if (banner) { banner.classList.remove("is-visible"); setTimeout(function () { banner.hidden = true; }, 400); } }

  var lastFocus = null;
  function openModal() {
    if (!modal) return;
    var c = readConsent() || { external: false, analytics: false };
    modal.querySelector("[name=external]").checked = !!c.external;
    modal.querySelector("[name=analytics]").checked = !!c.analytics;
    lastFocus = document.activeElement;
    modal.hidden = false;
    requestAnimationFrame(function () { modal.classList.add("is-open"); modal.querySelector(".modal-dialog").focus(); });
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.classList.remove("is-open");
    setTimeout(function () { modal.hidden = true; }, 300);
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-consent]");
    if (!t) return;
    var a = t.getAttribute("data-consent");
    if (a === "accept") saveConsent({ external: true, analytics: true });
    if (a === "reject") saveConsent({ external: false, analytics: false });
    if (a === "settings") { e.preventDefault(); openModal(); }
    if (a === "close") closeModal();
    if (a === "save") saveConsent({
      external: modal.querySelector("[name=external]").checked,
      analytics: modal.querySelector("[name=analytics]").checked
    });
    if (a === "map") {
      var cur = readConsent() || { analytics: false };
      saveConsent({ external: true, analytics: cur.analytics });
    }
  });
  if (modal) {
    modal.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
      if (e.key === "Tab") {
        var f = modal.querySelectorAll("button, input, a[href]");
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  function loadMaps() {
    document.querySelectorAll("[data-map]").forEach(function (box) {
      if (box.querySelector("iframe")) return;
      var f = document.createElement("iframe");
      f.src = box.getAttribute("data-map");
      f.title = "Zemljevid: Brezje pri Grosupljem 87, 1290 Grosuplje";
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer-when-downgrade";
      f.allowFullscreen = true;
      box.appendChild(f);
      var ph = box.querySelector(".map-placeholder");
      if (ph) ph.remove();
    });
  }

  var consent = readConsent();
  if (consent) apply(consent); else setTimeout(showBanner, 700);
})();
