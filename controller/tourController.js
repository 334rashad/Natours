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
