"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ToastContainer, toast, Bounce } from 'react-toastify';


export default function ContactPage() {

  const [form, setForm] = useState({
    name: "",
    phone: "",
    message: "",
  });
  const handleContact = async (e) => {


    const res = await fetch("/api/contact/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!data.success) {
      toast.warn(data.message);
      return;
    }

    toast.success('Message sent successfully ✅', {
      position: "top-right",
      autoClose: 3000,
      theme: "dark",
    });

    setForm({ name: "", email: "", phone: "", message: "" });
  };
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />

      <div className="h-[200vh] max-md:h-[250vh] bg-white text-gray-800">

        {/* 🔥 Hero Section */}
        <div className="bg-gradient-to-r  text-black py-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Contact Us</h1>
          <p className="mt-4 text-lg opacity-90">
            We'd love to hear from you. Let's talk!
          </p>
        </div>

        {/* 📦 Main Section */}
        <div className="max-w-6xl mx-auto px-6  grid md:grid-cols-2 gap-10">

          {/* 📩 Contact Form */}
          <div className="bg-white shadow-xl rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-6">Send a Message</h2>

            <form action={handleContact} className="space-y-5">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="flex">

                {/* +91 Prefix */}
                <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200  border-gray-300 rounded-l-lg border ">
                  +91
                </span>
                <input
                  value={form.phone}
                  onChange={handleChange}
                  type="tel"
                  name="phone"
                  placeholder="Enter phone number"
                  maxLength={10}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <textarea
                name="message"
                placeholder="Your Message"
                rows="5"
                value={form.message}
                onChange={handleChange}
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* 📍 Contact Info */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="p-6 bg-gray-100 rounded-xl shadow-sm">
              <h3 className="font-semibold text-lg">📍 Address</h3>
              <div className="text-gray-600 mt-2">
                <p className="font-bold">SIDDHI GLASS & PLYWOOD CENTER</p>
                <p>Shop No 38, Old Gunj Bazaar,
                  nearby SBI Bank, Sanskar Society, Palanpur, Gujarat 385001 </p>
              </div>
            </div>
            <div className="p-6 bg-gray-100 rounded-xl shadow-sm">
              <h3 className="font-semibold text-lg">📧 Email</h3>
              <p className="text-gray-600 mt-2">
                siddhi123@gmail.com
              </p>
            </div>
            <div className="p-6 bg-gray-100 rounded-xl shadow-sm">
              <h3 className="font-semibold text-lg">📞 Phone</h3>
              <p className="text-gray-600 mt-2 flex gap-6">
                <a href="tel:9023238916"> +91 9023238916</a>
                <a href="tel:9898986312"> +91 9898986312</a>
              </p>
            </div>
          </div>
        </div>

        {/* 🗺️ Map Section */}
        <div className="w-full h-[400px]">
          <div className="py-16 px-6 bg-gradient-to-b from-white to-gray-50">
            {/* Heading */}
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                Our Location
              </h2>
              <p className="text-gray-500 mt-2">
                Visit us or find us easily on the map
              </p>
            </div>
            {/* Map Card */}
            <div className="max-w-6xl mx-auto relative group">

              {/* Glow Border */}
              <div className=" bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>

              {/* Glass Card */}
              <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-white/20">

                {/* Map */}
                <div className="w-full h-[400px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!3m2!1sen!2sin!4v1776075857367!5m2!1sen!2sin!6m8!1m7!1sbS8My7lQaN-5UT94qa-uxQ!2m2!1d24.16845635665575!2d72.43284704886223!3f115.62849513312229!4f13.818140886549116!5f0.4000000000000002"
                    className="w-full h-full border-0"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>

                {/* Bottom Info Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">

                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      Our Shop
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Gujarat, India
                    </p>
                  </div>

                  <a
                    href="https://maps.app.goo.gl/X7tsetpGdqVsUWCW7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105"
                  >
                    Open in Google Maps
                  </a>


                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}