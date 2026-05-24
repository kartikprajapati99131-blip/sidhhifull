// ✅ SEO FIX: About page already had no "use client" — kept as server component.
// Added metadata export for unique title and description.

import React from "react";
import Link from "next/link";

export const metadata = {
  title: "About Us",
  description:
    "Learn about Siddhi Interiors — Vadodara's trusted supplier of premium plywood, laminate, glass, UPVC and interior materials. Our story, mission, values and the brands we work with.",
  openGraph: {
    title: "About Siddhi Interiors — Our Story, Mission & Values",
    description:
      "From a small plywood supplier to a complete interior materials destination. Learn about Siddhi Interiors, our values, and the premium brands we stock in Vadodara.",
    url: "https://www.siddhiinteriors.com/about",
  },
  alternates: {
    canonical: "https://www.siddhiinteriors.com/about",
  },
};

const about = () => {
  return (
    <div className="bg-gray-100 text-gray-900 shadow-md m-2 md:m-15 rounded-2xl">

      {/* 🔥 HERO */}
      <section className="text-center py-24 px-6 bg-gradient-to-r rounded-2xl from-gray-50 via-gray-100 to-gray-50">
        <h1 className="text-5xl md:text-6xl font-bold">
          We Build Dream Spaces
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          We Bring your dreams in to reality.
        </p>
      </section>

      {/* 📖 STORY */}
      <section className="py-20 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-semibold mb-4">Our Story</h2>
          <p className="text-gray-600 leading-relaxed capitalize">
            What began as a small effort to supply quality plywood and essential materials soon grew into a complete destination for furniture and interior solutions. We saw a common challenge: finding reliable, high-quality materials from different places was time-consuming and inconsistent. So, we decided to change that.
          </p>
        </div>
        <div>
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
            alt="Siddhi Interiors team at work"
            className="rounded-2xl w-full object-cover"
          />
        </div>
      </section>

      <GoogleReviews />

    </div>
  );
};

export default about;
