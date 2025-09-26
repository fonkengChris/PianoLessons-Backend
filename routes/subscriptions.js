import express from "express";
import auth from "../middleware/auth.js";
import { Subscription } from "../models/subscription.js";
import { User } from "../models/user.js";

const router = express.Router();

// Create subscription
router.post("/", auth, async (req, res) => {
  const { paymentId } = req.body;

  // Calculate end date (e.g., 30 days from now)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const subscription = new Subscription({
    userId: req.user.id,
    endDate,
    paymentId,
  });

  await subscription.save();

  // Update user's subscription status
  await User.findByIdAndUpdate(req.user.id, { subscriptionActive: true });

  res.status(201).json(subscription);
});

// Get user's subscription status
router.get("/status", auth, async (req, res) => {
  const subscription = await Subscription.findOne({
    userId: req.user.id,
    status: "active",
    endDate: { $gt: new Date() },
  });

  res.json({
    hasActiveSubscription: !!subscription,
    subscription,
  });
});

export default router;
