"use client";

import { useState } from "react";
import { ToastContainer, toast, Bounce } from "react-toastify";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

function getCoverImage(product) {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0].url;
  }
  if (product.image?.url) return product.image.url;
  return null;
}

function getPriceDisplay(product) {
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  if (hasVariants) {
    const prices = product.variants.map((v) => v.price).filter(Boolean);
    if (prices.length === 0) return null;
    const min  = Math.min(...prices);
    const unit = product.variants[0]?.unit;
    return { label: `from ₹ ${min}`, unit: unit || null };
  }
  if (product.price != null && product.price !== "") {
    return { label: `₹ ${product.price}`, unit: product.priceUnit || null };
  }
  return null;
}

export default function ShopClient({ initialProducts, selectedType }) {
  const { addToCart } = useCart();
  const [products]    = useState(initialProducts);

  const handleAddToCart = (product) => {
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

  // ✅ FIX: Empty state — show helpful message instead of blank screen
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
        </svg>
        <p className="text-lg font-medium text-gray-500">No products yet</p>
        <p className="text-sm mt-1 text-gray-400">
          {selectedType
            ? `We haven't added any ${selectedType} products yet. Check back soon!`
            : "No products found. Check back soon!"}
        </p>
        <Link href="/shop" className="mt-6 px-5 py-2 bg-gray-800 text-white rounded-xl text-sm hover:bg-gray-700 transition">
          Browse all categories
        </Link>
      </div>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Bounce}
      />

      <div className="p-5 w-full max-w-6xl mx-auto">
        <div className="space-y-4 -mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {products.map((p) => {
              const priceDisplay = getPriceDisplay(p);
              const hasVariants  = Array.isArray(p.variants) && p.variants.length > 0;
              const coverImage   = getCoverImage(p);

              return (
                <div key={p._id}>
                  <Link href={`/detail/${p._id}`}>
                    <div className="bg-gray-100 text-center backdrop-blur-md shadow-lg rounded-2xl p-4 hover:scale-105 transition w-full">

                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={`${p.name} — ${selectedType || p.type} — SIDDHI`}
                          className="object-contain w-32 h-32 mx-auto bg-gray-200 rounded-2xl mb-4 shadow-sm"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-32 h-32 mx-auto bg-gray-200 rounded-2xl mb-4 shadow-sm flex items-center justify-center text-gray-400 text-xs">
                          No image
                        </div>
                      )}

                      <h3 className="text-lg font-semibold">{p.name}</h3>

                      {priceDisplay && (
                        <p className="text-gray-600 text-sm font-medium">
                          {priceDisplay.label}
                          {priceDisplay.unit && (
                            <span className="text-gray-400 font-normal">
                              {" "}/ {priceDisplay.unit}
                            </span>
                          )}
                        </p>
                      )}

                      {hasVariants && (
                        <div className="flex flex-wrap justify-center gap-1 mt-2">
                          {p.variants.slice(0, 4).map((v, i) => (
                            <span
                              key={i}
                              className="text-xs bg-white border border-gray-300 rounded-full px-2 py-0.5 text-gray-600"
                            >
                              {v.label}
                            </span>
                          ))}
                          {p.variants.length > 4 && (
                            <span className="text-xs text-gray-400 px-1">
                              +{p.variants.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                        {p.description}
                      </p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}