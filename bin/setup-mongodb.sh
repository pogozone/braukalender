#!/bin/bash

# MongoDB Setup Script für Braukalender
# Erstellt Datenbank und Kollektionen für die Braukalender-Anwendung

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
DB_PORT="27017"
MONGO_USER=""
MONGO_PASSWORD=""

# Hilfsfunktion für farbige Ausgabe
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

# Überprüfen, ob MongoDB installiert ist
check_mongodb() {
    print_status "Überprüfe MongoDB Installation..."
    
    if command -v mongod &> /dev/null; then
        print_success "MongoDB ist installiert"
        mongod --version
    else
        print_error "MongoDB ist nicht installiert"
        echo ""
        echo "Installation für Ubuntu/Debian:"
        echo "sudo apt update"
        echo "sudo apt install -y mongodb"
        echo ""
        echo "Oder für MongoDB Community Edition:"
        echo "wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -"
        echo "echo \"deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse\" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list"
        echo "sudo apt update"
        echo "sudo apt install -y mongodb-org"
        exit 1
    fi
}

# MongoDB starten/starten
start_mongodb() {
    print_status "Starte MongoDB Service..."
    
    if systemctl is-active --quiet mongod; then
        print_success "MongoDB läuft bereits"
    else
        sudo systemctl start mongod
        sleep 3
        
        if systemctl is-active --quiet mongod; then
            print_success "MongoDB wurde erfolgreich gestartet"
        else
            print_error "MongoDB konnte nicht gestartet werden"
            exit 1
        fi
    fi
    
    # MongoDB beim Boot aktivieren
    sudo systemctl enable mongod
    print_success "MongoDB wird beim Systemstart automatisch gestartet"
}

# Datenbank und Kollektionen erstellen
setup_database() {
    print_status "Erstelle Datenbank und Kollektionen..."
    
    # JavaScript-Datei für MongoDB Setup
    cat > /tmp/setup_braukalender.js << 'EOF'
// Braukalender MongoDB Setup
db = db.getSiblingDB('braukalender');

// Indexe für bessere Performance erstellen
db.termine.createIndex({ "startDatum": 1 });
db.termine.createIndex({ "endDatum": 1 });
db.termine.createIndex({ "typ": 1 });

db.brauvorgaenge.createIndex({ "startDatum": 1 });
db.brauvorgaenge.createIndex({ "brauart": 1 });
db.brauvorgaenge.createIndex({ "gaertankId": 1 });

db.resources.createIndex({ "id": 1 }, { unique: true });

// Beispieldaten einfügen (falls Kollektionen leer)
if (db.termine.countDocuments() === 0) {
    print("Füge Beispieldaten ein...");
    
    // Beispiel-Termin
    db.termine.insertOne({
        id: "beispiel-termin-1",
        titel: "Brau-Workshop",
        beschreibung: "Einführung in das Brauen von Bier",
        startDatum: new Date(),
        endDatum: new Date(Date.now() + 2 * 60 * 60 * 1000), // +2 Stunden
        typ: "termin",
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    // Beispiel-Brauvorgang
    db.brauvorgaenge.insertOne({
        id: "beispiel-brauvorgang-1",
        titel: "Sommerbier 2024",
        beschreibung: "Helles Bier für den Sommer",
        startDatum: new Date(),
        brauart: "obergärig",
        gaertankId: 1,
        gaertankName: "Gärtank 1",
        belegteFaesser: [1, 2, 3],
        faesserNamen: ["Fass 1", "Fass 2", "Fass 3"],
        typ: "brauvorgang",
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    // Beispiel-Resources
    db.resources.insertOne({
        kuehlschraenke: [
            { id: 1, name: "Kühlschrank 1", kapazität: 1000, status: "verfügbar" },
            { id: 2, name: "Kühlschrank 2", kapazität: 800, status: "verfügbar" }
        ],
        gaertanks: [
            { id: 1, name: "Gärtank 1", kapazität: 500, status: "verfügbar" },
            { id: 2, name: "Gärtank 2", kapazität: 300, status: "verfügbar" },
            { id: 3, name: "Gärtank 3", kapazität: 200, status: "verfügbar" }
        ],
        faesser: Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            name: `Fass ${i + 1}`,
            kapazität: 50,
            status: "verfügbar"
        })),
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    print("Beispieldaten wurden eingefügt");
} else {
    print("Datenbank enthält bereits Daten");
}

// Statistik anzeigen
print("=== Datenbank Statistik ===");
print("Termine: " + db.termine.countDocuments());
print("Brauvorgänge: " + db.brauvorgaenge.countDocuments());
print("Resources: " + db.resources.countDocuments());
print("========================");
EOF

    # Setup ausführen
    mongo "$DB_NAME" /tmp/setup_braukalender.js
    
    if [ $? -eq 0 ]; then
        print_success "Datenbank Setup erfolgreich abgeschlossen"
    else
        print_error "Datenbank Setup fehlgeschlagen"
        exit 1
    fi
    
    # Temporäre Datei löschen
    rm -f /tmp/setup_braukalender.js
}

# Verbindung testen
test_connection() {
    print_status "Teste Datenbankverbindung..."
    
    if mongo --eval "db.adminCommand('ismaster')" >/dev/null 2>&1; then
        print_success "Verbindung zur MongoDB erfolgreich"
    else
        print_error "Keine Verbindung zur MongoDB möglich"
        print_status "Überprüfen Sie, ob MongoDB läuft und die Firewall-Einstellungen korrekt sind"
        exit 1
    fi
}

# Konfiguration anzeigen
show_config() {
    print_status "Verwendete Konfiguration:"
    echo "Datenbank: $DB_NAME"
    echo "Host: $DB_HOST"
    echo "Port: $DB_PORT"
    echo ""
}

# Hauptfunktion
main() {
    echo "========================================"
    echo "  Braukalender MongoDB Setup Script"
    echo "========================================"
    echo ""
    
    show_config
    check_mongodb
    start_mongodb
    test_connection
    setup_database
    
    echo ""
    print_success "MongoDB Setup für Braukalender abgeschlossen!"
    echo ""
    echo "Nächste Schritte:"
    echo "1. React App starten: npm start"
    echo "2. Storage-Typ konfigurieren: REACT_APP_STORAGE_TYPE=mongodb"
    echo "3. Browser öffnen: http://localhost:3000"
    echo ""
    echo "Datenbank-Verbindungsdetails:"
    echo "mongodb://$DB_HOST:$DB_PORT/$DB_NAME"
}

# Script ausführen
main "$@"
