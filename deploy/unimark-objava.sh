#!/bin/sh
# Samodejna objava unimark.si na gostovanju Domenca.
# Cron ga zažene vsakih 5 minut: če je na GitHubu (veja "deploy") nova različica strani,
# jo prenese in prepiše datoteke v public_html. Gesla ali žetoni niso potrebni (javni repozitorij).
REPO="AnzeSimic/unimark-spletna-stran"
DEST="$HOME/public_html"
STATE="$HOME/.unimark-objava"
TMP="$HOME/.unimark-objava-tmp"
LOG="$HOME/unimark-objava.log"

NEW=$(curl -fsSL --max-time 20 "https://raw.githubusercontent.com/$REPO/deploy/VERSION?t=$(date +%s)" 2>/dev/null | tr -cd '0-9a-f')
[ -n "$NEW" ] || exit 0
[ "$NEW" = "$(cat "$STATE" 2>/dev/null)" ] && exit 0

rm -rf "$TMP"; mkdir -p "$TMP" || exit 1
if curl -fsSL --max-time 180 "https://codeload.github.com/$REPO/tar.gz/refs/heads/deploy" | tar -xzf - -C "$TMP" --strip-components=1 \
   && [ -f "$TMP/index.html" ] && [ "$(tr -cd '0-9a-f' < "$TMP/VERSION")" = "$NEW" ]; then
  rm -f "$TMP/VERSION"
  if cp -Rf "$TMP"/. "$DEST"/; then
    echo "$NEW" > "$STATE"
    echo "$(date '+%Y-%m-%d %H:%M') objavljena različica $NEW" >> "$LOG"
  fi
fi
rm -rf "$TMP"
