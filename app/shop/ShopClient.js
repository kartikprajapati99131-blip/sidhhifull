"use client";

import { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast, Bounce } from "react-toastify";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCoverImage(product) {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0].url;
  }
  if (product.image?.url) return product.image.url;
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShopClient({ initialProducts, selectedType }) {
  const { addToCart } = useCart();
  const [products] = useState(initialProducts);
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [activeBrand, setActiveBrand] = useState(null);   // brand object | null
  const [activeSubCat, setActiveSubCat] = useState(null);   // string | null

  // ─── Fetch brands for this type ──────────────────────────────────────────────
  const fetchBrands = useCallback(async () => {
    if (!selectedType) return;
    setBrandsLoading(true);
    try {
      const res = await fetch(`/api/brand/list?type=${selectedType}`);
      const data = await res.json();
      if (data.success) setBrands(data.brands);
    } catch {
      // silently ignore — brands are supplementary
    } finally {
      setBrandsLoading(false);
    }
  }, [selectedType]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  // ─── Reset brand filter when type changes ────────────────────────────────────
  useEffect(() => {
    setActiveBrand(null);
    setActiveSubCat(null);
  }, [selectedType]);

  // ─── Cart ────────────────────────────────────────────────────────────────────
  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(`${product.name} added to cart`, {
      position: "top-right",
      autoClose: 5000,
      theme: "dark",
      transition: Bounce,
    });
  };

  // ─── Brand click ─────────────────────────────────────────────────────────────
  const handleBrandClick = (brand) => {
    if (activeBrand?._id === brand._id) {
      setActiveBrand(null);
      setActiveSubCat(null);
    } else {
      setActiveBrand(brand);
      setActiveSubCat(null);
    }
  };

  // ─── Filter products ─────────────────────────────────────────────────────────
  const filteredProducts = (() => {
    let list = products;
    if (activeBrand) {
      list = list.filter((p) => {
        const pBrand = p.brand || p.brandName || "";
        return pBrand.toLowerCase() === activeBrand.name.toLowerCase();
      });
    }
    if (activeSubCat) {
      list = list.filter((p) => {
        const pSub = p.subCategory || p.subCat || "";
        return pSub.toLowerCase() === activeSubCat.toLowerCase();
      });
    }
    return list;
  })();

  // ─── Empty state ─────────────────────────────────────────────────────────────
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
            ? `No ${selectedType} products yet. Check back soon!`
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

      <div className="w-full font-[Outfit,sans-serif]">

        {/* ── Brand row ── */}
        {selectedType && (
          <div className="w-full max-w-6xl mx-auto mb-10 px-6">
            {brandsLoading ? (
              <p className="text-center text-xs text-[#c4bbb0] py-4">Loading brands…</p>
            ) : brands.length > 0 ? (
              <>
                <p className="text-[11px] tracking-[0.22em] uppercase text-[#9b9186] font-semibold mb-4 text-left">
                  Shop by brand
                </p>
                <div className="flex gap-6 flex-wrap justify-center">
                  {brands.map((brand) => {
                    const isActive = activeBrand?._id === brand._id;
                    const isInactive = activeBrand && !isActive;
                    return (
                      <div
                        key={brand._id}
                        onClick={() => handleBrandClick(brand)}
                        className={`flex flex-col items-center gap-2.5 cursor-pointer transition-all duration-200 hover:-translate-y-1 ${
                          isInactive ? "opacity-25 pointer-events-none" : ""
                        }`}
                      >
                        <div
                          className={`w-[120px] h-[120px] sm:w-[92px] sm:h-[92px] rounded-3xl sm:rounded-2xl border-2 bg-white flex items-center justify-center overflow-hidden transition-all ${
                            isActive
                              ? "border-[#1a1814] shadow-[0_0_0_4px_rgba(26,24,20,0.08)]"
                              : "border-[#e4ddd3] hover:border-[#b8956a] hover:shadow-[0_8px_25px_rgba(184,149,106,0.15)]"
                          }`}
                        >
                          {brand.logo?.url ? (
                            <img src={brand.logo.url} alt={brand.name} className="w-full h-full object-contain p-3" />
                          ) : (
                            <span className="text-[38px] text-[#d0c9c0]">🏷️</span>
                          )}
                        </div>
                        <span
                          className={`text-[13px] font-semibold max-w-[120px] sm:max-w-[92px] sm:text-xs text-center leading-snug whitespace-nowrap overflow-hidden text-ellipsis ${
                            isActive ? "text-[#1a1814]" : "text-[#5a5248]"
                          }`}
                        >
                          {brand.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ── Active brand banner + sub-category pills ── */}
        {activeBrand && (
          <>
            <div className="flex items-center gap-2.5 max-w-[900px] mx-auto mb-[1.2rem] py-2.5 pr-4 pl-3 bg-[#faf8f5] border border-[#e4ddd3] rounded-[10px]">
              <div className="w-9 h-9 rounded-[7px] border border-[#e4ddd3] bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
                {activeBrand.logo?.url ? (
                  <img src={activeBrand.logo.url} alt={activeBrand.name} className="w-full h-full object-contain p-[3px]" />
                ) : (
                  <span className="text-base">🏷️</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-[#1a1814]">{activeBrand.name}</p>
                <p className="text-[11px] text-[#9b9186] mt-px">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
                  {activeSubCat ? ` · ${activeSubCat}` : ""}
                </p>
              </div>
              <button
                className="text-[11.5px] text-[#9b9186] bg-transparent border border-[#e4ddd3] rounded-md px-2.5 py-1 cursor-pointer transition-all hover:border-[#b8956a] hover:text-[#b8956a]"
                onClick={() => { setActiveBrand(null); setActiveSubCat(null); }}
              >
                Show all
              </button>
            </div>

            {/* Sub-category pills */}
            {activeBrand.subCategories?.length > 0 && (
              <div className="flex gap-2 flex-wrap justify-center mx-auto mb-6 px-5 max-w-[700px]">
                <button
                  className={`px-4 py-[5px] rounded-full text-[12.5px] font-medium border cursor-pointer transition-all ${
                    !activeSubCat
                      ? "bg-[#1a1814] text-[#faf8f5] border-[#1a1814]"
                      : "border-[#e4ddd3] bg-[#faf8f5] text-[#7a6a5a] hover:border-[#b8956a] hover:text-[#b8956a]"
                  }`}
                  onClick={() => setActiveSubCat(null)}
                >
                  All
                </button>
                {activeBrand.subCategories.map((s) => (
                  <button
                    key={s}
                    className={`px-4 py-[5px] rounded-full text-[12.5px] font-medium border cursor-pointer transition-all ${
                      activeSubCat === s
                        ? "bg-[#1a1814] text-[#faf8f5] border-[#1a1814]"
                        : "border-[#e4ddd3] bg-[#faf8f5] text-[#7a6a5a] hover:border-[#b8956a] hover:text-[#b8956a]"
                    }`}
                    onClick={() => setActiveSubCat((prev) => (prev === s ? null : s))}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Product grid ── */}
        <div className="p-5 w-full max-w-6xl mx-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 px-4 text-[#c4bbb0]">
              <p className="text-3xl mb-2">📦</p>
              <p className="text-sm">
                No products found{activeBrand ? ` for ${activeBrand.name}` : ""}
                {activeSubCat ? ` · ${activeSubCat}` : ""}.
              </p>
              <p className="text-xs mt-1.5">
                {activeBrand
                  ? 'Try selecting a different sub-category or click "Show all".'
                  : "Check back soon!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredProducts.map((p) => {
                const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
                const coverImage = getCoverImage(p);

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

                        {/* Brand badge */}
                        {p.brand && (
                          <p className="text-xs text-amber-700 bg-amber-50 rounded-full px-2 py-0.5 inline-block mt-1 font-medium">
                            {p.brand}
                          </p>
                        )}

                        {hasVariants && (
                          <div className="flex flex-wrap justify-center gap-1 mt-2">
                            {p.variants.slice(0, 4).map((v, i) => (
                              <span key={i} className="text-xs bg-white border border-gray-300 rounded-full px-2 py-0.5 text-gray-600">
                                {v.label}
                              </span>
                            ))}
                            {p.variants.length > 4 && (
                              <span className="text-xs text-gray-400 px-1">+{p.variants.length - 4} more</span>
                            )}
                          </div>
                        )}

                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{p.description}</p>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}