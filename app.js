import express from 'express';
import morgan from 'morgan';
import tourRouter from './routes/tourRoutes.js';
import userRouter from './routes/userRoutes.js';

// ===== Configuration =====
const rootDir = import.meta.dirname;

// ===== App & Middleware =====
const app = express();

app.use(morgan('dev'));
app.use(express.static(`${rootDir}/public`));
app.use(express.json());

// ===== Routes =====
// The Mapbox key is meant for the browser, so sending it to the client is intentional.
app.get('/config.js', (req, res) => {
  const key = process.env.MAPBOX_API_KEY ?? '';
  res
    .type('application/javascript')
    .send(`window.MAPBOX_API_KEY = ${JSON.stringify(key)};`);
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

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

export default app;
