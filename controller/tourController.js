import AppError from '../utils/appError.js';
import { Tour } from '../models/tourModel.js';

const tourNotFound = () => new AppError('Tour not found', 404);

// Malformed IDs and failed validation are client errors; anything else stays a server error
const toAppError = (err) =>
  err.name === 'CastError' || err.name === 'ValidationError'
    ? new AppError(err.message, 400)
    : err;

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

export const getAllTours = async (req, res, next) => {
  try {
    const tours = await Tour.find();
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: { tours },
    });
  } catch (err) {
    next(toAppError(err));
  }
};

export const getTour = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return next(tourNotFound());
    res.status(200).json({ status: 'success', data: { tour } });
  } catch (err) {
    next(toAppError(err));
  }
};

export const updateTour = async (req, res, next) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!tour) return next(tourNotFound());
    res.status(200).json({ status: 'success', data: { tour } });
  } catch (err) {
    next(toAppError(err));
  }
};

export const deleteTour = async (req, res, next) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) return next(tourNotFound());
    res.status(204).end();
  } catch (err) {
    next(toAppError(err));
  }
};

export const createTour = async (req, res, next) => {
  try {
    const tour = await Tour.create(req.body);
    res.status(201).json({ status: 'success', data: { tour } });
  } catch (err) {
    next(toAppError(err));
  }
};
