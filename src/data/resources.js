export const initialResources = {
  kuehlschraenke: [
    { id: 1, name: 'Kühlschrank 1', kapazitaet: 100 }
  ],
  gaertanks: [
    { id: 1, name: 'Gärtank 1', status: 'verfügbar' },
    { id: 2, name: 'Gärtank 2', status: 'verfügbar' },
    { id: 3, name: 'Gärtank 3', status: 'verfügbar' }
  ],
  faesser: Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: `Fass ${i + 1}`,
    status: 'verfügbar'
  }))
};

export const brauzeiten = {
  obergärig: { tage: 14, name: 'Obergärig' },
  untergärig: { tage: 10, name: 'Untergärig' }
};
