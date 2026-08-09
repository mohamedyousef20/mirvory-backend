const axios = require('axios');
const Order = require('../models/order.model.js');

// Paymob configuration
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_FRAME_ID = process.env.PAYMOB_FRAME_ID;

// Create Paymob payment session
export const createPaymobPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Create Paymob payment session
    const response = await axios.post('https://accept.paymob.com/api/v3/paymentsession', {
      auth_token: PAYMOB_API_KEY,
      delivery_needed: "false",
      amount_cents: amount * 100, // Convert to cents
      currency: "EGP",
      items: [],
      shipping_data: {
        first_name: order.buyer.name,
        last_name: "",
        email: order.buyer.email,
        street: order.deliveryAddress,
        building: "",
        floor: "",
        apartment: "",
        postal_code: "",
        city: "",
        country: "EG",
        phone_number: order.buyer.phone
      },
      billing_data: {
        first_name: order.buyer.name,
        last_name: "",
        email: order.buyer.email,
        street: order.deliveryAddress,
        building: "",
        floor: "",
        apartment: "",
        postal_code: "",
        city: "",
        country: "EG",
        phone_number: order.buyer.phone
      },
      integration_id: PAYMOB_INTEGRATION_ID,
      lock_order_when_paid: "true"
    });

    const { token } = response.data;
    
    // Update order payment method and status
    await Order.findByIdAndUpdate(orderId, {
      paymentMethod: 'card',
      paymentStatus: 'pending',
      paymentData: {
        paymobToken: token
      }
    });

    res.json({
      success: true,
      token,
      frameUrl: `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_FRAME_ID}?payment_token=${token}`
    });
  } catch (error) {
    console.error('Paymob payment error:', error);
    res.status(500).json({ message: 'Payment processing failed' });
  }
};

// Verify Paymob payment
export const verifyPaymobPayment = async (req, res) => {
  try {
    const { orderId, paymobToken } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify payment status with Paymob
    const response = await axios.get(`https://accept.paymob.com/api/v3/acceptance/payments/${paymobToken}`, {
      headers: {
        'Authorization': `Bearer ${PAYMOB_API_KEY}`
      }
    });

    const { status } = response.data;
    
    // Update order payment status
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: status === 'captured' ? 'completed' : 'failed'
    });

    res.json({
      success: true,
      status,
      message: status === 'captured' ? 'Payment successful' : 'Payment failed'
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};
