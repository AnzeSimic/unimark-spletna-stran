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

Podstrani storitev (`ciscenje-domov.html` …) se ustvarijo iz datotek v `content/storitve/`.

## Urejanje vsebine in samodejna objava

- **Vsebina** (kontakt, delovni čas, mnenja, vprašanja, storitve, galerija, prej/potem) je v mapi `content/`, fotografije v `assets/img/foto/`. Stranka jih ureja v **Pages CMS** (https://app.pagescms.org), nastavitve so v `.pages.yml`. Navodila za stranko: `NAVODILA-ZA-UREJANJE.md`.
- **GitHub:** repozitorij `AnzeSimic/unimark-spletna-stran` (javen). Ob vsakem pushu na `main` GitHub Actions (`.github/workflows/objava.yml`) zažene `node build.mjs` in zgrajeno stran shrani v vejo `deploy`.
- **Domenca:** cron vsakih 5 minut zažene `~/unimark-objava.sh` (kopija v `deploy/unimark-objava.sh`). Če je v veji `deploy` nova različica, jo prenese v `public_html`. Dnevnik: `~/unimark-objava.log`.
- Velike in JPG/PNG fotografije se ob gradnji samodejno pretvorijo v WebP (največ 1600 px), zato je potreben `npm install` (sharp).

## Pred objavo dopolnite

1. **Obrazec (FormSubmit)** – pošilja na `formTarget` v `build.mjs`. Prvo oddano povpraševanje na objavljeni strani sproži potrditveni e-mail na info.unimark@gmail.com; kliknite »Activate Form«. Nato lahko e-naslov v `formTarget` zamenjate z naključno kodo iz tega e-maila.
2. **Matična in davčna številka** – v `src/pages/pogoji.html` (označeno z »dopolnite«).
3. **Ocene strank** – v Pages CMS (Mnenja strank) objavite samo resnične ocene.
4. **Fotografije** v `assets/img/foto/` so z Unsplasha (brezplačna komercialna uporaba, navedba avtorja ni obvezna). Najbolje jih je postopoma zamenjati s fotografijami vaše ekipe – najlažje kar v Pages CMS.
