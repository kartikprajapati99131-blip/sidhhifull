// ✅ SEO FIX: sitemap.js
// Next.js automatically serves this as /sitemap.xml
// Submit this URL to Google Search Console after deploying.
// 🔁 Replace "https://www.siddhiinteriors.com" with your real domain everywhere.

const BASE_URL = "https://www.siddhiinteriors.com";

const PRODUCT_TYPES = [
  "Plywood",
  "Laminate",
  "Glass",
  "UPVC",
  "Hardware",
  "Aluminium",
  "Lock",
  "Handle",
  "Hinges",
  "Wood",
];

export default function sitemap() {
  // Static pages
  const staticRoutes = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  // One URL per product category (shop filter pages)
  const categoryRoutes = PRODUCT_TYPES.map((type) => ({
    url: `${BASE_URL}/shop?type=${type}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.85,
  }));

  return [...staticRoutes, ...categoryRoutes];
}
