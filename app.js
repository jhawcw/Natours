const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

// Start express app
const app = express();

app.set('view engine', 'pug'); // pug templates are known as view in express
app.set('views', path.join(__dirname, 'views'));

// 1) Global MIDDLEWARE

// Serving static file
app.use(express.static(path.join(__dirname, 'public')));

//security HTTP headers
if (process.env.NODE_ENV === 'production') {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
          baseUri: ["'self'"],
          fontSrc: ["'self'", 'https:', 'http:', 'data:'],
          scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
          imgSrc: ["'self'", 'https: data:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );
}

// app.use(
// helmet({
//   contentSecurityPolicy: false,
//   crossOriginEmbedderPolicy: false,
// })
//     helmet.({
//       contentSecurityPolicy:{
//       directives: {
//         defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
//         baseUri: ["'self'"],
//         fontSrc: ["'self'", 'https:', 'http:', 'data:'],
//         scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
//         styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
//         imgSrc: ["'self'", 'https: data:'],
//       },
//     }
//     ),
//     crossOriginEmbedderPolicy: false,
//   })
//   );
// }
// app.use(helmet()); original

// development logging
//console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// limit request
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, try again in an hour LOL!',
});

app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); //middleware that modify incoming request data, to add the data to the body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NOSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

//prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  console.log(req.cookies);
  console.log('hello from the middleware 😁');
  next();
});

// middleware for testing
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.headers);
  next();
});

// app.get('/', (req, res) => {
//   res.status(200).json({ message: 'HELLO YOUVE MADE IT', app: 'Natours' });
// });

// app.post('/', (req, res) => {
//   res.send('You can post to this endpoint...');
// });

// 2)route handlers

//app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
//app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// 3) ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
