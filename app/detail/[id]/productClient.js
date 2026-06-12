"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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

const TYPE_COLORS = {
  Plywood: "bg-amber-50 text-amber-700 border-amber-200",
  Laminate: "bg-rose-50 text-rose-700 border-rose-200",
  Glass: "bg-sky-50 text-sky-700 border-sky-200",
  UPVC: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Hardware: "bg-slate-50 text-slate-700 border-slate-200",
  AluminiumSection: "bg-zinc-50 text-zinc-700 border-zinc-200",
  Lock: "bg-orange-50 text-orange-700 border-orange-200",
  Handle: "bg-violet-50 text-violet-700 border-violet-200",
  Hinges: "bg-teal-50 text-teal-700 border-teal-200",
  Wood: "bg-stone-50 text-stone-700 border-stone-200",
};

export default function ProductClient({ product }) {
  const [direction, setDirection] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const hasVariants =
    Array.isArray(product.variants) && product.variants.length > 0;

  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images.map((img) => (typeof img === "string" ? img : img.url))
      : product.image?.url
        ? [product.image.url]
        : [];

  useEffect(() => {
    setSelectedVariant(hasVariants ? product.variants[0] : null);
    setIsVisible(true);
  }, [hasVariants, product.variants]);

  const changeImage = useCallback(
    (newIndex) => {
      setDirection(newIndex > selectedIndex ? 1 : -1);
      setSelectedIndex(newIndex);
      setIsImageLoading(true);
    },
    [selectedIndex]
  );

  const nextImage = useCallback(() => {
    changeImage((selectedIndex + 1) % images.length);
  }, [selectedIndex, images.length, changeImage]);

  const prevImage = useCallback(() => {
    changeImage((selectedIndex - 1 + images.length) % images.length);
  }, [selectedIndex, images.length, changeImage]);

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const MIN_SWIPE = 40;

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) < MIN_SWIPE) return;
    if (diff > 0) {
      nextImage();
    } else {
      prevImage();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const thumbRef = useRef(null);

  const handleWheel = (e) => {
    if (thumbRef.current) {
      e.preventDefault();
      thumbRef.current.scrollTop += e.deltaY;
    }
  };

  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showLightbox) {
        if (e.key === "ArrowRight") {
          setLightboxIndex((i) => (i + 1) % images.length);
        } else if (e.key === "ArrowLeft") {
          setLightboxIndex((i) => (i - 1 + images.length) % images.length);
        } else if (e.key === "Escape") {
          setShowLightbox(false);
          document.body.style.overflow = "unset";
        }
      } else if (images.length > 1) {
        if (e.key === "ArrowRight") nextImage();
        if (e.key === "ArrowLeft") prevImage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLightbox, images.length, nextImage, prevImage]);

  const selectedImage = images[selectedIndex] || "";

  const typeLabel = TYPE_LABEL[product.type] || product.type;
  const typeColorClass = TYPE_COLORS[product.type] || "bg-gray-50 text-gray-700 border-gray-200";

  const handleWhatsAppEnquiry = () => {
    const pageUrl =
      typeof window !== "undefined" ? window.location.href : "";

    const message = [
      `Hi! I'm interested in the following product:`,
      ``,
      `🛍️ *${product.name}*`,
      product.type ? `📦 Category: ${typeLabel}` : null,
      hasVariants && selectedVariant
        ? `📐 Size / Option: ${selectedVariant.label}`
        : null,
      `💰 Price: Please share the price`,
      product.description ? `📝 Description: ${product.description}` : null,
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

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setShowLightbox(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setShowLightbox(false);
    document.body.style.overflow = "unset";
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
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

      {/* Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center animate-fade-in"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i - 1 + images.length) % images.length);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-3 bg-white/10 rounded-full hover:bg-white/20"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i + 1) % images.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-3 bg-white/10 rounded-full hover:bg-white/20"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <img
            key={lightboxIndex}
            src={images[lightboxIndex]}
            alt={product.name}
            className="max-w-[90vw] max-h-[85vh] object-contain animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(i);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${lightboxIndex === i ? "bg-white w-6" : "bg-white/40 w-2"
                  }`}
              />
            ))}
          </div>
        </div>
      )}

      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
      >
        

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* LEFT: IMAGE GALLERY */}
          <div className="flex gap-4 animate-fade-in-up delay-100">
            {/* Thumbnails - vertical desktop */}
            {images.length > 1 && (
              <div
                ref={thumbRef}
                onWheel={handleWheel}
                className="hidden md:flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                style={{ scrollbarWidth: "thin" }}
              >
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => changeImage(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 hover:scale-105 active:scale-95 ${selectedIndex === i
                        ? "border-green-500 shadow-lg shadow-green-500/20"
                        : "border-transparent hover:border-gray-300"
                      }`}
                    style={{ aspectRatio: "4/5", width: "72px" }}
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
            )}

            {/* Main image */}
            <div className="flex-1 flex flex-col gap-4">
              <div
                className="relative w-full overflow-hidden rounded-2xl bg-gray-50 shadow-lg select-none group cursor-zoom-in"
                style={{ aspectRatio: "4/5" }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
                onClick={() => openLightbox(selectedIndex)}
              >
                {selectedImage ? (
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={selectedImage}
                      alt={product.name}
                      className="w-full h-full object-cover transition-all duration-500 ease-out"
                      draggable={false}
                      style={
                        isZoomed
                          ? {
                            transform: "scale(2.5)",
                            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                            transition: "transform 0.2s ease-out",
                          }
                          : {
                            transform: "scale(1)",
                            transformOrigin: "center center",
                          }
                      }
                      onLoad={() => setIsImageLoading(false)}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <svg
                      className="w-16 h-16 opacity-20"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm font-medium">No image available</span>
                  </div>
                )}

                {isImageLoading && selectedImage && (
                  <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                )}

                {/* Zoom hint */}
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  Click to expand
                </div>

                {/* Desktop arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2.5 shadow-lg text-gray-700 hover:bg-white hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      aria-label="Previous image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2.5 shadow-lg text-gray-700 hover:bg-white hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      aria-label="Next image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Mobile arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow text-gray-700 active:scale-95 transition"
                      aria-label="Previous image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow text-gray-700 active:scale-95 transition"
                      aria-label="Next image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Mobile dots */}
                {images.length > 1 && (
                  <div className="md:hidden absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          changeImage(i);
                        }}
                        aria-label={`Go to image ${i + 1}`}
                        className={`rounded-full transition-all duration-300 ${selectedIndex === i ? "w-6 h-2 bg-green-500" : "w-2 h-2 bg-white/80"
                          }`}
                      />
                    ))}
                  </div>
                )}

                {/* Image counter */}
                {images.length > 1 && (
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
                    {selectedIndex + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* Mobile thumbnails */}
              {images.length > 1 && (
                <div className="md:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => changeImage(i)}
                      aria-label={`View image ${i + 1}`}
                      className={`flex-shrink-0 w-16 rounded-lg overflow-hidden border-2 transition-all duration-300 snap-start ${selectedIndex === i
                          ? "border-green-500 shadow-md"
                          : "border-transparent opacity-60"
                        }`}
                      style={{ aspectRatio: "4/5" }}
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
              )}
            </div>
          </div>

          {/* RIGHT: DETAILS */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-24 h-fit">
            {/* Category badge */}
            {product.type && (
              <div className="animate-fade-in-up delay-100">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${typeColorClass}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  {typeLabel}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-gray-900 tracking-tight animate-fade-in-up delay-150">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 py-2 animate-fade-in-up delay-200">
              <span className="text-gray-400 text-xl font-medium">
                Contact for price
              </span>
            </div>

            <div className="h-px bg-gray-200 animate-fade-in-up delay-200" />

            {/* Variant selector */}
            {hasVariants && (
              <div className="space-y-3 animate-fade-in-up delay-250">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    Select Size / Option
                  </p>
                  <span className="text-xs text-gray-400">
                    {selectedVariant?.label} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v, i) => {
                    const isSelected = selectedVariant?.label === v.label;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedVariant(v)}
                        className={`relative px-5 py-3 rounded-xl text-sm font-medium border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${isSelected
                            ? "border-green-500 bg-green-50 text-green-700 shadow-sm shadow-green-500/10"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        <span className="font-semibold">{v.label}</span>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-scale-in">
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="space-y-2 animate-fade-in-up delay-300">
                <h3 className="text-sm font-semibold text-gray-700">
                  Description
                </h3>
                <p className="text-gray-600 leading-relaxed text-[15px]">
                  {product.description}
                </p>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-2 gap-3 animate-fade-in-up delay-300">
              {[
                {
                  icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                  text: "Premium Quality",
                },
                {
                  icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                  text: "Long-lasting",
                },
                {
                  icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
                  text: "Best Price",
                },
                {
                  icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
                  text: "Fast Delivery",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <svg
                    className="w-4 h-4 text-green-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={feature.icon}
                    />
                  </svg>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>

            {/* WhatsApp CTA */}
            <div className="flex flex-col gap-3 pt-4 animate-fade-in-up delay-350">
              <button
                onClick={handleWhatsAppEnquiry}
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg shadow-green-500/20 hover:scale-[1.01] active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.532 5.855L.064 23.446a.5.5 0 00.608.607l5.67-1.484A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.655-.502-5.184-1.38l-.37-.217-3.834 1.004 1.02-3.733-.236-.386A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                </svg>
                Enquire on WhatsApp
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 animate-fade-in-up delay-400">
              {[
                {
                  icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                  text: "100% Authentic",
                },
                {
                  icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
                  text: "Secure Payment",
                },
                {
                  icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                  text: "1,000+ Customers",
                },
              ].map((badge, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d={badge.icon}
                      />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {badge.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 md:mt-24">
        <AllProduct type={product.type} />
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-150 {
          animation-delay: 0.15s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .delay-250 {
          animation-delay: 0.25s;
        }
        .delay-300 {
          animation-delay: 0.3s;
        }
        .delay-350 {
          animation-delay: 0.35s;
        }
        .delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </>
  );
}