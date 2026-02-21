#!/bin/bash

# Braukalender Setup Script
# Automatisches Setup für verschiedene Storage-Typen

set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Storage-Typ auswählen
choose_storage() {
    echo ""
    echo "========================================"
    echo "  Braukalender Setup - Storage wählen"
    echo "========================================"
    echo ""
    echo "Wählen Sie den Storage-Typ:"
    echo "1) File Storage (JSON-Datei) - Empfohlen für Entwicklung"
    echo "2) MongoDB - Empfohlen für Produktion"
    echo "3) MySQL - Empfohlen für relationale Daten"
    echo ""
    echo -n "Ihre Wahl (1-3): "
    read choice
    
    case $choice in
        1)
            STORAGE_TYPE="file"
            print_success "File Storage gewählt"
            ;;
        2)
            STORAGE_TYPE="mongodb"
            print_success "MongoDB gewählt"
            ;;
        3)
            STORAGE_TYPE="mysql"
            print_success "MySQL gewählt"
            ;;
        *)
            print_error "Ungültige Wahl"
            exit 1
            ;;
    esac
}

# Konfiguration kopieren
setup_config() {
    print_status "Kopiere Konfiguration..."
    
    case $STORAGE_TYPE in
        "file")
            cp config/file.env .env
            print_success "File Storage Konfiguration kopiert"
            ;;
        "mongodb")
            cp config/mongodb.env .env
            print_success "MongoDB Konfiguration kopiert"
            ;;
        "mysql")
            cp config/mysql.env .env
            print_success "MySQL Konfiguration kopiert"
            print_warning "Passen Sie das MySQL Passwort in .env an!"
            ;;
    esac
}

# Abhängigkeiten installieren
install_dependencies() {
    print_status "Installiere Abhängigkeiten..."
    
    npm install
    
    case $STORAGE_TYPE in
        "mongodb")
            if ! npm list mongodb >/dev/null 2>&1; then
                print_status "Installiere MongoDB Treiber..."
                npm install mongodb
            fi
            ;;
        "mysql")
            if ! npm list mysql2 >/dev/null 2>&1; then
                print_status "Installiere MySQL Treiber..."
                npm install mysql2
            fi
            ;;
    esac
    
    print_success "Abhängigkeiten installiert"
}

# Datenbank einrichten
setup_database() {
    case $STORAGE_TYPE in
        "mongodb")
            if [ -f "bin/setup-mongodb.sh" ]; then
                print_status "Richte MongoDB ein..."
                ./bin/setup-mongodb.sh
            else
                print_warning "MongoDB Setup Script nicht gefunden"
                print_status "Manuelle Einrichtung erforderlich"
            fi
            ;;
        "mysql")
            if [ -f "bin/setup-mysql.sh" ]; then
                print_status "Richte MySQL ein..."
                ./bin/setup-mysql.sh
            else
                print_warning "MySQL Setup Script nicht gefunden"
                print_status "Manuelle Einrichtung erforderlich"
            fi
            ;;
        "file")
            print_status "File Storage benötigt keine Datenbank-Einrichtung"
            ;;
    esac
}

# Anwendung testen
test_application() {
    print_status "Teste Anwendung..."
    
    if [ -f ".env" ]; then
        print_success ".env Datei gefunden"
    else
        print_error ".env Datei nicht gefunden"
        exit 1
    fi
    
    # Prüfe ob node_modules existiert
    if [ -d "node_modules" ]; then
        print_success "Abhängigkeiten installiert"
    else
        print_error "Abhängigkeiten nicht installiert"
        exit 1
    fi
    
    print_success "Anwendung ist bereit zum Starten"
}

# Hauptfunktion
main() {
    echo ""
    echo "========================================"
    echo "    Braukalender Automatisches Setup"
    echo "========================================"
    echo ""
    
    choose_storage
    setup_config
    install_dependencies
    setup_database
    test_application
    
    echo ""
    print_success "Setup abgeschlossen!"
    echo ""
    echo "Nächste Schritte:"
    echo "1. Anwendung starten: npm start"
    echo "2. Browser öffnen: http://localhost:3000"
    echo ""
    echo "Konfiguration:"
    echo "- Storage-Typ: $STORAGE_TYPE"
    echo "- Konfigurationsdatei: .env"
    echo ""
    echo "Bei Problemen siehe SETUP.md"
}

# Script ausführen
main "$@"
