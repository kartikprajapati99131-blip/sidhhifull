export default function Loading() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
      
      {/* Logo */}
      <h1 className="text-2xl font-bold mb-6">Siddhi Enterprise</h1>

      {/* Spinner */}
      <div className="w-10 h-10 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>

      {/* Text */}
      <p className="mt-4 text-gray-400">Please wait...</p>
    </div>
  );
}