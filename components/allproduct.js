"use client";

import { useEffect, useState } from "react";
import { ToastContainer, toast, Bounce } from "react-toastify";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

// ✅ FIX: Correct price display for both base-price and variant products
function getPriceDisplay(p) {
  const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
  if (hasVariants) {
    const prices = p.variants.map((v) => v.price).filter(Boolean);
    if (prices.length === 0) return null;
    const min = Math.min(...prices);
    const unit = p.variants[0]?.unit;
    return { label: `from ₹ ${min}`, unit: unit || null };
  }
  if (p.price != null && p.price !== "") {
    return { label: `₹ ${p.price}`, unit: p.priceUnit || null };
  }
  return null;
}

export default function AllProduct({ type }) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [type]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/type?type=" + (type || ""));
      if (!res.ok) { setProducts([]); return; }
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

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

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[200px] p-5 w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl p-4 animate-pulse">
              <div className="w-32 h-32 bg-gray-200 rounded-2xl mx-auto mb-4" />
              <div className="h-4 bg-gray-200 rounded mx-auto w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded mx-auto w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ✅ FIX: Empty state — instead of a blank screen show a helpful message
  if (products.length === 0) {
    return (
      <div className="min-h-screen justify-center text-center">
        <h2 className="text-2xl font-bold mb-4 mt-10">
          {type ? `${type} Products` : "Products"}
        </h2>
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
          </svg>
          <p className="text-lg font-medium text-gray-500">No products yet</p>
          <p className="text-sm mt-1 text-gray-400">Check back soon — we're adding new stock.</p>
          <Link href="/shop" className="mt-6 px-5 py-2 bg-gray-800 text-white rounded-xl text-sm hover:bg-gray-700 transition">
            Browse all products
          </Link>
        </div>
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
      <div className="min-h-screen justify-center text-center">
        <h2 className="text-2xl font-bold mb-4 mt-10 gap-4">
          More {type} products for you
        </h2>
        <p className="text-sm md:text-lg opacity-90 mb-4">
          Durability you can trust. Quality you can feel.
        </p>

        <div className="p-5 w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 items-stretch">
            {products.slice(0, 10).map((p) => {
              const priceDisplay = getPriceDisplay(p);
              const imgSrc = p.images?.[0]?.url ?? p.image?.url ?? null;

              return (
                <div key={p._id} className="flex">
                  <Link href={`/detail/${p._id}`} className="w-full">
                    <div className="bg-gray-100 backdrop-blur-md shadow-lg rounded-2xl p-4 hover:scale-105 transition flex flex-col h-full">

                      {/* Image */}
                      <div className="flex justify-center mb-3 flex-shrink-0">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={p.name}
                            className="object-contain w-28 h-28 bg-gray-200 rounded-2xl shadow-sm"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-28 h-28 bg-gray-200 rounded-2xl shadow-sm flex items-center justify-center text-gray-400 text-xs">
                            No image
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <h3 className="text-sm font-semibold text-center leading-snug line-clamp-2 flex-shrink-0">
                        {p.name}
                      </h3>

                      {/* Price */}
                      {priceDisplay && (
                        <p className="text-gray-600 text-sm font-medium text-center mt-1 flex-shrink-0">
                          {priceDisplay.label}
                          {priceDisplay.unit && (
                            <span className="text-gray-400 font-normal"> / {priceDisplay.unit}</span>
                          )}
                        </p>
                      )}

                      {/* Description — fills remaining space */}
                      <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mt-1.5 flex-grow">
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