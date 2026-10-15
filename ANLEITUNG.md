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

## 4. Strava verbinden (einmalig)

1. Am Computer **strava.com/settings/api** öffnen und eine App anlegen:
   - Name: `Formwerk`, Kategorie: `Training`
   - Website: `https://windischwilli-art.github.io/gym/`
   - Authorization Callback Domain: `windischwilli-art.github.io`
2. In Formwerk: Coach → Daten & Verbindungen → **Strava verbinden**, Client-ID und Client-Secret eintragen.
3. **Mit Strava verbinden** tippen und bei Strava „Autorisieren“ wählen.
4. Landest du danach in Safari statt in der App: dort **Code kopieren**, Formwerk öffnen und den Code bei Strava einfügen.
5. Ab jetzt kommen neue Läufe automatisch, sobald du die App öffnest.
   Tipp: In der Garmin-Connect-App Strava verknüpfen, dann landen auch Läufe von der Uhr hier.

## 5. Deine Daten (Cloud-Sync wie in der Spanisch-App)

- Coach → Daten & Verbindungen → **Sync-Code erstellen**. Ab dann wird alles automatisch in der Cloud gespeichert.
- Den Code gut aufschreiben (z. B. in Notizen).
- **Anderes Gerät:** App öffnen, bei der Einrichtung „Schon einen Sync-Code?“ → Code eingeben → Laden.
- Zusätzlich kannst du weiterhin eine Sicherungsdatei in iCloud Drive speichern.
- Gespeichert wird im selben Firebase-Projekt wie die Spanisch-App (Sammlung `syncStates`, Einträge beginnen mit `formwerk_`).

## 6. KI-Foto-Analyse einrichten (optional)

- Coach → Daten & Verbindungen → **KI-Foto-Analyse einrichten**
- **Google Gemini (kostenlos):** aistudio.google.com/apikey → API-Schlüssel erstellen → einfügen
- **Claude (Anthropic):** console.anthropic.com → Guthaben aufladen → API Keys → Schlüssel einfügen
- Danach unter Ernährung auf **Foto** tippen, Teller fotografieren, Werte prüfen, hinzufügen.

## 7. Updates einspielen

Neue `index.html` auf GitHub hochladen (gleiche Datei ersetzen) und in `sw.js` die Zeile
`const VERSION = "formwerk-v11";` hochzählen (v10, v11, …) und in `index.html` die Zahl hinter `guide.js?v=` und `ai.js?v=` erhöhen. Die App holt sich das Update beim nächsten Öffnen.

## Was die App kann

- Kalorien & Nährwerte: über 200 Lebensmittel mit Portionsgrössen, Online-Suche, Live-Barcode-Scanner, KI-Foto-Schätzung
- Kalorienziel passt sich täglich an Training, Sportart und Intensität an
- Lauf-Tracker mit GPS, Pace, Wochenziel, automatischem Strava-Abgleich und Datei-Import (TCX/GPX)
- Geführtes Krafttraining: passendes Aufwärmen, animierte Übungsanleitungen, Satz-für-Satz-Führung mit Pausentimer
- Übungen passend zum eigenen Equipment, mit Alternativen zum Tauschen, eigenen Übungen und anpassbaren Vorlagen
- Aufwärmprogramm vor dem Laufen
- Eigene Trainings frei zusammenstellen, nachtragen und als Vorlage speichern
- Tagesbericht beim ersten Öffnen: Plan für heute, Wochenziel, Ernährung der letzten 7 Tage, Tipps (optional mit KI)
- Kalender mit allen Trainings, Nachtragen pro Tag, Wochenplan in den iPhone-Kalender
- Coach mit persönlichem Plan je nach Ziel und Trainingswahl, Gewichtsverlauf
- Funktioniert offline (außer der Produktsuche beim ersten Scan eines neuen Produkts)


## Quellen

- Übungsfotos: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense, gemeinfrei)
- Produktdaten: [Open Food Facts](https://openfoodfacts.org) (ODbL)
