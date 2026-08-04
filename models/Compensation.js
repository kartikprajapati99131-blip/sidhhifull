import mongoose from "mongoose";

const compensationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
    },

    employeeName: {
      type: String,
      required: true,
      trim: true,
    },

    hours: {
      type: Number,
      required: true,
      min: 0,
    },

    minutes: {
      type: Number,
      required: true,
      min: 0,
      max: 59,
      default: 0,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: String, // YYYY-MM-DD (same convention as Attendance.date)
      required: true,
    },

    addedBy: {
      type: String,
      required: true,
    },

    addedByName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
  }
);

compensationSchema.index({ employeeId: 1, date: -1 });

export default mongoose.models.Compensation ||
  mongoose.model("Compensation", compensationSchema);
