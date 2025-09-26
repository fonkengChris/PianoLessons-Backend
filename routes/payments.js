import express from "express";
import auth from "../middleware/auth.js";
import { Payment } from "../models/payment.js";
import { Subscription } from "../models/subscription.js";
import { User } from "../models/user.js";
import { PayPalService } from "../services/paypalService.js";
import { MTNMobileMoneyService } from "../services/mtnMobileMoneyService.js";

const router = express.Router();

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  basic: {
    name: "Basic",
    price: 9.99,
    currency: "USD",
    duration: 30, // days
    features: ["Access to all courses", "Basic support", "No ads"]
  },
  pro: {
    name: "Pro", 
    price: 19.99,
    currency: "USD",
    duration: 30, // days
    features: ["Everything in Basic", "Priority support", "Downloadable content"]
  }
};

// Get available payment methods
router.get("/methods", (req, res) => {
  res.json({
    methods: [
      {
        id: "paypal",
        name: "PayPal",
        description: "Pay securely with PayPal",
        icon: "paypal",
        supported: true
      },
      {
        id: "mtn_mobile_money",
        name: "MTN Mobile Money",
        description: "Pay with MTN Mobile Money (Cameroon)",
        icon: "mobile",
        supported: true
      }
    ]
  });
});

// Get subscription plans
router.get("/plans", (req, res) => {
  res.json({
    plans: Object.entries(SUBSCRIPTION_PLANS).map(([id, plan]) => ({
      id,
      ...plan
    }))
  });
});

// Create PayPal payment
router.post("/paypal/create", auth, async (req, res) => {
  try {
    const { planId } = req.body;
    
    if (!SUBSCRIPTION_PLANS[planId]) {
      return res.status(400).json({ error: "Invalid plan ID" });
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    
    // Create PayPal order
    const paypalResult = await PayPalService.createOrder(
      plan.price,
      plan.currency,
      `${plan.name} Subscription - Piano Lessons`
    );

    if (!paypalResult.success) {
      return res.status(400).json({ error: paypalResult.error });
    }

    // Create payment record
    const payment = new Payment({
      userId: req.user._id,
      amount: plan.price,
      currency: plan.currency,
      paymentMethod: "paypal",
      status: "pending",
      paymentDetails: {
        paypalOrderId: paypalResult.orderId
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        country: req.get('CF-IPCountry') || 'Unknown'
      }
    });

    await payment.save();

    res.json({
      paymentId: payment._id,
      orderId: paypalResult.orderId,
      approvalUrl: paypalResult.approvalUrl
    });
  } catch (error) {
    console.error("PayPal create payment error:", error);
    res.status(500).json({ error: "Failed to create PayPal payment" });
  }
});

// Capture PayPal payment
router.post("/paypal/capture", auth, async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;

    // Get payment record
    const payment = await Payment.findOne({
      _id: paymentId,
      userId: req.user._id,
      status: "pending"
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Capture PayPal order
    const captureResult = await PayPalService.captureOrder(orderId);

    if (!captureResult.success) {
      return res.status(400).json({ error: captureResult.error });
    }

    // Update payment record
    payment.status = "completed";
    payment.externalPaymentId = captureResult.transactionId;
    payment.paymentDetails.paypalPayerId = captureResult.payerId;
    payment.completedAt = new Date();
    await payment.save();

    // Create subscription
    const plan = SUBSCRIPTION_PLANS[req.body.planId];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    const subscription = new Subscription({
      userId: req.user.id,
      planId: req.body.planId,
      endDate,
      status: "active",
      paymentId: payment._id
    });

    await subscription.save();

    // Update user subscription status
    await User.findByIdAndUpdate(req.user._id, { subscriptionActive: true });

    res.json({
      success: true,
      paymentId: payment._id,
      subscriptionId: subscription._id,
      transactionId: captureResult.transactionId
    });
  } catch (error) {
    console.error("PayPal capture payment error:", error);
    res.status(500).json({ error: "Failed to capture PayPal payment" });
  }
});

// Create MTN Mobile Money payment
router.post("/mtn/create", auth, async (req, res) => {
  try {
    const { planId, phoneNumber } = req.body;
    
    if (!SUBSCRIPTION_PLANS[planId]) {
      return res.status(400).json({ error: "Invalid plan ID" });
    }

    if (!MTNMobileMoneyService.validateCameroonPhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: "Invalid Cameroon phone number format" });
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    const formattedPhone = MTNMobileMoneyService.formatPhoneNumber(phoneNumber);
    
    // Create payment record first
    const payment = new Payment({
      userId: req.user._id,
      amount: plan.price,
      currency: plan.currency,
      paymentMethod: "mtn_mobile_money",
      status: "pending",
      paymentDetails: {
        mtnPhoneNumber: formattedPhone
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        country: req.get('CF-IPCountry') || 'CM'
      }
    });

    await payment.save();

    // Request payment from MTN
    const mtnService = new MTNMobileMoneyService();
    const mtnResult = await mtnService.requestPayment(
      plan.price,
      formattedPhone,
      payment._id.toString(),
      `${plan.name} Subscription - Piano Lessons`
    );

    if (!mtnResult.success) {
      payment.status = "failed";
      await payment.save();
      return res.status(400).json({ error: mtnResult.error });
    }

    // Update payment with MTN transaction details
    payment.paymentDetails.mtnTransactionId = mtnResult.transactionId;
    payment.paymentDetails.mtnReference = mtnResult.transactionId;
    await payment.save();

    res.json({
      paymentId: payment._id,
      transactionId: mtnResult.transactionId,
      status: mtnResult.status,
      phoneNumber: formattedPhone,
      amount: mtnResult.amount,
      currency: mtnResult.currency
    });
  } catch (error) {
    console.error("MTN create payment error:", error);
    res.status(500).json({ error: "Failed to create MTN Mobile Money payment" });
  }
});

// Check MTN Mobile Money payment status
router.post("/mtn/status", auth, async (req, res) => {
  try {
    const { paymentId } = req.body;

    const payment = await Payment.findOne({
      _id: paymentId,
      userId: req.user._id
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.paymentMethod !== "mtn_mobile_money") {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    const mtnService = new MTNMobileMoneyService();
    const statusResult = await mtnService.getPaymentStatus(
      payment.paymentDetails.mtnTransactionId
    );

    if (!statusResult.success) {
      return res.status(400).json({ error: statusResult.error });
    }

    // Update payment status based on MTN response
    if (statusResult.status === "SUCCESSFUL" && payment.status === "pending") {
      payment.status = "completed";
      payment.completedAt = new Date();
      await payment.save();

      // Create subscription
      const subscription = await Subscription.findOne({ paymentId: payment._id });
      if (subscription) {
        subscription.status = "active";
        await subscription.save();

        // Update user subscription status
        await User.findByIdAndUpdate(req.user._id, { subscriptionActive: true });
      }
    } else if (statusResult.status === "FAILED" && payment.status === "pending") {
      payment.status = "failed";
      await payment.save();
    }

    res.json({
      paymentId: payment._id,
      status: statusResult.status,
      paymentStatus: payment.status,
      amount: statusResult.amount,
      currency: statusResult.currency
    });
  } catch (error) {
    console.error("MTN status check error:", error);
    res.status(500).json({ error: "Failed to check payment status" });
  }
});

// Get payment history for user
router.get("/history", auth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ payments });
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({ error: "Failed to get payment history" });
  }
});

// Get payment details
router.get("/:paymentId", auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.paymentId,
      userId: req.user._id
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json({ payment });
  } catch (error) {
    console.error("Get payment details error:", error);
    res.status(500).json({ error: "Failed to get payment details" });
  }
});

export default router;
