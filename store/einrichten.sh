#!/bin/bash
# Formwerk: App-Projekt für App Store und Google Play einrichten bzw. aktualisieren.
# Aufruf im Terminal:  curl -fsSL https://windischwilli-art.github.io/gym/store/einrichten.sh | bash
set -euo pipefail

APP="$HOME/Formwerk-App"
ZIP_URL="https://codeload.github.com/windischwilli-art/gym/zip/refs/heads/main"
TMP="$(mktemp -d)"
gruen(){ printf "\033[32m%s\033[0m\n" "$1"; }
rot(){ printf "\033[31m%s\033[0m\n" "$1"; }
schritt(){ printf "\n\033[1m▶ %s\033[0m\n" "$1"; }

schritt "Voraussetzungen prüfen"
if ! command -v node >/dev/null 2>&1; then
  rot "Node.js fehlt. Bitte installieren: https://nodejs.org (Version 22 oder neuer, Installer 'LTS'), danach diese Zeile nochmal ausführen."
  exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 22 ]; then rot "Node.js $NODE_MAJOR ist zu alt. Bitte Version 22 oder neuer von https://nodejs.org installieren."; exit 1; fi
gruen "Node.js $(node -v) ok"
HAS_XCODE=0
if xcodebuild -version >/dev/null 2>&1; then HAS_XCODE=1; gruen "$(xcodebuild -version | head -1) ok"; else rot "Xcode fehlt oder ist nicht eingerichtet. iPhone-Teil wird übersprungen (Xcode aus dem Mac App Store installieren und einmal öffnen)."; fi
HAS_STUDIO=0
if [ -d "/Applications/Android Studio.app" ]; then HAS_STUDIO=1; gruen "Android Studio gefunden"; else echo "Android Studio nicht gefunden. Das Android-Projekt wird trotzdem vorbereitet."; fi

schritt "Neueste Version der App herunterladen"
curl -fsSL "$ZIP_URL" -o "$TMP/app.zip"
unzip -q "$TMP/app.zip" -d "$TMP"
SRC="$(find "$TMP" -maxdepth 1 -type d -name 'gym-*' | head -1)"
mkdir -p "$APP/web-src"
rsync -a --delete --exclude store --exclude .git "$SRC/" "$APP/web-src/"
# Projektdateien (überschreibt nur Konfiguration, nicht die nativen Ordner ios/ und android/)
cp "$SRC/store/package.json" "$SRC/store/capacitor.config.json" "$SRC/store/build-www.mjs" "$SRC/store/patch-native.mjs" "$APP/"
mkdir -p "$APP/resources" && cp "$SRC/store/resources/"* "$APP/resources/"
cp "$SRC/store/einrichten.sh" "$APP/"
gruen "Dateien in $APP"

cd "$APP"
schritt "Bausteine installieren (dauert beim ersten Mal 1–3 Minuten)"
npm install --no-audit --no-fund --loglevel=error

schritt "App-Inhalt bauen"
FORMWERK_SRC="$APP/web-src" node build-www.mjs

schritt "iPhone- und Android-Projekt"
if [ "$HAS_XCODE" = 1 ] && [ ! -d ios ]; then npx cap add ios; fi
if [ ! -d android ]; then npx cap add android; fi

schritt "App-Icon und Startbild erzeugen"
npx @capacitor/assets generate --assetPath resources \
  --iconBackgroundColor '#2747E0' --iconBackgroundColorDark '#2747E0' \
  --splashBackgroundColor '#2747E0' --splashBackgroundColorDark '#0E1310' >/dev/null
gruen "Icons und Startbilder erstellt"

schritt "Berechtigungen und Einstellungen"
node patch-native.mjs
npx cap sync

rm -rf "$TMP"
schritt "Fertig"
gruen "Das App-Projekt liegt in: $APP"
if [ "$HAS_XCODE" = 1 ]; then
  echo "Xcode wird jetzt geöffnet. Weiter geht es mit Schritt 4 der Anleitung (Team wählen, Archive, hochladen)."
  npx cap open ios || true
fi
if [ "$HAS_STUDIO" = 1 ]; then echo "Android: Im Terminal 'cd ~/Formwerk-App && npx cap open android' oder in Android Studio den Ordner ~/Formwerk-App/android öffnen."; fi
echo "Nach App-Änderungen einfach diese Zeile nochmal ausführen. Die App wird aktualisiert, deine Xcode-Einstellungen bleiben."
