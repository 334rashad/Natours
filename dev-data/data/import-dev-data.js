import fs from 'fs';
import mongoose from 'mongoose';
import { Tour } from '../../models/tourModel.js';

// Parse JSON file into a JS object
const tours = JSON.parse(
  fs.readFileSync(`${import.meta.dirname}/tours-simple.json`, 'utf-8'),
);

const importData = async () => {
  await Tour.create(tours);
  console.log('Data successfully imported');
};

const deleteData = async () => {
  await Tour.deleteMany();
  console.log('Data successfully deleted');
};

const main = async () => {
  const mode = process.argv[2];

  if (mode !== '--import' && mode !== '--delete') {
    console.log('Usage: node import-dev-data.js --import | --delete');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Database connected successfully');

    if (mode === '--import') {
      await importData();
    } else {
      await deleteData();
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

// Usage: node import-dev-data.js --import | --delete
main();
