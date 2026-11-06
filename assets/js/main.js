/* هيكل — HAYKAL
   سكربت واحد: ترويسة، كشف عند التمرير، أداة المقارنة، مستكشف العناصر، النموذج. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. الترويسة ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-stuck", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 2. قائمة الجوال ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var mnav = document.querySelector(".mobile-nav");
  if (toggle && mnav) {
    toggle.addEventListener("click", function () {
      var open = mnav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mnav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        mnav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- 3. الكشف عند التمرير ---------- */
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 60 + "ms";
      io.observe(el);
    });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- 4. أداة المقارنة: الزخرفة ← الهيكل ---------- */
  var cmp = document.querySelector(".compare");
  if (cmp) {
    var range = cmp.querySelector(".compare__range");
    var knobLabel = cmp.querySelector(".compare__knob");
    function paint(v) {
      cmp.style.setProperty("--split", v + "%");
      if (knobLabel) knobLabel.setAttribute("aria-valuetext", v + "٪");
    }
    paint(parseFloat(range ? range.value : 46));
    if (range) {
      range.addEventListener("input", function () { paint(parseFloat(range.value)); });
      var start = parseFloat(range.value);
      range.addEventListener("pointerdown", function () { start = parseFloat(range.value); });
      range.addEventListener("keydown", function (e) {
        // فتح/إغلاق كامل بلوحة المفاتيح
        if (e.key === "Home") { range.value = 0; paint(0); }
        if (e.key === "End") { range.value = 100; paint(100); }
      });
      // لمسة واحدة على أي مكان في الأداة = قفزة مباشرة
      cmp.addEventListener("click", function (e) {
        if (e.target === range || e.target.closest(".compare__range")) return;
        var r = cmp.getBoundingClientRect();
        var pct = ((r.right - e.clientX) / r.width) * 100;
        pct = Math.max(0, Math.min(100, pct));
        range.value = pct;
        paint(pct);
      });
    }
  }

  /* ---------- 5. مستكشف العناصر ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-tab]"));
  var panels = Array.prototype.slice.call(document.querySelectorAll("[data-panel]"));
  if (tabs.length && panels.length) {
    function select(id, focus) {
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-tab") === id;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.setAttribute("tabindex", on ? "0" : "-1");
        if (on && focus) t.focus();
      });
      panels.forEach(function (p) {
        p.hidden = p.getAttribute("data-panel") !== id;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t.getAttribute("data-tab")); });
      t.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowDown" || e.key === "ArrowLeft") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowUp" || e.key === "ArrowRight") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") next = tabs[0];
        if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) {
          e.preventDefault();
          select(next.getAttribute("data-tab"), true);
        }
      });
    });
  }

  /* ---------- 6. النموذج ---------- */
  var form = document.querySelector(".join-form");
  if (form) {
    var done = form.querySelector(".form__done");

    function setErr(field, msg) {
      var wrap = field.closest(".field");
      if (!wrap) return;
      if (msg) {
        wrap.classList.add("is-error");
        var err = wrap.querySelector(".field__err");
        if (err) err.textContent = msg;
        field.setAttribute("aria-invalid", "true");
      } else {
        wrap.classList.remove("is-error");
        field.removeAttribute("aria-invalid");
      }
    }

    form.addEventListener("input", function (e) {
      if (e.target.matches("input, select, textarea")) setErr(e.target, "");
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name;
      var email = form.elements.email;
      var role = form.elements.role;
      var city = form.elements.city;
      var about = form.elements.about;
      var ok = true;

      if (!name.value.trim() || name.value.trim().length < 3) {
        setErr(name, "اكتب الاسم الكامل (٣ أحرف على الأقل).");
        ok = false;
      }
      var em = email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) {
        setErr(email, "البريد الإلكتروني غير صحيح.");
        ok = false;
      }
      if (!role.value) {
        setErr(role, "اختر صفتك في المشروع.");
        ok = false;
      }
      if (!ok) {
        var first = form.querySelector(".field.is-error input, .field.is-error select");
        if (first) first.focus();
        return;
      }

      var payload = {
        name: name.value.trim(),
        email: em,
        role: role.value,
        city: city.value.trim(),
        about: about.value.trim(),
        at: new Date().toISOString()
      };

      try {
        var key = "haykal:applications";
        var all = JSON.parse(localStorage.getItem(key) || "[]");
        all.push(payload);
        localStorage.setItem(key, JSON.stringify(all));
      } catch (err) {
        /* التخزين المحلي غير متاح — لا نُفشل الطلب */
      }

      if (done) {
        done.querySelector("[data-done-name]").textContent = payload.name.split(" ")[0];
        done.classList.add("is-on");
        done.setAttribute("role", "status");
      }
      form.querySelectorAll(".field input, .field select, .field textarea").forEach(function (el) {
        el.value = "";
      });
      done.scrollIntoView({ block: "nearest" });
    });
  }

  /* ---------- 7. سنة التذييل ---------- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
