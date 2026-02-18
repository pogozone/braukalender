export class DataManager {
  constructor() {
    this.storageKey = 'braukalender-data';
    this.apiEndpoint = 'http://localhost:3001/api/data';
  }

  // Daten aus localStorage laden
  loadData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten aus localStorage:', error);
    }
    
    // Fallback zu leeren Daten
    return this.getEmptyData();
  }

  // Daten in localStorage speichern
  saveData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Fehler beim Speichern der Daten in localStorage:', error);
      return false;
    }
  }

  // Daten an Server senden (für persistente Speicherung)
  async saveToServer(data) {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        return true;
      } else {
        console.error('Server speicherte Daten nicht erfolgreich');
        return false;
      }
    } catch (error) {
      console.error('Fehler beim Senden der Daten an Server:', error);
      return false;
    }
  }

  // Daten vom Server laden
  async loadFromServer() {
    try {
      const response = await fetch(this.apiEndpoint);
      if (response.ok) {
        const data = await response.json();
        this.saveData(data); // Auch in localStorage speichern
        return data;
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten vom Server:', error);
    }
    
    // Fallback zu localStorage
    return this.loadData();
  }

  // Leere Datenstruktur
  getEmptyData() {
    return {
      termine: [],
      brauvorgaenge: [],
      gärtanks: [
        {
          id: 1,
          name: "Gärtank 1",
          kapazität: 500,
          status: "verfügbar"
        },
        {
          id: 2,
          name: "Gärtank 2",
          kapazität: 500,
          status: "verfügbar"
        },
        {
          id: 3,
          name: "Gärtank 3",
          kapazität: 500,
          status: "verfügbar"
        }
      ],
      kühlschränke: [
        {
          id: 1,
          name: "Kühlschrank 1",
          kapazität: 1000,
          status: "verfügbar"
        }
      ],
      faesser: Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Fass ${i + 1}`,
        kapazität: 50,
        status: "verfügbar"
      }))
    };
  }

  // Brauvorgang hinzufügen
  addBrauvorgang(brauvorgang) {
    const data = this.loadData();
    data.brauvorgaenge.push(brauvorgang);
    this.saveData(data);
    this.saveToServer(data); // Asynchron speichern
    return data;
  }

  // Termin hinzufügen
  addTermin(termin) {
    const data = this.loadData();
    data.termine.push(termin);
    this.saveData(data);
    this.saveToServer(data); // Asynchron speichern
    return data;
  }

  // Alle Daten abrufen
  getAllData() {
    return this.loadData();
  }
}
