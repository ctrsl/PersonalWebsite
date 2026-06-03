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
  const SPOTIFY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.59 14.43a.62.62 0 01-.86.21c-2.35-1.44-5.3-1.76-8.79-.96a.62.62 0 11-.28-1.21c3.8-.87 7.07-.5 9.71 1.12.3.18.39.57.22.84zm1.23-2.73a.78.78 0 01-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 11-.45-1.49c3.63-1.1 8.15-.56 11.24 1.33.36.22.48.7.25 1.07zm.11-2.85C14.84 8.98 9.5 8.8 6.4 9.74a.94.94 0 11-.54-1.8c3.56-1.08 9.46-.87 13.18 1.34a.94.94 0 01-.98 1.6z"/></svg>';

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
    // keep the About "projects" stat in sync with the real number
    const countEl = document.querySelector("[data-project-count]");
    if (countEl) countEl.textContent = items.length;
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

  /* ---------- Media / Instagram (3 most recent, with metrics) ---------- */
  const HEART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"/></svg>';
  const CHAT  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 01-9 8.4 9 9 0 01-4-1L3 20l1-4.5a8.4 8.4 0 01-1-4A8.4 8.4 0 0112 3a8.4 8.4 0 019 8.5z"/></svg>';

  function renderMedia(el, data) {
    // If you paste a live widget embed (e.g. LightWidget/SnapWidget iframe) into
    // the admin "embed code" field, we show that instead of the managed cards.
    if (data.embed_code && data.embed_code.trim()) {
      el.innerHTML = data.embed_code;
    } else {
      const posts = (data.posts || []).slice(0, 3); // 3 most recent (newest first)
      el.innerHTML = posts.length
        ? '<div class="grid grid--3">' + posts.map(function (m, i) {
            const tag = m.url ? "a" : "div";
            const href = m.url ? ' href="' + esc(m.url) + '" target="_blank" rel="noopener"' : "";
            const metrics = (m.likes != null || m.comments != null)
              ? '<div class="ig-metrics">' +
                  (m.likes != null ? "<span>" + HEART + esc(m.likes) + "</span>" : "") +
                  (m.comments != null ? "<span>" + CHAT + esc(m.comments) + "</span>" : "") +
                "</div>"
              : "";
            return "<" + tag + ' class="ig-card reveal" data-delay="' + (i + 1) + '"' + href + ">" +
                     '<span class="ig-card__media"><img src="' + esc(m.image) + '" alt="" loading="lazy"></span>' +
                     '<div class="ig-card__body">' +
                       '<p class="ig-card__desc">' + esc(m.description || m.caption || "") + "</p>" +
                       metrics +
                     "</div>" +
                   "</" + tag + ">";
          }).join("") + "</div>"
        : '<p class="skeleton">No photos yet.</p>';
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
    const link = (data.spotify_link || "").trim();
    // A playlist/album/artist/track/podcast link CAN be embedded as a player.
    if (/\/(playlist|album|artist|track|episode|show)\//.test(link)) {
      const e = spotifyEmbed(link);
      el.innerHTML = '<div class="spotify-wrap"><iframe src="' + esc(e.src) +
        '" height="' + e.height + '" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Spotify player"></iframe></div>';
      return;
    }
    // A profile link can't be embedded by Spotify, so we show a link card instead.
    if (!link) { el.innerHTML = '<p class="skeleton">Add your Spotify profile link in the admin panel.</p>'; return; }
    el.innerHTML =
      '<div class="social-card reveal">' +
        '<div class="social-card__icon">' + SPOTIFY + "</div>" +
        '<div class="social-card__text"><strong>My Spotify profile</strong><p>Follow along with what I’m playing.</p></div>' +
        '<a class="btn btn--primary" href="' + esc(link) + '" target="_blank" rel="noopener">Open Spotify <span class="btn__arrow">→</span></a>' +
      "</div>";
    reobserve(el);
  }

  /* ---------- About portrait ---------- */
  function renderAboutMedia(el, data) {
    if (data.portrait) {
      el.innerHTML = '<img src="' + esc(data.portrait) + '" alt="Leif R">';
    } else {
      el.innerHTML = '<div class="initials">' + esc(data.initials || "LR") + "</div>";
    }
  }

  /* ---------- LinkedIn callout ---------- */
  function renderLinkedIn(el, data) {
    if (!data.linkedin_url) { el.innerHTML = ""; return; }
    el.innerHTML =
      '<div class="social-card reveal">' +
        '<div class="social-card__icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zM8.34 17.5v-7H6v7h2.34zM7.17 9.43a1.36 1.36 0 100-2.72 1.36 1.36 0 000 2.72zM18 17.5v-3.85c0-2.06-1.1-3.02-2.57-3.02-1.18 0-1.71.65-2 1.11v-.95H11.1v7h2.33v-3.9c0-.25.02-.5.09-.68.2-.5.65-1.02 1.42-1.02 1 0 1.4.76 1.4 1.88v3.72H18z"/></svg></div>' +
        '<div class="social-card__text"><strong>Also on LinkedIn</strong>' +
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
    "about-media":{ file: "content/about.json",      fn: renderAboutMedia },
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
