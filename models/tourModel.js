import mongoose from 'mongoose';

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tour name is required'],
    unique: true,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  price: {
    type: Number,
    required: [true, 'Tour price is required'],
  },
});

export const Tour = mongoose.model('Tour', tourSchema);

// const testTour = new Tour({
//   name: 'City tour',
//   rating: 4.7,
//   price: 199,
// });

// testTour
//   .save()
//   .then((entry) => console.log('Test tour saved successfully', entry))
//   .catch((err) => console.error('Error saving test tour:', err));
