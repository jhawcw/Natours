import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51MxWCNFEkM4OvoccHLFTfB9qd8F2arAWxH12NoyVXHTSfmcAAW8QecxfGQp2Z3iy5HArjE20dL5EoN7QUTwRxUap00Gflvt1um'
);

export const bookTour = async (tourId) => {
  try {
    // 1) get checkout session from API
    const session = await axios(
      `http://127.0.0.1:8098/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
    // 2) create checkout form + charge credit card
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
