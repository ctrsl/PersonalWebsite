/* ============================================================
   content.js — loads editable content from /content/*.json
   and renders it into the single-page site. This is what lets
   the CMS admin panel change the site without touching code.

   Containers opt in with a data-render="..." attribute.
   ============================================================ */

(function () {
  "use strict";

  // Tiny, safe markdown -> HTML (headings, bold, italic, links, lists, quotes).
  function md(src) {
    if (!src) return "";
    let html = src
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    html = html
      .replace(/^### (.*)$/gm, "<h3>$1</h3>")
      .replace(/^## (.*)$/gm, "<h2>$1</h2>")
      .replace(/^> (.*)$/gm, "<blockquote>$1</blockquote>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/`(.+?)`/g, "<code>$1</code>");
    html = html.replace(/(?:^- .*(?:\n|$))+/gm, function (block) {
      const items = block.trim().split("\n").map(function (l) {
        return "<li>" + l.replace(/^- /, "") + "</li>";
      }).join("");
      return "<ul>" + items + "</ul>";
    });
    html = html.split(/\n{2,}/).map(function (block) {
      block = block.trim();
      if (!block) return "";
      if (/^<(h2|h3|ul|ol|blockquote)/.test(block)) return block;
      return "<p>" + block.replace(/\n/g, "<br>") + "</p>";
    }).join("\n");
    return html;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  async function load(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load " + path);
    return res.json();
  }

  function formatDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  /* ---------- Renderers ---------- */

  function renderProjects(el, data) {
    const items = (data.projects || []);
    if (!items.length) { el.innerHTML = '<p class="skeleton">No projects yet.</p>'; return; }
    el.innerHTML = items.map(function (p, i) {
      const link = p.url
        ? '<a class="card__link" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.link_text || "View project") + ARROW + "</a>"
        : "";
      return '' +
        '<article class="card reveal" data-delay="' + (i % 3 + 1) + '">' +
          (p.tag ? '<span class="card__tag">' + esc(p.tag) + "</span>" : "") +
          "<h3>" + esc(p.title) + "</h3>" +
          "<p>" + esc(p.description) + "</p>" +
          link +
        "</article>";
    }).join("");
    reobserve(el);
  }

  function renderExperience(el, data) {
    const items = (data.roles || []);
    if (!items.length) { el.innerHTML = '<p class="skeleton">No experience entries yet.</p>'; return; }
    el.innerHTML = '<div class="timeline">' + items.map(function (r) {
      return '' +
        '<div class="tl-item reveal">' +
          '<div class="tl-date">' + esc(r.period) + "</div>" +
          '<div class="tl-role">' + esc(r.role) + "</div>" +
          '<div class="tl-org">' + esc(r.org) + "</div>" +
          "<p>" + esc(r.summary) + "</p>" +
        "</div>";
    }).join("") + "</div>";
    reobserve(el);
  }

  // Blog: cards that open the full post in an on-page modal.
  let BLOG_POSTS = [];
  function renderBlog(el, data) {
    BLOG_POSTS = (data.posts || []).slice().sort(function (a, b) {
      return (b.date || "").localeCompare(a.date || "");
    });
    if (!BLOG_POSTS.length) { el.innerHTML = '<p class="skeleton">No posts yet.</p>'; return; }
    el.innerHTML = BLOG_POSTS.map(function (p, i) {
      const key = p.slug || p.title;
      return '' +
        '<button class="card reveal" data-delay="' + (i % 3 + 1) + '" data-post="' + esc(key) + '" style="text-align:left;cursor:pointer;font:inherit;">' +
          '<span class="card__tag">' + esc(formatDate(p.date)) + "</span>" +
          "<h3>" + esc(p.title) + "</h3>" +
          "<p>" + esc(p.excerpt || "") + "</p>" +
          '<span class="card__link">Read post' + ARROW + "</span>" +
        "</button>";
    }).join("");
    el.querySelectorAll("[data-post]").forEach(function (btn) {
      btn.addEventListener("click", function () { openPost(btn.getAttribute("data-post")); });
    });
    reobserve(el);
  }

  /* ---------- Blog modal ---------- */
  let modal;
  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML =
      '<div class="modal__overlay" data-close></div>' +
      '<div class="modal__panel" role="dialog" aria-modal="true">' +
        '<button class="modal__close" data-close aria-label="Close">✕</button>' +
        '<p class="modal__meta"></p>' +
        '<h2 class="modal__title"></h2>' +
        '<div class="prose modal__body"></div>' +
      '</div>';
    document.body.appendChild(modal);
    modal.querySelectorAll("[data-close]").forEach(function (n) {
      n.addEventListener("click", closePost);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePost();
    });
    return modal;
  }
  function openPost(key) {
    const post = BLOG_POSTS.find(function (p) { return (p.slug || p.title) === key; });
    if (!post) return;
    ensureModal();
    modal.querySelector(".modal__meta").textContent = formatDate(post.date) + (post.author ? " · " + post.author : "");
    modal.querySelector(".modal__title").textContent = post.title;
    modal.querySelector(".modal__body").innerHTML = md(post.body || post.excerpt || "");
    modal.querySelector(".modal__panel").scrollTop = 0;
    modal.classList.add("open");
    document.body.classList.add("modal-open");
  }
  function closePost() {
    if (!modal) return;
    modal.classList.remove("open");
    document.body.classList.remove("modal-open");
  }

  // re-run reveal observer for freshly injected nodes
  function reobserve(scope) {
    const reveals = scope.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Wire up by data-render attribute ---------- */
  const map = {
    "projects":   { file: "content/projects.json",   fn: renderProjects },
    "experience": { file: "content/experience.json", fn: renderExperience },
    "blog":       { file: "content/blog.json",       fn: renderBlog }
  };

  document.querySelectorAll("[data-render]").forEach(function (el) {
    const cfg = map[el.getAttribute("data-render")];
    if (!cfg) return;
    el.innerHTML = '<p class="skeleton">Loading…</p>';
    load(cfg.file)
      .then(function (data) { cfg.fn(el, data); })
      .catch(function (err) {
        el.innerHTML = '<p class="skeleton">Content will appear here once the site is running on a server.</p>';
        console.warn(err);
      });
  });
})();
