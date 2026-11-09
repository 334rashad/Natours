import AppError from '../utils/appError.js';
import { Tour } from '../models/tourModel.js';

const tourNotFound = () => new AppError('Tour not found', 404);

// Malformed IDs and failed validation are client errors; anything else stays a server error
const toAppError = (err) =>
  err.name === 'CastError' || err.name === 'ValidationError'
    ? new AppError(err.message, 400)
    : err;

export const aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
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

const comparisonOperators = ['gt', 'gte', 'lt', 'lte'];

// Builds a filter from schema fields and explicitly supported query operators.
const toFilterCondition = (key, value) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every((v) => typeof v === 'string'))
    return { $in: value };
  if (value && typeof value === 'object') {
    const conditions = Object.entries(value);
    if (
      conditions.length > 0 &&
      conditions.every(
        ([operator, operand]) =>
          comparisonOperators.includes(operator) && typeof operand === 'string',
      )
    )
      return conditions.reduce(
        (filter, [operator, operand]) => ({
          ...filter,
          [`$${operator}`]: operand,
        }),
        {},
      );
  }
  throw new AppError(`Invalid value for query parameter '${key}'`, 400);
};

const buildTourFilter = (query) =>
  Object.entries(query)
    .filter(([key]) => Tour.schema.path(key))
    .reduce(
      (filter, [key, value]) => ({
        ...filter,
        [key]: toFilterCondition(key, value),
      }),
      {},
    );

const DEFAULT_SORT = { createdAt: -1 };

// Accepts `sort=price,-ratingsAverage`: fields apply in order, a leading '-' sorts descending.
const buildTourSort = (sortParam) => {
  if (sortParam === undefined) return DEFAULT_SORT;
  if (typeof sortParam !== 'string')
    throw new AppError(
      "Query parameter 'sort' must be a comma-separated list",
      400,
    );

  const entries = sortParam
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (entries.length === 0) return DEFAULT_SORT;

  return entries.reduce((sort, entry) => {
    const descending = entry.startsWith('-');
    const field = descending ? entry.slice(1) : entry;
    if (!Object.hasOwn(Tour.schema.paths, field))
      throw new AppError(`Cannot sort tours by unknown field '${field}'`, 400);
    return { ...sort, [field]: descending ? -1 : 1 };
  }, {});
};

// Accepts `fields=name,price` to include fields or `fields=-description` to exclude them.
// Mixing both forms is rejected because MongoDB projections can't combine them.
const buildTourProjection = (fieldsParam) => {
  if (fieldsParam === undefined) return undefined;
  if (typeof fieldsParam !== 'string')
    throw new AppError(
      "Query parameter 'fields' must be a comma-separated list",
      400,
    );

  const entries = fieldsParam
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (entries.length === 0) return undefined;

  const excluding = entries[0].startsWith('-');
  if (entries.some((entry) => entry.startsWith('-') !== excluding))
    throw new AppError(
      "Query parameter 'fields' cannot mix included and excluded fields",
      400,
    );

  return entries.reduce((projection, entry) => {
    const field = excluding ? entry.slice(1) : entry;
    if (!Object.hasOwn(Tour.schema.paths, field))
      throw new AppError(`Cannot select unknown tour field '${field}'`, 400);
    return { ...projection, [field]: excluding ? 0 : 1 };
  }, {});
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const parsePositiveInteger = (key, value, fallback) => {
  if (value === undefined) return fallback;
  const number = Number(value);
  if (
    typeof value !== 'string' ||
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(number) ||
    number < 1
  )
    throw new AppError(
      `Query parameter '${key}' must be a positive integer`,
      400,
    );
  return number;
};

export const getAllTours = async (req, res, next) => {
  try {
    const { sort, fields, page, limit, ...queryObj } = req.query;
    const filter = buildTourFilter(queryObj);
    const currentPage = parsePositiveInteger('page', page, DEFAULT_PAGE);
    const pageSize = parsePositiveInteger('limit', limit, DEFAULT_LIMIT);
    if (pageSize > MAX_LIMIT)
      throw new AppError(
        `Query parameter 'limit' cannot exceed ${MAX_LIMIT}`,
        400,
      );

    const sortSpec = buildTourSort(sort);

    const [tours, total] = await Promise.all([
      // _id is a unique tiebreaker so page boundaries stay stable when sort values repeat.
      Tour.find(filter, buildTourProjection(fields))
        .sort({ ...sortSpec, _id: sortSpec._id ?? 1 })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize),
      Tour.countDocuments(filter),
    ]);

    res.status(200).json({
      status: 'success',
      results: tours.length,
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      data: { tours },
    });
  } catch (err) {
    next(toAppError(err));
  }
};

export const getTour = async (req, res, next) => {
  try {
    const tour = await Tour.findById(
      req.params.id,
      buildTourProjection(req.query.fields),
    );
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

export const getTourStats = async (req, res, next) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } }, // filter
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
      {
        $match: { _id: { $ne: 'EASY' } },
      },
    ]);
    res.status(200).json({ status: 'success', data: { stats } });
  } catch (err) {
    next(toAppError(err));
  }
};
