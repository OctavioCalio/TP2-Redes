const express = require('express');
const WebSocket = require('ws');
const axios = require('axios');

const app = express();
const port = 8080;

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
  console.log('Cliente conectado al WebSocket');
  ws.on('message', function incoming(message) {
    const data = JSON.parse(message);
    console.log('Recibido:', message);

    axios.post('http://localhost:3001/webhook', data)
      .then(response => {
        console.log('Datos enviados al webhook con éxito:', response.data);
      })
      .catch(error => {
        console.error('Error de envio datos al webhook:', error);
      });
  });
});

console.log('Servidor WebSocket ejecutándose en el puerto 8080');
