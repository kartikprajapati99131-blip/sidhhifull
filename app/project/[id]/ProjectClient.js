"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { CldUploadButton } from "next-cloudinary";
import Link from "next/link";

export default function ProjectClient({ project }) {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [images, setImages] = useState(project?.images || []);
  const [selectedImage, setSelectedImage] = useState(
    project?.images?.[0] || "/placeholder.png"
  );
  const [imgLoading, setImgLoading] = useState(false);

  const handleThumbClick = (img) => {
    if (img === selectedImage) return;
    setImgLoading(true);
    setSelectedImage(img);
  };

  // Don't render admin controls until session is resolved
  const sessionReady = status !== "loading";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Cormorant Garamond', serif; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(1.015); } to { opacity: 1; transform: scale(1); } }
        .fade-in { animation: fadeIn 0.35s ease forwards; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
      `}</style>

      <div className="min-h-screen bg-[#F8F5F0]">

        {/* BREADCRUMB */}
        <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-2">
          <ol className="flex items-center gap-2 text-xs text-gray-400 tracking-widest uppercase">
            <li><Link href="/" className="hover:text-gray-700 transition-colors">Home</Link></li>
            <li className="text-gray-300">/</li>
            <li><Link href="/projects" className="hover:text-gray-700 transition-colors">Projects</Link></li>
            <li className="text-gray-300">/</li>
            <li className="text-gray-600 truncate max-w-[140px]">{project.title}</li>
          </ol>
        </nav>

        {/* MAIN LAYOUT */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
          <article className="flex flex-col lg:grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] gap-10 lg:gap-14 items-start">

            {/* ══ LEFT: IMAGE GALLERY ══ */}
            <section aria-label="Project images" className="w-full">
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 w-full">

                {/* Thumbnails */}
                <div className="flex flex-row sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto sm:overflow-x-hidden scrollbar-none flex-shrink-0 sm:max-h-[500px] pb-1 sm:pb-0">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => handleThumbClick(img)}
                      aria-label={`View image ${i + 1}`}
                      className={`flex-shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-lg overflow-hidden border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
                        selectedImage === img
                          ? "border-stone-800 shadow-md scale-[1.04]"
                          : "border-transparent hover:border-stone-300"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${project.title} view ${i + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>

                {/* Main image */}
                <div
                  className="relative w-full overflow-hidden rounded-2xl bg-stone-100 shadow-sm"
                  style={{ aspectRatio: "4/3" }}
                >
                  <img
                    key={selectedImage}
                    src={selectedImage}
                    alt={`${project.title} — featured view`}
                    onLoad={() => setImgLoading(false)}
                    className={`absolute inset-0 w-full h-full object-cover fade-in transition-opacity duration-300 ${
                      imgLoading ? "opacity-0" : "opacity-100"
                    }`}
                  />

                  {project.category && (
                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-stone-700 text-[10px] font-medium tracking-[0.12em] uppercase px-3 py-1 rounded-full border border-stone-200 z-10">
                      {project.category}
                    </span>
                  )}

                  {images.length > 1 && (
                    <span className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-[11px] px-3 py-1 rounded-full tracking-wider z-10">
                      {images.indexOf(selectedImage) + 1} / {images.length}
                    </span>
                  )}
                </div>

              </div>
            </section>

            {/* ══ RIGHT: DETAILS ══ */}
            <aside className="w-full lg:sticky lg:top-24 flex flex-col gap-5 h-fit">

              {project.category && (
                <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-stone-400">
                  {project.category}
                </p>
              )}

              <h1 className="font-display text-3xl sm:text-4xl xl:text-5xl font-light text-stone-900 leading-tight">
                {project.title}
              </h1>

              <div className="h-px w-12 bg-stone-300" />

              {project.description && (
                <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                  {project.description}
                </p>
              )}

              <div className="bg-stone-100 border border-stone-200 rounded-xl px-5 py-4">
                <p className="text-stone-500 text-sm leading-relaxed">
                  This project showcases modern design principles, exceptional
                  durability, and premium finishing — crafted to elevate every
                  space it inhabits.
                </p>
              </div>

              {project.createdAt && (
                <div className="flex items-center gap-2 text-xs text-stone-400 tracking-wider uppercase">
                  <svg
                    className="w-3.5 h-3.5 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {new Date(project.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              )}

              <Link
                href="/contact"
                className="mt-2 flex items-center justify-center gap-2 border border-stone-900 text-stone-900 text-sm font-medium tracking-widest uppercase py-3.5 px-6 rounded-xl hover:bg-stone-900 hover:text-white transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                Contact / Enquiry
              </Link>

              {/* Share */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest">
                  Share
                </span>
                <a
                  href="https://wa.me/"
                  onClick={(e) => {
                    e.preventDefault();
                    const url = `https://wa.me/?text=${encodeURIComponent(
                      project.title + " — " + window.location.href
                    )}`;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on WhatsApp"
                  className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-green-600 hover:border-green-300 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.532 5.855L.064 23.446a.5.5 0 00.608.607l5.67-1.484A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.655-.502-5.184-1.38l-.37-.217-3.834 1.004 1.02-3.733-.236-.386A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                  </svg>
                </a>
                <button
                  aria-label="Copy link"
                  onClick={() =>
                    navigator.clipboard?.writeText(window.location.href)
                  }
                  className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:border-stone-400 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </svg>
                </button>
              </div>

              {/* Admin Upload — only render after session resolves */}
              {sessionReady && isAdmin && (
                <div className="pt-3 border-t border-stone-200">
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-3">
                    Admin — Add Image
                  </p>
                  <CldUploadButton
                    uploadPreset="bxbblrlt"
                    onSuccess={async (result) => {
                      const url =
                        result?.info?.secure_url || result?.info?.url;
                      if (!url) return;
                      await fetch(`/api/project/${project._id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ newImage: url }),
                      });
                      setImages((prev) => [...prev, url]);
                      setSelectedImage(url);
                    }}
                  >
                    <div className="h-[90px] w-full border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-stone-50 hover:border-stone-300 transition-colors cursor-pointer group">
                      <svg
                        className="w-6 h-6 text-stone-300 group-hover:text-stone-500 transition-colors"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span className="text-xs text-stone-400 group-hover:text-stone-600 transition-colors">
                        Upload image
                      </span>
                    </div>
                  </CldUploadButton>
                </div>
              )}

            </aside>
          </article>
        </main>
      </div>
    </>
  );
}