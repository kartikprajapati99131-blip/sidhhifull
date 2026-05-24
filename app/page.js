// ✅ SEO FIX: Removed "use client" — this is now a server component so Google can index it.
// Interactive parts (image load state) moved to a client child if needed.
import Image from "next/image";
import Main from "@/components/Main";
import AboutUs from "@/components/aboutus";

// ✅ SEO FIX: Page-specific metadata (overrides layout default via template)
export const metadata = {
  title: "Home",
  description:
    "Welcome to SIDDHI — Palanpur's trusted destination for plywood, laminate, glass, UPVC, hardware, aluminium, handles, hinges, locks and wood. Shop quality interior materials online.",
  openGraph: {
    title: "SIDDHI — Premium Interior Materials, Palanpur",
    description:
      "Shop plywood, laminate, glass, UPVC, hardware, aluminium and more. Quality interior materials delivered across Palanpur and Gujarat.",
    url: "https://www.siddhiinteriors.com",
  },
  alternates: {
    canonical: "https://www.siddhiinteriors.com",
  },
};

export default function Home() {
  return (
    <>
      <div className="min-h-screen justify-center">
        <div className="justify-center items-center flex w-full">
          <Image
            src="/Background.jpg"
            alt="SIDDHI — Premium Interior Materials showroom, Palanpur"
            width={1800}
            height={1200}
            priority
            className="mask-b-from-20% mask-b-to-80% opacity-50 object-cover h-auto w-full"
          />
          {/* ✅ SEO FIX: H1 now has meaningful text visible to Google */}
          <h1 className="absolute top-100 max-md:top-40 gap-2 flex items-center md:text-6xl max-md:text-3xl font-serif font-bold text-gray-500">
            Welcome to
            <Image
              src="/s-text.svg"
              alt="SIDDHI"
              width={250}
              height={220}
              priority
              className="mt-2.5 h-auto md:w-60 w-30"
            />
          </h1>
        </div>
        <Main />
        <AboutUs />
      </div>
    </>
  );
}
