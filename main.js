var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// anime-runtime.js
var require_anime_runtime = __commonJS({
  "anime-runtime.js"(exports2, module2) {
    var L = Object.defineProperty;
    var R = Object.getOwnPropertyDescriptor;
    var _ = Object.getOwnPropertyNames;
    var O = Object.prototype.hasOwnProperty;
    var W = (r, i) => {
      for (var e in i) L(r, e, { get: i[e], enumerable: true });
    };
    var H = (r, i, e, s) => {
      if (i && typeof i == "object" || typeof i == "function") for (let t of _(i)) !O.call(r, t) && t !== e && L(r, t, { get: () => i[t], enumerable: !(s = R(i, t)) || s.enumerable });
      return r;
    };
    var U = (r) => H(L({}, "__esModule", { value: true }), r);
    var ee = {};
    W(ee, { default: () => C });
    module2.exports = U(ee);
    var u = require("obsidian");
    var J = { mal: "mal_id", anilist: "anilist_id", bangumi: "bgm_id" };
    async function I(r) {
      return new Promise((i) => setTimeout(i, r));
    }
    async function y(r) {
      for (let i = 1; i <= 3; i++) try {
        return await (0, u.requestUrl)(r);
      } catch (e) {
        let s = e instanceof Error ? e.message : String(e);
        if (!/(?:^|\D)(429|500|502|503|504)(?:\D|$)/.test(s) || i === 3) throw e;
        await I(i * 1500);
      }
      throw new Error("Request failed after retries.");
    }
    async function G(r) {
      var a;
      let i = await y({ url: `https://myanimelist.net/search/all?q=${encodeURIComponent(r)}`, method: "GET" }), e = /* @__PURE__ */ new Set(), s = [], t = /href="https:\/\/myanimelist\.net\/anime\/(\d+)\/([^"]+)"/g, n;
      for (; (n = t.exec((a = i.text) != null ? a : "")) !== null && s.length < 10; ) e.has(n[1]) || (e.add(n[1]), s.push({ id: n[1], label: decodeURIComponent(n[2].replace(/_/g, " ")), sublabel: "MyAnimeList" }));
      return s;
    }
    async function D(r) {
      var s, t, n, a;
      return ((a = (n = (t = (s = (await y({ url: "https://graphql.anilist.co", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: "query ($search: String) { Page(perPage: 10) { media(search: $search, type: ANIME) { id format startDate { year } title { romaji english native } } } }", variables: { search: r } }) })).json) == null ? void 0 : s.data) == null ? void 0 : t.Page) == null ? void 0 : n.media) != null ? a : []).map((o) => {
        var l;
        return { id: o.id, label: o.title.english || o.title.romaji || o.title.native, sublabel: [o.format, (l = o.startDate) == null ? void 0 : l.year, o.title.native].filter(Boolean).join(" \xB7 ") };
      });
    }
    async function K(r) {
      var i, e;
      try {
        return ((e = (i = (await y({ url: `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(r)}&limit=10`, method: "GET" })).json) == null ? void 0 : i.data) != null ? e : []).map((t) => ({ id: t.mal_id, label: t.title || t.title_english || "Untitled", sublabel: [t.type, t.year, t.title_japanese].filter(Boolean).join(" \xB7 ") }));
      } catch (s) {
        console.warn("Jikan search failed; falling back to direct MAL search", s);
        let t = await G(r).catch(() => []);
        return t.length ? t : (await D(r)).map((n) => ({ ...n, id: `anilist:${n.id}` }));
      }
    }
    async function Y(r) {
      var e, s, t, n;
      let i = [];
      for (let a = 1; ; a++) {
        let o = await y({ url: `https://api.jikan.moe/v4/anime/${r}/episodes?page=${a}`, method: "GET" });
        for (let l of (s = (e = o.json) == null ? void 0 : e.data) != null ? s : []) i.push({ number: l.mal_id, title: l.title || `Episode ${l.mal_id}`, nativeTitle: l.title_japanese || void 0 });
        if (!((n = (t = o.json) == null ? void 0 : t.pagination) != null && n.has_next_page)) break;
        await I(500);
      }
      return i.sort((a, o) => a.number - o.number);
    }
    async function N(r) {
      var t, n, a, o;
      let i = await y({ url: `https://myanimelist.net/anime/${r}/episode`, method: "GET" }), e = new DOMParser().parseFromString((t = i.text) != null ? t : "", "text/html"), s = [];
      for (let l of Array.from(e.querySelectorAll("td.episode-title"))) {
        let c = l.querySelector('a[href*="/episode/"]'), p = Number((a = (n = c == null ? void 0 : c.getAttribute("href")) == null ? void 0 : n.match(/\/episode\/(\d+)/)) == null ? void 0 : a[1]), m = (o = c == null ? void 0 : c.textContent) == null ? void 0 : o.trim();
        p && m && s.push({ number: p, title: m });
      }
      return s.sort((l, c) => l.number - c.number);
    }
    async function $(r, i = false) {
      var l, c, p, m, E;
      let e = i ? "query ($idMal: Int) { Media(idMal: $idMal, type: ANIME) { id episodes streamingEpisodes { title } } }" : "query ($id: Int) { Media(id: $id) { episodes streamingEpisodes { title } } }", s = i ? { idMal: Number(r) } : { id: Number(r) }, n = (c = (l = (await y({ url: "https://graphql.anilist.co", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: e, variables: s }) })).json) == null ? void 0 : l.data) == null ? void 0 : c.Media, a = [], o = /* @__PURE__ */ new Set();
      for (let g of (p = n == null ? void 0 : n.streamingEpisodes) != null ? p : []) {
        let f = /^Episode\s+(\d+)\s*-\s*(.+)$/i.exec((m = g.title) != null ? m : "");
        f && (a.push({ number: Number(f[1]), title: f[2].trim() }), o.add(Number(f[1])));
      }
      for (let g = 1; g <= ((E = n == null ? void 0 : n.episodes) != null ? E : 0); g++) o.has(g) || a.push({ number: g, title: `Episode ${g}` });
      return a.sort((g, f) => g.number - f.number);
    }
    async function V(r) {
      var o, l, c, p, m, E, g, f, M, h, w, d, T;
      let e = (p = (c = (l = (o = (await y({ url: `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(r)}&format=json`, method: "GET" })).json) == null ? void 0 : o.query) == null ? void 0 : l.search) == null ? void 0 : c[0]) == null ? void 0 : p.title;
      if (!e) return [];
      let t = (g = (E = (m = (await y({ url: `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(e)}&prop=text&format=json`, method: "GET" })).json) == null ? void 0 : m.parse) == null ? void 0 : E.text) == null ? void 0 : g["*"];
      if (typeof t != "string") return [];
      let n = new DOMParser().parseFromString(t, "text/html"), a = [];
      for (let b of Array.from(n.querySelectorAll("tr.module-episode-list-row"))) {
        let x = Number((M = (f = b.querySelector('th[scope="row"]')) == null ? void 0 : f.textContent) == null ? void 0 : M.trim()), v = b.querySelector("td.summary"), j = (w = (h = v == null ? void 0 : v.textContent) == null ? void 0 : h.trim()) != null ? w : "", F = /^[\"“](.+?)[\"”]/.exec(j), S = (d = v == null ? void 0 : v.querySelector('span[lang="ja"]')) == null ? void 0 : d.cloneNode(true);
        S == null || S.querySelectorAll("sup").forEach((B) => B.remove());
        let q = (T = S == null ? void 0 : S.textContent) == null ? void 0 : T.replace(/\s+/g, " ").trim();
        x > 0 && F && a.push({ number: x, title: F[1], nativeTitle: q || void 0 });
      }
      return a.sort((b, x) => b.number - x.number);
    }
    function k(r) {
      let i = /^##\s+Episodes\s*$/m.exec(r);
      if (!i) return { before: r, after: "", lines: [], found: false };
      let e = i.index + i[0].length, s = r.slice(e), t = /\n##?\s+\S/.exec(s), n = t ? t.index : s.length, a = s.slice(0, n), o = [], l = /^-\s*\[([ xX])\]\s*(\d+)\.\s*(.*)$/gm, c;
      for (; (c = l.exec(a)) !== null; ) o.push({ checked: c[1].toLowerCase() === "x", number: Number(c[2]), title: c[3].trim() });
      return { before: r.slice(0, e), after: s.slice(n), lines: o, found: true };
    }
    function X(r, i) {
      let e = k(r);
      if (!e.found) return r;
      let s = e.before.length, t = r.length - e.after.length, n = r.slice(s, t), a = Math.max(0, Math.floor(i)), o = n.replace(/^(-\s*\[)[ xX](\]\s*)(\d+)(\.\s*.*)$/gm, (l, c, p, m, E) => `${c}${Number(m) <= a ? "x" : " "}${p}${m}${E}`);
      return o === n ? r : `${r.slice(0, s)}${o}${r.slice(t)}`;
    }
    function z(r, i, e) {
      let s = e && r.nativeTitle ? ` (${r.nativeTitle})` : "";
      return `- [${i ? "x" : " "}] ${r.number}. ${r.title}${s}`;
    }
    function Q(r, i, e, s) {
      let t = new Set(i.lines.map((p) => p.number)), n = e.filter((p) => !t.has(p.number)).sort((p, m) => p.number - m.number);
      if (!n.length) return null;
      let a = n.map((p) => z(p, false, s)).join(`
`);
      if (!i.found) return `${r}${r.endsWith(`
`) ? "" : `
`}
## Episodes

${a}
`;
      let o = r.length - i.after.length, l = r.slice(0, o), c = l.endsWith(`
`) ? "" : `
`;
      return `${l}${c}${a}
${i.after}`;
    }
    var Z = { autoFillFinishedDate: true, source: "mal", includeNativeTitle: true, titleKey: "title" };
    var C = class extends u.Plugin {
      async onload() {
        await this.loadSettings(), this.addCommand({ id: "update-watch-progress", name: "Sync episodes and update watch progress", checkCallback: (i) => {
          let e = this.app.workspace.getActiveFile();
          return e ? (i || this.syncAndOpen(e), true) : false;
        } }), this.addRibbonIcon("clapperboard", "Sync episodes and update watch progress", () => {
          let i = this.app.workspace.getActiveFile();
          if (!i) {
            new u.Notice("Open a watch-log note first.");
            return;
          }
          this.syncAndOpen(i);
        }), this.addSettingTab(new A(this.app, this));
      }
      async loadSettings() {
        this.settings = Object.assign({}, Z, await this.loadData());
      }
      async saveSettings() {
        await this.saveData(this.settings);
      }
      getTitle(i) {
        var t, n, a;
        let e = (n = (t = this.app.metadataCache.getFileCache(i)) == null ? void 0 : t.frontmatter) == null ? void 0 : n[this.settings.titleKey];
        if (typeof e != "string") return null;
        let s = /^\[\[([^\]|]+)(\|([^\]]+))?\]\]$/.exec(e.trim());
        return (s ? (a = s[3]) != null ? a : s[1] : e).trim();
      }
      async syncAndOpen(i) {
        var s, t;
        let e = new P(this.app, this, i);
        e.open();
        try {
          await this.migrateEpisodeProperty(i), e.refreshEpisodeTotal(), Number((t = (s = this.app.metadataCache.getFileCache(i)) == null ? void 0 : s.frontmatter) == null ? void 0 : t.episodes) !== 1 && (await this.syncEpisodes(i), e.refreshEpisodeTotal());
        } catch (n) {
          console.error(n), new u.Notice(`Episode sync failed: ${n instanceof Error ? n.message : String(n)}`);
        }
      }
      async migrateEpisodeProperty(i) {
        await this.app.fileManager.processFrontMatter(i, (e) => {
          (e.episodes === void 0 || e.episodes === null || e.episodes === "") && e.episode !== void 0 && (e.episodes = e.episode), delete e.episode;
        });
      }
      async syncEpisodes(i) {
        var E, g, f, M;
        let e = this.getTitle(i);
        if (!e) throw new Error(`Couldn't find a "${this.settings.titleKey}" field in this note's frontmatter.`);
        let s = J[this.settings.source], t = (g = (E = this.app.metadataCache.getFileCache(i)) == null ? void 0 : E.frontmatter) == null ? void 0 : g[s];
        if (this.settings.source === "mal" && typeof t == "string" && t.startsWith("anilist:") && (t = void 0), t === void 0 || t === "") {
          new u.Notice(`Finding episodes for "${e}"...`);
          let h = this.settings.source === "mal" ? await K(e) : await D(e);
          if (!h.length) throw new Error("No anime match found.");
          t = h[0].id, await this.app.fileManager.processFrontMatter(i, (w) => {
            w[s] = t;
          });
        }
        new u.Notice("Syncing latest episodes...");
        let n;
        if (this.settings.source !== "mal") n = await $(t);
        else if (typeof t == "string" && t.startsWith("anilist:")) n = await $(t.slice(8));
        else try {
          if (n = await Y(t), !n.length) throw new Error("Jikan returned no episodes.");
        } catch (h) {
          console.warn("Jikan episode sync failed; falling back to MAL's public episode list", h);
          try {
            if (n = await N(t), !n.length) throw new Error("MAL returned no episode titles.");
          } catch (w) {
            console.warn("MAL episode page failed; falling back to AniList by MAL ID", w), new u.Notice("Jikan and MAL episode titles are unavailable; using AniList..."), n = await $(t, true);
          }
        }
        let a = typeof t == "string" && t.startsWith("anilist:"), o = Number((M = (f = this.app.metadataCache.getFileCache(i)) == null ? void 0 : f.frontmatter) == null ? void 0 : M.episodes);
        if (this.settings.source === "mal" && !a && Number.isFinite(o)) {
          let h = Math.max(...n.map((w) => w.number));
          if (o > h) {
            try {
              let d = await N(t);
              Math.max(0, ...d.map((b) => b.number)) >= o && (n = d);
            } catch (d) {
              console.warn("MyAnimeList episode-page fallback failed; keeping the Jikan list", d);
            }
            if (Math.max(0, ...n.map((d) => d.number)) < o) try {
              let d = await $(t, true);
              Math.max(0, ...d.map((b) => b.number)) >= o && (n = d);
            } catch (d) {
              console.warn("AniList episode completeness fallback failed; keeping the MyAnimeList list", d);
            }
          }
        }
        if (n.some((h) => /^Episode\s+\d+$/i.test(h.title))) try {
          let h = await V(e), w = new Map(h.map((d) => [d.number, d]));
          n = n.map((d) => {
            var T;
            return /^Episode\s+\d+$/i.test(d.title) && (T = w.get(d.number)) != null ? T : d;
          });
        } catch (h) {
          console.warn("Wikipedia episode title fallback failed", h);
        }
        if (!n.length) throw new Error("No episodes returned by the source.");
        let l = await this.app.vault.read(i), c = k(l), p = Q(l, c, n, this.settings.includeNativeTitle);
        p !== null && await this.app.vault.modify(i, p);
        let m = Math.max(...n.map((h) => h.number));
        await this.app.fileManager.processFrontMatter(i, (h) => {
          m > (Number(h.episodes) || 0) && (h.episodes = m);
        }), p === null && new u.Notice("No new episodes to add.");
      }
    };
    var P = class extends u.Modal {
      constructor(e, s, t) {
        super(e);
        this.episodeLines = [];
        this.plugin = s, this.file = t;
      }
      onOpen() {
        var n, a;
        this.modalEl.addClass("wpm-modal");
        let { contentEl: e } = this;
        e.addClass("watch-progress-modal");
        let s = this.app.metadataCache.getFileCache(this.file), t = (n = s == null ? void 0 : s.frontmatter) != null ? n : {};
        this.displayTitle = (a = t.title) != null ? a : this.file.basename, this.cover = t.cover, this.episodeTotal = Number(t.episodes) || 0, this.progress = Number(t.progress) || 0, this.renderHeader(e), this.renderProgressBar(e), this.renderNumberRow(e), this.renderEpisodeTitle(e), this.renderActionButtons(e), this.refreshBar(), this.loadEpisodeTitles();
      }
      refreshEpisodeTotal() {
        var s;
        let e = (s = this.app.metadataCache.getFileCache(this.file)) == null ? void 0 : s.frontmatter;
        this.episodeTotal = Number(e == null ? void 0 : e.episodes) || 0, this.totalDisplayEl.setText(String(this.episodeTotal)), this.refreshBar();
      }
      renderHeader(e) {
        let s = e.createDiv({ cls: "wpm-header" });
        s.createDiv({ cls: "wpm-title", text: this.displayTitle }), this.cover && s.createEl("img", { cls: "wpm-cover", attr: { src: this.cover } });
      }
      renderProgressBar(e) {
        let s = e.createDiv({ cls: "wpm-bar-wrap" }), t = s.createDiv({ cls: "wpm-bar-track" });
        this.progressBarFillEl = t.createDiv({ cls: "wpm-bar-fill" }), this.percentLabelEl = s.createDiv({ cls: "wpm-percent-label" });
      }
      renderNumberRow(e) {
        let s = e.createDiv({ cls: "wpm-number-row" });
        s.createEl("button", { cls: "wpm-step-btn", text: "\u2796" }).addEventListener("click", () => {
          this.progress = Math.max(0, this.progress - 1), this.progressInputEl.value = String(this.progress), this.refreshBar();
        });
        let t = s.createDiv({ cls: "wpm-readout" });
        this.progressInputEl = t.createEl("input", { type: "number", cls: "wpm-progress-input", attr: { min: "0" } }), this.progressInputEl.value = String(this.progress), t.createSpan({ cls: "wpm-slash", text: "/" }), this.totalDisplayEl = t.createSpan({ cls: "wpm-total-display", text: String(this.episodeTotal) }), s.createEl("button", { cls: "wpm-step-btn", text: "\u2795" }).addEventListener("click", () => {
          this.progress = this.episodeTotal ? Math.min(this.episodeTotal, this.progress + 1) : this.progress + 1, this.progressInputEl.value = String(this.progress), this.refreshBar();
        }), this.progressInputEl.addEventListener("input", () => {
          this.progress = Number(this.progressInputEl.value) || 0, this.refreshBar();
        });
      }
      renderEpisodeTitle(e) {
        this.episodeTitleEl = e.createDiv({ cls: "wpm-episode-title" });
      }
      async loadEpisodeTitles() {
        try {
          let e = await this.app.vault.read(this.file);
          this.episodeLines = k(e).lines, this.refreshEpisodeTitle();
        } catch (e) {
          console.warn("Could not load episode titles", e);
        }
      }
      renderActionButtons(e) {
        let s = e.createDiv({ cls: "wpm-btn-row" });
        s.createEl("button", { text: "Cancel" }).addEventListener("click", () => this.close()), s.createEl("button", { text: "Save", cls: "mod-cta" }).addEventListener("click", () => this.save());
      }
      refreshBar() {
        let e = this.episodeTotal > 0 ? Math.min(100, Math.round(this.progress / this.episodeTotal * 100)) : 0;
        this.progressBarFillEl.style.width = `${e}%`, this.percentLabelEl.setText(`${e}%`), this.refreshEpisodeTitle();
      }
      refreshEpisodeTitle() {
        let e = this.episodeLines.find((s) => s.number === this.progress);
        this.episodeTitleEl.setText(e ? `${e.number}. ${e.title}` : "");
      }
      async save() {
        let e = this.episodeTotal > 0 && this.progress >= this.episodeTotal, s = await this.app.vault.read(this.file), t = X(s, this.progress);
        t !== s && await this.app.vault.modify(this.file, t), await this.app.fileManager.processFrontMatter(this.file, (n) => {
          n.progress = this.progress, n.episodes = this.episodeTotal, e && this.plugin.settings.autoFillFinishedDate && !n.finished && (n.finished = window.moment().format("YYYY-MM-DD"));
        }), new u.Notice(`Progress saved: ${this.progress}/${this.episodeTotal}`), this.close();
      }
      onClose() {
        this.contentEl.empty();
      }
    };
    var A = class extends u.PluginSettingTab {
      constructor(i, e) {
        super(i, e), this.plugin = e;
      }
      display() {
        let { containerEl: i } = this;
        i.empty(), i.createEl("h2", { text: "Watch Progress Tracker settings" }), new u.Setting(i).setName("Auto-fill finished date").setDesc("Set the 'finished' frontmatter field to today's date once progress reaches the episode total").addToggle((e) => e.setValue(this.plugin.settings.autoFillFinishedDate).onChange(async (s) => {
          this.plugin.settings.autoFillFinishedDate = s, await this.plugin.saveSettings();
        }));
      }
    };
  }
});

// game-progress.js
var require_game_progress = __commonJS({
  "game-progress.js"(exports2, module2) {
    function isGameNote2(frontmatter) {
      const rawTypes = frontmatter && frontmatter.type;
      const types = Array.isArray(rawTypes) ? rawTypes : [rawTypes];
      return types.some((rawType) => {
        if (rawType == null) return false;
        const type = String(rawType).replace(/^\[\[/, "").replace(/\]\]$/, "").split("|", 1)[0].trim();
        return type === "\u{1F3AE}" || /^game$/i.test(type);
      });
    }
    function parseChecklist2(content) {
      const lines = content.split(/\r?\n/);
      const headingIndex = lines.findIndex((line) => /^##\s+Chapters\s*$/i.test(line));
      if (headingIndex < 0) return [];
      let endIndex = lines.length;
      for (let index = headingIndex + 1; index < lines.length; index++) {
        if (/^#{1,2}\s/.test(lines[index])) {
          endIndex = index;
          break;
        }
      }
      const items = [];
      for (let index = headingIndex + 1; index < endIndex; index++) {
        const match = lines[index].match(/^\s*[-*]\s+\[([ xX])\]\s+\d+[.)]\s*(.*?)\s*$/);
        if (match && match[2]) {
          items.push({ done: match[1].toLowerCase() === "x", title: match[2], lineIndex: index });
        }
      }
      return items;
    }
    function readInitialProgress2(items, rawProgress) {
      const checkedCount = items.filter((item) => item.done).length;
      const progress = Number(rawProgress);
      const fromFrontmatter = Number.isFinite(progress) && progress >= 0 ? Math.round(progress) : 0;
      const initial = checkedCount > 0 ? checkedCount : fromFrontmatter;
      return Math.max(0, Math.min(items.length, initial));
    }
    function updateChecklist2(content, progress) {
      const items = parseChecklist2(content);
      if (!items.length) return content;
      const lineEnding = content.includes("\r\n") ? "\r\n" : "\n";
      const lines = content.split(/\r?\n/);
      const completed = Math.max(0, Math.min(items.length, Math.round(Number(progress) || 0)));
      items.forEach((item, index) => {
        lines[item.lineIndex] = lines[item.lineIndex].replace(/\[([ xX])\]/, index < completed ? "[x]" : "[ ]");
      });
      return lines.join(lineEnding);
    }
    function applyCompletionMetadata2(properties, date) {
      properties.status = "[[\u{1F7E3} Fin]]";
      properties.finished = date;
    }
    module2.exports = {
      isGameNote: isGameNote2,
      parseChecklist: parseChecklist2,
      readInitialProgress: readInitialProgress2,
      updateChecklist: updateChecklist2,
      applyCompletionMetadata: applyCompletionMetadata2
    };
  }
});

// plugin-entry.js
var { Modal, Notice, addIcon, setIcon } = require("obsidian");
var AnimeProgressPlugin = require_anime_runtime().default;
var {
  isGameNote,
  parseChecklist,
  readInitialProgress,
  updateChecklist,
  applyCompletionMetadata
} = require_game_progress();
var PROGRESS_ICON_ID = "obsidian-progress-tracker-checklist";
var PROGRESS_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 6 1.5 1.5L7 5"/><path d="M10 6h11"/><path d="m3 12 1.5 1.5L7 11"/><path d="M10 12h11"/><path d="m3 18 1.5 1.5L7 17"/><path d="M10 18h11"/></svg>';
function frontmatterText(value) {
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first !== "string") return "";
  const match = first.trim().match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
  return match ? (match[2] || match[1]).trim() : first.trim();
}
function todayDate() {
  if (window.moment) return window.moment().format("YYYY-MM-DD");
  const now = /* @__PURE__ */ new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
function isBookNote(frontmatter) {
  const rawTypes = frontmatter && frontmatter.type;
  const types = Array.isArray(rawTypes) ? rawTypes : [rawTypes];
  return types.some((rawType) => {
    if (rawType == null) return false;
    const type = String(rawType).replace(/^\[\[/, "").replace(/\]\]$/, "").split("|", 1)[0].trim();
    return type === "\u{1F4DA}" || /^book$/i.test(type);
  });
}
var GameProgressModal = class extends Modal {
  constructor(app, title, cover, items, initialProgress, onSave, total = items.length, isBook = false) {
    super(app);
    this.title = title;
    this.cover = cover;
    this.items = items;
    this.total = total;
    this.progress = initialProgress;
    this.onSaveProgress = onSave;
    this.isBook = isBook;
  }
  onOpen() {
    this.modalEl.addClass("wpm-modal");
    this.contentEl.addClass("watch-progress-modal");
    const header = this.contentEl.createDiv({ cls: "wpm-header" });
    header.createDiv({ cls: "wpm-title", text: this.title });
    if (this.cover) header.createEl("img", { cls: "wpm-cover", attr: { src: this.cover, alt: "" } });
    const progressBar = this.contentEl.createDiv({ cls: "wpm-bar-wrap" });
    const track = progressBar.createDiv({ cls: "wpm-bar-track" });
    const fill = track.createDiv({ cls: "wpm-bar-fill" });
    const percentage = progressBar.createDiv({ cls: "wpm-percent-label" });
    const numberRow = this.contentEl.createDiv({ cls: "wpm-number-row" });
    const decrement = numberRow.createEl("button", { cls: "wpm-step-btn", text: "-" });
    const readout = numberRow.createDiv({ cls: "wpm-readout" });
    const input = readout.createEl("input", {
      type: "number",
      cls: "wpm-progress-input",
      attr: { min: "0", max: String(this.total), step: "1" }
    });
    readout.createSpan({ cls: "wpm-slash", text: "/" });
    readout.createSpan({ cls: "wpm-total-display", text: String(this.total) });
    const increment = numberRow.createEl("button", { cls: "wpm-step-btn", text: "+" });
    const current = this.contentEl.createDiv({ cls: "wpm-episode-title" });
    const actions = this.contentEl.createDiv({ cls: "wpm-btn-row" });
    actions.createEl("button", { text: "Cancel" }).addEventListener("click", () => this.close());
    const save = actions.createEl("button", { text: "Save", cls: "mod-cta" });
    const render = () => {
      const percent = this.total > 0 ? Math.round(this.progress / this.total * 100) : 0;
      input.value = String(this.progress);
      fill.style.width = `${percent}%`;
      percentage.setText(`${percent}%`);
      current.setText(this.progress > 0 && this.items[this.progress - 1] ? `${this.progress}. ${this.items[this.progress - 1].title}` : this.isBook && this.progress > 0 ? `Chapter ${this.progress}` : "");
    };
    const set = (value) => {
      this.progress = Math.max(0, Math.min(this.total, Math.round(Number(value) || 0)));
      render();
    };
    decrement.addEventListener("click", () => set(this.progress - 1));
    increment.addEventListener("click", () => set(this.progress + 1));
    input.addEventListener("change", () => set(input.value));
    save.addEventListener("click", async () => {
      save.disabled = true;
      try {
        await this.onSaveProgress(this.progress);
        this.close();
      } catch (error) {
        console.error(error);
        new Notice(`Could not save progress: ${error instanceof Error ? error.message : error}`);
        save.disabled = false;
      }
    });
    render();
  }
  onClose() {
    this.contentEl.empty();
  }
};
module.exports = class ProgressTrackerPlugin extends AnimeProgressPlugin {
  addRibbonIcon(icon, title, callback) {
    if (icon === "clapperboard") icon = PROGRESS_ICON_ID;
    return super.addRibbonIcon(icon, title, callback);
  }
  async onload() {
    addIcon(PROGRESS_ICON_ID, PROGRESS_ICON_SVG);
    await super.onload();
    this.addCommand({
      id: "update-active-note-progress",
      icon: PROGRESS_ICON_ID,
      name: "Update progress for active anime, game, or book note",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== "md") return false;
        if (!checking) void this.syncAndOpen(file);
        return true;
      }
    });
  }
  async syncAndOpen(file) {
    var _a;
    const frontmatter = ((_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) || {};
    if (isBookNote(frontmatter)) return this.openBookProgress(file, frontmatter);
    if (!isGameNote(frontmatter)) return this.openAnimeWithEpisodeUpdate(file);
    try {
      const content = await this.app.vault.read(file);
      const items = parseChecklist(content);
      if (!items.length) {
        new Notice('Add numbered checkboxes under "## Chapters" to track this game.');
        return;
      }
      const title = frontmatterText(frontmatter.title) || file.basename;
      const cover = frontmatterText(frontmatter.cover);
      const initialProgress = readInitialProgress(items, frontmatter.progress);
      new GameProgressModal(this.app, title, cover, items, initialProgress, async (progress) => {
        const latestContent = await this.app.vault.read(file);
        const latestItems = parseChecklist(latestContent);
        if (latestItems.length !== items.length) {
          throw new Error("The checklist changed while the progress window was open. Reopen it and try again.");
        }
        const updatedContent = updateChecklist(latestContent, progress);
        if (updatedContent !== latestContent) await this.app.vault.modify(file, updatedContent);
        await this.app.fileManager.processFrontMatter(file, (properties) => {
          properties.chapters = items.length;
          properties.progress = progress;
          if (progress >= items.length) {
            applyCompletionMetadata(properties, todayDate());
          }
        });
        new Notice(`Progress saved: ${progress}/${items.length}`);
      }).open();
    } catch (error) {
      console.error(error);
      new Notice(`Could not open game progress: ${error instanceof Error ? error.message : error}`);
    }
  }
  async openBookProgress(file, frontmatter) {
    try {
      const content = await this.app.vault.read(file);
      const items = parseChecklist(content);
      const chaptersValue = Number(Array.isArray(frontmatter.chapters) ? frontmatter.chapters[0] : frontmatter.chapters);
      const propertyChapters = Number.isFinite(chaptersValue) && chaptersValue > 0 ? Math.floor(chaptersValue) : 0;
      const chapters = items.length > 0 ? items.length : propertyChapters;
      if (chapters < 1) {
        new Notice('Add numbered checkboxes under "## Chapters" or set the chapters property to track this book.');
        return;
      }
      const title = frontmatterText(frontmatter.title) || file.basename;
      const cover = frontmatterText(frontmatter.cover);
      const initialProgress = items.length > 0 ? readInitialProgress(items, frontmatter.progress) : Math.max(0, Math.min(chapters, Math.round(Number(frontmatter.progress) || 0)));
      new GameProgressModal(
        this.app,
        title,
        cover,
        items,
        initialProgress,
        async (progress) => {
          if (items.length > 0) {
            const latestContent = await this.app.vault.read(file);
            const latestItems = parseChecklist(latestContent);
            if (latestItems.length !== items.length) {
              throw new Error("The chapter checklist changed while the progress window was open. Reopen it and try again.");
            }
            const updatedContent = updateChecklist(latestContent, progress);
            if (updatedContent !== latestContent) await this.app.vault.modify(file, updatedContent);
          }
          await this.app.fileManager.processFrontMatter(file, (properties) => {
            properties.chapters = chapters;
            properties.progress = progress;
            if (progress >= chapters) {
              applyCompletionMetadata(properties, todayDate());
            }
          });
          new Notice(`Reading progress saved: ${progress}/${chapters} chapters`);
        },
        chapters,
        true
      ).open();
    } catch (error) {
      console.error(error);
      new Notice(`Could not open book progress: ${error instanceof Error ? error.message : error}`);
    }
  }
  async openAnimeWithEpisodeUpdate(file) {
    const plugin = this;
    const originalOpen = Modal.prototype.open;
    const originalSyncEpisodes = this.syncEpisodes;
    let progressModal;
    let updateButton;
    Modal.prototype.open = function(...args) {
      var _a;
      const result = originalOpen.apply(this, args);
      if (((_a = this.contentEl) == null ? void 0 : _a.hasClass("watch-progress-modal")) && this.contentEl.querySelector(".wpm-total-display")) {
        progressModal = this;
        if (typeof this.save === "function") {
          const originalSave = this.save;
          this.save = async function(...saveArgs) {
            await originalSave.apply(this, saveArgs);
            if (this.episodeTotal > 0 && this.progress >= this.episodeTotal) {
              try {
                await plugin.app.fileManager.processFrontMatter(this.file, (properties) => {
                  applyCompletionMetadata(properties, todayDate());
                });
              } catch (error) {
                console.error(error);
                new Notice(`Could not update completion status: ${error instanceof Error ? error.message : error}`);
              }
            }
          };
        }
        const tools = this.contentEl.createDiv({ cls: "wpm-modal-tools" });
        this.contentEl.insertBefore(tools, this.contentEl.firstChild);
        updateButton = tools.createEl("button", {
          cls: "wpm-refresh-button mod-quiet",
          attr: { "aria-label": "Update episodes", title: "Update episodes" }
        });
        setIcon(updateButton, "refresh-cw");
        updateButton.disabled = true;
        updateButton.addEventListener("click", async () => {
          updateButton.disabled = true;
          updateButton.title = "Updating episodes...";
          updateButton.addClass("is-loading");
          try {
            await plugin.syncEpisodes(file);
            progressModal.refreshEpisodeTotal();
            await progressModal.loadEpisodeTitles();
          } catch (error) {
            console.error(error);
            new Notice(`Episode sync failed: ${error instanceof Error ? error.message : String(error)}`);
          } finally {
            updateButton.disabled = false;
            updateButton.title = "Update episodes";
            updateButton.removeClass("is-loading");
          }
        });
      }
      return result;
    };
    this.syncEpisodes = async () => {
    };
    let syncPromise;
    try {
      syncPromise = super.syncAndOpen(file);
    } finally {
      Modal.prototype.open = originalOpen;
    }
    try {
      await syncPromise;
    } finally {
      this.syncEpisodes = originalSyncEpisodes;
      if (updateButton) updateButton.disabled = false;
    }
  }
};
