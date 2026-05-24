// ✅ SEO FIX: This is now a SERVER component.
// Products are fetched at request time so Google's crawler sees real content.
// All interactive logic (add to cart, toast) stays in ShopClient below.

import ShopClient from "./ShopClient";
import connectDB from "@/db/connectDb";
import Product from "@/models/product";

const COVER_MAP = {
  Plywood: { src: "/covers/PlywoodCover.png", alt: "Plywood products — SIDDHI Palanpur" },
  Laminate: { src: "/covers/LaminateCover.png", alt: "Laminate products — SIDDHI Palanpur" },
  Glass: { src: "/covers/GlassCover.png", alt: "Glass products — SIDDHI Palanpur" },
  UPVC: { src: "/covers/upvcCover.png", alt: "UPVC windows and doors — SIDDHI Palanpur" },
  Hardware: { src: "/covers/HardwareCover.png", alt: "Hardware products — SIDDHI Palanpur" },
  Aluminium: { src: "/covers/AllumimiumCover.png", alt: "Aluminium sections — SIDDHI Palanpur" },
  Lock: { src: "/covers/LockCover.png", alt: "Lock products — SIDDHI Palanpur" },
  Handle: { src: "/covers/handleCover.png", alt: "Door handles — SIDDHI Palanpur" },
  Hinges: { src: "/covers/hingesCover.png", alt: "Hinges — SIDDHI Palanpur" },
  Wood: { src: "/covers/woodCover.png", alt: "Wood products — SIDDHI Palanpur" },
};

// ✅ FIX: await searchParams (required in Next.js 15+)
export async function generateMetadata({ searchParams }) {
  const resolvedParams = await searchParams;
  const type = resolvedParams?.type || "";

  const title = type
    ? `${type} Products — Buy ${type} in Palanpur`
    : "Shop All Products — Interior Materials Palanpur";
  const description = type
    ? `Buy premium ${type} products from SIDDHI, Palanpur. Best quality ${type.toLowerCase()} at competitive prices. Fast delivery across Gujarat.`
    : "Shop all interior materials at SIDDHI — plywood, laminate, glass, UPVC, aluminium, hardware, handles, hinges, locks and wood. Palanpur's trusted interior supplier.";

  return {
    title,
    description,
    openGraph: {
      title: `${title} | SIDDHI`,
      description,
      url: `https://sidhhifull-l1oi.vercel.app/shop${type ? `?type=${type}` : ""}`,
      images: COVER_MAP[type]
        ? [{ url: COVER_MAP[type].src, alt: COVER_MAP[type].alt }]
        : undefined,
    },
    alternates: {
      canonical: `https://sidhhifull-l1oi.vercel.app/shop${type ? `?type=${type}` : ""}`,
    },
  };
}

async function getProducts(type) {
  try {
    await connectDB();
    const query = type ? { type } : {};
    const products = await Product.find(query).lean();
    return products.map((p) => ({
      ...p,
      _id: p._id.toString(),
      createdAt: p.createdAt?.toString() || null,
      updatedAt: p.updatedAt?.toString() || null,
    }));
  } catch {
    return [];
  }
}

export default async function ShopPage({ searchParams }) {
  // ✅ FIX: await searchParams (required in Next.js 15+)
  const resolvedParams = await searchParams;
  const type = resolvedParams?.type || "";

  const products = await getProducts(type);
  const cover = COVER_MAP[type] || null;

  const productListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: type ? `${type} Products` : "All Products",
    description: type
      ? `Premium ${type} products available at SIDDHI, Palanpur`
      : "All interior material products at SIDDHI, Palanpur",
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
          seller: { "@type": "Organization", name: "SIDDHI" },
        },
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productListSchema) }}
      />

      <div className="min-h-screen justify-center text-center">
        <h1 className="text-2xl font-bold mb-4 mt-10 gap-4">
          {type ? `Premium ${type} Products for Modern Living` : "All Products — Interior Materials"}
        </h1>
        <p className="text-sm md:text-lg opacity-90 mb-4">
          Durability you can trust. Quality you can feel.
        </p>

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

        <ShopClient initialProducts={products} selectedType={type} />
      </div>
    </>
  );
}