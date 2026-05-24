import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

// models/user.js — add points fields to your existing schema
const UserSchema = new Schema({
    email:      { type: String, required: true, unique: true },
    name:       { type: String, required: true },
    username:   { type: String, required: true, unique: true },
    profilepic: { type: String },
    password:   { type: String, required: false },
    role:       { type: String, default: "user" },
    phone:      { type: String, sparse: true },
    createdAt:  { type: Date, default: Date.now },

    // ✅ NEW — add these two fields
    points: { type: Number, default: 0 },
    pointsLog: [{
        amount:    { type: Number },
        reason:    { type: String },
        createdAt: { type: Date, default: Date.now },
    }],
});

// export default models.User || model("User", UserSchema);
export default mongoose.models.User || mongoose.model("User", UserSchema);