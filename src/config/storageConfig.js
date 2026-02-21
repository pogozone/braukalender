// Storage-Konfiguration
const STORAGE_CONFIG = {
  type: process.env.REACT_APP_STORAGE_TYPE || 'file', // 'file', 'mongodb', 'mysql'
  file: {
    path: './termine.json'
  },
  mongodb: {
    url: process.env.REACT_APP_MONGODB_URL || 'mongodb://localhost:27017/braukalender',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  mysql: {
    host: process.env.REACT_APP_MYSQL_HOST || 'localhost',
    port: process.env.REACT_APP_MYSQL_PORT || 3306,
    user: process.env.REACT_APP_MYSQL_USER || 'root',
    password: process.env.REACT_APP_MYSQL_PASSWORD || '',
    database: process.env.REACT_APP_MYSQL_DATABASE || 'braukalender'
  }
};

export default STORAGE_CONFIG;
