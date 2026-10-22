import express from 'express';
import { userNotImplemented } from '../controller/userController.js';

const userRouter = express.Router();

userRouter.route('/').get(userNotImplemented).post(userNotImplemented);
userRouter
  .route('/:id')
  .get(userNotImplemented)
  .patch(userNotImplemented)
  .delete(userNotImplemented);

export default userRouter;
