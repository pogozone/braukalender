# Braukalender Setup Anleitung

## Schnellstart

### 1. Konfiguration auswählen

Kopieren Sie die gewünschte Konfigurationsdatei als `.env`:

```bash
# Für File Storage (Default)
cp config/file.env .env

# Für MongoDB
cp config/mongodb.env .env

# Für MySQL
cp config/mysql.env .env
```

### 2. Datenbank einrichten (falls gewählt)

#### MongoDB
```bash
# Setup-Script ausführen
./bin/setup-mongodb.sh

# Oder manuell:
sudo systemctl start mongod
mongo braukalender
```

#### MySQL
```bash
# Setup-Script ausführen
./bin/setup-mysql.sh

# Passwort in .env anpassen!
nano .env
```

### 3. Abhängigkeiten installieren

```bash
# Für MongoDB
npm install mongodb

# Für MySQL
npm install mysql2

# Für alle Varianten
npm install
```

### 4. Anwendung starten

```bash
# Entwicklung
npm start

# Produktion
npm run build
npm run server
```

## Konfigurationsdateien

### File Storage (`config/file.env`)
- ✅ Einfachste Konfiguration
- ✅ Keine zusätzliche Software
- ✅ Gut für Entwicklung
- ❌ Nicht für große Datenmengen

### MongoDB (`config/mongodb.env`)
- ✅ Skalierbar
- ✅ Gute Performance
- ✅ Flexible Datenstruktur
- ❌ Benötigt MongoDB Installation

### MySQL (`config/mongodb.env`)
- ✅ Strukturierte Daten
- ✅ Transaktionen
- ✅ Bewährt in Produktion
- ❌ Feste Tabellenstruktur

## Environment Variablen

| Variable | Beschreibung | Default |
|----------|-------------|---------|
| `REACT_APP_STORAGE_TYPE` | Storage-Typ (file/mongodb/mysql) | file |
| `REACT_APP_MONGODB_URL` | MongoDB Connection String | mongodb://localhost:27017/braukalender |
| `REACT_APP_MYSQL_HOST` | MySQL Host | localhost |
| `REACT_APP_MYSQL_PORT` | MySQL Port | 3306 |
| `REACT_APP_MYSQL_USER` | MySQL Benutzer | root |
| `REACT_APP_MYSQL_PASSWORD` | MySQL Passwort | - |
| `REACT_APP_MYSQL_DATABASE` | MySQL Datenbank | braukalender |

## Troubleshooting

### MongoDB Probleme
```bash
# MongoDB Status prüfen
sudo systemctl status mongod

# MongoDB starten
sudo systemctl start mongod

# Logs ansehen
sudo journalctl -u mongod -f
```

### MySQL Probleme
```bash
# MySQL Status prüfen
sudo systemctl status mysql

# MySQL starten
sudo systemctl start mysql

# Logs ansehen
sudo journalctl -u mysql -f

# Verbindung testen
mysql -u root -p -e "SHOW DATABASES;"
```

### Storage-Typ wechseln
```bash
# Alte .env sichern
mv .env .env.backup

# Neue Konfiguration kopieren
cp config/mongodb.env .env

# App neu starten
npm start
```

## Datenmigration

### File → MongoDB
```bash
# 1. Aktuelle Daten exportieren
cp termine.json backup.json

# 2. MongoDB einrichten
./bin/setup-mongodb.sh

# 3. Migrationsscript (manuell erforderlich)
# TODO: Migrationsscript erstellen
```

### File → MySQL
```bash
# 1. Aktuelle Daten sichern
cp termine.json backup.json

# 2. MySQL einrichten
./bin/setup-mysql.sh

# 3. Migrationsscript (manuell erforderlich)
# TODO: Migrationsscript erstellen
```
