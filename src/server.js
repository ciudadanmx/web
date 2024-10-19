const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());

// Función para manejar el logging
const logToFile = (message) => {
    fs.appendFile('webhook.log', `${new Date().toISOString()} - ${message}\n`, (err) => {
        if (err) console.error('Error escribiendo en el log:', err);
    });
};

// Endpoint para manejar el webhook de GitHub
app.post('/webhook', (req, res) => {
    const event = req.headers['x-github-event'];
    const ref = req.body.ref;

    if (event === 'push' && ref === 'refs/heads/main') {
        exec('cd /www/wwwroot/ciudadan.org/ciudadan-web/web && git pull origin main && npm install && npm run build', (error, stdout, stderr) => {
            if (error) {
                logToFile(`Error: ${error.message}`);
                return res.status(500).send('Error en la construcción');
            }
            if (stderr) {
                logToFile(`stderr: ${stderr}`);
                return res.status(500).send('Error en la construcción');
            }
            logToFile(`stdout: ${stdout}`);
            res.status(200).send('Construcción completada');
        });
    } else {
        logToFile('No es un evento de push en la rama main');
        res.status(200).send('No es un evento de push en la rama main');
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
