# Persönliche Homepage & Dashboard

Selbst gehostete, vollständig konfigurierbare persönliche Website – Portfolio und persönliches Dashboard in einem.
Alles (Inhalte, Design, Layout, Widgets) wird über die Oberfläche eingestellt; im Quellcode stehen keine persönlichen Inhalte.

- **20 Widgets**: Profil, Begrüßung, Über mich, Lebenslauf, Fähigkeiten, Projekte, Social Media, Links & Lesezeichen, Suche, Uhr, Wetter, Kalender, Notizen, To-dos, RSS, Galerie, Zitate, Countdown, Kontaktformular, eigene Widgets (Markdown, Einbettung, Bild, Kennzahl)
- **Live-Editor**: Drag-and-drop, Größe per Ziehen, Duplizieren, Ein-/Ausblenden, Undo/Redo, Autosave
- **Konfigurationscenter** (Zahnrad): Allgemein, Erscheinung, Layout, Widgets, Schnellzugriffe, Daten
- **13 Design-Vorlagen** (inkl. „Architectural Grid“ im Schweizer Raster-Stil und „Tactile Dark“ mit Papier-Objekten), Light/Dark/AMOLED/System, Glassmorphism, animierte Hintergründe, eigenes CSS
- **6 Layout-Vorlagen**: Dashboard, Seitenleiste, Portfolio, Bento, Editorial (großer Schriftzug, nummerierte Abschnitte, Rasterlinien, Scroll-Effekte: Parallaxe, Wort-für-Wort-Einfärben, Wortfeld, fixierte Bildsequenz, Manifest, Bild-Aufdecken), Bühne (ein Objekt pro Bereich: Postkarte, Ausweis, Telemetrie, Buch, Projekt-Rad, Briefpapier; Papier-Übergang, Wechsel per Mausrad, Wischen oder Pfeiltasten) – plus eigene Mobil-Reihenfolge
- **Admin-Bereich**: Benutzer & Rollen, Medien, Nachrichten, Statistiken, Wartungsmodus, Backups, Besuchervorschau
- **Öffentlich vs. privat** pro Widget – private Widgets werden serverseitig herausgefiltert und nie ausgeliefert
- Deutsch & Englisch, Befehlspalette (`Strg + K`), Tastaturkürzel, PWA mit Offline-Cache
- Keine verpflichtenden externen Dienste

---

## Schnellstart mit Docker

```bash
git clone <dein-repo> homepage && cd homepage
cp .env.example .env   # optional
docker compose up -d
```

Dann `http://localhost:3000/setup` öffnen und das Eigentümerkonto anlegen. Fertig.

> Tipp für Server im Internet: Setze vor dem ersten Start `SETUP_TOKEN` in der `.env`, damit niemand anderes die Einrichtung vornehmen kann – oder lege das Konto direkt mit `ADMIN_USERNAME`/`ADMIN_PASSWORD` an.

Alle Daten (SQLite-Datenbank und Uploads) liegen im Volume `homepage-data` (`/data` im Container).

### Hinter einem Reverse Proxy (HTTPS)

Den Port 3000 z. B. per Caddy, Traefik oder nginx veröffentlichen. Der Proxy muss `X-Forwarded-Proto` setzen – dann werden Cookies automatisch als `Secure` markiert (erzwingen mit `COOKIE_SECURE=true`). Beispiel Caddy:

```
homepage.example.com {
  reverse_proxy localhost:3000
}
```

## Deployment auf Vercel

Vercel hat kein dauerhaftes Dateisystem. Die Anwendung nutzt deshalb **libSQL** – denselben SQLite-Dialekt, wahlweise als lokale Datei (Docker) oder als gehostete Datenbank (Vercel). Es gibt nur einen Code-Pfad.

1. Kostenlose libSQL-Datenbank anlegen, z. B. bei [Turso](https://turso.tech): `turso db create homepage` und `turso db tokens create homepage`
2. Repository in Vercel importieren (Framework wird automatisch erkannt)
3. Umgebungsvariablen setzen:
   - `DATABASE_URL` = `libsql://<deine-db>.turso.io`
   - `DATABASE_AUTH_TOKEN` = Token aus Schritt 1
   - empfohlen: `SETUP_TOKEN`, `STATS_SALT`
4. Deployen und `/setup` aufrufen

Unterschiede auf Vercel: Uploads werden in der Datenbank gespeichert (Limit pro Upload ca. 4,5 MB durch Vercel), die Tabellen werden beim ersten Aufruf automatisch angelegt.

## Lokale Entwicklung

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # Produktions-Build (standalone)
npm start              # startet .next/standalone/server.js*
npm run typecheck
BASE_URL=http://localhost:3000 npm test   # Smoke-Test gegen eine laufende Instanz
```

\* Für `npm start` außerhalb von Docker vorher `cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/` ausführen (genau das macht das Dockerfile) – oder `npm run start:next` verwenden.

Daten landen lokal in `./data` (änderbar über `DATA_DIR`).

---

## Update

**Docker**

```bash
git pull
docker compose build --pull
docker compose up -d
```

Die Datenbank wird beim Start automatisch migriert; das Volume bleibt erhalten. Vorher ein Backup anzulegen schadet nie (siehe unten).

**Vercel**: `git push` – Vercel baut automatisch neu.

## Backup & Wiederherstellung

Es gibt drei Ebenen:

| Was | Wie | Enthält |
| --- | --- | --- |
| Konfigurations-Export | Zahnrad → Daten → „Als JSON exportieren" | Aktive Konfiguration (Design, Layout, Widgets, Inhalte) |
| Server-Backup | Admin → System & Backups → „Backup erstellen" (herunterladbar) | Alle Profile, Notizen/To-dos, Systemeinstellungen |
| Vollständiges Volume-Backup | siehe unten | Alles inkl. Benutzerkonten und Medien |

Beim Wiederherstellen eines Backups wird automatisch vorher ein Sicherungs-Backup erstellt.

**Vollständiges Backup (Docker)**

```bash
docker compose stop
docker run --rm -v homepage_homepage-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/homepage-$(date +%F).tar.gz -C /data .
docker compose start
```

**Wiederherstellen**

```bash
docker compose down
docker run --rm -v homepage_homepage-data:/data -v "$PWD":/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/homepage-YYYY-MM-DD.tar.gz -C /data"
docker compose up -d
```

(Der Volume-Name setzt sich aus Projektordner und `homepage-data` zusammen – mit `docker volume ls` prüfen.)

---

## Bedienung

| Aktion | Wie |
| --- | --- |
| Anmelden | Footer-Link oder `/login` |
| Bearbeitungsmodus | Stift-Symbol im Header oder Taste `E` |
| Konfigurationscenter | Zahnrad oder Taste `,` |
| Widget verschieben | Im Bearbeitungsmodus am Griff ziehen (auch per Tastatur) |
| Widget-Größe | Ecke unten rechts ziehen oder −/+ in der Widget-Leiste |
| Rückgängig / Wiederholen | `Strg + Z` / `Strg + Umschalt + Z` |
| Befehlspalette | `Strg + K` – Aktionen, Bereiche, Lesezeichen, Websuche |
| Suche fokussieren | `/` |
| Vollbild / Farbschema | `F` / `T` |
| Alle Kürzel | `?` |
| Besuchervorschau | Avatar-Menü → „Vorschau als Besucher" oder Admin → Design & Vorschau |

**Konfigurationsprofile**: Unter Daten können mehrere komplette Konfigurationen angelegt werden (z. B. „Bewerbung" und „Privat"). Besucher sehen immer das aktive Profil.

**Rollen**: Eigentümer und Admins haben vollen Zugriff. Redakteure dürfen Inhalte, Design und Medien bearbeiten, aber keine Benutzer, Backups oder Systemeinstellungen ändern.

---

## Architektur

```
src/
├── app/                      Next.js App Router
│   ├── page.tsx              Startseite (Server Component, lädt & filtert Konfiguration)
│   ├── layout.tsx            Theme-Boot-Script (kein Aufflackern), SSR-Theme
│   ├── admin/[[...section]]  Administrationsbereich
│   ├── login/, setup/        Anmeldung & Ersteinrichtung
│   ├── api/                  REST-Endpunkte (Auth, Config, Profile, Backups, Medien, Widget-Daten, …)
│   ├── media/[file]          Auslieferung hochgeladener Dateien (Range-Requests für Video)
│   └── manifest.ts, robots.ts, sitemap.ts
├── proxy.ts                  Security-Header + CSP-Nonce pro Request
├── lib/
│   ├── config/               Schema (zod), Standardwerte, Presets, Normalisierung/Migration
│   ├── server/               Datenbank, Auth, CSRF, Rate-Limit, Repositories (nur Server)
│   ├── theme.ts              Theme-Engine: Konfiguration → CSS-Variablen (inkl. Kontrastschutz)
│   ├── i18n/                 Deutsch & Englisch
│   └── markdown.ts           Sicherer Markdown-Renderer (escape-first)
├── store/                    Zustand: config-store (pro Request!), ui-store (LocalStorage)
├── widgets/                  Widget-Registry + 20 Widget-Komponenten (lazy geladen)
├── components/
│   ├── ui/                   UI-Bausteine im shadcn/ui-Stil
│   ├── shell/                Header, Footer, Hintergrund, Autosave, Tastatur, Theme
│   ├── grid/                 Widget-Raster mit dnd-kit (Drag & Drop, Resize)
│   ├── settings/             Konfigurationscenter, generischer Formular-Renderer, Mediathek
│   ├── command/              Befehlspalette
│   └── admin/                Admin-Seiten
public/sw.js                  Service Worker (Offline-Cache)
scripts/smoke.mjs             Smoke-Test
```

**Datenfluss**: Die gesamte Seite wird aus einem einzigen, mit zod validierten Konfigurationsobjekt erzeugt. Der Server lädt das aktive Profil aus SQLite; Besucher bekommen eine gefilterte Fassung (`toPublicConfig`: ohne private, deaktivierte oder leere Widgets). Der Eigentümer bearbeitet die Konfiguration im Client-Store, jede Änderung ist sofort sichtbar und wird nach 800 ms gespeichert. Offline bleiben Entwürfe in LocalStorage und werden nachgereicht.

### Technische Entscheidungen

- **libSQL statt better-sqlite3** – identisches SQLite, aber zusätzlich als gehostete DB nutzbar. Damit laufen Docker und Vercel aus einer Codebasis.
- **Ein Store pro Request** – der Konfigurations-Store wird per React-Context erzeugt, nicht als Modul-Singleton. So kann die (private) Eigentümer-Konfiguration beim Server-Rendering nie zwischen Anfragen geteilt werden.
- **UI-Komponenten im shadcn/ui-Stil** ohne Radix-Abhängigkeiten (Dialoge mit Fokusfalle, Switch, Segmented Control …) – weniger Abhängigkeiten, volle Kontrolle.
- **Theme über CSS-Variablen** – serverseitig gerendert und live aktualisiert. Primär-/Akzentfarben werden automatisch auf ausreichenden Kontrast zum Hintergrund korrigiert.
- **Selbst gehostete Schriften** (Fontsource) – keine Anfragen an Google Fonts.
- **Widget-Formulare aus Metadaten** – Einstellungen werden aus `fields` generiert; neue Widgets brauchen keinen eigenen Editor.
- **Medien in Datei (Docker) oder DB (Vercel)**, Dateityp per Magic Bytes geprüft, SVG aus Sicherheitsgründen abgelehnt.

## Eigenes Widget entwickeln

1. Metadaten in `src/widgets/definitions.ts` ergänzen:

```ts
{
  type: "github-stats",
  name: l("GitHub-Statistik", "GitHub stats"),
  description: l("Zeigt Repos und Sterne", "Shows repos and stars"),
  icon: "Code2",                      // Name aus src/components/icon.tsx
  category: "custom",
  defaultSize: { w: 1, h: 1 },
  defaultVisibility: "public",
  defaultSettings: { user: "" },
  fields: [{ key: "user", type: "text", label: l("Benutzer", "User") }],
  isEmpty: (s) => !s.user,           // leere Widgets bleiben für Besucher unsichtbar
}
```

2. Komponente `src/widgets/github-stats.tsx` anlegen (`export default function (props: WidgetProps<…>)`).
3. In `src/widgets/components.tsx` registrieren: `"github-stats": d(() => import("./github-stats"))`.

Das Einstellungsformular, Drag & Drop, Sichtbarkeit, Größe und Mobil-Optionen funktionieren automatisch. Braucht das Widget externe Daten, eine API-Route anlegen, die die Parameter aus der **gespeicherten** Konfiguration liest (`resolveWidget` in `src/lib/server/widget-access.ts`) – nie aus der Anfrage. API-Schlüssel gehören in Umgebungsvariablen, nie in die Konfiguration.

Verfügbare Feldtypen: `text`, `textarea`, `markdown`, `url`, `image`, `video`, `file`, `color`, `date`, `datetime`, `timezone`, `icon`, `number`, `range`, `toggle`, `select`, `tags`, `list` (verschachtelbar). Mit `when` lassen sich Felder bedingt einblenden.

---

## Sicherheit & Datenschutz

- Passwörter mit **scrypt** (N=32768) gehasht, Sessions als zufällige Tokens (nur SHA-256 in der DB), Cookies `HttpOnly` + `SameSite=Lax` (+ `Secure` hinter HTTPS)
- **CSRF**: Same-Origin-Prüfung (Origin / Sec-Fetch-Site) und Synchronizer-Token pro Session für alle schreibenden Anfragen
- **XSS**: strikte CSP mit Nonce, Markdown wird zuerst vollständig escaped, Links nur `http(s)`/`mailto`/`tel`/relativ, eigenes CSS kann nicht aus dem `<style>`-Tag ausbrechen, Uploads mit `nosniff` + Sandbox-CSP
- **Autorisierung serverseitig**: private Widgets und ihre Daten sind für Besucher nicht abrufbar (404), Rollenprüfung in jedem Endpunkt
- **Rate-Limits** für Login, Setup und Kontaktformular (in der DB, funktioniert auch serverless); Honeypot + Zeitprüfung gegen Spam-Bots
- **SSRF-Schutz** für RSS/Wetter: Ziele kommen nur aus der gespeicherten Konfiguration, private Netze werden blockiert (Freigabe per `ALLOW_PRIVATE_FETCH=true`), Redirects werden einzeln geprüft
- Validierung aller Eingaben mit zod
- **Statistik** (standardmäßig aus): keine Cookies, keine IP-Speicherung, Besucher-Hash rotiert täglich, Do-Not-Track/GPC werden respektiert, eigene Besuche zählen nicht
- **Externe Dienste** nur, wenn du sie aktivierst: Wetter (Open-Meteo, ohne Schlüssel, serverseitig abgerufen), RSS, optionale Favicons von verlinkten Seiten, Einbettungen

## Umgebungsvariablen

Siehe [`.env.example`](.env.example). Keine ist zwingend nötig.

## Lizenz

Dein Projekt – wähle selbst eine Lizenz. Die Marken-Icons stammen aus [Simple Icons](https://simpleicons.org) (CC0).

## Standardkonfiguration

[`config/default-config.json`](config/default-config.json) enthält die Werkseinstellungen als importierbare Datei (Zahnrad → Daten → „JSON importieren"). Maßgeblich ist der Code in `src/lib/config/defaults.ts`; die Datei dient als Referenz und Vorlage für eigene Konfigurationen.
