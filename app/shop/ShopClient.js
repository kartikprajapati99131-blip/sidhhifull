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

function getPriceDisplay(product) {
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  if (hasVariants) {
    const prices = product.variants.map((v) => v.price).filter(Boolean);
    if (prices.length === 0) return null;
    const min = Math.min(...prices);
    const unit = product.variants[0]?.unit;
    return { label: `from ₹ ${min}`, unit: unit || null };
  }
  if (product.price != null && product.price !== "") {
    return { label: `₹ ${product.price}`, unit: product.priceUnit || null };
  }
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
      // clicking active brand deselects it
      setActiveBrand(null);
      setActiveSubCat(null);
    } else {
      setActiveBrand(brand);
      setActiveSubCat(null);
    }
  };

  // ─── Filter products ─────────────────────────────────────────────────────────
  // Products are tagged with brandId — if your product model has a `brandId` field.
  // If not (current schema), filter by product.brand === activeBrand.name (string match).
  const filteredProducts = (() => {
    let list = products;
    if (activeBrand) {
      // Match by brand name (case-insensitive) stored on the product
      // Supports both product.brand (string) and product.brandId (ObjectId string)
      list = list.filter((p) => {
        const pBrand = p.brand || p.brandName || "";
        return pBrand.toLowerCase() === activeBrand.name.toLowerCase();
      });
    }
    if (activeSubCat) {
      // Filter by subCategory field on the product (string match)
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500&display=swap');

       /* ── Brand row ── */
.brand-row-wrap {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 2.5rem;
  padding: 0 1.5rem;
}

.brand-row-label {
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #9b9186;
  font-weight: 600;
  margin-bottom: 1rem;
  text-align: left;
}

.brand-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

/* ── Brand card ── */
.brand-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.brand-card:hover {
  transform: translateY(-3px);
}

.brand-card.inactive {
  opacity: 0.25;
  pointer-events: none;
}

.brand-card:hover .brand-card-logo {
  border-color: #b8956a;
  box-shadow: 0 8px 25px rgba(184, 149, 106, 0.15);
}

/* ── BIGGER LOGO ── */
.brand-card-logo {
  width: 120px;
  height: 120px;
  border-radius: 24px;
  border: 2px solid #e4ddd3;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition:
    border-color 0.18s,
    box-shadow 0.18s,
    transform 0.18s;
}

.brand-card.active .brand-card-logo {
  border-color: #1a1814;
  box-shadow: 0 0 0 4px rgba(26, 24, 20, 0.08);
}

.brand-card-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 12px;
}

.brand-card-logo-empty {
  font-size: 38px;
  color: #d0c9c0;
}

.brand-card-name {
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  color: #5a5248;
  font-weight: 600;
  max-width: 120px;
  text-align: center;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-card.active .brand-card-name {
  color: #1a1814;
}

/* Mobile */
@media (max-width: 640px) {
  .brand-row {
    gap: 16px;
  }

  .brand-card-logo {
    width: 92px;
    height: 92px;
    border-radius: 18px;
  }

  .brand-card-name {
    max-width: 92px;
    font-size: 12px;
  }
}
        /* ── Sub-category pills ── */
        .subcat-row {
          display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;
          margin: 0 auto 1.5rem; padding: 0 1.25rem;
          max-width: 700px;
        }
        .subcat-pill {
          padding: 5px 16px; border-radius: 100px; font-size: 12.5px; font-weight: 500;
          border: 1px solid #e4ddd3; background: #faf8f5; color: #7a6a5a;
          cursor: pointer; transition: all 0.15s; font-family: 'Outfit', sans-serif;
        }
        .subcat-pill:hover  { border-color: #b8956a; color: #b8956a; }
        .subcat-pill.active { background: #1a1814; color: #faf8f5; border-color: #1a1814; }

        /* ── Active brand banner ── */
        .brand-active-banner {
          display: flex; align-items: center; gap: 10px;
          max-width: 900px; margin: 0 auto 1.2rem;
          padding: 0.6rem 1rem 0.6rem 0.75rem;
          background: #faf8f5; border: 1px solid #e4ddd3; border-radius: 10px;
          font-family: 'Outfit', sans-serif;
        }
        .brand-active-logo {
          width: 36px; height: 36px; border-radius: 7px; border: 1px solid #e4ddd3;
          background: #fff; overflow: hidden; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .brand-active-logo img { width: 100%; height: 100%; object-fit: contain; padding: 3px; }
        .brand-active-info { flex: 1; }
        .brand-active-name  { font-size: 13px; font-weight: 500; color: #1a1814; }
        .brand-active-count { font-size: 11px; color: #9b9186; margin-top: 1px; }
        .brand-clear-btn {
          font-size: 11.5px; color: #9b9186; background: none; border: 1px solid #e4ddd3;
          border-radius: 6px; padding: 4px 10px; cursor: pointer; font-family: 'Outfit', sans-serif;
          transition: all 0.15s;
        }
        .brand-clear-btn:hover { border-color: #b8956a; color: #b8956a; }

        .brands-loading { text-align: center; font-size: 12px; color: #c4bbb0; padding: 1rem 0; font-family: 'Outfit', sans-serif; }

        /* ── No results ── */
        .no-results {
          text-align: center; padding: 3rem 1rem;
          font-family: 'Outfit', sans-serif; color: #c4bbb0;
        }
        .no-results p:first-child { font-size: 32px; margin-bottom: 8px; }
        .no-results p { font-size: 14px; }
      `}</style>

      <div style={{ width: "100%" }}>

        {/* ── Brand row ── */}
        {selectedType && (
          <div className="brand-row-wrap">
            {brandsLoading ? (
              <p className="brands-loading">Loading brands…</p>
            ) : brands.length > 0 ? (
              <>
                <p className="brand-row-label">Shop by brand</p>
                <div className="brand-row">
                  {brands.map((brand) => {
                    const isActive = activeBrand?._id === brand._id;
                    const isInactive = activeBrand && !isActive;
                    return (
                      <div
                        key={brand._id}
                        className={`brand-card${isActive ? " active" : ""}${isInactive ? " inactive" : ""}`}
                        onClick={() => handleBrandClick(brand)}
                      >
                        <div className="brand-card-logo">
                          {brand.logo?.url
                            ? <img src={brand.logo.url} alt={brand.name} />
                            : <span className="brand-card-logo-empty">🏷️</span>
                          }
                        </div>
                        <span className="brand-card-name">{brand.name}</span>
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
            <div className="brand-active-banner" style={{ marginLeft: "auto", marginRight: "auto", maxWidth: 900, marginBottom: "1rem" }}>
              <div className="brand-active-logo">
                {activeBrand.logo?.url
                  ? <img src={activeBrand.logo.url} alt={activeBrand.name} />
                  : <span style={{ fontSize: 16 }}>🏷️</span>
                }
              </div>
              <div className="brand-active-info">
                <p className="brand-active-name">{activeBrand.name}</p>
                <p className="brand-active-count">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
                  {activeSubCat ? ` · ${activeSubCat}` : ""}
                </p>
              </div>
              <button
                className="brand-clear-btn"
                onClick={() => { setActiveBrand(null); setActiveSubCat(null); }}
              >
                Show all
              </button>
            </div>

            {/* Sub-category pills */}
            {activeBrand.subCategories?.length > 0 && (
              <div className="subcat-row">
                <button
                  className={`subcat-pill${!activeSubCat ? " active" : ""}`}
                  onClick={() => setActiveSubCat(null)}
                >
                  All
                </button>
                {activeBrand.subCategories.map((s) => (
                  <button
                    key={s}
                    className={`subcat-pill${activeSubCat === s ? " active" : ""}`}
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
            <div className="no-results">
              <p>📦</p>
              <p>No products found{activeBrand ? ` for ${activeBrand.name}` : ""}
                {activeSubCat ? ` · ${activeSubCat}` : ""}.</p>
              <p style={{ fontSize: 12, marginTop: 6 }}>
                {activeBrand
                  ? "Try selecting a different sub-category or click \"Show all\"."
                  : "Check back soon!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredProducts.map((p) => {
                const priceDisplay = getPriceDisplay(p);
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

                        {priceDisplay && (
                          <p className="text-gray-600 text-sm font-medium">
                            {priceDisplay.label}
                            {priceDisplay.unit && (
                              <span className="text-gray-400 font-normal"> / {priceDisplay.unit}</span>
                            )}
                          </p>
                        )}

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