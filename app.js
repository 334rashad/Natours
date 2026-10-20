const fs = require('fs');
const express = require('express');

if (fs.existsSync(`${__dirname}/.env`)) {
  process.loadEnvFile(`${__dirname}/.env`);
}

const app = express();

const port = 3000;

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours.json`),
);

app.use(express.static(`${__dirname}/public`));

// The Mapbox key is meant for the browser, so sending it to the client is intentional.
app.get('/config.js', (req, res) => {
  res
    .type('application/javascript')
    .send(
      `window.MAPBOX_API_KEY = ${JSON.stringify(process.env.MAPBOX_API_KEY || '')};`,
    );
});

app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

app.listen(port, () => {
  console.log(`App running on port ${port}!!!`);
});

module.exports = app;
