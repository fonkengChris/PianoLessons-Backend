import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    required: true,
    enum: ["active", "expired", "cancelled"],
    default: "active",
  },
  paymentId: String,
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export { Subscription };
