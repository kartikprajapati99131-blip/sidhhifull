"use server"
import connectDB from '../db/connectDb'
import product from '@/models/product';


export const updateProduct = async (id, data) => {
  try {
    await connectDB();

    await product.findByIdAndUpdate(id, data);

    return { success: true };

  } catch (err) {
    return { success: false, message: err.message };
  }
};

// create this model



