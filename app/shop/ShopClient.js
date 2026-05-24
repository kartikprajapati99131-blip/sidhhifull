"use client";

// ✅ SEO FIX: All interactive logic lives here (client component).
// The parent page.js is a server component so product HTML is pre-rendered for Google.

import { useState } from "react";
import { ToastContainer, toast, Bounce } from "react-toastify";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function ShopClient({ initialProducts, selectedType }) {
  const { addToCart } = useCart();
  const [products] = useState(initialProducts);

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
            {Array.isArray(products) && products.map((p) => (
              <div key={p._id}>
                <Link href={`/detail/${p._id}`}>
                  <div className="bg-gray-100 text-center backdrop-blur-md shadow-lg rounded-2xl p-4 hover:scale-105 transition w-full">
                    <img
                      src={p.image?.url}
                      // ✅ SEO FIX: descriptive alt text using product name and type
                      alt={`${p.name} — ${selectedType || p.type} — SIDDHI`}
                      className="object-contain w-32 h-32 mx-auto bg-gray-200 rounded-2xl mb-4 shadow-sm"
                    />
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                    <p className="text-gray-600 text-sm font-medium">₹ {p.price}</p>
                    {selectedType === "Plywood" && (
                      <p className="text-gray-600 text-sm font-medium">per Sq.ft</p>
                    )}
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">{p.description}</p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(p);
                      }}
                      className="mt-2 border border-gray-50 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                    >
                      Add to Cart
                    </button>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
