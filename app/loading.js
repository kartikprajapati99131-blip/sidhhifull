"use client";

import { useEffect, useState } from "react";

export default function Loading() {
  const [color, setColor] = useState("border-t-green-500");

  useEffect(() => {
    const colors = ["border-t-green-500", "border-t-blue-500"];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % colors.length;
      setColor(colors[i]);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      {/* Logo */}
      <h1 className="text-2xl font-bold mb-6 tracking-widest text-gray-800">
        SIDDHI
      </h1>

      {/* Spinner */}
      <div
        className={`w-12 h-12 border-4 border-gray-200 ${color} rounded-full animate-spin transition-colors duration-300`}
      ></div>

      {/* Text */}
      <p className="mt-4 text-sm text-gray-400 tracking-wide">
        Please wait...
      </p>
    </div>
  );
}