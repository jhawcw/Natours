const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourID);

  const transformedItems = [
    {
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: tour.price * 100,
        product_data: {
          name: `${tour.name} Tour`,
          description: tour.description, //description here
          images: [`https://www.natours.dev/img/tours/${tour.imageCover}`], //only accepts live images (images hosted on the internet),
        },
      },
    },
  ];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/`, //user will be redirected to this url when payment is successful. home page
    // cancel_url: `${req.protocol}://${req.get('host')}/${tour.slug}`, //user will be redirected to this url when payment has an issue. tour page (previous page)
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourID
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID, //this field allows us to pass in some data about this session that we are currently creating.
    line_items: transformedItems,
    mode: 'payment',
  });

  //   const session = await stripe.checkout.sessions.create({
  //     payment_method_types: ['card'],
  //     success_url: `${req.protocol}://${req.get('host')}/`,
  //     cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
  //     customer_email: req.user.email,
  //     client_reference_id: req.params.tourID,
  //     line_items: [
  //       {
  //         name: `${tour.name} Tour`,
  //         description: tour.summary,
  //         images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
  //         amount: tour.price * 100,
  //         currency: 'sgd',
  //         quantity: 1,
  //       },
  //     ],
  //   });
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  //temporary
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
