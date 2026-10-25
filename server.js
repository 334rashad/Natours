import mongoose from 'mongoose';
import app from './app.js';

mongoose
  .connect(process.env.DATABASE_URL, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => console.log('Database connected successfully'))
  .catch((err) => console.error('Database connection error:', err));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`App running on port ${port}!!!`);
});
