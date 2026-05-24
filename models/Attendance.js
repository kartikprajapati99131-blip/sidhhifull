import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  userId: String,
  date: String, // YYYY-MM-DD

  entryTime: Date,
  exitTime: Date,

  totalHours: Number, // in hours

  entryLocation: {
    lat: Number,
    lng: Number,
  },

  exitLocation: {
    lat: Number,
    lng: Number,
  },
});

export default mongoose.models.Attendance ||
  mongoose.model("Attendance", attendanceSchema);