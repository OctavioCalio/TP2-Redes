const express = require('express');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');

const secretKey = process.env.CLAVE_SECRETA;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

client.connect()
  .then(() => {
    console.log('Conectado a la base de datos PostgreSQL');
  })
  .catch(error => console.error('Error al conectar con la base de datos PostgreSQL:', error));

const temperatureReadingTable = `
CREATE TABLE IF NOT EXISTS temperature_readings (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  temperature DECIMAL(5,2) NOT NULL
);`;

client.query(temperatureReadingTable)
  .then(() => console.log('Tabla "temperature_readings" creada si no existía'))
  .catch(error => console.error('Error al crear la tabla "temperature_readings":', error));

const app = express();
const port = 5000;

app.use(express.json());

app.use(cors({
  origin: '*' // Reemplaza con la URL y puerto donde se está ejecutando 'serve'. * indica desde cualquier origen
}));




// Definición del middleware verifyToken
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'No se proporcionó un token' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }

    req.user = decoded;
    next();
  });
};

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Usuario hardcodeado
  const hardcodedUser = {
    username: 'usuario',
    password: 'contraseña'
  };  //Hardcodeamos el usuario y contraseña para hacer la comparativa y si es correcta, crear el token

  
  if (username === hardcodedUser.username && password === hardcodedUser.password) {
    // Generar un token JWT
    const token = jwt.sign({ username: hardcodedUser.username }, secretKey, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Credenciales inválidas' });
  }
  
  
  
  
});

// Ruta protegida que requiere autenticación
app.post('/temperature-readings', verifyToken, async (req, res) => {
  const { timestamp, temperature } = req.body;
  console.log('Datos recibidos en el endpoint:', { timestamp, temperature });

  try {
    const query = `INSERT INTO temperature_readings (timestamp, temperature) VALUES ($1, $2)`;
    const values = [new Date(timestamp * 1000), temperature];
    await client.query(query, values);
    console.log('Datos insertados en la base de datos');
    res.status(201).send({ message: 'Lectura de temperatura insertada correctamente' });
  } catch (error) {
    console.error('Error al insertar la lectura de temperatura:', error);
    res.status(500).send({ message: 'Error al insertar la lectura de temperatura' });
  }
});

app.get('/temperature-readings', verifyToken, async (req, res) => {
  try {
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    let formattedDate = currentDate.toISOString().split('T')[0] + ' 00:00:00';

    //const query = `SELECT * FROM temperature_readings as r where r.timestamp between timestamp '${formattedDate} AND LOCALTIMESTAMP ORDER BY r.timestamp DESC LIMIT 100`;
    const query = `SELECT * FROM temperature_readings as r WHERE r.timestamp >= NOW() - INTERVAL '7 days' ORDER BY r.timestamp DESC`;
    const result = await client.query(query);
    const data = result.rows.reverse();
    const distributedData = getDistributedSamples(data, 100)
    

    // Limitar la cantidad de datos a enviar (por ejemplo, los últimos 100)
    const limitedData = distributedData.slice(0, 100);

    res.status(200).json({ data: limitedData });
  } catch (error) {
    console.error('Error al obtener las lecturas de temperatura:', error);
    res.status(500).json({ message: 'Error al obtener las lecturas de temperatura' });
  }
});

app.listen(port, () => {
  console.log(`Servidor API REST escuchando en el puerto ${port}`);
});

function getDistributedSamples(samples, numSamples) {
  let distributedSamples = [];
  let totalSamples = samples.length;

  if (totalSamples <= numSamples) {
    return samples; // Si el muestreo no es mayor a 100, no lo procesamos, lo retornamos tal cual está
  }

  let interval = Math.floor((totalSamples - 1) / (numSamples - 1));

  for (let i = 0; i < numSamples - 1; i++) {
      let index = i * interval;
      if (index < totalSamples) {
          distributedSamples.push(samples[index]);
      }
  }

  // Asegura que la ultima muestra esta incluida en el muestreo
  distributedSamples.push(samples[totalSamples - 1]);

  return distributedSamples;
}

 