const express = require('express');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.use(express.json());

app.use('/auth', require('./routes/auth.routes'));
app.use('/bookings', require('./routes/booking.routes'));
app.use('/artists', require('./routes/artist.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
