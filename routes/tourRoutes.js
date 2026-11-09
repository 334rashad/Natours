import express from 'express';
import {
  getAllTours,
  getTour,
  updateTour,
  deleteTour,
  createTour,
  checkUpdateBody,
  aliasTopTours,
  getTourStats,
} from '../controller/tourController.js';

const tourRouter = express.Router();

tourRouter.route('/top-5-cheap').get(aliasTopTours, getAllTours);

tourRouter.route('/tour-stats').get(getTourStats);

tourRouter.route('/').get(getAllTours).post(createTour);
tourRouter
  .route('/:id')
  .get(getTour)
  .patch(checkUpdateBody, updateTour)
  .delete(deleteTour);

export default tourRouter;
