/* ============================================================
   main.js — interaction & scroll behavior
   Loaded on every page. Pure vanilla JS, no dependencies.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- 1. Scroll progress bar ---------- */
  const progress = document.querySelector(".scroll-progress");
  function updateProgress() {
    const h = document.documentElement;
    const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
    if (progress) progress.style.width = (scrolled * 100) + "%";
  }

  /* ---------- 2. Navbar shrink/blur on scroll ---------- */
  const nav = document.querySelector(".nav");
  function updateNav() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 30);
  }

  window.addEventListener("scroll", function () {
    updateProgress();
    updateNav();
  }, { passive: true });
  updateProgress();
  updateNav();

  /* ---------- 3. Mobile nav toggle ---------- */
  const toggle = document.querySelector(".nav__toggle");
  const links = document.querySelector(".nav__links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      links.classList.toggle("open");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { links.classList.remove("open"); });
    });
  }

  /* ---------- 4. Reveal-on-scroll (Intersection Observer) ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- 5. Hero parallax ---------- */
  const heroBg = document.querySelector(".hero__bg");
  if (heroBg) {
    window.addEventListener("scroll", function () {
      const y = window.scrollY;
      heroBg.style.transform = "translateY(" + (y * 0.25) + "px)";
    }, { passive: true });
  }

  /* ---------- 6. Card spotlight follows cursor ---------- */
  document.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- 7. Button ripple on click ---------- */
  document.querySelectorAll(".btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      const circle = document.createElement("span");
      const d = Math.max(btn.clientWidth, btn.clientHeight);
      const r = btn.getBoundingClientRect();
      circle.className = "ripple";
      circle.style.width = circle.style.height = d + "px";
      circle.style.left = (e.clientX - r.left - d / 2) + "px";
      circle.style.top = (e.clientY - r.top - d / 2) + "px";
      btn.appendChild(circle);
      setTimeout(function () { circle.remove(); }, 600);
    });
  });

  /* ---------- 8. Magnetic primary buttons ---------- */
  if (window.matchMedia("(pointer:fine)").matches) {
    document.querySelectorAll(".btn--primary").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        const r = btn.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2;
        const my = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + mx * 0.18 + "px," + my * 0.28 + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }

  /* ---------- 9. Scroll-spy: highlight the nav link for the section in view ---------- */
  const navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__link[href^="#"]'));
  const sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          navLinks.forEach(function (a) {
            a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id);
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 10. Footer year ---------- */
  const yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();
})();
