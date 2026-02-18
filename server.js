const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'termine.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('build'));

// Hilfsfunktion zum Lesen der Daten
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Fehler beim Lesen der Datei:', error);
    return getEmptyData();
  }
}

// Hilfsfunktion zum Schreiben der Daten
async function writeData(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Fehler beim Schreiben der Datei:', error);
    return false;
  }
}

// Leere Datenstruktur
function getEmptyData() {
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

// API Endpoints
app.get('/api/data', async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden der Daten' });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    const success = await writeData(req.body);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Fehler beim Speichern der Daten' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Speichern der Daten' });
  }
});

// Serve React App
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`React App: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/data`);
});
