"use client";

import { useEffect, useState } from "react";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function ProductsPage({ type }) {
    const { data: session } = useSession();
    const { addToCart } = useCart();
    const searchParams = useSearchParams();
    const selectedType = searchParams.get("type");


    const [products, setProducts] = useState([]);
    const [cartdata, setcartdata] = useState([]);

    useEffect(() => {
        fetchProducts();
    }, [selectedType]);

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/type?type=" + (type || ""));

            // 🚨 handle 401 / errors
            if (!res.ok) {
                console.error("API Error:", res.status);
                setProducts([]); // prevent crash
                return;
            }

            const data = await res.json();

            // 🛡️ safety check
            if (Array.isArray(data)) {
                setProducts(data);
            } else {
                console.error("Invalid response:", data);
                setProducts([]);
            }

        } catch (err) {
            console.error("Fetch failed:", err);
            setProducts([]);
        }
    };
    const handleAdtoCart = (product) => {
        addToCart(product);
        setcartdata(product);

        toast.success(`${product.name} added to cart`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
            transition: Bounce,
        });

    }

    return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={true}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                transition={Bounce}
            />
            <div className="  min-h-screen justify-center text-center  ">
                <h1 className="text-2xl font-bold mb-4  mt-10 gap-4">
                    This {type} is for you
                </h1>
                <p className=" text-sm md:text-lg opacity-90 mb-4">
                    Durability you can trust. Quality you can feel.
                </p>



                <div className="p-5 w-full max-w-6xl mx-auto">


                    {/* 🧱 Grid */}
                    <div className="space-y-4 -mt-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {Array.isArray(products) && products.slice(0, 10).map((p) => (
                                <div key={p._id}>

                                    <Link href={`/detail/${p._id}`} >

                                        <div

                                            className="bg-gray-100 text-center backdrop-blur-md shadow-lg rounded-2xl p-4 hover:scale-105 transition w-full"
                                        >
                                            {/* Image */}
                                            <img
                                                src={p.image?.url}
                                                alt={p.name}
                                                className="object-contain w-32 h-32 mx-auto bg-gray-200 rounded-2xl mb-4 shadow-sm"
                                            />

                                            {/* Name */}
                                            <h3 className="text-lg font-semibold">{p.name}</h3>

                                            {/* Price */}
                                            <p className="text-gray-600 text-sm font-medium">₹ {p.price}</p>
                                            {selectedType === "Plywood" && (
                                                <p className="text-gray-600 text-sm font-medium">per S.q.ft</p>

                                            )
                                            }
                                            {/* Type */}
                                            {/* <p className="text-gray-500 text-sm">{p.type}</p> */}

                                            {/* Description (optional short) */}
                                            <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                                                {p.description}
                                            </p>
                                            <button
                                                onClick={() => handleAdtoCart(p)}
                                                className="mt-2  border border-gray-50 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                                                Add to Cart
                                            </button>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}