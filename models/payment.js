import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["paypal", "mtn_mobile_money"],
  },
  status: {
    type: String,
    required: true,
    enum: ["pending", "completed", "failed", "cancelled", "refunded"],
    default: "pending",
  },
  externalPaymentId: String, // PayPal transaction ID or MTN reference
  paymentDetails: {
    // PayPal specific
    paypalOrderId: String,
    paypalPayerId: String,
    
    // MTN Mobile Money specific
    mtnPhoneNumber: String,
    mtnTransactionId: String,
    mtnReference: String,
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    country: String,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: Date,
});

// Update the updatedAt field before saving
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Payment = mongoose.model("Payment", paymentSchema);

export { Payment };
