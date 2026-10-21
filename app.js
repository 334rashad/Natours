import { existsSync, readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import express from 'express';

const rootDir = import.meta.dirname;
const toursFile = `${rootDir}/dev-data/data/tours.json`;
const port = 3000;

if (existsSync(`${rootDir}/.env`)) {
  process.loadEnvFile(`${rootDir}/.env`);
}

const tours = JSON.parse(readFileSync(toursFile, 'utf-8'));

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const saveTours = () => writeFile(toursFile, JSON.stringify(tours, null, 2));

const findTourIndex = (id) => {
  const index = tours.findIndex((t) => t._id === id);
  if (index === -1) throw new AppError('Tour not found', 404);
  return index;
};

const findTour = (id) => tours[findTourIndex(id)];

const app = express();

app.use(express.static(`${rootDir}/public`));
app.use(express.json());

// The Mapbox key is meant for the browser, so sending it to the client is intentional.
app.get('/config.js', (req, res) => {
  const key = process.env.MAPBOX_API_KEY ?? '';
  res
    .type('application/javascript')
    .send(`window.MAPBOX_API_KEY = ${JSON.stringify(key)};`);
});

const getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
};

const getTour = (req, res) => {
  const tour = findTour(req.params.id);
  res.status(200).json({ status: 'success', data: { tour } });
};

const updateTour = async (req, res) => {
  const tour = findTour(req.params.id);
  Object.assign(tour, req.body);
  await saveTours();
  res.status(200).json({ status: 'success', data: { tour } });
};

const deleteTour = async (req, res) => {
  tours.splice(findTourIndex(req.params.id), 1);
  await saveTours();
  res.status(204).end();
};

const createTour = async (req, res) => {
  const newTour = req.body;
  tours.push(newTour);
  await saveTours();
  res.status(201).json({ status: 'success', data: { tour: newTour } });
};

app.route('/api/v1/tours').get(getAllTours).post(createTour);
app.route('/api/v1/tours/:id').get(getTour).patch(updateTour).delete(deleteTour);

app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Cannot find ${req.originalUrl} on this server`,
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode ?? 500;
  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message: err.message,
  });
});

app.listen(port, () => {
  console.log(`App running on port ${port}!!!`);
});

export default app;
