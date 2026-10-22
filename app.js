// ===== Imports =====
import { existsSync, readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import express from 'express';
import morgan from 'morgan';

// ===== Configuration =====
const rootDir = import.meta.dirname;
const toursFile = `${rootDir}/dev-data/data/tours.json`;
const port = 3000;

// Load .env before any code reads process.env
if (existsSync(`${rootDir}/.env`)) {
  process.loadEnvFile(`${rootDir}/.env`);
}

// ===== Data =====
// Tours live in memory and are written back to the JSON file after each change
const tours = JSON.parse(readFileSync(toursFile, 'utf-8'));

const saveTours = () => writeFile(toursFile, JSON.stringify(tours, null, 2));

// ===== Helpers =====
// Error with an HTTP status code; the error middleware at the bottom sends it
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Throws a 404 AppError when no tour matches the id
const findTourIndex = (id) => {
  const index = tours.findIndex((t) => t._id === id);
  if (index === -1) throw new AppError('Tour not found', 404);
  return index;
};

const findTour = (id) => tours[findTourIndex(id)];

// ===== App & Middleware =====
const app = express();

app.use(morgan('dev'));
app.use(express.static(`${rootDir}/public`));
app.use(express.json());

// ===== Tour Handlers =====
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

// ===== User Handlers (placeholders) =====
const userNotImplemented = (req, res) => {
  res.status(501).json({
    status: 'fail',
    message: 'This route is not implemented yet',
  });
};

// ===== Routes =====
// The Mapbox key is meant for the browser, so sending it to the client is intentional.
app.get('/config.js', (req, res) => {
  const key = process.env.MAPBOX_API_KEY ?? '';
  res
    .type('application/javascript')
    .send(`window.MAPBOX_API_KEY = ${JSON.stringify(key)};`);
});

app.route('/api/v1/tours').get(getAllTours).post(createTour);
app
  .route('/api/v1/tours/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

app.route('/api/v1/users').get(userNotImplemented).post(userNotImplemented);
app
  .route('/api/v1/users/:id')
  .get(userNotImplemented)
  .patch(userNotImplemented)
  .delete(userNotImplemented);

// ===== Error Handling =====
// Reached only when no route above responded
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Cannot find ${req.originalUrl} on this server`,
  });
});

// Four parameters tell Express this is error middleware, so `next` must stay
app.use((err, req, res, next) => {
  const statusCode = err.statusCode ?? 500;
  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message: err.message,
  });
});

// ===== Server =====
app.listen(port, () => {
  console.log(`App running on port ${port}!!!`);
});

export default app;
