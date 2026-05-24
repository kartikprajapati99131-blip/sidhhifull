"use client";
import { useEffect } from "react";

export default function GoogleReviews() {
  useEffect(() => {
    const existing = document.querySelector('script[src*="trustindex"]');
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.src = "https://cdn.trustindex.io/loader.js?661bf6c7167c268f2b468492875";
    script.defer = true;
    script.async = true;

    // Inject script INSIDE our container, not in <head>
    // This tells Trustindex to render near this element
    document.getElementById("trustindex-container")?.appendChild(script);
  }, []);

  return (
    <div
      id="trustindex-container"
      className="w-full px-4 py-10 "
    >
      <div data-widget-id="661bf6c7167c268f2b468492875" />
    </div>
  );
}


