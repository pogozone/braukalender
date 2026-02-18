import { brauzeiten } from '../data/resources';

export class ResourceManager {
  constructor(resources, brauvorgaenge) {
    this.resources = resources;
    this.brauvorgaenge = brauvorgaenge;
  }

  pruefeGaertankVerfuegbarkeit(startDatum, brauart) {
    const dauer = brauzeiten[brauart].tage;
    const endDatum = new Date(startDatum);
    endDatum.setDate(endDatum.getDate() + dauer);

    return this.resources.gaertanks.some(tank => {
      return !this.brauvorgaenge.some(brauvorgang => {
        if (brauvorgang.gaertankId === tank.id) {
          const brauvorgangEnde = new Date(brauvorgang.startDatum);
          brauvorgangEnde.setDate(brauvorgangEnde.getDate() + brauzeiten[brauvorgang.brauart].tage);
          
          return !(endDatum <= brauvorgang.startDatum || startDatum >= brauvorgangEnde);
        }
        return false;
      });
    });
  }

  pruefeFaesserVerfuegbarkeit(startDatum, brauart) {
    const dauer = brauzeiten[brauart].tage;
    const benoetigteFaesser = 3;
    const endDatum = new Date(startDatum);
    endDatum.setDate(endDatum.getDate() + dauer);

    const verfuegbareFaesser = this.resources.faesser.filter(fass => {
      return !this.brauvorgaenge.some(brauvorgang => {
        if (brauvorgang.belegteFaesser.includes(fass.id)) {
          const brauvorgangEnde = new Date(brauvorgang.startDatum);
          brauvorgangEnde.setDate(brauvorgangEnde.getDate() + brauzeiten[brauvorgang.brauart].tage);
          
          return !(endDatum <= brauvorgang.startDatum || startDatum >= brauvorgangEnde);
        }
        return false;
      });
    });

    return verfuegbareFaesser.length >= benoetigteFaesser;
  }

  getVerfuegbarenGaertank(startDatum, brauart) {
    const dauer = brauzeiten[brauart].tage;
    const endDatum = new Date(startDatum);
    endDatum.setDate(endDatum.getDate() + dauer);

    return this.resources.gaertanks.find(tank => {
      return !this.brauvorgaenge.some(brauvorgang => {
        if (brauvorgang.gaertankId === tank.id) {
          const brauvorgangEnde = new Date(brauvorgang.startDatum);
          brauvorgangEnde.setDate(brauvorgangEnde.getDate() + brauzeiten[brauvorgang.brauart].tage);
          
          return !(endDatum <= brauvorgang.startDatum || startDatum >= brauvorgangEnde);
        }
        return false;
      });
    });
  }

  getVerfuegbareFaesser(startDatum, brauart) {
    const dauer = brauzeiten[brauart].tage;
    const endDatum = new Date(startDatum);
    endDatum.setDate(endDatum.getDate() + dauer);

    const verfuegbareFaesser = this.resources.faesser.filter(fass => {
      return !this.brauvorgaenge.some(brauvorgang => {
        if (brauvorgang.belegteFaesser.includes(fass.id)) {
          const brauvorgangEnde = new Date(brauvorgang.startDatum);
          brauvorgangEnde.setDate(brauvorgangEnde.getDate() + brauzeiten[brauvorgang.brauart].tage);
          
          return !(endDatum <= brauvorgang.startDatum || startDatum >= brauvorgangEnde);
        }
        return false;
      });
    });

    return verfuegbareFaesser.slice(0, 3);
  }

  getRessourcenStatus() {
    const heute = new Date();
    const status = {
      gaertanks: this.resources.gaertanks.map(tank => {
        const belegt = this.brauvorgaenge.some(brauvorgang => {
          if (brauvorgang.gaertankId === tank.id) {
            const brauvorgangEnde = new Date(brauvorgang.startDatum);
            brauvorgangEnde.setDate(brauvorgangEnde.getDate() + brauzeiten[brauvorgang.brauart].tage);
            return heute < brauvorgangEnde;
          }
          return false;
        });
        return { ...tank, status: belegt ? 'belegt' : 'verfügbar' };
      }),
      faesser: this.resources.faesser.map(fass => {
        const belegt = this.brauvorgaenge.some(brauvorgang => {
          if (brauvorgang.belegteFaesser.includes(fass.id)) {
            const brauvorgangEnde = new Date(brauvorgang.startDatum);
            brauvorgangEnde.setDate(brauvorgangEnde.getDate() + brauzeiten[brauvorgang.brauart].tage);
            return heute < brauvorgangEnde;
          }
          return false;
        });
        return { ...fass, status: belegt ? 'belegt' : 'verfügbar' };
      })
    };
    
    return status;
  }
}
