const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3001;

let jwtToken = null; // Variable global para almacenar el token

// Middleware para analizar cuerpos JSON
app.use(express.json());
app.use(cors());

// Función para obtener un token JWT válido
async function getToken() {
  try {
    const response = await axios.post('http://localhost:5000/login', {
      username: 'usuario',
      password: 'contraseña'
    });
    jwtToken = response.data.token; // Almacenar el token en la variable global
    return jwtToken;
  } catch (error) {
    console.error('Error al obtener el token JWT:', error);
    return null;
  }
}

// Endpoint para el webhook
app.post('/webhook', async (req, res) => {
  console.log('Recibido webhook:', req.body);
  const { timestamp, temperature } = req.body;

  // Obtener un token JWT válido
  const token = await getToken();

  if (!token) {
    console.error('No se pudo obtener un token JWT válido');
    res.status(500).send('Error procesando el webhook');
    return;
  }

  // Reenviar datos a la API incluyendo el token JWT en el encabezado Authorization
  axios.post('http://localhost:5000/temperature-readings', { timestamp, temperature }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => {
      console.log('Datos enviados a la API con éxito:', response.data);
      res.status(200).send('Webhook recibido');
    })
    .catch(error => {
      console.error('Error enviando datos a la API:', error);
      res.status(500).send('Error procesando el webhook');
    });
});

// Endpoint para obtener el token desde el frontend
app.get('/token', (req, res) => {
  if (jwtToken) {
    res.json({ token: jwtToken });
  } else {
    res.status(500).send('Token no disponible');
  }
});

app.listen(port, () => {
  console.log(`Servidor webhook escuchando en el puerto ${port}`);
});

