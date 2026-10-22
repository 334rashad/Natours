import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import AppError from '../utils/appError.js';

const rootDir = import.meta.dirname;
const toursFile = `${rootDir}/../dev-data/data/tours.json`;
const tours = JSON.parse(readFileSync(toursFile, 'utf-8'));

const saveTours = () => writeFile(toursFile, JSON.stringify(tours, null, 2));

// Throws a 404 AppError when no tour matches the id
const findTourIndex = (id) => {
  const index = tours.findIndex((t) => t._id === id);
  if (index === -1) throw new AppError('Tour not found', 404);
  return index;
};

const findTour = (id) => tours[findTourIndex(id)];

// Router param middleware: stops the request with a 404 before the handler runs
export const checkId = (req, res, next, id) => {
  console.log(`Tour ID: ${id}`);
  if (!tours.some((t) => t._id === id))
    return next(new AppError('Tour not found', 404));
  next();
};

export const checkBody = (req, res, next) => {
  if (!req.body) return next(new AppError('Request body is empty', 400));
  if (!req.body.name) return next(new AppError('Tour name is required', 400));
  next();
};

export const checkUpdateBody = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0)
    return next(new AppError('Request body is empty', 400));
  if ('_id' in req.body)
    return next(new AppError('Tour _id cannot be changed', 400));
  if (
    'name' in req.body &&
    (typeof req.body.name !== 'string' || !req.body.name.trim())
  )
    return next(new AppError('Tour name must be a non-empty string', 400));
  if (
    'price' in req.body &&
    (typeof req.body.price !== 'number' || req.body.price < 0)
  )
    return next(new AppError('Tour price must be a non-negative number', 400));
  next();
};

export const getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
};

export const getTour = (req, res) => {
  const tour = findTour(req.params.id);
  res.status(200).json({ status: 'success', data: { tour } });
};

export const updateTour = async (req, res) => {
  const tour = findTour(req.params.id);
  Object.assign(tour, req.body);
  await saveTours();
  res.status(200).json({ status: 'success', data: { tour } });
};

export const deleteTour = async (req, res) => {
  tours.splice(findTourIndex(req.params.id), 1);
  await saveTours();
  res.status(204).end();
};

export const createTour = async (req, res) => {
  const newTour = req.body;
  tours.push(newTour);
  await saveTours();
  res.status(201).json({ status: 'success', data: { tour: newTour } });
};
