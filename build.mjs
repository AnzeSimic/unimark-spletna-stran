// Unimark — generator statične spletne strani.
// Uporaba:  node build.mjs   → rezultat v mapi dist/ (to mapo naložite na strežnik)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import sharp from "sharp";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, "src");
const OUT = join(ROOT, "dist");
const CONTENT = join(ROOT, "content");

/* ------------------------------------------------------------------ */
/* Vsebina, ki jo stranka ureja v Pages CMS (mapa content/)            */
/* ------------------------------------------------------------------ */
const readJson = (f) => {
  try { return JSON.parse(readFileSync(join(CONTENT, f), "utf8")); }
  catch (e) { throw new Error(`Napaka v datoteki content/${f}: ${e.message}`); }
};
const arr = (v) => (Array.isArray(v) ? v : []).filter((x) => x !== null && x !== undefined && x !== "");
const slugify = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
// Odgovori in daljša besedila pridejo iz urejevalnika kot HTML (<p>…</p>); navadno besedilo zavijemo v <p>.
const para = (s) => { const t = String(s || "").trim(); return /^<(p|ul|ol|div|h[1-6]|blockquote)[\s>]/i.test(t) ? t : t ? `<p>${t}</p>` : ""; };
const CO = readJson("podjetje.json");
const phoneDigits = String(CO.telefon).replace(/[^\d+]/g, "");
const phoneE164 = phoneDigits.startsWith("+") ? phoneDigits : phoneDigits.startsWith("00") ? `+${phoneDigits.slice(2)}` : `+386${phoneDigits.replace(/^0/, "")}`;
const HOURS = { week: CO.delovni_cas_pon_pet || "6.00–18.00", sat: CO.delovni_cas_sobota || "" };
const hoursSat = HOURS.sat && !/zaprto/i.test(HOURS.sat) ? HOURS.sat : "";
const toTime = (t) => { const m = String(t).match(/(\d{1,2})[.:](\d{2})/); return m ? `${m[1].padStart(2, "0")}:${m[2]}` : null; };
const range = (s) => { const p = String(s).split(/[–—-]/); return p.length === 2 ? [toTime(p[0]), toTime(p[1])] : [null, null]; };

/* ------------------------------------------------------------------ */
/* Podatki podjetja                                                    */
/* ------------------------------------------------------------------ */
const SITE = {
  url: "https://unimark.si",
  legalName: "UNIMARK, čistilni servis in ost. storitve, Helena Germšek, s.p.",
  phone: String(CO.telefon).trim(),
  phoneHref: `tel:${phoneE164}`,
  phoneIntl: phoneE164.replace(/^\+386(\d{2})(\d{3})(\d+)$/, "+386 $1 $2 $3"),
  email: String(CO.email).trim(),
  street: "Brezje pri Grosupljem 87",
  zip: "1290",
  city: "Grosuplje",
  mapsLink: "https://maps.google.com/?q=Brezje+pri+Grosupljem+87,+1290+Grosuplje",
  mapsEmbed: "https://maps.google.com/maps?q=Brezje%20pri%20Grosupljem%2087%2C%201290%20Grosuplje&z=13&output=embed",
  hours: `Pon.–pet.: ${HOURS.week}${hoursSat ? `, sob.: ${hoursSat}` : ""}`,
  hoursHtml: `Pon.–pet.: ${HOURS.week}${hoursSat ? `<br>Sobota: ${hoursSat}` : ""}`,
  // FormSubmit (formsubmit.co): po prvem povpraševanju pride na ta naslov potrditveni e-mail.
  // Po potrditvi lahko e-naslov tukaj zamenjate z naključno kodo iz tega e-maila (skrije naslov pred roboti).
  formTarget: "info.unimark@gmail.com",
  updated: "november 2026",
};

/* ------------------------------------------------------------------ */
/* Ikone                                                               */
/* ------------------------------------------------------------------ */
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  office: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"/><path d="M10 21v-3h4v3"/>',
  blocks: '<path d="M3 21h18"/><rect x="4" y="8" width="7" height="13"/><rect x="13" y="3" width="7" height="18"/><path d="M6.5 11.5h2M6.5 15h2M15.5 7h2M15.5 10.5h2M15.5 14h2M15.5 17.5h2"/>',
  museum: '<path d="M3 9 12 4l9 5"/><path d="M4 9h16"/><path d="M6 9v9M10 9v9M14 9v9M18 9v9"/><path d="M3 21h18M4 18h16"/>',
  sparkles: '<path d="M11 3c.7 4.4 2.6 6.3 7 7-4.4.7-6.3 2.6-7 7-.7-4.4-2.6-6.3-7-7 4.4-.7 6.3-2.6 7-7Z"/><path d="M18.5 15c.3 2 1.1 2.8 3 3-1.9.3-2.7 1.1-3 3-.3-1.9-1.1-2.7-3-3 1.9-.2 2.7-1 3-3Z"/>',
  window: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M12 3v18M4 12h16"/>',
  phone: '<path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  star: '<path fill="currentColor" stroke="none" d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9L12 2.8Z"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clipboard: '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5v-1h6v1"/><path d="M8.5 11h7M8.5 15h4.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .6 3.2 2.3 3.5 5.2"/>',
  euro: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5a4 4 0 1 0 0 7M7 11h6M7 13.5h6"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>',
  alert: '<path d="M12 3.5 2.5 20h19L12 3.5Z"/><path d="M12 10v4.5M12 17.5v.01"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  cookie: '<path d="M20.5 12.5A8.5 8.5 0 1 1 11.5 3.5a3 3 0 0 0 4 3.5 3 3 0 0 0 5 5.5Z"/><circle cx="8.5" cy="10" r="1" fill="currentColor"/><circle cx="14" cy="15" r="1" fill="currentColor"/>',
  handle: '<path d="m9 7-5 5 5 5M15 7l5 5-5 5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  quote: '<path fill="currentColor" stroke="none" d="M4 18v-5.5C4 8 6.4 5.3 10 4.5l.8 1.8C8.6 7 7.5 8.6 7.4 11H10v7H4Zm10 0v-5.5c0-4.5 2.4-7.2 6-8l.8 1.8c-2.2.7-3.3 2.3-3.4 4.7H20v7h-6Z"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  spray: '<path d="M9 9h6v12H9z"/><path d="M10 9V6h4v3M14 6h3l2-2M17 8h3M17 4.5l2.5-1"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
  repeat: '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17v.01"/>',
};
const icon = (name, cls = "") => {
  if (!ICONS[name]) throw new Error(`Manjka ikona: ${name}`);
  return `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
};
const stars = () => `<span class="stars" role="img" aria-label="Ocena 5 od 5">${icon("star").repeat(5)}</span>`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const img = (src, alt, w, h, attrs = "") => `<img src="${src}" alt="${esc(alt)}" width="${w}" height="${h}" ${attrs || 'loading="lazy" decoding="async"'}>`;

/* ------------------------------------------------------------------ */
/* Fotografije (Unsplash licenca – brezplačna uporaba)                 */
/* ------------------------------------------------------------------ */
const P = {
  hero: ["assets/img/hero-pisarna.webp", 1672, 941],
  domPomivanje: ["assets/img/foto/dom-pomivanje.webp", 1400, 788],
  domSesanje: ["assets/img/foto/dom-sesanje.webp", 1400, 933],
  pisarnaSesanje: ["assets/img/foto/pisarna-sesanje.webp", 1400, 1120],
  pisarnaMiza: ["assets/img/foto/pisarna-miza.webp", 1400, 933],
  stopnisce: ["assets/img/foto/stopnisce.webp", 1400, 933],
  stopnisceOkno: ["assets/img/foto/stopnisce-okno.webp", 1400, 2097],
  galerija: ["assets/img/foto/galerija.webp", 1400, 2100],
  muzejKipi: ["assets/img/foto/muzej-kipi.webp", 1400, 933],
  prenovaKuhinja: ["assets/img/foto/prenova-kuhinja.webp", 1400, 933],
  prenovaBrisanje: ["assets/img/foto/prenova-brisanje.webp", 1400, 788],
  okna: ["assets/img/foto/okna.webp", 1400, 933],
  izlozba: ["assets/img/foto/izlozba.webp", 1400, 2100],
  ekipa: ["assets/img/foto/ekipa-stopnice.webp", 1400, 933],
  razprsilka: ["assets/img/foto/razprsilka.webp", 1400, 933],
  rokavice: ["assets/img/foto/rokavice.webp", 1400, 933],
  potem1: ["assets/img/foto/potem1.webp", 1000, 1333],
  prej1: ["assets/img/foto/prej1.webp", 1200, 900],
};
const pimg = (key, alt, attrs) => img(P[key][0], alt, P[key][1], P[key][2], attrs);

/* ------------------------------------------------------------------ */
/* Slike iz urejevalnika: velike/JPG/PNG se samodejno pretvorijo v WebP */
/* ------------------------------------------------------------------ */
const IMG = new Map();
const MAX_W = 1600;
const normImg = (p) => String(p || "").trim().split("?")[0].replace(/\\/g, "/").replace(/^\/+/, "");
async function prepImage(p) {
  const rel = normImg(p);
  if (!rel || IMG.has(rel)) return;
  const file = join(ROOT, rel);
  if (!existsSync(file)) { console.warn(`Opozorilo: slika ne obstaja: ${rel}`); IMG.set(rel, null); return; }
  const buf = readFileSync(file);
  const v = createHash("md5").update(buf).digest("hex").slice(0, 8);
  const meta = await sharp(buf).metadata();
  let out = rel, w = meta.width, h = meta.height;
  if (!/\.webp$/i.test(rel) || w > MAX_W * 1.25 || buf.length > 700_000) {
    out = rel.replace(/\.[a-z0-9]+$/i, "") + ".webp";
    const r = await sharp(buf).rotate().resize({ width: MAX_W, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
    mkdirSync(dirname(join(OUT, out)), { recursive: true });
    writeFileSync(join(OUT, out), r.data);
    w = r.info.width; h = r.info.height;
  }
  IMG.set(rel, { src: `${encodeURI(out)}?v=${v}`, w, h });
}
const pic = (p) => IMG.get(normImg(p)) || null;
// Slika po ključu iz P (predloge) ali po poti iz urejevalnika; manjkajoča slika → nadomestna
const anyImg = (ref, alt, attrs) => {
  if (P[ref]) return pimg(ref, alt, attrs);
  const i = pic(ref) || { src: P.hero[0], w: P.hero[1], h: P.hero[2] };
  return img(i.src, alt, i.w, i.h, attrs);
};
const anySrc = (ref) => (P[ref] ? P[ref][0] : (pic(ref) || { src: P.hero[0] }).src);

/* ------------------------------------------------------------------ */
/* Storitve                                                            */
/* ------------------------------------------------------------------ */
const ICON_FALLBACK = "sparkles";
const SERVICES = readdirSync(join(CONTENT, "storitve"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    const j = readJson(`storitve/${f}`);
    return {
      slug: slugify(f.replace(/\.json$/, "")),
      order: Number(j.vrstni_red) || 99,
      title: j.naslov || "Storitev",
      nav: j.kratko_ime || j.naslov || "Storitev",
      icon: ICONS[j.ikona] ? j.ikona : ICON_FALLBACK,
      photo: j.slika, photoAlt: j.slika_opis || j.naslov || "",
      photo2: j.slika2 || j.slika, photo2Alt: j.slika2_opis || j.slika_opis || "",
      card: j.opis_na_kartici || "",
      h1: j.naslov_strani || j.naslov || "",
      lead: j.uvod || "",
      metaDesc: j.opis_za_google || j.uvod || "",
      intro: para(j.besedilo),
      includes: arr(j.vkljucuje), extras: arr(j.dodatno), who: arr(j.za_koga),
      freq: !!j.pokazi_pogostost,
      beforeAfter: !!j.pokazi_prej_potem,
      faq: arr(j.vprasanja).filter((q) => q.vprasanje).map((q) => [q.vprasanje, q.odgovor || ""]),
    };
  })
  .sort((x, y) => x.order - y.order || x.title.localeCompare(y.title, "sl"));

/* ------------------------------------------------------------------ */
/* Ocene strank                                                        */
/* ------------------------------------------------------------------ */
const REVIEWS = arr(readJson("ocene.json").ocene).filter((r) => r.besedilo && r.ime).map((r) => [r.besedilo, r.ime, r.opis || ""]);
const reviewCard = ([q, n, r], i = 0) => `
<figure class="review reveal" style="--d:${(i % 3) * 80}ms">
  ${icon("quote", "q")}
  ${stars()}
  <blockquote><p>${esc(q)}</p></blockquote>
  <figcaption><span class="av" aria-hidden="true">${esc(n[0])}</span><div><strong>${esc(n)}</strong><span>${esc(r)}</span></div></figcaption>
</figure>`;

/* ------------------------------------------------------------------ */
/* Pogosta vprašanja                                                   */
/* ------------------------------------------------------------------ */
const FAQ = arr(readJson("vprasanja.json").skupine).map((g) => ({
  id: slugify(g.skupina || "vprasanja"),
  title: g.skupina || "Vprašanja",
  icon: ICONS[g.ikona] ? g.ikona : "question",
  items: arr(g.vprasanja).filter((q) => q.vprasanje).map((q) => [q.vprasanje, q.odgovor || "", !!q.na_domaci_strani]),
}));
const faqItem = ([q, a], open = false) => `
<details${open ? " open" : ""}>
  <summary>${esc(q)}<span class="pm" aria-hidden="true"></span></summary>
  <div class="answer">${para(a)}</div>
</details>`;
const stripTags = (s) => String(s).replace(/<\/p>\s*<p[^>]*>/g, " ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const faqJsonLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: stripTags(a) } })),
});

/* ------------------------------------------------------------------ */
/* Delci                                                               */
/* ------------------------------------------------------------------ */
const serviceCards = (list = SERVICES) => `
<div class="services">
${list.map((s, i) => `  <a class="service-card reveal" href="${s.slug}.html" style="--d:${(i % 3) * 80}ms">
    <div class="img">${anyImg(s.photo, s.photoAlt)}<span class="badge-ico">${icon(s.icon)}</span></div>
    <div class="body">
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.card)}</p>
      <span class="more">Več o storitvi ${icon("arrow")}</span>
    </div>
  </a>`).join("\n")}
</div>`;

const callStrip = () => `
<div class="call-strip">
  <strong>Raje pokličete?</strong>
  <a href="${SITE.phoneHref}">${icon("phone")} ${SITE.phone}</a>
  <span class="sep" aria-hidden="true"></span>
  <a href="mailto:${SITE.email}">${icon("mail")} ${SITE.email}</a>
  <span class="sep" aria-hidden="true"></span>
  <span>${SITE.hours}</span>
</div>`;

// Primerjave prej/potem (content/prej-potem.json). Prva se pokaže tudi na domači strani in pri oknih.
const BA = arr(readJson("prej-potem.json").primerjave).filter((b) => b.prej && b.potem);
const beforeAfter = (i = 0) => {
  const b = BA[i];
  if (!b) return "";
  const pr = pic(b.prej), po = pic(b.potem);
  if (!pr || !po) return "";
  // Ležeče slike pokažemo v njihovem razmerju, pokončne obrežemo na 4:3 (privzeto v CSS).
  const ratio = pr.w > pr.h ? ` style="aspect-ratio:${pr.w} / ${pr.h}"` : "";
  const cap = String(b.napis || "").trim();
  return `
<div>
  <div class="ba" data-ba${ratio}>
    <img src="${pr.src}" alt="${esc(b.opis_prej || `${b.naslov || ""} pred čiščenjem`)}" width="${pr.w}" height="${pr.h}" loading="lazy" decoding="async">
    <img class="ba-after" src="${po.src}" alt="${esc(b.opis_potem || `${b.naslov || ""} po čiščenju`)}" width="${pr.w}" height="${pr.h}" loading="lazy" decoding="async">
    <span class="ba-label l">Prej</span><span class="ba-label r">Potem</span>
    <span class="ba-line" aria-hidden="true"></span>
    <input type="range" min="0" max="100" value="50" aria-label="Primerjava prej in potem: povlecite levo ali desno">
    <span class="ba-handle" aria-hidden="true">${icon("handle")}</span>
  </div>
  <p class="ba-caption">${esc(cap)}${cap && !/[.!?]$/.test(cap) ? "." : ""} Povlecite drsnik.</p>
</div>`;
};
const beforeAfterAll = () => BA.map((b, i) => `
<section class="section"${i ? ' style="padding-top:0"' : ""}>
  <div class="container split">
    <div class="reveal">
      <span class="kicker">Prej in potem</span>
      <h2>${esc(b.naslov || "")}</h2>
      ${b.besedilo ? `<p class="lead" style="margin-top:16px">${esc(b.besedilo)}</p>` : ""}
    </div>
    <div class="reveal" style="--d:100ms">${beforeAfter(i)}</div>
  </div>
</section>`).join("\n");

// Galerija na strani Reference (content/galerija.json)
const gallery = () => {
  const items = arr(readJson("galerija.json").slike).filter((g) => g.slika && pic(g.slika));
  let col = 0;
  return `<div class="gallery">${items.map((g) => {
    const i = pic(g.slika);
    const d = g.siroka ? 0 : (col++ % 3) * 80;
    if (g.siroka) col = 0;
    return `
      <figure class="reveal${g.siroka ? " wide" : ""}"${d ? ` style="--d:${d}ms"` : ""}>${img(i.src, g.opis_slike || g.opis || "", i.w, i.h)}${g.opis ? `<figcaption>${esc(g.opis)}</figcaption>` : ""}</figure>`;
  }).join("")}
    </div>`;
};

const phModule = () => `
<div class="ph-bar" aria-hidden="true"></div>
<div class="ph-ticks" aria-hidden="true">${Array.from({ length: 15 }, (_, i) => `<span>${i}</span>`).join("")}</div>
<div class="ph-cols">
  <article class="ph-col ph-acid reveal">
    <span class="val">pH 2–5</span>
    <h3>Kislo</h3>
    <p>Za mineralno umazanijo, kjer se nabira voda.</p>
    <ul><li>Vodni kamen na pipah in tuš kabinah</li><li>Urinski kamen in rja v WC školjkah</li><li>Sledi mila na ploščicah</li></ul>
    <p class="note">Nikoli na marmorju in drugem naravnem kamnu.</p>
  </article>
  <article class="ph-col ph-neutral reveal" style="--d:80ms">
    <span class="val">pH 6–8</span>
    <h3>Nevtralno</h3>
    <p>Za vsakodnevni prah in občutljive materiale.</p>
    <ul><li>Okna in steklo brez lis</li><li>Žaluzije z aluminijastimi lamelami</li><li>Parket, laminat in pohištvo</li><li>Marmor, granit in muzejski eksponati</li></ul>
  </article>
  <article class="ph-col ph-base reveal" style="--d:160ms">
    <span class="val">pH 9–12</span>
    <h3>Bazično</h3>
    <p>Za organsko umazanijo, kjer se kuha ali dela z olji.</p>
    <ul><li>Maščoba na napah, pečicah in pultih</li><li>Saje okoli kaminov</li><li>Olja in voski na industrijskih tleh</li></ul>
    <p class="note">Ciljno, ker lahko poškoduje aluminij in les.</p>
  </article>
</div>`;

const cta = (title = "Potrebujete zanesljiv čistilni servis?", text = "Pošljite povpraševanje in brezplačno ponudbo prejmete običajno v enem delovnem dnevu.") => `
<section class="cta" aria-label="Povpraševanje">
  <div class="container">
    <div>
      <h2>${title}</h2>
      <p>${text}</p>
    </div>
    <div class="cta-btns">
      <a class="cta-phone" href="${SITE.phoneHref}"><span class="ic">${icon("phone")}</span><span><small>Pokličite nas</small><strong>${SITE.phone}</strong></span></a>
      <a class="btn btn-amber" href="kontakt.html#povprasevanje">Brezplačna ponudba ${icon("arrow", "arrow")}</a>
    </div>
  </div>
</section>`;

const serviceOptions = (selected = "") =>
  SERVICES.map((s) => `<option value="${esc(s.title)}" data-slug="${s.slug}"${s.slug === selected ? " selected" : ""}>${s.title}</option>`).join("") +
  `<option value="Drugo / nisem prepričan" data-slug="drugo">Drugo / nisem prepričan</option>`;

const hidden = (subject) => `
      <input type="hidden" name="_subject" value="${esc(subject)}">
      <input type="hidden" name="_template" value="table">
      <input type="hidden" name="_captcha" value="false">
      <input type="hidden" name="_next" value="${SITE.url}/hvala.html">
      <input type="text" name="_honey" class="visually-hidden" tabindex="-1" autocomplete="off" aria-hidden="true">`;

const field = (id, label, input, { full = false, opt = false } = {}) => `
      <div class="field${full ? " full" : ""}">
        <label for="${id}">${label}${opt ? ' <span class="opt">(neobvezno)</span>' : " *"}</label>
        ${input}
        <span class="err" id="${id}-err" role="alert"></span>
      </div>`;
const nameInput = (id) => `<input id="${id}" name="ime_priimek" type="text" required autocomplete="name" placeholder="Janez Novak" aria-describedby="${id}-err">`;
const phoneInput = (id) => `<input id="${id}" name="telefon" type="tel" required autocomplete="tel" inputmode="tel" pattern="[0-9+ \\-]{6,}" placeholder="041 234 567" aria-describedby="${id}-err">`;
const emailInput = (id, req = true) => `<input id="${id}" name="email" type="email"${req ? " required" : ""} autocomplete="email" placeholder="janez@primer.si" aria-describedby="${id}-err">`;
const serviceSelect = (id, sel) => `<select id="${id}" name="storitev" required aria-describedby="${id}-err"><option value="">Izberite storitev …</option>${serviceOptions(sel)}</select>`;
const cityInput = (id) => `<input id="${id}" name="lokacija" type="text" required autocomplete="address-level2" placeholder="npr. Grosuplje" aria-describedby="${id}-err">`;
const consentBox = (id) => `
      <label class="consent">
        <input type="checkbox" name="soglasje" value="Da" required aria-describedby="${id}-err">
        <span>Strinjam se z obdelavo podatkov za pripravo ponudbe, skladno s <a href="zasebnost.html">politiko zasebnosti</a>. *<span class="err" id="${id}-err" role="alert"></span></span>
      </label>`;
const submitRow = (label, cls = "btn-amber") => `
      <div class="form-status" role="alert" aria-live="polite"></div>
      <button class="btn ${cls} btn-block form-submit" type="submit">${label} <span class="spinner" aria-hidden="true"></span>${icon("arrow", "arrow")}</button>
      <p class="form-note">${icon("lock")} Brezplačno in neobvezujoče. Vaših podatkov ne delimo.</p>`;
const success = () => `
  <div class="form-success" tabindex="-1" role="status">
    <div class="ok">${icon("check")}</div>
    <h3>Hvala, povpraševanje je poslano!</h3>
    <p>Odgovorimo vam običajno v enem delovnem dnevu. Če se vam mudi, pokličite <a href="${SITE.phoneHref}">${SITE.phone}</a>.</p>
  </div>`;

const FORM_ACTION = `https://formsubmit.co/${SITE.formTarget}`;

function quickForm() {
  const p = "q";
  return `
<div class="quick-card form-card">
  <div class="form-body">
    <h2>Brezplačna ponudba</h2>
    <p class="sub">Izpolnite obrazec in poklicali vas bomo v enem delovnem dnevu.</p>
    <form class="form-grid" action="${FORM_ACTION}" method="POST" data-inquiry novalidate>${hidden("Hitro povpraševanje prek unimark.si")}
      ${field(`${p}-name`, "Ime in priimek", nameInput(`${p}-name`))}
      ${field(`${p}-phone`, "Telefon", phoneInput(`${p}-phone`))}
      ${field(`${p}-service`, "Storitev", serviceSelect(`${p}-service`))}
      ${field(`${p}-city`, "Kraj", cityInput(`${p}-city`))}
      ${consentBox(`${p}-consent`)}
      ${submitRow("Pošljite povpraševanje")}
    </form>
  </div>${success()}
</div>`;
}

function sideForm(s) {
  const p = "s";
  return `
<div class="form-card side">
  <div class="form-body">
    <h3>Zahtevajte ponudbo</h3>
    <p class="sub">Za: ${s.nav.toLowerCase()}</p>
    <form class="form-grid" action="${FORM_ACTION}" method="POST" data-inquiry novalidate>${hidden(`Povpraševanje: ${s.title}`)}
      <input type="hidden" name="storitev" value="${esc(s.title)}">
      ${field(`${p}-name`, "Ime in priimek", nameInput(`${p}-name`))}
      ${field(`${p}-phone`, "Telefon", phoneInput(`${p}-phone`))}
      ${field(`${p}-city`, "Kraj", cityInput(`${p}-city`))}
      ${field(`${p}-msg`, "Sporočilo", `<textarea id="${p}-msg" name="sporocilo" rows="3" placeholder="Velikost prostora, želeni termin …"></textarea>`, { opt: true })}
      ${consentBox(`${p}-consent`)}
      ${submitRow("Pošljite", "btn-teal")}
    </form>
  </div>${success()}
</div>`;
}

function bigForm() {
  const p = "f";
  return `
<div class="form-card big">
  <div class="form-body">
    <h2>Oddajte povpraševanje</h2>
    <p class="sub">Polja z zvezdico so obvezna. Odgovorimo običajno v enem delovnem dnevu.</p>
    <form class="form-grid" action="${FORM_ACTION}" method="POST" data-inquiry novalidate>${hidden("Novo povpraševanje prek unimark.si")}
      ${field(`${p}-name`, "Ime in priimek", nameInput(`${p}-name`))}
      ${field(`${p}-phone`, "Telefon", phoneInput(`${p}-phone`))}
      ${field(`${p}-email`, "E-pošta", emailInput(`${p}-email`), { full: true })}
      ${field(`${p}-service`, "Storitev", serviceSelect(`${p}-service`))}
      ${field(`${p}-city`, "Kraj", cityInput(`${p}-city`))}
      <fieldset class="field full">
        <legend>Kako pogosto?</legend>
        <div class="chips">
          <label class="chip"><input type="radio" name="pogostost" value="Enkratno" checked><span>Enkratno</span></label>
          <label class="chip"><input type="radio" name="pogostost" value="Tedensko"><span>Tedensko</span></label>
          <label class="chip"><input type="radio" name="pogostost" value="Na 14 dni"><span>Na 14 dni</span></label>
          <label class="chip"><input type="radio" name="pogostost" value="Mesečno"><span>Mesečno</span></label>
        </div>
      </fieldset>
      ${field(`${p}-size`, "Približna velikost prostora", `<input id="${p}-size" name="velikost" type="text" placeholder="npr. 75 m², trisobno stanovanje">`, { full: true, opt: true })}
      ${field(`${p}-msg`, "Sporočilo", `<textarea id="${p}-msg" name="sporocilo" rows="4" placeholder="Opišite prostor, želeni termin ali posebnosti …"></textarea>`, { full: true, opt: true })}
      ${consentBox(`${p}-consent`)}
      ${submitRow("Pošljite povpraševanje")}
    </form>
  </div>${success()}
</div>`;
}

const contactBox = () => `
<aside class="contact-box">
  <h3>Kontaktni podatki</h3>
  <ul class="contact-list">
    <li><span class="ic">${icon("phone")}</span><div><small>Telefon</small><a href="${SITE.phoneHref}">${SITE.phone}</a></div></li>
    <li><span class="ic">${icon("mail")}</span><div><small>E-pošta</small><a href="mailto:${SITE.email}">${SITE.email}</a></div></li>
    <li><span class="ic">${icon("clock")}</span><div><small>Delovni čas</small><strong>${SITE.hoursHtml}</strong></div></li>
  </ul>
  <hr>
  <ul class="perks">
    <li>${icon("check")}Odgovor običajno v enem delovnem dnevu</li>
    <li>${icon("check")}Brezplačna in neobvezujoča ponudba</li>
    <li>${icon("check")}Termin prilagojen vašemu urniku</li>
  </ul>
</aside>`;

const inquirySection = () => `
<section class="section section-tint" id="povprasevanje" aria-label="Povpraševanje">
  <div class="container inquiry">
    <div class="reveal">${bigForm()}</div>
    <div class="reveal" style="--d:100ms">${contactBox()}</div>
  </div>
</section>`;

const banner = (crumbs, h1, lead, photo, extra = "") => `
<section class="page-banner">
  <div class="bg">${anyImg(photo, "", 'fetchpriority="high"')}</div>
  <div class="container">
    <ol class="crumbs" aria-label="Drobtine"><li><a href="index.html">Domov</a></li>${crumbs.map(([n, h]) => (h ? `<li><a href="${h}">${n}</a></li>` : `<li aria-current="page">${n}</li>`)).join("")}</ol>
    <h1>${h1}</h1>
    ${lead ? `<p>${lead}</p>` : ""}
    ${extra}
  </div>
</section>`;

/* ------------------------------------------------------------------ */
/* Ogrodje strani                                                      */
/* ------------------------------------------------------------------ */
const NAV = [
  { href: "index.html", label: "Domov", key: "domov" },
  { href: "storitve.html", label: "Storitve", key: "storitve", menu: true },
  { href: "strokovnost.html", label: "Strokovnost", key: "strokovnost" },
  { href: "reference.html", label: "Reference", key: "reference" },
  { href: "o-nas.html", label: "O nas", key: "o-nas" },
  { href: "pogosta-vprasanja.html", label: "Vprašanja", key: "faq" },
  { href: "kontakt.html", label: "Kontakt", key: "kontakt" },
];

const header = (active) => `
<a class="skip-link" href="#main">Preskoči na vsebino</a>
<div class="topbar">
  <div class="container">
    <div class="topbar-group">
      <span>${icon("pin")} Grosuplje, Ljubljana in okolica</span>
      <span class="hide-md">${icon("clock")} ${SITE.hours}</span>
    </div>
    <div class="topbar-group">
      <a href="mailto:${SITE.email}" class="hide-md">${icon("mail")} ${SITE.email}</a>
      <a href="${SITE.phoneHref}">${icon("phone")} <strong>${SITE.phone}</strong></a>
    </div>
  </div>
</div>
<header class="site-header" data-header>
  <div class="container header-inner">
    <a class="brand" href="index.html" aria-label="Unimark, čistilni servis – domov">
      <img src="assets/img/unimark-logo.png" alt="Unimark – čistilni servis, čarovnija čistoče" width="900" height="284">
    </a>
    <nav class="nav" aria-label="Glavna navigacija">
      <ul>
        ${NAV.map((n) =>
          n.menu
            ? `<li class="has-menu">
          <button class="nav-btn${active === n.key ? " is-current" : ""}" type="button" aria-expanded="false" aria-controls="dd-storitve">${n.label} ${icon("chevron")}</button>
          <div class="dropdown" id="dd-storitve">
            ${SERVICES.map((s) => `<a href="${s.slug}.html">${img(anySrc(s.photo), "", 54, 40)}<span>${esc(s.nav)}</span></a>`).join("\n            ")}
            <a class="all" href="storitve.html">Vse storitve →</a>
          </div>
        </li>`
            : `<li><a href="${n.href}"${active === n.key ? ' aria-current="page"' : ""}>${n.label}</a></li>`
        ).join("\n        ")}
      </ul>
    </nav>
    <div class="header-cta">
      <a class="header-phone" href="${SITE.phoneHref}" aria-label="Pokličite ${SITE.phone}">${icon("phone")}<span>${SITE.phone}</span></a>
      <a class="btn btn-amber" href="kontakt.html#povprasevanje">Brezplačna ponudba</a>
      <button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobile-menu" aria-label="Odpri meni"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu">
  <nav aria-label="Mobilna navigacija">
    <a href="index.html">Domov</a>
    <details>
      <summary>Storitve ${icon("chevron")}</summary>
      <div class="sub">
        <a href="storitve.html">Vse storitve</a>
        ${SERVICES.map((s) => `<a href="${s.slug}.html">${s.nav}</a>`).join("\n        ")}
      </div>
    </details>
    ${NAV.filter((n) => !n.menu && n.key !== "domov").map((n) => `<a href="${n.href}">${n.label === "Vprašanja" ? "Pogosta vprašanja" : n.label}</a>`).join("\n    ")}
  </nav>
  <div class="mm-cta">
    <a class="btn btn-amber btn-block" href="kontakt.html#povprasevanje">Brezplačna ponudba</a>
    <a class="btn btn-outline btn-block" href="${SITE.phoneHref}">${icon("phone")} ${SITE.phone}</a>
  </div>
  <p class="mm-info">${SITE.hours}</p>
</div>`;

const footer = () => `
<footer class="site-footer">
  <div class="container footer-top">
    <div class="footer-about">
      <a class="footer-logo" href="index.html"><img src="assets/img/unimark-logo.png" alt="Unimark" width="900" height="284" loading="lazy"></a>
      <p>Profesionalni čistilni servis za domove, podjetja, večstanovanjske stavbe in kulturne ustanove. Že več kot 10 let.</p>
    </div>
    <div>
      <h3>Storitve</h3>
      <ul>${SERVICES.map((s) => `<li><a href="${s.slug}.html">${s.nav}</a></li>`).join("")}</ul>
    </div>
    <div>
      <h3>Podjetje</h3>
      <ul>
        <li><a href="o-nas.html">O nas</a></li>
        <li><a href="strokovnost.html">Strokovnost</a></li>
        <li><a href="reference.html">Reference</a></li>
        <li><a href="pogosta-vprasanja.html">Pogosta vprašanja</a></li>
        <li><a href="kontakt.html">Kontakt</a></li>
      </ul>
    </div>
    <div>
      <h3>Kontakt</h3>
      <ul class="f-contact">
        <li>${icon("phone")}<a href="${SITE.phoneHref}">${SITE.phone}</a></li>
        <li>${icon("mail")}<a href="mailto:${SITE.email}">${SITE.email}</a></li>
        <li>${icon("clock")}<span>${SITE.hoursHtml}</span></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container">
      <span>© <span data-year>2026</span> UNIMARK, Helena Germšek, s.p. Vse pravice pridržane.</span>
      <nav aria-label="Pravne informacije">
        <a href="zasebnost.html">Politika zasebnosti</a>
        <a href="pogoji.html">Pogoji poslovanja</a>
        <a href="piskotki.html">Piškotki</a>
        <button type="button" data-consent="settings">Nastavitve piškotkov</button>
      </nav>
    </div>
  </div>
</footer>`;

const cookieUi = () => `
<div class="cookie" id="cookie-banner" role="region" aria-label="Obvestilo o piškotkih" hidden>
  <h2>${icon("cookie")} Piškotki</h2>
  <p>Stran uporablja le nujno shranjevanje. Z vašim soglasjem lahko naložimo tudi Google zemljevid. <a href="piskotki.html">Več o piškotkih</a></p>
  <div class="cookie-actions">
    <button class="btn btn-outline" type="button" data-consent="reject">Zavrni</button>
    <button class="btn btn-teal" type="button" data-consent="accept">Sprejmi vse</button>
    <button class="link" type="button" data-consent="settings">Nastavitve</button>
  </div>
</div>
<div class="modal" id="cookie-modal" hidden>
  <div class="modal-backdrop" data-consent="close"></div>
  <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="cm-title" tabindex="-1">
    <button class="modal-close" type="button" data-consent="close" aria-label="Zapri">${icon("close")}</button>
    <h2 id="cm-title">Nastavitve piškotkov</h2>
    <p>Izberite, katere kategorije dovolite. Izbiro lahko kadar koli spremenite v nogi strani.</p>
    <ul class="consent-list">
      <li class="consent-item">
        <strong>Nujni</strong>
        <p>Potrebni za delovanje strani in shranjevanje vaše izbire. Teh ni mogoče izklopiti.</p>
        <label class="switch"><input type="checkbox" checked disabled aria-label="Nujni piškotki (vedno vklopljeni)"><span></span></label>
      </li>
      <li class="consent-item">
        <strong>Zunanje vsebine</strong>
        <p>Vgrajeni zemljevid Google Maps na strani Kontakt. Google lahko nastavi lastne piškotke.</p>
        <label class="switch"><input type="checkbox" name="external" aria-label="Zunanje vsebine"><span></span></label>
      </li>
      <li class="consent-item">
        <strong>Analitika</strong>
        <p>Anonimna statistika obiskov. Trenutno ne uporabljamo nobenega analitičnega orodja.</p>
        <label class="switch"><input type="checkbox" name="analytics" aria-label="Analitika"><span></span></label>
      </li>
    </ul>
    <div class="modal-actions">
      <button class="btn btn-outline btn-sm" type="button" data-consent="reject">Zavrni vse</button>
      <button class="btn btn-outline btn-sm" type="button" data-consent="accept">Sprejmi vse</button>
      <button class="btn btn-teal btn-sm" type="button" data-consent="save">Shrani izbiro</button>
    </div>
  </div>
</div>`;

const mobileBar = () => `
<div class="mobile-bar" data-mobile-bar>
  <a class="call" href="${SITE.phoneHref}">${icon("phone")} Pokličite</a>
  <a class="quote" href="kontakt.html#povprasevanje">Ponudba ${icon("arrow")}</a>
</div>`;

const LOCAL_BUSINESS = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE.url}/#podjetje`,
  name: "Unimark – čistilni servis",
  legalName: SITE.legalName,
  description: "Profesionalno čiščenje domov, poslovnih prostorov, večstanovanjskih stavb, muzejev in galerij ter generalna čiščenja.",
  url: `${SITE.url}/`,
  logo: `${SITE.url}/assets/img/unimark-logo.png`,
  image: `${SITE.url}/assets/img/og-image.png`,
  telephone: SITE.phoneIntl,
  email: SITE.email,
  priceRange: "€€",
  address: { "@type": "PostalAddress", streetAddress: SITE.street, postalCode: SITE.zip, addressLocality: SITE.city, addressCountry: "SI" },
  areaServed: ["Grosuplje", "Ljubljana", "Škofljica", "Šmarje - Sap", "Ivančna Gorica", "Dobrepolje"].map((n) => ({ "@type": "City", name: n })),
  openingHoursSpecification: [
    [["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], range(HOURS.week)],
    ["Saturday", hoursSat ? range(hoursSat) : [null, null]],
  ].filter(([, [o, c]]) => o && c).map(([dayOfWeek, [opens, closes]]) => ({ "@type": "OpeningHoursSpecification", dayOfWeek, opens, closes })),
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Storitve čiščenja",
    itemListElement: SERVICES.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.title, url: `${SITE.url}/${s.slug}.html` } })),
  },
};

function layout(p) {
  const url = p.path === "index.html" ? `${SITE.url}/` : `${SITE.url}/${p.path}`;
  const title = p.path === "index.html" ? p.title : `${p.title} | Unimark`;
  const jsonld = [...(p.jsonld || [])];
  if (p.breadcrumb) {
    jsonld.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [["Domov", "index.html"], ...p.breadcrumb].map(([name, href], i) => ({
        "@type": "ListItem", position: i + 1, name, ...(href ? { item: href === "index.html" ? `${SITE.url}/` : `${SITE.url}/${href}` } : {}),
      })),
    });
  }
  return `<!doctype html>
<html lang="sl" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${p.base ? `<base href="/">\n` : ""}<title>${esc(title)}</title>
<meta name="description" content="${esc(p.description)}">
<meta name="robots" content="${p.noindex ? "noindex, follow" : "index, follow"}">
<meta name="theme-color" content="#0f2f3d">
<meta name="format-detection" content="telephone=no">
${p.noindex ? "" : `<link rel="canonical" href="${url}">\n`}<meta property="og:type" content="website">
<meta property="og:site_name" content="Unimark">
<meta property="og:locale" content="sl_SI">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.url}/assets/img/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon-32.png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="preload" href="assets/fonts/poppins-600.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/sourcesans3.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/style.css?v=${BUILD_ID}">
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
</head>
<body>
${header(p.nav)}
<main id="main">
${p.body}
</main>
${footer()}
${cookieUi()}
${p.noMobileBar ? "" : mobileBar()}
<script src="assets/js/main.js?v=${BUILD_ID}" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
/* Podstrani storitev                                                  */
/* ------------------------------------------------------------------ */
function servicePage(s) {
  const body = `
${banner([["Storitve", "storitve.html"], [esc(s.nav)]], esc(s.h1), esc(s.lead), s.photo, `<div class="hero-btns"><a class="btn btn-amber" href="#ponudba">Zahtevajte ponudbo ${icon("arrow", "arrow")}</a><a class="btn btn-white-outline" href="${SITE.phoneHref}">${icon("phone")} ${SITE.phone}</a></div>`)}

<section class="section">
  <div class="container layout">
    <div class="content">
      <div class="text-block reveal">
        <h2>${esc(s.title)}</h2>
        ${s.intro}
      </div>
      ${anyImg(s.photo2, s.photo2Alt, 'class="content-img reveal" loading="lazy" decoding="async"')}
      <div class="reveal">
        <h2>Kaj vključuje čiščenje</h2>
        <ul class="incl">${s.includes.map((t) => `<li>${icon("check")}${esc(t)}</li>`).join("")}</ul>
      </div>
      <div class="reveal">
        <h2>Dodatno po dogovoru</h2>
        <ul class="incl extra">${s.extras.map((t) => `<li>${icon("plus")}${esc(t)}</li>`).join("")}</ul>
      </div>
      ${s.beforeAfter && BA.length ? `<div class="reveal"><h2>Prej in potem</h2>${beforeAfter(0)}</div>` : ""}
      ${s.freq ? `<div class="reveal">
        <h2>Kako pogosto?</h2>
        <div class="freq">
          <div>${icon("repeat")}<strong>Tedensko</strong><span>Vedno urejeno, najugodneje na obisk</span></div>
          <div>${icon("calendar")}<strong>Na 14 dni</strong><span>Najpogostejša izbira</span></div>
          <div>${icon("clock")}<strong>Mesečno</strong><span>Temeljito vzdrževanje</span></div>
          <div>${icon("sparkles")}<strong>Enkratno</strong><span>Po potrebi ali ob priložnosti</span></div>
        </div>
      </div>` : ""}
      <div class="reveal">
        <h2>Za koga je storitev primerna</h2>
        <div class="tags">${s.who.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
      </div>
      <div class="reveal">
        <h2>Pogosta vprašanja</h2>
        <div class="faq">${s.faq.map((f, i) => faqItem(f, i === 0)).join("")}</div>
      </div>
    </div>
    <aside class="sidebar" id="ponudba">
      ${sideForm(s)}
      <div class="side-box">
        <h3>Naše storitve</h3>
        <ul class="side-nav">${SERVICES.map((x) => `<li><a href="${x.slug}.html"${x === s ? ' aria-current="page"' : ""}>${x.nav}${icon("chevronRight")}</a></li>`).join("")}</ul>
      </div>
      <div class="side-call">
        <span class="ic">${icon("phone")}</span>
        <p>Imate vprašanje? Pokličite nas</p>
        <a href="${SITE.phoneHref}">${SITE.phone}</a>
        <small>${SITE.hours}</small>
      </div>
    </aside>
  </div>
</section>
${cta()}`;

  return {
    path: `${s.slug}.html`,
    title: `${s.title} – Grosuplje, Ljubljana`,
    description: s.metaDesc,
    nav: "storitve",
    breadcrumb: [["Storitve", "storitve.html"], [s.nav]],
    jsonld: [
      { "@context": "https://schema.org", "@type": "Service", name: s.title, serviceType: s.title, description: s.metaDesc, provider: { "@id": `${SITE.url}/#podjetje` }, areaServed: { "@type": "AdministrativeArea", name: "Osrednjeslovenska regija" }, url: `${SITE.url}/${s.slug}.html` },
      faqJsonLd(s.faq),
      LOCAL_BUSINESS,
    ],
    body,
  };
}

/* ------------------------------------------------------------------ */
/* Ročno pisane strani iz src/pages                                    */
/* ------------------------------------------------------------------ */
const TOKENS = {
  "service-cards": () => serviceCards(),
  "call-strip": callStrip,
  "before-after": () => beforeAfter(0),
  "before-after-all": beforeAfterAll,
  gallery,
  "service-count": () => String(SERVICES.length),
  "hours-week": () => HOURS.week,
  "hours-sat": () => hoursSat || "Zaprto",
  ph: phModule,
  cta: () => cta(),
  inquiry: inquirySection,
  "quick-form": quickForm,
  "big-form": bigForm,
  "contact-box": contactBox,
  "reviews-home": () => `<div class="reviews">${REVIEWS.slice(0, 3).map(reviewCard).join("")}</div>`,
  "reviews-all": () => `<div class="reviews">${REVIEWS.map(reviewCard).join("")}</div>`,
  "faq-home": () => { const all = FAQ.flatMap((g) => g.items); const sel = all.filter((q) => q[2]); return `<div class="faq">${(sel.length ? sel : all.slice(0, 4)).map((f, i) => faqItem(f, i === 0)).join("")}</div>`; },
  "faq-all": () => FAQ.map((g) => `<div class="faq-group" id="${g.id}"><h2><span class="icon-circle">${icon(g.icon)}</span>${esc(g.title)}</h2><div class="faq">${g.items.map((f) => faqItem(f)).join("")}</div></div>`).join(""),
  phone: () => SITE.phone,
  "phone-href": () => SITE.phoneHref,
  email: () => SITE.email,
  "legal-name": () => SITE.legalName,
  address: () => `${SITE.street}, ${SITE.zip} ${SITE.city}`,
  "maps-link": () => SITE.mapsLink,
  "maps-embed": () => SITE.mapsEmbed,
  hours: () => SITE.hours,
  updated: () => SITE.updated,
  stars: stars,
};
function render(html) {
  return html.replace(/\{\{\s*([\w:,-]+)\s*\}\}/g, (m, key) => {
    if (key.startsWith("icon:")) { const [, name, cls] = key.split(":"); return icon(name, cls || ""); }
    if (key.startsWith("photo:")) { const [, k] = key.split(":"); if (!P[k]) throw new Error(`Neznana fotografija: ${m}`); return P[k][0]; }
    if (!TOKENS[key]) throw new Error(`Neznan žeton: ${m}`);
    return TOKENS[key]();
  });
}

function readPage(file) {
  const raw = readFileSync(join(SRC, "pages", file), "utf8");
  const m = raw.match(/^<!--\s*(\{[\s\S]*?\})\s*-->\s*/);
  if (!m) throw new Error(`Manjka glava v ${file}`);
  const meta = JSON.parse(m[1]);
  const jsonld = (meta.jsonld || []).map((j) => (j === "localbusiness" ? LOCAL_BUSINESS : j === "faq" ? faqJsonLd(FAQ.flatMap((g) => g.items)) : j));
  let body = render(raw.slice(m[0].length));
  if (meta.banner) {
    const b = meta.banner;
    body = banner(b.crumbs, b.h1, b.lead ? render(b.lead) : "", b.photo, b.updated ? `<p class="updated">Zadnja posodobitev: ${SITE.updated}</p>` : "") + "\n" + body;
  }
  return { ...meta, jsonld, path: file, body };
}

/* ------------------------------------------------------------------ */
/* Izgradnja                                                           */
/* ------------------------------------------------------------------ */
const BUILD_ID = Date.now().toString(36);
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(SRC, "assets"), join(OUT, "assets"), { recursive: true });
// Izvirnikov JPG/PNG iz urejevalnika ne kopiramo – objavijo se pretvorjene WebP različice (prepImage).
cpSync(join(ROOT, "assets"), join(OUT, "assets"), { recursive: true, filter: (p) => !/[\\/]foto[\\/].+\.(jpe?g|png|gif)$/i.test(p) });
const contentImages = [
  ...SERVICES.flatMap((s) => [s.photo, s.photo2]),
  ...BA.flatMap((b) => [b.prej, b.potem]),
  ...arr(readJson("galerija.json").slike).map((g) => g.slika),
].filter((p) => p && !P[p]);
for (const p of contentImages) await prepImage(p);
cpSync(join(ROOT, "assets", "img", "favicon.ico"), join(OUT, "favicon.ico"));
for (const f of readdirSync(join(SRC, "static"))) cpSync(join(SRC, "static", f), join(OUT, f));

const pages = [
  ...readdirSync(join(SRC, "pages")).filter((f) => f.endsWith(".html")).map(readPage),
  ...SERVICES.map(servicePage),
];
for (const p of pages) writeFileSync(join(OUT, p.path), layout(p));

const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .filter((p) => !p.noindex)
  .sort((a, b) => (a.path === "index.html" ? -1 : b.path === "index.html" ? 1 : a.path.localeCompare(b.path)))
  .map((p) => `  <url><loc>${p.path === "index.html" ? SITE.url + "/" : `${SITE.url}/${p.path}`}</loc><lastmod>${today}</lastmod><priority>${p.path === "index.html" ? "1.0" : p.priority || "0.7"}</priority></url>`)
  .join("\n")}
</urlset>
`);
console.log(`Zgrajeno ${pages.length} strani v dist/`);
