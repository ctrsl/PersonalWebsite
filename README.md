# Your Website

A fast, static personal website with a dark earthy theme, scroll animations,
animated buttons, and a **secure no-code editor** so you can update your
content from anywhere — without touching any code.

Pages: **Home/About · Projects · Experience · Blog**

---

## 1. What's in this folder

| File / folder        | What it is                                                        |
|----------------------|-------------------------------------------------------------------|
| `index.html`         | The whole site — one page with Home, About, Projects, Experience, and Blog sections you reach by scrolling or the nav buttons |
| `css/styles.css`     | All the styling (colors, layout, animations)                      |
| `js/`                | The scroll effects, button animations, and content loading        |
| `content/*.json`     | **Your actual content.** The editor changes these for you.        |
| `admin/`             | The secure visual editor (the "no-code" part)                     |
| `netlify.toml`       | Hosting settings                                                  |

You normally only ever edit content through the **admin panel** (Step 4) —
you should not need to open the code files at all.

---

## 2. Preview it on your own computer

Because the pages load content from files, you need a tiny local web server
(double-clicking the HTML file won't load the content). Easiest options:

**Option A — Python (already on most computers):**
```powershell
# from inside this folder
python -m http.server 8080
```
Then open <http://localhost:8080> in your browser.

**Option B — VS Code:** install the free "Live Server" extension, right-click
`index.html`, and choose *Open with Live Server*.

---

## 3. Put it online (free) with Netlify

This is the recommended host because it gives you the secure login for free.

1. Create a free account at <https://netlify.com> (sign up with GitHub if you have it).
2. Put this project in a **GitHub repository** (Netlify reads from there so the
   editor can save your changes back). If you've never used GitHub:
   - Create a free account at <https://github.com>.
   - Create a new repository, then upload all these files to it.
3. In Netlify: **Add new site → Import an existing project → pick your repo.**
   Leave the build settings as detected (`netlify.toml` handles them) and deploy.
4. Your site is now live at something like `https://your-site-name.netlify.app`.
   (You can add a custom domain later in Netlify's settings.)

---

## 4. Turn on the secure editor (only YOU can edit)

This is your spec: *edit the pages while hosted, but nobody else, without
touching code.* Here's how it works once and forever after:

1. In your Netlify site dashboard, go to **Integrations / Identity** and click
   **Enable Identity**.
2. Under **Identity → Registration**, set it to **Invite only**.
   👉 This is the key step — it means **only people you personally invite can
   ever log in.** The public just sees your normal site.
3. Under **Identity → Services → Git Gateway**, click **Enable Git Gateway**.
   (This is what lets the editor save your changes.)
4. Click **Identity → Invite users** and invite **your own email address**.
5. Check your email, click the invite link, and set a password.

**From now on, to edit your site from any device:**
- Go to `https://your-site-name.netlify.app/admin/`
- Log in with your email + password.
- Edit Projects, Experience, or Blog in a friendly visual form and hit
  **Publish**. Your live site updates automatically in a minute or two.

> 🔒 No one else can log in or edit, because registration is invite-only and
> you control the invites. For extra safety you can later turn on
> two-factor / external login providers in Netlify Identity.

### One small edit before you go live
Open `admin/config.yml` and replace `YOUR-SITE.netlify.app` (two places) with
your real Netlify address. That's the only code edit you need.

---

## 5. Make it yours

Quick personalizations (search-and-replace in the files):

- **Your name / brand:** replace `Your Name` and `Your.Name` in `index.html`,
  and `you@example.com` with your real email.
- **Colors:** open `css/styles.css` — every color is at the very top under
  `:root`. Change `--clay`, `--sage`, `--gold`, etc. and the whole site updates.
- **Social links:** in the footer of `index.html`, update the GitHub/LinkedIn
  `href="#"` links.
- **Starter content:** the Projects, Experience, and Blog entries are samples —
  replace them through the admin editor.

---

## 6. The social sections (Instagram, Spotify, LinkedIn)

All three are editable from your admin panel. Here's how each one works and
what's realistic for a site like this:

### 🎵 Spotify (Music section) — links to your profile
The Music section shows an **"Open Spotify"** card linking to your profile.
(Spotify only lets websites *embed* playlists/albums/artists — **not** a personal
profile — so a profile shows as a link card.)

1. In the Spotify app, go to your profile → **•••** → **Share → Copy link**.
2. In the admin panel go to **Music (Spotify)**, paste it into **Spotify profile
   link**, and publish.

💡 Bonus: if you ever paste a **playlist/album/artist** link instead of your
profile, the site automatically embeds a live, playable player there.

### 📷 Instagram (Media section) — 3 recent posts with metrics
The Media section shows your **3 most recent posts** with a description and
like/comment counts.

⚠️ Honest heads-up: Instagram does **not** allow a website to auto-pull your
posts and their like/comment numbers from "just a handle" anymore — that needs a
business account + authenticated API, and handle-scraping breaks constantly. So
this is set up as a **manual showcase you control** from the admin panel:

- In the admin panel go to **Media (Instagram)**. Add up to a few posts (only the
  **top 3** show — put the newest first): upload the photo, write a description,
  and type in the likes/comments numbers. Set **Your Instagram URL** for the
  "Follow" button.
- **Optional live feed:** if you'd rather it auto-update, sign up for a free
  widget service like **LightWidget** (<https://lightwidget.com>), copy the
  `<iframe>` it gives you, and paste it into the **Live widget embed code** field.
  (Note: those free widgets usually show recent photos but *not* like/comment
  counts.)

### 💼 LinkedIn — why it's a link, not an auto-feed
Unlike Spotify, **LinkedIn does not let websites pull your posts automatically**
(there's no public feed/RSS, and scraping it is against their rules and breaks
constantly). So the site shows an **"Also on LinkedIn"** card linking to your
profile. When you post something on LinkedIn worth keeping, add it as a **Blog**
entry in the admin panel (takes ~30 seconds) — that's the reliable way to
"reflect" it here.

Set your profile URL in the admin panel under **LinkedIn**.

---

## 7. The About photo

The About section shows an **"LR" monogram** by default. To use a real photo:

1. In the admin panel, open the **About** collection.
2. Click **Portrait photo → Choose an image**, upload your photo, and publish.

The photo replaces the monogram automatically. (Leave it blank any time to go
back to the monogram.) A roughly square or portrait photo looks best.

---

## 8. The contact form — where messages go

The **"Have something in mind?"** section is a real contact form (name, email,
subject, message). It uses **Netlify Forms**, which captures submissions for you
automatically — no code, no inbox setup required.

**To read the messages people send you:**
1. Go to your site in the **Netlify dashboard**.
2. Open the **Forms** tab → click the **contact** form.
3. Every submission is listed there for you to review.

**To also get an email when someone writes in (recommended):**
- In the Netlify dashboard: **Forms → Settings & notifications → Add notification
  → Email notification**, and enter your email.

Notes:
- The form only works on the **live Netlify site** — it won't send from your
  computer's local preview (you'll see a friendly note if you try).
- Netlify includes free spam filtering; the form has a hidden honeypot field to
  catch bots.

---

Enjoy your new site! 🌿
