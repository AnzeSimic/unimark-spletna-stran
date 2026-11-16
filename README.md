# Unimark – spletna stran

Statična spletna stran (HTML + CSS + JS, brez frameworka). Za objavo se uporablja mapa **`dist/`**.

## Ukazi

```bash
node build.mjs     # zgradi stran v dist/
node serve.mjs     # predogled na http://localhost:4321
```

## Struktura

| Pot | Vsebina |
|---|---|
| `build.mjs` | podatki podjetja, storitve, ocene, FAQ, glava, noga, piškotki, obrazec |
| `src/pages/*.html` | ročno pisane strani (domov, o nas, kontakt, pravne strani, 404 …) |
| `src/assets/css/style.css` | vsi stili |
| `src/assets/js/main.js` | meni, obrazec, piškotki, pH zavihki, drsnik prej/potem |
| `assets/` | slike in pisave (gostovane lokalno, brez Google Fonts) |
| `src/static/` | robots.txt, manifest, `_headers` (Cloudflare/Netlify), `.htaccess` (Apache) |

Podstrani storitev (`ciscenje-domov.html` …) se ustvarijo iz seznama `SERVICES` v `build.mjs`.

## Pred objavo dopolnite

1. **Obrazec (FormSubmit)** – pošilja na `formTarget` v `build.mjs`. Prvo oddano povpraševanje na objavljeni strani sproži potrditveni e-mail na info.unimark@gmail.com; kliknite »Activate Form«. Nato lahko e-naslov v `formTarget` zamenjate z naključno kodo iz tega e-maila.
2. **Matična in davčna številka** – v `src/pages/pogoji.html` (označeno z »dopolnite«).
3. **Ocene strank** – v `build.mjs` (`REVIEWS`) objavite samo resnične ocene.
4. **Fotografije** v `assets/img/foto/` so z Unsplasha (brezplačna komercialna uporaba, navedba avtorja ni obvezna). Najbolje jih je postopoma zamenjati s fotografijami vaše ekipe – v `build.mjs` (objekt `P`) samo zamenjate pot.
