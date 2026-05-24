import mongoose from "mongoose";

const connectDb = async () => {
    if (mongoose.connections[0].readyState) return;
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            
        });
    } catch (error) {
        console.error("MongoDB Error:", error.message);
    }
}

export default connectDb;
