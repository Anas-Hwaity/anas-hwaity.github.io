(function () {
  "use strict";

  var root = document.documentElement;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var lang = function () { return root.dataset.lang === "ar" ? "ar" : "en"; };

  var LABELS = {
    en: { lang: "التبديل إلى العربية", theme: "Toggle dark mode", close: "Close" },
    ar: { lang: "Switch to English", theme: "تبديل الوضع الليلي", close: "إغلاق" }
  };

  function applyLabels() {
    var l = LABELS[lang()];
    document.getElementById("langBtn").setAttribute("aria-label", l.lang);
    document.getElementById("themeBtn").setAttribute("aria-label", l.theme);
    document.getElementById("caseClose").setAttribute("aria-label", l.close);
    var open = document.getElementById("caseDialog");
    if (open.open && open.dataset.case) setCaseTitle(open.dataset.case);
  }

  function setLang(next) {
    root.dataset.lang = next;
    root.lang = next;
    root.dir = next === "ar" ? "rtl" : "ltr";
    store.set("lang", next);
    var url = new URL(location.href);
    if (next === "ar") url.searchParams.set("lang", "ar"); else url.searchParams.delete("lang");
    history.replaceState(null, "", url);
    applyLabels();
  }

  document.getElementById("langBtn").addEventListener("click", function () {
    setLang(lang() === "ar" ? "en" : "ar");
  });

  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  function currentTheme() { return root.dataset.theme || (mq.matches ? "dark" : "light"); }
  document.getElementById("themeBtn").addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    store.set("theme", next);
  });
  if (!root.dataset.theme && mq.matches) root.dataset.theme = "dark";
  mq.addEventListener && mq.addEventListener("change", function (e) {
    if (!store.get("theme")) root.dataset.theme = e.matches ? "dark" : "light";
  });

  var ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿ]/;
  var input = document.getElementById("labInput");
  var broken = document.getElementById("labBroken");
  var fixed = document.getElementById("labFixed");

  function renderBroken(text) {
    var frag = document.createDocumentFragment();
    var seg = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
    var parts = seg ? Array.from(seg.segment(text), function (s) { return s.segment; }) : Array.from(text);
    parts.forEach(function (g) {
      var s = document.createElement("span");
      s.textContent = g;
      if (ARABIC.test(g)) s.className = "iso";
      frag.appendChild(s);
    });
    broken.replaceChildren(frag);
  }

  function renderLab() {
    var t = input.value || " ";
    fixed.textContent = t;
    renderBroken(t);
  }
  input.addEventListener("input", renderLab);
  document.querySelectorAll("[data-sample]").forEach(function (b) {
    b.addEventListener("click", function () { input.value = b.dataset.sample; renderLab(); input.focus(); });
  });
  renderLab();

  var filters = document.querySelectorAll(".filter");
  var cards = document.querySelectorAll(".grid .p");
  filters.forEach(function (f) {
    f.addEventListener("click", function () {
      var key = f.dataset.filter;
      filters.forEach(function (x) { x.setAttribute("aria-pressed", String(x === f)); });
      cards.forEach(function (c) {
        var show = key === "all" || (" " + c.dataset.cat + " ").indexOf(" " + key + " ") !== -1;
        c.classList.toggle("is-hidden", !show);
        if (show) c.classList.add("in");
      });
    });
  });

  var axImg = document.getElementById("axImg");
  document.querySelectorAll(".seg [role=tab]").forEach(function (tab, _, all) {
    tab.addEventListener("click", function (e) {
      e.stopPropagation();
      all.forEach(function (t) { t.setAttribute("aria-selected", String(t === tab)); });
      var pre = new Image();
      pre.onload = function () {
        axImg.style.opacity = "0";
        setTimeout(function () {
          axImg.src = tab.dataset.src;
          axImg.alt = "Axioos Download Manager, " + tab.textContent + " theme";
          axImg.style.opacity = "1";
        }, 160);
      };
      pre.src = tab.dataset.src;
    });
  });

  var dialog = document.getElementById("caseDialog");
  var body = document.getElementById("caseBody");
  var title = document.getElementById("caseTitle");
  var opener = null;

  function setCaseTitle(id) {
    var tpl = document.getElementById("case-" + id);
    title.textContent = tpl.dataset["title" + (lang() === "ar" ? "Ar" : "En")];
  }

  function openCase(id, from) {
    var tpl = document.getElementById("case-" + id);
    if (!tpl) return;
    opener = from;
    dialog.dataset.case = id;
    setCaseTitle(id);
    body.replaceChildren(tpl.content.cloneNode(true));
    body.scrollTop = 0;
    if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
    document.body.style.overflow = "hidden";
    history.replaceState(null, "", "#" + id);
  }

  function closeCase() {
    if (dialog.open) dialog.close();
  }

  dialog.addEventListener("close", function () {
    document.body.style.overflow = "";
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    if (opener) opener.focus();
  });
  dialog.addEventListener("click", function (e) { if (e.target === dialog) closeCase(); });
  document.getElementById("caseClose").addEventListener("click", closeCase);
  document.querySelectorAll("[data-case]").forEach(function (b) {
    b.addEventListener("click", function () { openCase(b.dataset.case, b); });
  });
  var deep = location.hash.replace("#", "");
  if (deep && document.getElementById("case-" + deep)) openCase(deep, null);

  var header = document.getElementById("top");
  var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    document.querySelectorAll(".rv").forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 60 + "ms";
      io.observe(el);
    });
  } else {
    document.querySelectorAll(".rv").forEach(function (el) { el.classList.add("in"); });
  }

  document.getElementById("yr").textContent = String(new Date().getFullYear());
  applyLabels();
})();
