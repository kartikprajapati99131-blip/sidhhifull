"use client";
import { useCart } from "@/context/CartContext";
import Checkout from "@/components/checkout";
import { useEffect, useState } from "react";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    increaseQty,
    decreaseQty,
    total,
  } = useCart();
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);

  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    const res = await fetch(`/api/type`);
    const data = await res.json();
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length === 0) return;
    const productIds = products.map((p) => p._id);
    cart.forEach((item) => {
      if (!productIds.includes(item._id)) {
        removeFromCart(item._id);
      }
    });
  }, [products]);

  return (
    <>
      {/* Wrapper makes the overlay position relative to the whole cart+checkout block */}
      <div className="relative">

        {/* ── COMING SOON OVERLAY ───────────────────────────────────────── */}
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl backdrop-blur-[6px] bg-white/20 pointer-events-none select-none">
          <div className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl bg-white/80 shadow-xl border border-white/60 backdrop-blur-md">
            <span className="text-4xl">🛒</span>
            <p className="text-2xl font-bold text-gray-800 tracking-tight">Coming Soon</p>
            <p className="text-sm text-gray-500 text-center max-w-[200px]">
              This feature will be available shortly. Stay tuned!
            </p>
          </div>
        </div>

        {/* ── CART CONTENT (blurred behind overlay) ────────────────────── */}
        <div className="p-6 md:w-1/2 flex flex-col md:mx-auto lg:mx-auto bg-gray-200 mx-5 rounded-2xl m-4">
          <h1 className="text-2xl font-bold">Your Cart</h1>

          {cart.length === 0 ? (
            <p className="mt-4">Cart is empty</p>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item._id} className="flex gap-4 border-b py-4">
                  <img
                    src={item.image?.url}
                    className="w-20 h-20 object-contain"
                    alt={item.name}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h2>{item.name}</h2>
                      <p>₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 border bg-white rounded-2xl md:px-4 border-amber-200">
                        {item.qty === 1 ? (
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="text-red-500"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 72 72"
                              fill="currentColor"
                              className="w-6 h-6"
                            >
                              <path d="M 32 13 C 30.895 13 30 13.895 30 15 L 30 16 L 17 16 C 14.791 16 13 17.791 13 20 C 13 21.973645 14.432361 23.602634 16.3125 23.929688 L 18.707031 52.664062 C 19.053031 56.811062 22.520641 60 26.681641 60 L 45.318359 60 C 49.479359 60 52.945969 56.811062 53.292969 52.664062 L 55.6875 23.929688 C 57.567639 23.602634 59 21.973645 59 20 C 59 17.791 57.209 16 55 16 L 42 16 L 42 15 C 42 13.895 41.105 13 40 13 L 32 13 z M 24.347656 24 L 47.652344 24 L 45.396484 51.082031 C 45.352484 51.600031 44.918438 52 44.398438 52 L 27.601562 52 C 27.081562 52 26.647469 51.600031 26.605469 51.082031 L 24.347656 24 z" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => decreaseQty(item._id)}
                            className="px-2 text-lg"
                          >
                            -
                          </button>
                        )}
                        <span>{item.qty}</span>
                        <button onClick={() => increaseQty(item._id)}>+</button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="underline text-xs hover:text-red-600"
                      >
                        delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between">
                <h2 className="text-xl mt-4">Total Items: ({totalQty})</h2>
                <h2 className="text-xl mt-4 text-right">
                  Total:{" "}
                  {total.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                  })}
                </h2>
              </div>
            </>
          )}
        </div>

        <Checkout />
      </div>
    </>
  );
}