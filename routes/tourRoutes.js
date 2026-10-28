import express from 'express';
import {
  getAllTours,
  getTour,
  updateTour,
  deleteTour,
  createTour,
  checkUpdateBody,
} from '../controller/tourController.js';

const tourRouter = express.Router();

tourRouter.route('/').get(getAllTours).post(createTour);
tourRouter
  .route('/:id')
  .get(getTour)
  .patch(checkUpdateBody, updateTour)
  .delete(deleteTour);

export default tourRouter;
