import express from "express";
import auth from "../middleware/auth.js";
import { Subscription } from "../models/subscription.js";
import { Payment } from "../models/payment.js";
import { User } from "../models/user.js";

const router = express.Router();

// Create subscription (legacy endpoint - now handled by payment routes)
router.post("/", auth, async (req, res) => {
  const { paymentId } = req.body;

  // Calculate end date (e.g., 30 days from now)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const subscription = new Subscription({
    userId: req.user.id,
    planId: "basic", // default plan
    endDate,
    paymentId,
    status: "active"
  });

  await subscription.save();

  // Update user's subscription status
  await User.findByIdAndUpdate(req.user.id, { subscriptionActive: true });

  res.status(201).json(subscription);
});

// Subscribe to a plan (new endpoint)
router.post("/subscribe", auth, async (req, res) => {
  try {
    const { planId, paymentMethod, paymentData } = req.body;

    // This endpoint is now mainly for initiating the payment process
    // The actual subscription creation happens in the payment capture endpoints
    
    res.json({
      message: "Please use the payment endpoints to complete your subscription",
      nextStep: "payment"
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json({ error: "Failed to process subscription" });
  }
});

// Get user's subscription status
router.get("/status", auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user.id,
      status: "active",
      endDate: { $gt: new Date() },
    }).populate('paymentId');

    res.json({
      hasActiveSubscription: !!subscription,
      subscription,
    });
  } catch (error) {
    console.error("Get subscription status error:", error);
    res.status(500).json({ error: "Failed to get subscription status" });
  }
});

// Get all user subscriptions
router.get("/", auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user.id })
      .populate('paymentId')
      .sort({ createdAt: -1 });

    res.json({ subscriptions });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    res.status(500).json({ error: "Failed to get subscriptions" });
  }
});

// Cancel subscription
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: "active"
    });

    if (!subscription) {
      return res.status(404).json({ error: "Active subscription not found" });
    }

    subscription.status = "cancelled";
    subscription.autoRenew = false;
    await subscription.save();

    // Update user's subscription status if this was their only active subscription
    const activeSubscriptions = await Subscription.countDocuments({
      userId: req.user.id,
      status: "active",
      endDate: { $gt: new Date() }
    });

    if (activeSubscriptions === 0) {
      await User.findByIdAndUpdate(req.user.id, { subscriptionActive: false });
    }

    res.json({ message: "Subscription cancelled successfully", subscription });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

export default router;
