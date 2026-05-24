import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/footer";
import SemiNav from "@/components/seminav";
import SessionProvider from "@/components/SessionProvider";
import AnimationWrapper from "@/components/AnimationWraper";
import { CartProvider } from "@/context/CartContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ SEO FIX: Full metadata with OG tags, Twitter cards, and keywords
export const metadata = {
  metadataBase: new URL("https://www.siddhiinteriors.com"), // 🔁 Replace with your actual domain
  icons: {
    icon: "/JUST-LOGO.svg",
  },
  title: {
    default: "SIDDHI — Plywood, Laminate & Furniture Materials, Palanpur",
    template: "%s | SIDDHI",
  },
  description:
    "SIDDHI is Palanpur's trusted supplier of premium plywood, laminate, glass, UPVC, aluminium, hardware, handles, hinges, locks and wood products for homes and businesses.",
  keywords: [
    "plywood Palanpur",
    "laminate Palanpur",
    "furniture materials Palanpur",
    "interior materials India",
    "UPVC windows Palanpur",
    "glass Palanpur",
    "hardware store Palanpur",
    "SIDDHI",
    "wood suppliers Palanpur",
    "aluminium sections Palanpur",
  ],
  authors: [{ name: "Kartik Prajapati" }],
  creator: "Kartik Prajapati",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.siddhiinteriors.com",
    siteName: "SIDDHI",
    title: "SIDDHI — Plywood, Laminate & Furniture Materials, Palanpur",
    description:
      "Palanpur's trusted supplier of premium plywood, laminate, glass, UPVC, aluminium, hardware and wood products. Quality materials for homes and businesses.",
    images: [
      {
        url: "/og-image.jpg", // 🔁 Add a 1200x630 image to your /public folder
        width: 1200,
        height: 630,
        alt: "SIDDHI — Premium Interior Materials, Palanpur",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SIDDHI — Plywood, Laminate & Furniture Materials, Palanpur",
    description:
      "Palanpur's trusted supplier of premium plywood, laminate, glass, UPVC, aluminium and hardware products.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// ✅ SEO FIX: LocalBusiness structured data (JSON-LD) for Google rich results
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SIDDHI",
  description:
    "Palanpur's trusted supplier of premium plywood, laminate, glass, UPVC, aluminium, hardware and wood products.",
  url: "https://www.siddhiinteriors.com",
  logo: "https://www.siddhiinteriors.com/JUST-LOGO.svg",
  image: "https://www.siddhiinteriors.com/og-image.jpg",
  telephone: "+91-9023238916", // 🔁 Replace with real phone
  email: "info@siddhiinteriors.com", // 🔁 Replace with real email
  address: {
    "@type": "PostalAddress",
    streetAddress: "", // 🔁 Add street address
    addressLocality: "Palanpur",
    addressRegion: "Gujarat",
    postalCode: "385001", // 🔁 Add pin code
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 22.3072,   // 🔁 Update with exact coordinates
    longitude: 73.1812,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "19:00",
    },
  ],
  sameAs: [
    // 🔁 Add your social media URLs here
    // "https://www.facebook.com/siddhiinteriors",
    // "https://www.instagram.com/siddhiinteriors",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* ✅ SEO FIX: JSON-LD structured data injected into every page */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <CartProvider>
          <SessionProvider>
            <Navbar />
            <SemiNav />
            <div className="flex-1 ">
              <AnimationWrapper>
                {children}
              </AnimationWrapper>
            </div>
            <Footer />
          </SessionProvider>
        </CartProvider>
      </body>
    </html>
  );
}
