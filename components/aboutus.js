// ✅ SEO FIX: About page already had no "use client" — kept as server component.
// Added metadata export for unique title and description.

import React from "react";
import Link from "next/link";
import GoogleReviews from "@/components/GoogleReviews";

export const metadata = {
  title: "About Us",
  description:
    "Learn about SIDDHI — Palanpur's trusted supplier of premium plywood, laminate, glass, UPVC and interior materials. Our story, mission, values and the brands we work with.",
  openGraph: {
    title: "About SIDDHI — Our Story, Mission & Values",
    description:
      "From a small plywood supplier to a complete interior materials destination. Learn about SIDDHI, our values, and the premium brands we stock in Palanpur.",
    url: "https://siddhionline.com/about",
  },
  alternates: {
    canonical: "https://siddhionline.com/about",
  },
};

const about = () => {
  return (
    <>
    <div className="bg-gray-100 text-gray-900 shadow-md  m-2 md:m-15 rounded-2xl">

            {/* 🔥 HERO */}
            <section className="text-center py-24 px-6 bg-gradient-to-r  rounded-2xl from-gray-50 via-gray-100 to-gray-50">
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
                        alt="shop"
                        className="rounded-xl shadow-md"
                    />
                </div>
            </section>

            {/* 🎯 MISSION + VISION */}
            <section className="py-20 px-6 bg-gray-100">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">
                    <div>
                        <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
                        <p className="text-gray-600">
                            To provide high-quality, reliable, and affordable furniture and interior materials under one roof, making it easier for customers to create strong, functional, and beautiful spaces. We are committed to delivering trusted products, expert guidance, and a smooth experience for every project.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-3">Our Promise</h2>
                        <p className="text-gray-600">
                            To become a leading and most trusted one-stop destination for furniture and interior materials, known for quality, innovation, and customer satisfaction — empowering builders, designers, and homeowners to create better spaces with confidence.
                        </p>
                    </div>
                </div>
            </section>

            {/* 💎 VALUES */}
            <section className="py-20 px-6 max-w-6xl mx-auto text-center">
                <h2 className="text-3xl font-semibold mb-10">Our Values</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {["Trust & Transparency", "Quality & Reliability", "Innovation & Creativity", "Customer Satisfaction", "Customer Focus", "Complete Solutions", "Continuous Improvement", "Commitment to Excellence"].map((item) => (
                        <div
                            key={item}
                            className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition"
                        >
                            <h3 className="font-medium">{item}</h3>
                        </div>
                    ))}
                </div>
            </section>

            {/* 👥 TEAM */}
            <section className="py-20 px-6 bg-gray-100 text-center mx-auto">
                <h2 className="text-3xl font-semibold mb-12">Brands We Work With</h2>

                <div className="grid md:grid-cols-5 gap-10 max-w-6xl mx-auto">
                    {[
                        { name: "Dorby", role: "Laminate", src: "/logos/dorby.png" },
                        { name: "Magnus", role: "Plywood", src: "/logos/magnus.png" },
                        { name: "Sitos", role: "Plywood", src: "/logos/sitos.png" },
                        { name: "Saint Gobain", role: "Glass", src: "/logos/saint-gobin.png" },
                        { name: "Sitos", role: "Plywood", src: "/logos/weathersheal.png" },
                    ].map((member, i) => (
                        <div key={i}>
                            <img
                                src={member.src}
                                alt={member.name}
                                className=" object-contain w-32 h-32 mx-auto rounded-2xl mb-4 shadow-sm"
                            />
                            <h3 className="text-lg font-semibold">{member.name}</h3>
                            <p className="text-gray-500 text-sm">{member.role}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 📊 STATS */}
            <section className="py-20 px-6 text-center max-w-6xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-1 gap-10">
                    {[
                        { label: "Experience", value: "16+ Years" },
                    ].map((stat, i) => (
                        <div key={i}>
                            <h3 className="text-3xl font-bold">{stat.value}</h3>
                            <p className="text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 🚀 CTA */}
            <section className="py-20 px-6 text-center bg-gray-400 text-white rounded-2xl">
                <h2 className="text-3xl font-bold">Let’s Work Together</h2>
                <p className="mt-4 text-blue-100">
                    Let’s bring your furniture and interior ideas to life.
                </p>
                <Link href="/contact">
                    <button className="mt-6 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:scale-105 transition">
                        Contact Us
                    </button>
                </Link>
            </section>

        </div>
      <GoogleReviews />
    </>
  );
};

export default about;
