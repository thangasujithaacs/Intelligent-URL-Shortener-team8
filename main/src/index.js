import express from 'express';
import pkg from 'body-parser';
import dotenv from 'dotenv';
import main from './main.js';

dotenv.config();

const { json } = pkg;

const app = express();
const cors = require('cors');
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PATCH'], // Specify allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Specify allowed headers
  }));
app.use(json());


app.post('/', async (req, res) => {
  await main({ req, res, log: console.log, error: console.error });
});

app.get('/analytics/*', async (req, res) => {
  await main({ req, res, log: console.log, error: console.error });
});

app.get('/:shortCode', async (req, res) => {
  await main({ req, res, log: console.log, error: console.error });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});