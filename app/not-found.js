import Link from "next/link";

export const metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <p className="text-8xl font-bold text-gray-200 select-none">404</p>
      <h1 className="text-2xl font-semibold text-gray-800 mt-4">Page not found</h1>
      <p className="text-gray-500 mt-2 max-w-sm">
        The product or page you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <div className="flex gap-3 mt-8">
        <Link
          href="/shop"
          className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition"
        >
          Browse Shop
        </Link>
        <Link
          href="/"
          className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}