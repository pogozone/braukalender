# Braukalender

Eine React-Anwendung zur Verwaltung von Terminen und Brauvorgängen mit Ressourcen-Management.

## Funktionen

- **Kalenderansicht**: Google Calendar ähnliche Darstellung von Terminen und Brauvorgängen
- **Terminverwaltung**: Einfache Termine mit Titel, Datum und Beschreibung
- **Brauvorgang-Management**: Komplexe Brauvorgänge mit automatischer Ressourcenprüfung
- **Ressourcen-Management**: Verwaltung von Gärtanks, Kühlschränken und Fässern
- **Verfügbarkeitsprüfung**: Automatische Prüfung von Gärtank- und Fassverfügbarkeit
- **Responsive Design**: Optimiert für Desktop und mobile Geräte

## Technologie-Stack

- React 18.2.0
- Bootstrap 5.3.2
- React Big Calendar (Kalender)
- React Datepicker (Datumsauswahl)
- Node.js v16.20.2

## Projektstruktur

```
src/
├── components/
│   ├── BrauvorgangModal.js    # Modal für neue Brauvorgänge
│   ├── TerminModal.js         # Modal für neue Termine
│   └── RessourcenUebersicht.js # Übersicht der Ressourcen
├── data/
│   └── resources.js           # Initiale Ressourcen und Brauzeiten
├── utils/
│   └── resourceManager.js     # Logik für Ressourcen-Management
├── App.js                     # Hauptanwendung
├── index.js                   # Entry Point
└── index.css                  # Globale Stile
```

## Installation und Start

1. Abhängigkeiten installieren:
```bash
npm install
```

2. Anwendung starten:
```bash
npm start
```

Die Anwendung läuft unter `http://localhost:3000`

## Apache2 Konfiguration

Für den Produktivbetrieb mit Apache2:

1. Build erstellen:
```bash
npm run build
```

2. Apache2 VirtualHost konfigurieren:
```apache
<VirtualHost *:80>
    ServerName braukalender.deine-domain.de
    DocumentRoot /pfad/zum/projekt/build
    
    <Directory /pfad/zum/projekt/build>
        AllowOverride All
        Require all granted
    </Directory>
    
    # React Router Support
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</VirtualHost>
```

## Ressourcen

- **Gärtanks**: 3 Stück (Gärtank 1-3)
- **Fässer**: 20 Stück (Fass 1-20)
- **Kühlschrank**: 1 Stück (Kühlschrank 1)

## Brauvorgänge

- **Obergärig**: 14 Tage (1 Gärtank + 3 Fässer)
- **Untergärig**: 10 Tage (1 Gärtank + 3 Fässer)

Die Anwendung prüft automatisch die Verfügbarkeit der benötigten Ressourcen und gibt entsprechende Hinweise bei Konflikten.
