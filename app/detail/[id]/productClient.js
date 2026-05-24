"use client";

import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { ToastContainer, toast, Bounce } from "react-toastify";
import AllProduct from "@/components/allproduct";

// ── Put your WhatsApp number here (with country code, no + or spaces) ──
const WHATSAPP_NUMBER = "919999999999";

export default function ProductClient({ product }) {
  const { addToCart } = useCart();

  const images = product.images?.length
    ? product.images
    : product.image?.url
    ? [product.image.url]
    : [];

  const [selectedImage, setSelectedImage] = useState(images[0] || "");

  // ── Add to cart ──────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    addToCart(product);
    toast.success(`${product.name} added to cart`, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      theme: "dark",
      transition: Bounce,
    });
  };

  // ── WhatsApp enquiry ─────────────────────────────────────────────────────
  // NOTE: WhatsApp doesn't embed images in the pre-filled message text, but
  // we include the direct image URL so the recipient can open it instantly.
  const handleWhatsAppEnquiry = () => {
    const pageUrl =
      typeof window !== "undefined" ? window.location.href : "";

    const message = [
      `Hi! I'm interested in the following product:`,
      ``,
      `🛍️ *${product.name}*`,
      product.type ? `📦 Category: ${product.type}` : null,
      `💰 Price: ₹${product.price}`,
      product.description
        ? `📝 Description: ${product.description}`
        : null,
      ``,
      pageUrl ? `🔗 Product Link: ${pageUrl}` : null,
      ``,
      `Could you please provide more details?`,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const encodedMessage = encodeURIComponent(message);
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Bounce}
      />

      <div className="max-w-7xl mx-auto p-6 md:p-12 grid md:grid-cols-2 gap-14">

        {/* ── LEFT: IMAGE GALLERY ─────────────────────────────────────────── */}
        <div className="flex gap-4">

          {/* Thumbnails */}
          <div className="flex flex-col gap-3">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(img)}
                aria-label={`View image ${i + 1}`}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${
                  selectedImage === img
                    ? "border-green-500 scale-[1.05] shadow-md"
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <img
                  src={img}
                  alt={`${product.name} view ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>

          {/* Main Image */}
          <div className="relative flex-1 overflow-hidden rounded-2xl bg-gray-100 shadow-sm aspect-square">
            {selectedImage ? (
              <img
                key={selectedImage}
                src={selectedImage}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                No image
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: DETAILS ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 md:sticky md:top-20 h-fit">

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-center gap-4 mt-2">
            <span className="text-3xl font-semibold text-green-600">
              ₹{product.price}
            </span>
           
          </div>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed mt-3">
            {product.description}
          </p>
          <p className="text-gray-500 leading-relaxed text-sm italic">
            "Crafted with premium materials, this {product.type} ensures
            durability, comfort, and everyday performance. Designed for modern
            needs."
          </p>

          {/* Highlights */}
          

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 mt-6">
            {/* Add to Cart */}
            {/* <button
              onClick={handleAddToCart}
              className="border bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white py-3 rounded-xl font-semibold transition-all duration-150"
            >
              Add to Cart
            </button> */}

            {/* WhatsApp Enquiry */}
            <button
              onClick={handleWhatsAppEnquiry}
              className="flex items-center justify-center gap-2 border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white active:scale-[0.98] py-3 rounded-xl font-semibold transition-all duration-150"
            >
              {/* WhatsApp icon */}
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.532 5.855L.064 23.446a.5.5 0 00.608.607l5.67-1.484A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.655-.502-5.184-1.38l-.37-.217-3.834 1.004 1.02-3.733-.236-.386A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>
              Enquire on WhatsApp
            </button>
          </div>

          {/* Footer note */}
          <div className="mt-6 text-xs text-gray-500">
            100% Original Product • Secure Payments • Trusted by 1,000+ customers
          </div>
        </div>
      </div>

      <AllProduct type={product.type} />
    </>
  );
}