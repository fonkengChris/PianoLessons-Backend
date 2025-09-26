import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  planId: { type: String, required: true }, // basic, pro, etc.
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    required: true,
    enum: ["active", "expired", "cancelled", "pending_payment"],
    default: "pending_payment",
  },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  autoRenew: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export { Subscription };
