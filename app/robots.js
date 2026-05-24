// ✅ SEO FIX: robots.js
// Next.js automatically serves this as /robots.txt
// Allows Google to crawl public pages, blocks admin/internal pages.
// 🔁 Replace "https://www.siddhiinteriors.com" with your real domain.

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/shop", "/about", "/projects", "/detail/"],
        disallow: [
          "/products",       // admin product management
          "/addproduct",     // admin add product
          "/orders",         // admin orders view
          "/users",          // admin users view
          "/allattendance",  // employee attendance (internal)
          "/attandance",     // employee attendance (internal)
          "/customer",       // admin customer management
          "/allrewiew",      // admin reviews management
          "/profile/",       // user profiles (private)
          "/yourorders",     // user order history (private)
          "/cart",           // cart (no SEO value)
          "/api/",           // all API routes
          "/login",          // auth pages
          "/register",       // auth pages
          "/addprojects",    // admin
          "/question",       // internal
        ],
      },
    ],
    sitemap: "https://www.siddhiinteriors.com/sitemap.xml",
  };
}
