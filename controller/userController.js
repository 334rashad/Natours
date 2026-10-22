export const userNotImplemented = (req, res) => {
  res.status(501).json({
    status: 'fail',
    message: 'This route is not implemented yet',
  });
};
