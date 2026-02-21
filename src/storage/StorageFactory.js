import STORAGE_CONFIG from '../config/storageConfig';
import { FileStorage } from './FileStorage';
import { MongoStorage } from './MongoStorage';
import { MySQLStorage } from './MySQLStorage';

// Storage Factory - erstellt die richtige Storage-Instanz basierend auf Konfiguration
class StorageFactory {
  static create() {
    const storageType = STORAGE_CONFIG.type.toLowerCase();
    
    switch (storageType) {
      case 'file':
        console.log('Verwende File Storage');
        return new FileStorage();
        
      case 'mongodb':
        console.log('Verwende MongoDB Storage');
        return new MongoStorage();
        
      case 'mysql':
        console.log('Verwende MySQL Storage');
        return new MySQLStorage();
        
      default:
        console.warn(`Unbekannter Storage-Typ: ${storageType}, verwende File Storage als Fallback`);
        return new FileStorage();
    }
  }
  
  static getSupportedTypes() {
    return ['file', 'mongodb', 'mysql'];
  }
  
  static getCurrentType() {
    return STORAGE_CONFIG.type;
  }
  
  static validateConfig() {
    const config = STORAGE_CONFIG[STORAGE_CONFIG.type.toLowerCase()];
    if (!config) {
      throw new Error(`Keine Konfiguration für Storage-Typ: ${STORAGE_CONFIG.type}`);
    }
    return true;
  }
}

export default StorageFactory;
