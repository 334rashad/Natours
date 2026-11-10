import mongoose from 'mongoose';

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tour name is required'],
      unique: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'Tour duration is required'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Tour max group size is required'],
    },
    difficulty: {
      type: String,
      required: [true, 'Tour difficulty is required'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Tour price is required'],
    },
    priceDiscount: {
      type: Number,
      default: 0,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'Tour summary is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'Tour cover image is required'],
    },
    images: {
      type: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    startDates: {
      type: [Date],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

export const Tour = mongoose.model('Tour', tourSchema);
