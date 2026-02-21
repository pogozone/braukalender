import StorageFactory from '../storage/StorageFactory';

class DataManager {
  constructor() {
    this.storage = StorageFactory.create();
  }

  async loadFromServer() {
    try {
      const data = await this.storage.load();
      return data;
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      return {
        termine: [],
        brauvorgaenge: [],
        resources: {}
      };
    }
  }

  async saveToServer(data) {
    try {
      return await this.storage.save(data);
    } catch (error) {
      console.error('Fehler beim Speichern der Daten:', error);
      throw error;
    }
  }

  async addBrauvorgang(brauvorgang) {
    return await this.storage.addBrauvorgang(brauvorgang);
  }

  async addTermin(termin) {
    return await this.storage.addTermin(termin);
  }

  async updateBrauvorgang(id, brauvorgang) {
    return await this.storage.updateBrauvorgang(id, brauvorgang);
  }

  async updateTermin(id, termin) {
    return await this.storage.updateTermin(id, termin);
  }

  async deleteBrauvorgang(id) {
    return await this.storage.deleteBrauvorgang(id);
  }

  async deleteTermin(id) {
    return await this.storage.deleteTermin(id);
  }

  // Storage-Informationen
  getStorageType() {
    return StorageFactory.getCurrentType();
  }

  getSupportedTypes() {
    return StorageFactory.getSupportedTypes();
  }
}

export { DataManager };
