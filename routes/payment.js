const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');

// Initialize Razorpay with your key_id and key_secret
const razorpay = new Razorpay({
  key_id: 'rzp_test_IHNgTrPlh4dObz',
  key_secret: 'G0hcDaKdyPCUX4dZcVlcGdyO',
});

// Endpoint to initiate payment
router.post('/create-payment', async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;

    const paymentOptions = {
      amount,       // Amount in paise
      currency,
      receipt,      // A unique order ID
      notes,
    };

    const response = await razorpay.orders.create(paymentOptions);

    res.json({
      orderId: response.id,
      amount: response.amount,
      currency: response.currency,
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to verify payment success
router.post('/verify-payment', async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    const expectedSignature = razorpay.webhooks.generateSignature(
      orderId + '|' + paymentId,
      'YOUR_RAZORPAY_WEBHOOK_SECRET'
    );

    if (expectedSignature === signature) {
      // Payment is verified
      res.json({ verified: true });
    } else {
      // Invalid signature
      res.json({ verified: false });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
