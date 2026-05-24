"use client";
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-gray-300 text-black px-6 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">

        {/* Brand */}
        <div>
          <h2 className="text-white text-2xl font-bold">
            <Link href="/">
              <Image src="/s-black.svg" alt="Get Me Chai Logo" width={150} height={120} priority className="h-auto w-40" />
            </Link>
          </h2>
          <p className="mt-3 text-sm">
            Premium products delivered fast and securely.
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className=" font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li> <Link href="/">Home</Link></li>
            <li> <Link href="/shop">Shop</Link></li>
            
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className=" font-semibold mb-3">Support</h3>
          <ul className="space-y-2 text-sm">
            <Link href="/contact">Help Center</Link>
            <li>Returns</li>
            <li>Shipping</li>
            <li>FAQ</li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h3 className=" font-semibold mb-3">Follow Us</h3>
          <div className="flex gap-4 text-lg">
            <FaFacebook className="hover:text-white cursor-pointer" />
            <FaInstagram className="hover:text-white cursor-pointer" />
            <FaTwitter className="hover:text-white cursor-pointer" />
            <FaLinkedin className="hover:text-white cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-700 mt-10 pt-6 text-center text-sm">
        © {new Date().getFullYear()} Siddhi. All rights reserved.
      </div>
    </footer>
  );
}