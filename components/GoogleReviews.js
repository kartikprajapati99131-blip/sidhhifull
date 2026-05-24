"use client";

import { useEffect } from "react";

export default function GoogleReviews() {
  useEffect(() => {
    // Prevent duplicate script loading
    if (document.querySelector('script[src*="featurable.com"]')) return;

    const script = document.createElement("script");
    script.src = "https://featurable.com/assets/bundle.js";
    script.async = true;
    script.defer = true;
    script.charset = "UTF-8";

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <section className="w-full  py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div
          id="featurable-82e974cb-c833-4324-8cbe-812866404f45"
          data-featurable-async
          className="rounded-3xl overflow-hidden"
        ></div>
      </div>
    </section>
  );
}