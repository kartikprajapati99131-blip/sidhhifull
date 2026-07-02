import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },

    entryTime: {
      type: Date,
      default: null,
    },

    exitTime: {
      type: Date,
      default: null,
    },

    totalHours: {
      type: Number, // in hours
      default: null,
    },

    entryLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    exitLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    // ── Admin manual-exit support ──────────────────────────────
    remark: {
      type: String,
      default: "",
      trim: true,
    },

    exitAddedByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
  }
);

// One attendance record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance ||
  mongoose.model("Attendance", attendanceSchema);