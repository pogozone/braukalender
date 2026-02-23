import { brauzeiten } from '../data/resources';

export class ResourceManager {
  constructor(resources, brauvorgaenge) {
    this.resources = resources;
    this.brauvorgaenge = brauvorgaenge;
  }

  startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  getBrauvorgangZeitraum(brauvorgang) {
    const tage = brauzeiten[brauvorgang.brauart].tage;

    const startBT = this.startOfDay(new Date(brauvorgang.startDatum));
    const startHG = this.addDays(startBT, 1);
    const defaultU = this.addDays(startHG, tage - 1);
    const dateU = brauvorgang.umdrueckDatum
      ? this.startOfDay(new Date(brauvorgang.umdrueckDatum))
      : defaultU;

    const endNG = this.addDays(dateU, tage - 1);
    const endExclusive = this.addDays(endNG, 1);

    return { start: startBT, endExclusive };
  }

  intervalOverlaps(aStart, aEndExclusive, bStart, bEndExclusive) {
    return aStart < bEndExclusive && bStart < aEndExclusive;
  }

  pruefeGaertankVerfuegbarkeit(startDatum, brauart, excludeBrauvorgangId = null) {
    // Verfügbarkeit ab Brautag bis Ende Nachgärung
    const tage = brauzeiten[brauart].tage;
    const requestStart = this.startOfDay(new Date(startDatum));
    const requestUDefault = this.addDays(this.addDays(requestStart, 1), tage - 1);
    const requestEndNG = this.addDays(requestUDefault, tage - 1);
    const requestEndExclusive = this.addDays(requestEndNG, 1);

    return this.resources.gaertanks.some(tank => {
      return !this.brauvorgaenge.some(brauvorgang => {
        // Exclude current brauvorgang when editing
        if (excludeBrauvorgangId && brauvorgang.id === excludeBrauvorgangId) {
          return false;
        }
        
        if (brauvorgang.gaertankId === tank.id) {
          const { start, endExclusive } = this.getBrauvorgangZeitraum(brauvorgang);
          return this.intervalOverlaps(requestStart, requestEndExclusive, start, endExclusive);
        }
        return false;
      });
    });
  }

  pruefeFaesserVerfuegbarkeit(startDatum, brauart, excludeBrauvorgangId = null) {
    const benoetigteFaesser = 3;

    const tage = brauzeiten[brauart].tage;
    const requestStart = this.startOfDay(new Date(startDatum));
    const requestUDefault = this.addDays(this.addDays(requestStart, 1), tage - 1);
    const requestEndNG = this.addDays(requestUDefault, tage - 1);
    const requestEndExclusive = this.addDays(requestEndNG, 1);

    const verfuegbareFaesser = this.resources.faesser.filter(fass => {
      return !this.brauvorgaenge.some(brauvorgang => {
        // Exclude current brauvorgang when editing
        if (excludeBrauvorgangId && brauvorgang.id === excludeBrauvorgangId) {
          return false;
        }
        
        if (brauvorgang.belegteFaesser.includes(fass.id)) {
          const { start, endExclusive } = this.getBrauvorgangZeitraum(brauvorgang);
          return this.intervalOverlaps(requestStart, requestEndExclusive, start, endExclusive);
        }
        return false;
      });
    });

    return verfuegbareFaesser.length >= benoetigteFaesser;
  }

  getVerfuegbarenGaertank(startDatum, brauart, excludeBrauvorgangId = null) {
    const tage = brauzeiten[brauart].tage;
    const requestStart = this.startOfDay(new Date(startDatum));
    const requestUDefault = this.addDays(this.addDays(requestStart, 1), tage - 1);
    const requestEndNG = this.addDays(requestUDefault, tage - 1);
    const requestEndExclusive = this.addDays(requestEndNG, 1);

    return this.resources.gaertanks.find(tank => {
      return !this.brauvorgaenge.some(brauvorgang => {
        // Exclude current brauvorgang when editing
        if (excludeBrauvorgangId && brauvorgang.id === excludeBrauvorgangId) {
          return false;
        }
        
        if (brauvorgang.gaertankId === tank.id) {
          const { start, endExclusive } = this.getBrauvorgangZeitraum(brauvorgang);
          return this.intervalOverlaps(requestStart, requestEndExclusive, start, endExclusive);
        }
        return false;
      });
    });
  }

  getVerfuegbareFaesser(startDatum, brauart, excludeBrauvorgangId = null) {
    const tage = brauzeiten[brauart].tage;
    const requestStart = this.startOfDay(new Date(startDatum));
    const requestUDefault = this.addDays(this.addDays(requestStart, 1), tage - 1);
    const requestEndNG = this.addDays(requestUDefault, tage - 1);
    const requestEndExclusive = this.addDays(requestEndNG, 1);

    const verfuegbareFaesser = this.resources.faesser.filter(fass => {
      return !this.brauvorgaenge.some(brauvorgang => {
        // Exclude current brauvorgang when editing
        if (excludeBrauvorgangId && brauvorgang.id === excludeBrauvorgangId) {
          return false;
        }
        
        if (brauvorgang.belegteFaesser.includes(fass.id)) {
          const { start, endExclusive } = this.getBrauvorgangZeitraum(brauvorgang);
          return this.intervalOverlaps(requestStart, requestEndExclusive, start, endExclusive);
        }
        return false;
      });
    });

    return verfuegbareFaesser.slice(0, 3);
  }

  getRessourcenStatus() {
    return this.getRessourcenStatusAm(new Date());
  }

  getRessourcenStatusAm(datum) {
    const stichtag = this.startOfDay(new Date(datum));
    const status = {
      gaertanks: this.resources.gaertanks.map(tank => {
        const belegt = this.brauvorgaenge.some(brauvorgang => {
          if (brauvorgang.gaertankId === tank.id) {
            const { start, endExclusive } = this.getBrauvorgangZeitraum(brauvorgang);
            return stichtag >= start && stichtag < endExclusive;
          }
          return false;
        });
        return { ...tank, status: belegt ? 'belegt' : 'verfügbar' };
      }),
      faesser: this.resources.faesser.map(fass => {
        const belegt = this.brauvorgaenge.some(brauvorgang => {
          if (brauvorgang.belegteFaesser.includes(fass.id)) {
            const { start, endExclusive } = this.getBrauvorgangZeitraum(brauvorgang);
            return stichtag >= start && stichtag < endExclusive;
          }
          return false;
        });
        return { ...fass, status: belegt ? 'belegt' : 'verfügbar' };
      })
    };

    return status;
  }
}
