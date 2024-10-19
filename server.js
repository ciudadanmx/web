const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());

// Ruta para el webhook
app.post('/webhook', (req, res) => {
  // Verifica el evento de GitHub
  if (req.body.ref === 'refs/heads/main') {
    console.log('Webhook recibido: nuevo push en main');

    // Comando a ejecutar
    const command = `
      cd /www/wwwroot/ciudadan.org/ciudadan-web/web &&
      git pull origin main &&
      npm install &&
      npm run build &&
      pm2 restart ciudadan-server
    `;

    // Ejecutar el comando
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar el comando: ${error}`);
        return res.status(500).send('Error en la construcción');
      }
      console.log(`STDOUT: ${stdout}`);
      console.error(`STDERR: ${stderr}`);
      return res.status(200).send('Construcción completada');
    });
  } else {
    return res.status(200).send('Evento no relevante');
  }
});

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
