// Función para obtener el token JWT desde el backend
async function fetchToken() {
  try {
    const response = await fetch('http://localhost:3001/token');
    if (response.ok) {
      const data = await response.json();
      return data.token;
    } else {
      console.error('Error al obtener el token:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error al obtener el token:', error);
    return null;
  }
}

// Función para obtener datos de temperatura
async function getTemperatureData(token) {
  const response = await fetch('http://localhost:5000/temperature-readings', {
    headers: {
      'Authorization': `Bearer ${token}` 
    }
  });

  const data = await response.json();

  if (response.ok) {
    return data.data; 
  } else {
    console.error('Error al obtener datos de temperatura:', response.statusText);
    return []; // Retornar un array vacío si hay un error
  }
}

// Función para crear el gráfico
async function createChart() {
  console.log('calling createChart')
  const token = await fetchToken(); // Obtener el token
  if (!token) {
    console.error('No se pudo obtener el token JWT');
    return;
  }

  const temperatureData = await getTemperatureData(token);

  // Ordenamos la temperatura de forma descendente:
  // Usa "sort" para ordenar el array de temperaturas (temperatureData) de forma descendente según el valor de timestamp
  temperatureData.sort((a, b) => a.timestamp - b.timestamp); // Ordenar los datos por timestamp

  const limitedData = temperatureData.slice(temperatureData.length - 10); // Obtener los últimos 10 datos
  // slice toma un array y devuelve un subconjunto de los elementos que cumplen cierta condición.

  const labels = temperatureData.map(reading => new Date(reading.timestamp).toLocaleString()); // Convertir timestamps a formato legible
  const values = temperatureData.map(reading => reading.temperature); // Obtener los valores de temperatura

  const data = {
    labels: labels,
    datasets: [{
      label: 'Temperatura',
      data: values,
      backgroundColor: 'rgba(54, 162, 235, 0.2)', // Nuevo color de fondo (azul claro)
      borderColor: 'rgba(54, 162, 235, 1)', // Nuevo color de borde (azul)
      borderWidth: 1
    }]
  };

  const options = {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      scales: {
        y: {
          min: 0, // Valor mínimo del eje Y
          max: 46, // Valor máximo del eje Y
          ticks: {
            stepSize: 5 // Incremento entre cada valor del eje Y
          }
        }
      }
    }
  };

  const ctx = document.getElementById('chart-container').getContext('2d');

  // Destruye el chart actual
  if (window.myChart !== undefined) {
    window.myChart.destroy();
  }

  window.myChart = new Chart(ctx, options);
}

// Iniciar el proceso para crear el gráfico
document.addEventListener('DOMContentLoaded', function() {
  createChart();

  setInterval(function() {
    createChart(); // Recarga el chart
  }, 5000);
})