const app = require('./app');
const connectMongo = require('./config/mongo');
const { port } = require('./config/env');

connectMongo()
  .then(() => app.listen(port, () => console.log(`API running on :${port}`)))
  .catch((err) => {
    console.error('Mongo connection failed', err);
    process.exit(1);
  });
