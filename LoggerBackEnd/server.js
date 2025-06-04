const express = require('express');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const https = require('https'); // Import HTTPS module
const cors = require('cors');

const app = express();
const port = 3005; // Change if needed
const host = 'hyphenview.in'; // Bind to all available network interfaces

app.use(cors());
app.use(express.json());

// Load SSL certificate and key
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'server.key')),  // Path to private key
  cert: fs.readFileSync(path.join(__dirname, 'server.cert')) // Path to certificate
};

// Logger configuration
const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const getLogger = (userId) => {
  const date = new Date().toISOString().split('T')[0];
  const logFilePath = path.join(logDirectory, `${userId}-${date}.log`);
  const customFormat = winston.format.printf(({ level, message, timestamp, status_code }) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toTimeString().split(' ')[0];

    return `[${level.toUpperCase()} ${status_code}] ${day}.${month} ${year} ${time}: ${message}`;
  });

  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format((info) => {
        info.status_code = info.status_code || 'N/A';
        return info;
      })(),
      customFormat
    ),
    transports: [
      new winston.transports.File({ filename: logFilePath })
    ]
  });
};

app.post('/log', (req, res) => {
  console.log('Received request:', req.method, req.url);
  console.log('Request body:', req.body);

  const { userId, status_code, message } = req.body;

  if (!userId || !status_code) {
    console.error('Missing userId, message, or status_code');
    return res.status(400).send('Missing userId, message, or status_code');
  }
  
  try {
    const logger = getLogger(userId);

    // Convert status_code to number if it comes as string
    const status = Number(status_code);

    if (status === 200) {
      logger.info({ status_code: status, message });
    } else {
      logger.error({ status_code: status, message });
    }

    res.send('Log recorded');
  } catch (error) {
    console.error('Error logging message:', error);
    res.status(500).send('Internal server error');
  }
});

// Create an HTTPS server with the SSL certificate
const server = https.createServer(sslOptions, app);
server.listen(port, host, () => {
  console.log(`HTTPS Server running at http://${host}:${port}`);
});
