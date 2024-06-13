const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.onopen = function open() {
  console.log('Conexión WebSocket abierta');
  setInterval(() => {
    const temperature = (Math.random() * 30).toFixed(2);
    const timestamp = Math.floor(new Date().getTime() / 1000); 
    const data = JSON.stringify({ temperature, timestamp });
    console.log('Mandando: %s', data); 
    ws.send(data);
  }, 5000);
};

ws.onmessage = function incoming(event) {
  console.log('Received: %s', event.data);
};
