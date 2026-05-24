import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
        },
        address: {
            type: String,
            trim: true,
            default: "",
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        addedByName: {
            type: String,
            default: "",
        },
        addedByRole: {
            type: String,
            enum: ["admin", "staff", "mistry", "user", "architect"],
            default: "user",
        },
    },
    { timestamps: true }
);

// Fast per-user lookup
CustomerSchema.index({ addedBy: 1, createdAt: -1 });

const Customer =
    mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);

export default Customer;