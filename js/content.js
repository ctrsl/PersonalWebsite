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

  /* ---------- Media / Instagram ---------- */
  function renderMedia(el, data) {
    // If you paste a live widget embed (e.g. LightWidget/SnapWidget iframe) into
    // the admin "embed code" field, we show that instead of the managed grid.
    if (data.embed_code && data.embed_code.trim()) {
      el.innerHTML = data.embed_code;
    } else {
      const posts = (data.posts || []);
      const grid = posts.length
        ? '<div class="media-grid">' + posts.map(function (m) {
            const tag = m.url ? "a" : "div";
            const href = m.url ? ' href="' + esc(m.url) + '" target="_blank" rel="noopener"' : "";
            return "<" + tag + ' class="media-tile"' + href + ">" +
                     '<img src="' + esc(m.image) + '" alt="" loading="lazy">' +
                     (m.caption ? '<span class="media-tile__cap">' + esc(m.caption) + "</span>" : "") +
                   "</" + tag + ">";
          }).join("") + "</div>"
        : '<p class="skeleton">No photos yet.</p>';
      el.innerHTML = grid;
    }
    if (data.instagram_url) {
      el.insertAdjacentHTML("beforeend",
        '<div class="section-foot reveal"><a class="btn btn--primary" href="' + esc(data.instagram_url) +
        '" target="_blank" rel="noopener">Follow on Instagram <span class="btn__arrow">→</span></a></div>');
    }
    reobserve(el);
  }

  /* ---------- Spotify ---------- */
  // Turns a normal Spotify share link into its embeddable form.
  function spotifyEmbed(link) {
    if (!link) return { src: "", height: 352 };
    try {
      const u = new URL(link.trim());
      if (u.hostname.indexOf("spotify.com") === -1) return { src: "", height: 352 };
      let path = u.pathname;
      if (path.indexOf("/embed/") !== 0) path = "/embed" + path;
      const small = /\/(track|episode)\//.test(path);
      return { src: "https://open.spotify.com" + path, height: small ? 152 : 352 };
    } catch (e) { return { src: "", height: 352 }; }
  }

  function renderSpotifyHead(el, data) {
    el.innerHTML =
      '<p class="eyebrow">Music</p>' +
      "<h2>" + esc(data.heading || "What I'm listening to") + "</h2>" +
      (data.blurb ? '<p class="lead">' + esc(data.blurb) + "</p>" : "");
  }

  function renderSpotify(el, data) {
    const e = spotifyEmbed(data.spotify_link);
    if (!e.src) { el.innerHTML = '<p class="skeleton">Add a Spotify share link in the admin panel.</p>'; return; }
    el.innerHTML = '<div class="spotify-wrap"><iframe src="' + esc(e.src) +
      '" height="' + e.height + '" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Spotify player"></iframe></div>';
  }

  /* ---------- LinkedIn callout ---------- */
  function renderLinkedIn(el, data) {
    if (!data.linkedin_url) { el.innerHTML = ""; return; }
    el.innerHTML =
      '<div class="linkedin-card reveal">' +
        '<div class="linkedin-card__icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zM8.34 17.5v-7H6v7h2.34zM7.17 9.43a1.36 1.36 0 100-2.72 1.36 1.36 0 000 2.72zM18 17.5v-3.85c0-2.06-1.1-3.02-2.57-3.02-1.18 0-1.71.65-2 1.11v-.95H11.1v7h2.33v-3.9c0-.25.02-.5.09-.68.2-.5.65-1.02 1.42-1.02 1 0 1.4.76 1.4 1.88v3.72H18z"/></svg></div>' +
        '<div class="linkedin-card__text"><strong>Also on LinkedIn</strong>' +
          (data.blurb ? "<p>" + esc(data.blurb) + "</p>" : "") +
        "</div>" +
        '<a class="btn btn--ghost" href="' + esc(data.linkedin_url) + '" target="_blank" rel="noopener">Connect <span class="btn__arrow">→</span></a>' +
      "</div>";
    reobserve(el);
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
    "blog":       { file: "content/blog.json",       fn: renderBlog },
    "linkedin":   { file: "content/linkedin.json",   fn: renderLinkedIn },
    "media":      { file: "content/media.json",      fn: renderMedia },
    "music-head": { file: "content/spotify.json",    fn: renderSpotifyHead },
    "music":      { file: "content/spotify.json",    fn: renderSpotify }
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
