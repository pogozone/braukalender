import { StorageInterface } from './StorageInterface';
import STORAGE_CONFIG from '../config/storageConfig';

// MongoDB Storage Implementation
export class MongoStorage extends StorageInterface {
  constructor() {
    super();
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;
    
    try {
      // Für Client-seitige MongoDB Nutzung würde man normalerweise eine API verwenden
      // Hier als Beispiel für zukünftige Server-seitige Implementierung
      const { MongoClient } = require('mongodb');
      this.client = new MongoClient(STORAGE_CONFIG.mongodb.url, STORAGE_CONFIG.mongodb.options);
      await this.client.connect();
      this.db = this.client.db();
      this.isConnected = true;
      console.log('MongoDB verbunden');
    } catch (error) {
      console.error('MongoDB Verbindungsfehler:', error);
      throw error;
    }
  }

  async load() {
    try {
      await this.connect();
      
      const termineCollection = this.db.collection('termine');
      const brauvorgaengeCollection = this.db.collection('brauvorgaenge');
      const resourcesCollection = this.db.collection('resources');
      
      const [termine, brauvorgaenge, resources] = await Promise.all([
        termineCollection.find({}).toArray(),
        brauvorgaengeCollection.find({}).toArray(),
        resourcesCollection.findOne({}) || {}
      ]);
      
      return {
        termine: termine || [],
        brauvorgaenge: brauvorgaenge || [],
        resources: resources || {}
      };
    } catch (error) {
      console.error('Fehler beim Laden aus MongoDB:', error);
      return {
        termine: [],
        brauvorgaenge: [],
        resources: {}
      };
    }
  }

  async save(data) {
    try {
      await this.connect();
      
      const termineCollection = this.db.collection('termine');
      const brauvorgaengeCollection = this.db.collection('brauvorgaenge');
      const resourcesCollection = this.db.collection('resources');
      
      // Batch-Operationen für bessere Performance
      const session = this.client.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Alle bestehenden Daten löschen
          await termineCollection.deleteMany({});
          await brauvorgaengeCollection.deleteMany({});
          await resourcesCollection.deleteMany({});
          
          // Neue Daten einfügen
          if (data.termine && data.termine.length > 0) {
            await termineCollection.insertMany(data.termine);
          }
          
          if (data.brauvorgaenge && data.brauvorgaenge.length > 0) {
            await brauvorgaengeCollection.insertMany(data.brauvorgaenge);
          }
          
          if (data.resources) {
            await resourcesCollection.insertOne(data.resources);
          }
        });
      } finally {
        await session.endSession();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Fehler beim Speichern in MongoDB:', error);
      throw error;
    }
  }

  async addBrauvorgang(brauvorgang) {
    await this.connect();
    const collection = this.db.collection('brauvorgaenge');
    const result = await collection.insertOne(brauvorgang);
    return { ...brauvorgang, _id: result.insertedId };
  }

  async addTermin(termin) {
    await this.connect();
    const collection = this.db.collection('termine');
    const result = await collection.insertOne(termin);
    return { ...termin, _id: result.insertedId };
  }

  async updateBrauvorgang(id, updatedBrauvorgang) {
    await this.connect();
    const collection = this.db.collection('brauvorgaenge');
    const result = await collection.updateOne(
      { id: id },
      { $set: updatedBrauvorgang }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Brauvorgang nicht gefunden');
    }
    return updatedBrauvorgang;
  }

  async updateTermin(id, updatedTermin) {
    await this.connect();
    const collection = this.db.collection('termine');
    const result = await collection.updateOne(
      { id: id },
      { $set: updatedTermin }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Termin nicht gefunden');
    }
    return updatedTermin;
  }

  async deleteBrauvorgang(id) {
    await this.connect();
    const collection = this.db.collection('brauvorgaenge');
    const result = await collection.deleteOne({ id: id });
    return result.deletedCount > 0;
  }

  async deleteTermin(id) {
    await this.connect();
    const collection = this.db.collection('termine');
    const result = await collection.deleteOne({ id: id });
    return result.deletedCount > 0;
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.close();
      this.isConnected = false;
      console.log('MongoDB Verbindung getrennt');
    }
  }
}
