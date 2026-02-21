#!/bin/bash

# MySQL Setup Script für Braukalender
# Erstellt Datenbank und Tabellen für die Braukalender-Anwendung

set -e

# Farben für Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Standard-Konfiguration
DB_NAME="braukalender"
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD=""
MYSQL_ROOT_PASSWORD=""

# Hilfsfunktionen
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Überprüfen, ob MySQL installiert ist
check_mysql() {
    print_status "Überprüfe MySQL Installation..."
    
    if command -v mysql &> /dev/null; then
        print_success "MySQL ist installiert"
        mysql --version
    else
        print_error "MySQL ist nicht installiert"
        echo ""
        echo "Installation für Ubuntu/Debian:"
        echo "sudo apt update"
        echo "sudo apt install -y mysql-server mysql-client"
        echo ""
        echo "Nach der Installation:"
        echo "sudo mysql_secure_installation"
        exit 1
    fi
}

# MySQL starten/starten
start_mysql() {
    print_status "Starte MySQL Service..."
    
    if systemctl is-active --quiet mysql; then
        print_success "MySQL läuft bereits"
    else
        sudo systemctl start mysql
        sleep 3
        
        if systemctl is-active --quiet mysql; then
            print_success "MySQL wurde erfolgreich gestartet"
        else
            print_error "MySQL konnte nicht gestartet werden"
            exit 1
        fi
    fi
    
    # MySQL beim Boot aktivieren
    sudo systemctl enable mysql
    print_success "MySQL wird beim Systemstart automatisch gestartet"
}

# Passwort abfragen
ask_password() {
    if [ -z "$DB_PASSWORD" ]; then
        echo -n "MySQL Root-Passwort: "
        read -s DB_PASSWORD
        echo ""
    fi
}

# Datenbank und Tabellen erstellen
setup_database() {
    print_status "Erstelle Datenbank und Tabellen..."
    
    # SQL-Datei für MySQL Setup
    cat > /tmp/setup_braukalender.sql << 'EOF'
-- Braukalender MySQL Setup

-- Datenbank erstellen (falls nicht vorhanden)
CREATE DATABASE IF NOT EXISTS braukalender CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE braukalender;

-- Termine Tabelle
CREATE TABLE IF NOT EXISTS termine (
    id VARCHAR(255) PRIMARY KEY,
    titel VARCHAR(255) NOT NULL,
    beschreibung TEXT,
    startDatum DATETIME NOT NULL,
    endDatum DATETIME,
    typ VARCHAR(50) DEFAULT 'termin',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_startDatum (startDatum),
    INDEX idx_endDatum (endDatum),
    INDEX idx_typ (typ)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Brauvorgänge Tabelle
CREATE TABLE IF NOT EXISTS brauvorgaenge (
    id VARCHAR(255) PRIMARY KEY,
    titel VARCHAR(255) NOT NULL,
    beschreibung TEXT,
    startDatum DATETIME NOT NULL,
    brauart VARCHAR(50) NOT NULL,
    gaertankId INT,
    gaertankName VARCHAR(255),
    belegteFaesser JSON,
    faesserNamen JSON,
    typ VARCHAR(50) DEFAULT 'brauvorgang',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_startDatum (startDatum),
    INDEX idx_brauart (brauart),
    INDEX idx_gaertankId (gaertankId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Resources Tabelle
CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Beispieldaten einfügen (falls Tabellen leer)
INSERT IGNORE INTO termine (id, titel, beschreibung, startDatum, endDatum, typ) VALUES
('beispiel-termin-1', 'Brau-Workshop', 'Einführung in das Brauen von Bier', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'termin');

INSERT IGNORE INTO brauvorgaenge (id, titel, beschreibung, startDatum, brauart, gaertankId, gaertankName, belegteFaesser, faesserNamen, typ) VALUES
('beispiel-brauvorgang-1', 'Sommerbier 2024', 'Helles Bier für den Sommer', NOW(), 'obergärig', 1, 'Gärtank 1', '[1,2,3]', '["Fass 1","Fass 2","Fass 3"]', 'brauvorgang');

INSERT IGNORE INTO resources (data) VALUES
('{"kuehlschraenke":[{"id":1,"name":"Kühlschrank 1","kapazität":1000,"status":"verfügbar"},{"id":2,"name":"Kühlschrank 2","kapazität":800,"status":"verfügbar"}],"gaertanks":[{"id":1,"name":"Gärtank 1","kapazität":500,"status":"verfügbar"},{"id":2,"name":"Gärtank 2","kapazität":300,"status":"verfügbar"},{"id":3,"name":"Gärtank 3","kapazität":200,"status":"verfügbar"}],"faesser":[{"id":1,"name":"Fass 1","kapazität":50,"status":"verfügbar"},{"id":2,"name":"Fass 2","kapazität":50,"status":"verfügbar"},{"id":3,"name":"Fass 3","kapazität":50,"status":"verfügbar"},{"id":4,"name":"Fass 4","kapazität":50,"status":"verfügbar"},{"id":5,"name":"Fass 5","kapazität":50,"status":"verfügbar"},{"id":6,"name":"Fass 6","kapazität":50,"status":"verfügbar"},{"id":7,"name":"Fass 7","kapazität":50,"status":"verfügbar"},{"id":8,"name":"Fass 8","kapazität":50,"status":"verfügbar"},{"id":9,"name":"Fass 9","kapazität":50,"status":"verfügbar"},{"id":10,"name":"Fass 10","kapazität":50,"status":"verfügbar"},{"id":11,"name":"Fass 11","kapazität":50,"status":"verfügbar"},{"id":12,"name":"Fass 12","kapazität":50,"status":"verfügbar"},{"id":13,"name":"Fass 13","kapazität":50,"status":"verfügbar"},{"id":14,"name":"Fass 14","kapazität":50,"status":"verfügbar"},{"id":15,"name":"Fass 15","kapazität":50,"status":"verfügbar"},{"id":16,"name":"Fass 16","kapazität":50,"status":"verfügbar"},{"id":17,"name":"Fass 17","kapazität":50,"status":"verfügbar"},{"id":18,"name":"Fass 18","kapazität":50,"status":"verfügbar"},{"id":19,"name":"Fass 19","kapazität":50,"status":"verfügbar"},{"id":20,"name":"Fass 20","kapazität":50,"status":"verfügbar"}]}');

-- Statistik anzeigen
SELECT '=== Datenbank Statistik ===' as info;
SELECT CONCAT('Termine: ', COUNT(*)) as info FROM termine;
SELECT CONCAT('Brauvorgänge: ', COUNT(*)) as info FROM brauvorgaenge;
SELECT CONCAT('Resources: ', COUNT(*)) as info FROM resources;
SELECT '========================' as info;
EOF

    # Setup ausführen
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" < /tmp/setup_braukalender.sql
    
    if [ $? -eq 0 ]; then
        print_success "Datenbank Setup erfolgreich abgeschlossen"
    else
        print_error "Datenbank Setup fehlgeschlagen"
        exit 1
    fi
    
    # Temporäre Datei löschen
    rm -f /tmp/setup_braukalender.sql
}

# Verbindung testen
test_connection() {
    print_status "Teste Datenbankverbindung..."
    
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; then
        print_success "Verbindung zur MySQL erfolgreich"
    else
        print_error "Keine Verbindung zur MySQL möglich"
        print_status "Überprüfen Sie die Zugangsdaten und ob MySQL läuft"
        exit 1
    fi
}

# Konfiguration anzeigen
show_config() {
    print_status "Verwendete Konfiguration:"
    echo "Datenbank: $DB_NAME"
    echo "Host: $DB_HOST"
    echo "Port: $DB_PORT"
    echo "Benutzer: $DB_USER"
    echo ""
}

# Hauptfunktion
main() {
    echo "========================================"
    echo "   Braukalender MySQL Setup Script"
    echo "========================================"
    echo ""
    
    show_config
    check_mysql
    start_mysql
    ask_password
    test_connection
    setup_database
    
    echo ""
    print_success "MySQL Setup für Braukalender abgeschlossen!"
    echo ""
    echo "Nächste Schritte:"
    echo "1. React App starten: npm start"
    echo "2. Storage-Typ konfigurieren:"
    echo "   REACT_APP_STORAGE_TYPE=mysql"
    echo "   REACT_APP_MYSQL_HOST=$DB_HOST"
    echo "   REACT_APP_MYSQL_PORT=$DB_PORT"
    echo "   REACT_APP_MYSQL_USER=$DB_USER"
    echo "   REACT_APP_MYSQL_PASSWORD=IHR_PASSWORT"
    echo "   REACT_APP_MYSQL_DATABASE=$DB_NAME"
    echo "3. Browser öffnen: http://localhost:3000"
    echo ""
    echo "Datenbank-Verbindungsdetails:"
    echo "mysql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
}

# Script ausführen
main "$@"
