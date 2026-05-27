"use client";

import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { ToastContainer, toast, Bounce } from "react-toastify";
import AllProduct from "@/components/allproduct";

const WHATSAPP_NUMBER = "919023238916";

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

export default function ProductClient({ product }) {
  const { addToCart } = useCart();

  const hasVariants =
    Array.isArray(product.variants) && product.variants.length > 0;

  // ✅ FIX: Correctly read images array; fallback to legacy image.url field
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images.map((img) => (typeof img === "string" ? img : img.url))
    : product.image?.url
    ? [product.image.url]
    : [];

  const [selectedImage, setSelectedImage]   = useState(images[0] || "");
  const [selectedVariant, setSelectedVariant] = useState(
    hasVariants ? product.variants[0] : null
  );

  const priceDisplay = hasVariants
    ? selectedVariant
      ? { amount: selectedVariant.price, unit: selectedVariant.unit }
      : null
    : product.price != null
    ? { amount: product.price, unit: product.priceUnit || null }
    : null;

  const typeLabel = TYPE_LABEL[product.type] || product.type;

  // ── Add to cart ──────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    const cartItem = hasVariants
      ? {
          ...product,
          price: selectedVariant?.price,
          selectedVariant: selectedVariant?.label,
          // ✅ FIX: pass cover image so cart page can show it
          image: { url: images[0] || "" },
        }
      : {
          ...product,
          image: { url: images[0] || "" },
        };
    addToCart(cartItem);
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
  const handleWhatsAppEnquiry = () => {
    const pageUrl =
      typeof window !== "undefined" ? window.location.href : "";

    const priceText = priceDisplay
      ? `₹${priceDisplay.amount}${priceDisplay.unit ? ` / ${priceDisplay.unit}` : ""}`
      : "Contact for price";

    const message = [
      `Hi! I'm interested in the following product:`,
      ``,
      `🛍️ *${product.name}*`,
      product.type ? `📦 Category: ${typeLabel}` : null,
      hasVariants && selectedVariant
        ? `📐 Size / Option: ${selectedVariant.label}`
        : null,
      `💰 Price: ${priceText}`,
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
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
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

          {/* Type badge */}
          {product.type && (
            <span className="self-start text-xs font-medium bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
              {typeLabel}
            </span>
          )}

          {/* ── Variant selector ─────────────────────────────────────────── */}
          {hasVariants && (
            <div className="mt-1">
              <p className="text-sm font-semibold text-gray-600 mb-2">
                Select Size / Option
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => {
                  const isSelected = selectedVariant?.label === v.label;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-150 ${
                        isSelected
                          ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {v.label}
                      <span className="ml-1.5 text-xs text-gray-500 font-normal">
                        ₹{v.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-2">
            {priceDisplay ? (
              <>
                <span className="text-3xl font-semibold text-green-600">
                  ₹{priceDisplay.amount}
                </span>
                {priceDisplay.unit && (
                  <span className="text-gray-400 text-sm">
                    / {priceDisplay.unit}
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-400 text-lg">
                Contact for price
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-gray-600 leading-relaxed mt-3">
              {product.description}
            </p>
          )}
          <p className="text-gray-500 leading-relaxed text-sm italic">
            &ldquo;Crafted with premium materials, this {typeLabel} ensures
            durability, comfort, and everyday performance. Designed for modern
            needs.&rdquo;
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 mt-6">
            {/* Add to Cart */}
            

            {/* WhatsApp Enquiry */}
            <button
              onClick={handleWhatsAppEnquiry}
              className="flex items-center justify-center gap-2 border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white active:scale-[0.98] py-3 rounded-xl font-semibold transition-all duration-150"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
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

      {/* Related products */}
      <AllProduct type={product.type} />
    </>
  );
}