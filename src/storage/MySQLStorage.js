import { StorageInterface } from './StorageInterface';
import STORAGE_CONFIG from '../config/storageConfig';

// MySQL Storage Implementation
export class MySQLStorage extends StorageInterface {
  constructor() {
    super();
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;
    
    try {
      // Für Client-seitige MySQL Nutzung würde man normalerweise eine API verwenden
      // Hier als Beispiel für zukünftige Server-seitige Implementierung
      const mysql = require('mysql2/promise');
      
      this.connection = await mysql.createConnection({
        host: STORAGE_CONFIG.mysql.host,
        port: STORAGE_CONFIG.mysql.port,
        user: STORAGE_CONFIG.mysql.user,
        password: STORAGE_CONFIG.mysql.password,
        database: STORAGE_CONFIG.mysql.database
      });
      
      this.isConnected = true;
      console.log('MySQL verbunden');
      
      // Tabellen erstellen falls nicht vorhanden
      await this.createTables();
    } catch (error) {
      console.error('MySQL Verbindungsfehler:', error);
      throw error;
    }
  }

  async createTables() {
    try {
      // Termine Tabelle
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS termine (
          id VARCHAR(255) PRIMARY KEY,
          titel VARCHAR(255) NOT NULL,
          beschreibung TEXT,
          startDatum DATETIME NOT NULL,
          endDatum DATETIME,
          typ VARCHAR(50) DEFAULT 'termin',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Brauvorgänge Tabelle
      await this.connection.execute(`
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
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Resources Tabelle
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS resources (
          id INT AUTO_INCREMENT PRIMARY KEY,
          data JSON,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      console.error('Fehler beim Erstellen der Tabellen:', error);
    }
  }

  async load() {
    try {
      await this.connect();
      
      const [termineRows] = await this.connection.execute('SELECT * FROM termine ORDER BY startDatum');
      const [brauvorgaengeRows] = await this.connection.execute('SELECT * FROM brauvorgaenge ORDER BY startDatum');
      const [resourcesRows] = await this.connection.execute('SELECT * FROM resources ORDER BY id DESC LIMIT 1');
      
      // JSON-Felder parsen
      const brauvorgaenge = brauvorgaengeRows.map(row => ({
        ...row,
        belegteFaesser: row.belegteFaesser ? JSON.parse(row.belegteFaesser) : [],
        faesserNamen: row.faesserNamen ? JSON.parse(row.faesserNamen) : []
      }));
      
      const resources = resourcesRows.length > 0 ? resourcesRows[0].data : {};
      
      return {
        termine: termineRows,
        brauvorgaenge: brauvorgaenge,
        resources: resources
      };
    } catch (error) {
      console.error('Fehler beim Laden aus MySQL:', error);
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
      
      await this.connection.beginTransaction();
      
      try {
        // Termine speichern
        await this.connection.execute('DELETE FROM termine');
        if (data.termine && data.termine.length > 0) {
          const termineValues = data.termine.map(t => [
            t.id, t.titel, t.beschreibung, t.startDatum, t.endDatum, t.typ
          ]);
          await this.connection.execute(
            'INSERT INTO termine (id, titel, beschreibung, startDatum, endDatum, typ) VALUES ?',
            [termineValues]
          );
        }
        
        // Brauvorgänge speichern
        await this.connection.execute('DELETE FROM brauvorgaenge');
        if (data.brauvorgaenge && data.brauvorgaenge.length > 0) {
          const brauvorgaengeValues = data.brauvorgaenge.map(b => [
            b.id, b.titel, b.beschreibung, b.startDatum, b.brauart,
            b.gaertankId, b.gaertankName,
            JSON.stringify(b.belegteFaesser || []),
            JSON.stringify(b.faesserNamen || []),
            b.typ
          ]);
          await this.connection.execute(
            'INSERT INTO brauvorgaenge (id, titel, beschreibung, startDatum, brauart, gaertankId, gaertankName, belegteFaesser, faesserNamen, typ) VALUES ?',
            [brauvorgaengeValues]
          );
        }
        
        // Resources speichern
        await this.connection.execute('DELETE FROM resources');
        await this.connection.execute(
          'INSERT INTO resources (data) VALUES (?)',
          [JSON.stringify(data.resources)]
        );
        
        await this.connection.commit();
        return { success: true };
      } catch (error) {
        await this.connection.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Fehler beim Speichern in MySQL:', error);
      throw error;
    }
  }

  async addBrauvorgang(brauvorgang) {
    await this.connect();
    const [result] = await this.connection.execute(
      `INSERT INTO brauvorgaenge (id, titel, beschreibung, startDatum, brauart, gaertankId, gaertankName, belegteFaesser, faesserNamen, typ) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        brauvorgang.id, brauvorgang.titel, brauvorgang.beschreibung,
        brauvorgang.startDatum, brauvorgang.brauart, brauvorgang.gaertankId,
        brauvorgang.gaertankName, JSON.stringify(brauvorgang.belegteFaesser || []),
        JSON.stringify(brauvorgang.faesserNamen || []), brauvorgang.typ
      ]
    );
    return { ...brauvorgang, insertId: result.insertId };
  }

  async addTermin(termin) {
    await this.connect();
    const [result] = await this.connection.execute(
      'INSERT INTO termine (id, titel, beschreibung, startDatum, endDatum, typ) VALUES (?, ?, ?, ?, ?, ?)',
      [termin.id, termin.titel, termin.beschreibung, termin.startDatum, termin.endDatum, termin.typ]
    );
    return { ...termin, insertId: result.insertId };
  }

  async updateBrauvorgang(id, updatedBrauvorgang) {
    await this.connect();
    const [result] = await this.connection.execute(
      `UPDATE brauvorgaenge SET titel = ?, beschreibung = ?, startDatum = ?, brauart = ?, 
       gaertankId = ?, gaertankName = ?, belegteFaesser = ?, faesserNamen = ?, typ = ? 
       WHERE id = ?`,
      [
        updatedBrauvorgang.titel, updatedBrauvorgang.beschreibung,
        updatedBrauvorgang.startDatum, updatedBrauvorgang.brauart,
        updatedBrauvorgang.gaertankId, updatedBrauvorgang.gaertankName,
        JSON.stringify(updatedBrauvorgang.belegteFaesser || []),
        JSON.stringify(updatedBrauvorgang.faesserNamen || []),
        updatedBrauvorgang.typ, id
      ]
    );
    
    if (result.affectedRows === 0) {
      throw new Error('Brauvorgang nicht gefunden');
    }
    return updatedBrauvorgang;
  }

  async updateTermin(id, updatedTermin) {
    await this.connect();
    const [result] = await this.connection.execute(
      'UPDATE termine SET titel = ?, beschreibung = ?, startDatum = ?, endDatum = ?, typ = ? WHERE id = ?',
      [updatedTermin.titel, updatedTermin.beschreibung, updatedTermin.startDatum, updatedTermin.endDatum, updatedTermin.typ, id]
    );
    
    if (result.affectedRows === 0) {
      throw new Error('Termin nicht gefunden');
    }
    return updatedTermin;
  }

  async deleteBrauvorgang(id) {
    await this.connect();
    const [result] = await this.connection.execute('DELETE FROM brauvorgaenge WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async deleteTermin(id) {
    await this.connect();
    const [result] = await this.connection.execute('DELETE FROM termine WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async disconnect() {
    if (this.connection && this.isConnected) {
      await this.connection.end();
      this.isConnected = false;
      console.log('MySQL Verbindung getrennt');
    }
  }
}
