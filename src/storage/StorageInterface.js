// Basis-Interface für alle Storage-Implementierungen
export class StorageInterface {
  async load() {
    throw new Error('load() muss implementiert werden');
  }
  
  async save(data) {
    throw new Error('save() muss implementiert werden');
  }
  
  async addBrauvorgang(brauvorgang) {
    throw new Error('addBrauvorgang() muss implementiert werden');
  }
  
  async addTermin(termin) {
    throw new Error('addTermin() muss implementiert werden');
  }
  
  async updateBrauvorgang(id, brauvorgang) {
    throw new Error('updateBrauvorgang() muss implementiert werden');
  }
  
  async updateTermin(id, termin) {
    throw new Error('updateTermin() muss implementiert werden');
  }
  
  async deleteBrauvorgang(id) {
    throw new Error('deleteBrauvorgang() muss implementiert werden');
  }
  
  async deleteTermin(id) {
    throw new Error('deleteTermin() muss implementiert werden');
  }
}
