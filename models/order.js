import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: String,
    cartItems: Array,
    amount: Number,


    address: {
      name: String,
      phone: String,
      addressLine: String,
      city: String,
      pincode: String,
    },

    razorpayOrderId: String,
    paymentId: String,

    status: {
      type: String,
      default: "pending",
    },
    deliveryStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order ||
  mongoose.model("Order", orderSchema);