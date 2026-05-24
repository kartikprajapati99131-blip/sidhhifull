// ✅ SEO FIX: This is now a SERVER component.
// Products are fetched at request time so Google's crawler sees real content.
// All interactive logic (add to cart, toast) stays in ShopClient below.

import ShopClient from "./ShopClient";

const COVER_MAP = {
  Plywood:   { src: "/covers/PlywoodCover.png",     alt: "Plywood products — Siddhi Interiors Vadodara" },
  Laminate:  { src: "/covers/LaminateCover.png",    alt: "Laminate products — Siddhi Interiors Vadodara" },
  Glass:     { src: "/covers/GlassCover.png",       alt: "Glass products — Siddhi Interiors Vadodara" },
  UPVC:      { src: "/covers/upvcCover.png",        alt: "UPVC windows and doors — Siddhi Interiors Vadodara" },
  Hardware:  { src: "/covers/HardwareCover.png",    alt: "Hardware products — Siddhi Interiors Vadodara" },
  Aluminium: { src: "/covers/AllumimiumCover.png",  alt: "Aluminium sections — Siddhi Interiors Vadodara" },
  Lock:      { src: "/covers/LockCover.png",        alt: "Lock products — Siddhi Interiors Vadodara" },
  Handle:    { src: "/covers/handleCover.png",      alt: "Door handles — Siddhi Interiors Vadodara" },
  Hinges:    { src: "/covers/hingesCover.png",      alt: "Hinges — Siddhi Interiors Vadodara" },
  Wood:      { src: "/covers/woodCover.png",        alt: "Wood products — Siddhi Interiors Vadodara" },
};

// ✅ SEO FIX: Dynamic metadata per category (Google shows the right title per filter)
export async function generateMetadata({ searchParams }) {
  const type = searchParams?.type || "";
  const title = type
    ? `${type} Products — Buy ${type} in Vadodara`
    : "Shop All Products — Interior Materials Vadodara";
  const description = type
    ? `Buy premium ${type} products from Siddhi Interiors, Vadodara. Best quality ${type.toLowerCase()} at competitive prices. Fast delivery across Gujarat.`
    : "Shop all interior materials at Siddhi Interiors — plywood, laminate, glass, UPVC, aluminium, hardware, handles, hinges, locks and wood. Vadodara's trusted interior supplier.";

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Siddhi Interiors`,
      description,
      url: `https://www.siddhiinteriors.com/shop${type ? `?type=${type}` : ""}`,
      images: COVER_MAP[type]
        ? [{ url: COVER_MAP[type].src, alt: COVER_MAP[type].alt }]
        : undefined,
    },
    alternates: {
      canonical: `https://www.siddhiinteriors.com/shop${type ? `?type=${type}` : ""}`,
    },
  };
}

// ✅ SEO FIX: Fetch products on the server so HTML contains real product data
async function getProducts(type) {
  try {
    const url = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/type${type ? `?type=${type}` : ""}`;
    const res = await fetch(url, { next: { revalidate: 60 } }); // revalidate every 60s
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function ShopPage({ searchParams }) {
  const type = searchParams?.type || "";
  const products = await getProducts(type);
  const cover = COVER_MAP[type] || null;

  // ✅ SEO FIX: Product list schema so Google shows products in search results
  const productListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: type ? `${type} Products` : "All Products",
    description: type
      ? `Premium ${type} products available at Siddhi Interiors, Vadodara`
      : "All interior material products at Siddhi Interiors, Vadodara",
    numberOfItems: products.length,
    itemListElement: products.slice(0, 10).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: p.name,
        description: p.description,
        image: p.image?.url,
        offers: {
          "@type": "Offer",
          price: p.price,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          seller: { "@type": "Organization", name: "Siddhi Interiors" },
        },
      },
    })),
  };

  return (
    <>
      {/* ✅ SEO FIX: Structured data for product listings */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productListSchema) }}
      />

      {/* ✅ SEO FIX: Static, server-rendered heading Google can read */}
      <div className="min-h-screen justify-center text-center">
        <h1 className="text-2xl font-bold mb-4 mt-10 gap-4">
          {type ? `Premium ${type} Products for Modern Living` : "All Products — Interior Materials"}
        </h1>
        <p className="text-sm md:text-lg opacity-90 mb-4">
          Durability you can trust. Quality you can feel.
        </p>

        {/* ✅ SEO FIX: Cover image with descriptive alt text */}
        {cover && (
          <div className="max-w-7xl mx-auto">
            <img
              src={cover.src}
              alt={cover.alt}
              width={1800}
              height={800}
              className="opacity-80 h-full w-full"
            />
          </div>
        )}

        {/* Client component handles cart, toast, and interactions */}
        <ShopClient initialProducts={products} selectedType={type} />
      </div>
    </>
  );
}
