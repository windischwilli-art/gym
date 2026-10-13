# Formwerk – so kommt die App auf dein iPhone

## 1. Auf GitHub hochladen (einmalig, ca. 5 Minuten)

1. Auf github.com anmelden und oben rechts auf **+ → New repository** klicken.
2. Name: `formwerk`, Sichtbarkeit **Public**, dann **Create repository**.
3. Auf der neuen Seite den Link **uploading an existing file** anklicken.
4. Den **Inhalt** des Ordners `formwerk-app` hineinziehen: `index.html`, `manifest.webmanifest`, `sw.js` und den Ordner `icons`.
   Wichtig: die Dateien selbst, nicht den Ordner `formwerk-app` drumherum.
5. Unten auf **Commit changes** klicken.
6. Oben auf **Settings → Pages**. Bei *Source* „Deploy from a branch“ wählen, Branch **main**, Ordner **/ (root)**, **Save**.
7. Nach 1–2 Minuten steht dort deine Adresse, z. B. `https://DEIN-NAME.github.io/formwerk/`.

## 2. Auf dem iPhone installieren

1. Die Adresse in **Safari** öffnen (nicht Chrome).
2. Unten auf **Teilen** (Quadrat mit Pfeil) → **Zum Home-Bildschirm** → **Hinzufügen**.
3. Formwerk liegt jetzt wie eine normale App auf dem Homescreen und startet im Vollbild.
4. Beim ersten Start einmal mit Internet öffnen, damit der Scanner für offline gespeichert wird.

## 3. Erlaubnisse

- **Kamera** (Barcode-Scanner): beim ersten Scan „Erlauben“ tippen.
- **Standort** (GPS beim Laufen): beim ersten Lauf „Erlauben“ tippen.
  Falls abgelehnt: Einstellungen → Datenschutz & Sicherheit → Ortungsdienste → Safari-Websites → „Beim Verwenden“.

## 4. Deine Daten

- Alles bleibt auf deinem iPhone, es gibt keinen Server.
- **Sichern:** Coach → Daten & Verbindungen → **Sichern** → in iCloud Drive speichern.
- **Neues iPhone:** App installieren, bei der Einrichtung auf „Wiederherstellen“ tippen und die Sicherung wählen.
- Wichtig: Löschst du die App vom Homescreen, sind die Daten weg. Vorher sichern.

## 5. Updates einspielen

Neue `index.html` auf GitHub hochladen (gleiche Datei ersetzen) und in `sw.js` die Zeile
`const VERSION = "formwerk-v1";` hochzählen (v2, v3, …). Die App holt sich das Update beim nächsten Öffnen.

## Was die App kann

- Kalorien & Nährwerte mit Live-Barcode-Scanner (Produktdaten von Open Food Facts)
- Lauf-Tracker mit GPS, Pace, Wochenziel und Import von Garmin (TCX/GPX) und Strava (GPX)
- Krafttraining mit Vorlagen, Sätzen, Pausentimer und Bestleistungen
- Coach mit persönlichem Plan je nach Ziel und Trainingswahl, Gewichtsverlauf
- Funktioniert offline (außer der Produktsuche beim ersten Scan eines neuen Produkts)
