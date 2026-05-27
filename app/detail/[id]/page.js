import connectDB from "@/db/connectDb";
import Product from "@/models/product";
import ProductClient from "./productClient";
import { notFound } from "next/navigation";

const TYPE_LABEL = {
  Plywood: "Plywood",
  Laminate: "Laminate",
  Glass: "Glass",
  UPVC: "UPVC",
  Hardware: "Hardware",
  AluminiumSection: "Aluminium Section",
  Lock: "Lock",
  Handle: "Handle",
  Hinges: "Hinges",
  Wood: "Wood",
};

function getCoverImageUrl(product) {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0].url;
  }
  if (product.image?.url) return product.image.url;
  return null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    await connectDB();
    const product = await Product.findById(id).lean();
    if (!product) return {};

    const typeLabel = TYPE_LABEL[product.type] || product.type || "";

    const hasVariants =
      Array.isArray(product.variants) && product.variants.length > 0;
    const priceStr = hasVariants
      ? `from ₹${Math.min(...product.variants.map((v) => v.price))}`
      : product.price != null
      ? `₹${product.price}`
      : null;

    const title = `${product.name} — ${typeLabel} | SIDDHI Palanpur`;
    const description = [
      product.description,
      priceStr ? `Price: ${priceStr}.` : null,
      `Buy ${product.name} from SIDDHI, Palanpur's trusted interior supplier.`,
    ]
      .filter(Boolean)
      .join(" ");

    const coverImageUrl = getCoverImageUrl(product);

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: coverImageUrl
          ? [{ url: coverImageUrl, alt: product.name }]
          : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function ProductPage({ params }) {
  const { id } = await params;

  await connectDB();

  let product;
  try {
    product = await Product.findById(id).lean();
  } catch {
    // Invalid ObjectId format → treat as not found
    notFound();
  }

  // ✅ FIX: Use notFound() instead of an inline red div — gives a proper 404 page
  if (!product) {
    notFound();
  }

  // ✅ FIX: .lean() bypasses the toJSON transform, so normalize images here
  const serialized = JSON.parse(JSON.stringify(product));
  if (!Array.isArray(serialized.images)) {
    serialized.images = [];
  }

  return <ProductClient product={serialized} />;
}