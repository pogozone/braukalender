const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('build'));

// MongoDB Verbindung
let mongoClient = null;
let mongoDb = null;

const connectMongo = async () => {
  try {
    const mongoUrl = process.env.REACT_APP_MONGODB_URL || 'mongodb://localhost:27017/braukalender';
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    mongoDb = mongoClient.db('braukalender');
    console.log('MongoDB verbunden');
  } catch (error) {
    console.error('MongoDB Verbindungsfehler:', error);
  }
};

// API Endpoints
app.get('/api/data', async (req, res) => {
  try {
    const storageType = process.env.REACT_APP_STORAGE_TYPE || 'file';
    console.log('Storage Type:', storageType);
    
    if (storageType === 'mongodb') {
      if (!mongoDb) {
        await connectMongo();
      }
      
      const [termine, brauvorgaenge, resources] = await Promise.all([
        mongoDb.collection('termine').find({}).toArray(),
        mongoDb.collection('brauvorgaenge').find({}).toArray(),
        mongoDb.collection('resources').findOne({}) || {}
      ]);
      
      console.log('MongoDB Data - Brauvorgänge:', brauvorgaenge.length);
      
      res.json({
        termine: termine || [],
        brauvorgaenge: brauvorgaenge || [],
        resources: resources || {}
      });
    } else {
      // File Storage (Fallback)
      const data = await fs.readFile('./termine.json', 'utf8');
      const parsed = JSON.parse(data);
      console.log('File Data - Brauvorgänge:', parsed.brauvorgaenge?.length || 0);
      res.json(parsed);
    }
  } catch (error) {
    console.error('Fehler beim Laden der Daten:', error);
    res.json({
      termine: [],
      brauvorgaenge: [],
      resources: {}
    });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    const storageType = process.env.REACT_APP_STORAGE_TYPE || 'file';
    
    if (storageType === 'mongodb') {
      if (!mongoDb) await connectMongo();
      
      const data = req.body;
      
      // Transaktion für atomare Operationen
      const session = mongoClient.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Alle bestehenden Daten löschen
          await mongoDb.collection('termine').deleteMany({});
          await mongoDb.collection('brauvorgaenge').deleteMany({});
          await mongoDb.collection('resources').deleteMany({});
          
          // Neue Daten einfügen
          if (data.termine && data.termine.length > 0) {
            await mongoDb.collection('termine').insertMany(data.termine);
          }
          
          if (data.brauvorgaenge && data.brauvorgaenge.length > 0) {
            await mongoDb.collection('brauvorgaenge').insertMany(data.brauvorgaenge);
          }
          
          if (data.resources) {
            await mongoDb.collection('resources').insertOne(data.resources);
          }
        });
      } finally {
        await session.endSession();
      }
      
      res.json({ success: true });
    } else {
      // File Storage (Fallback)
      await fs.writeFile('./termine.json', JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Fehler beim Speichern der Daten:', error);
    res.status(500).json({ error: 'Fehler beim Speichern' });
  }
});

// React App Route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Server starten
app.listen(PORT, async () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`React App: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/data`);
  
  // Bei MongoDB Storage sofort verbinden
  const storageType = process.env.REACT_APP_STORAGE_TYPE || 'file';
  if (storageType === 'mongodb') {
    await connectMongo();
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  if (mongoClient) {
    await mongoClient.close();
    console.log('MongoDB Verbindung getrennt');
  }
  process.exit(0);
});
