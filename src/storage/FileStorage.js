import { StorageInterface } from './StorageInterface';
import STORAGE_CONFIG from '../config/storageConfig';

// File Storage Implementation
export class FileStorage extends StorageInterface {
  constructor() {
    super();
    this.apiUrl = process.env.NODE_ENV === 'production' 
      ? '/api/data' 
      : 'http://localhost:3001/api/data';
  }

  async load() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return {
        termine: data.termine || [],
        brauvorgaenge: data.brauvorgaenge || [],
        resources: data.resources || {}
      };
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      return {
        termine: [],
        brauvorgaenge: [],
        resources: {}
      };
    }
  }

  async save(data) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Fehler beim Speichern der Daten:', error);
      throw error;
    }
  }

  async addBrauvorgang(brauvorgang) {
    const data = await this.load();
    data.brauvorgaenge.push(brauvorgang);
    await this.save(data);
    return brauvorgang;
  }

  async addTermin(termin) {
    const data = await this.load();
    data.termine.push(termin);
    await this.save(data);
    return termin;
  }

  async updateBrauvorgang(id, updatedBrauvorgang) {
    const data = await this.load();
    const index = data.brauvorgaenge.findIndex(b => b.id === id);
    if (index !== -1) {
      data.brauvorgaenge[index] = updatedBrauvorgang;
      await this.save(data);
      return updatedBrauvorgang;
    }
    throw new Error('Brauvorgang nicht gefunden');
  }

  async updateTermin(id, updatedTermin) {
    const data = await this.load();
    const index = data.termine.findIndex(t => t.id === id);
    if (index !== -1) {
      data.termine[index] = updatedTermin;
      await this.save(data);
      return updatedTermin;
    }
    throw new Error('Termin nicht gefunden');
  }

  async deleteBrauvorgang(id) {
    const data = await this.load();
    data.brauvorgaenge = data.brauvorgaenge.filter(b => b.id !== id);
    await this.save(data);
    return true;
  }

  async deleteTermin(id) {
    const data = await this.load();
    data.termine = data.termine.filter(t => t.id !== id);
    await this.save(data);
    return true;
  }
}
