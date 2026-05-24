import connectDB from "@/db/connectDb";
import Product from "@/models/product";
import ProductClient from "./productClient";

export default async function ProductPage({ params }) {
  const { id } = await params;

  await connectDB();

  const product = await Product.findById(id).lean();

  if (!product) {
    return <div className="p-6 text-red-500">Product not found</div>;
  }

  return (
    <ProductClient product={JSON.parse(JSON.stringify(product))} />
    
  );
}