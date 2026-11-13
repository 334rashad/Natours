import mongoose from 'mongoose';
import slugify from 'slugify';

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tour name is required'],
      unique: true,
      trim: true,
      maxLength: [40, 'Tour name must have at most 40 characters'],
      minLength: [5, 'Tour name must have at least 5 characters'],
    },
    slug: {
      type: String,
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
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be either easy, medium, or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
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
      validate: {
        validator: function (value) {
          // On update queries `this` is the Query, so the update hook below does this check instead
          if (this instanceof mongoose.Query) return true;
          return value < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
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
    secretTour: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual property for duration in weeks
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Query middleware to exclude secret tours from find queries
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function () {
  this.startTime = Date.now();
  this.find({ secretTour: { $ne: true } });
});

// Post query middleware to log query execution time
tourSchema.post(/^find/, function () {
  if (this.startTime === undefined) return;
  console.log(`Query took ${Date.now() - this.startTime} milliseconds`);
});

// Count only visible tours so `total` matches the tours returned
tourSchema.pre('countDocuments', function () {
  this.startTime = Date.now();
  this.find({ secretTour: { $ne: true } });
});

//Aggregate middleware to exclude secret tours from aggregation results
tourSchema.pre('aggregate', function () {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
});

// Builds the URL-friendly slug used by the save, update, and bulk insert hooks
const makeSlug = (name) => slugify(name, { lower: true, strict: true });

// Document middleware: builds a URL-friendly slug whenever a tour is created or renamed
tourSchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = makeSlug(this.name);
  }
});

// Query middleware: keeps the slug in sync when a tour is renamed through an update query
tourSchema.pre(['findOneAndUpdate', 'updateOne'], function () {
  const update = this.getUpdate();
  const name = update?.name ?? update?.$set?.name;
  if (typeof name === 'string') this.set({ slug: makeSlug(name) });
});

// Query middleware: checks the discount against the price on update queries
tourSchema.pre(['findOneAndUpdate', 'updateOne'], async function () {
  const update = this.getUpdate() ?? {};
  const changes = { ...update, ...update.$set };
  const hasPrice = changes.price !== undefined;
  const hasDiscount = changes.priceDiscount !== undefined;
  if (!hasPrice && !hasDiscount) return;

  // Raw collection avoids the secret-tour filter so secret tours are checked too
  const stored = await this.model.collection.findOne(this.getQuery(), {
    projection: { price: 1, priceDiscount: 1 },
  });
  if (!stored) return;

  const price = hasPrice ? changes.price : stored.price;
  const discount = hasDiscount ? changes.priceDiscount : stored.priceDiscount;
  if (discount < price) return;

  const error = new mongoose.Error.ValidationError();
  error.addError(
    'priceDiscount',
    new mongoose.Error.ValidatorError({
      path: 'priceDiscount',
      value: discount,
      message: `Discount price (${discount}) should be below regular price`,
    }),
  );
  throw error;
});

// Model middleware: insertMany skips save hooks, so bulk inserts set slugs here
tourSchema.pre('insertMany', (docs) => {
  docs.forEach((doc) => {
    if (typeof doc.name === 'string') doc.slug = makeSlug(doc.name);
  });
});

export const Tour = mongoose.model('Tour', tourSchema);
