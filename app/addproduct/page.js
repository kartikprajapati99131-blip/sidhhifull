"use client";

import { useState } from "react";
import { CldUploadButton } from "next-cloudinary";
import Image from "next/image";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import { useSession } from "next-auth/react";
import { notFound } from "next/navigation";




export default function AddProduct() {


    const [form, setForm] = useState({
        name: "",
        price: "",
        type: "",
        description: "",
        image: null,
    });

    const handleUpload = (result) => {
        if (result.info && typeof result.info !== "string") {
            setForm((prev) => ({
                ...prev,
                image: {
                    url: result.info.secure_url,
                    public_id: result.info.public_id,
                },
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const res = await fetch("/api/product/create", {
            method: "POST",
            body: JSON.stringify(form),
        });

        const data = await res.json();

        if (data.success) {
            toast.success('Product added ✅', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
                transition: Bounce,
            });
            setForm({ name: "", price: "", description: "", image: null });
        }
    };
    const { data: session, status } = useSession();
    const isAdmin = session?.user?.role === "admin";
    if (status === "loading") {
        return <p>Loading...</p>;
    } else if (!session || !isAdmin) {
        return notFound();
    }

    return (
        <>
            <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                transition={Bounce}
            />
            <div className="p-10 max-w-xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Add Product</h1>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <input
                        placeholder="Product Name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                    <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">Select Type</option>
                        <option value="Laminate">Laminate</option>
                        <option value="Plywood">Plywood</option>
                        <option value="Glass">Glass</option>
                        <option value="UPVC">UPVC</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Alluminiumsection">Alluminiumsection</option>
                        <option value="Lock">Lock</option>
                        <option value="Handle">Handle</option>
                        <option value="Hinges">Hinges</option>
                        <option value="Wood">Wood</option>
                    </select>

                    <input
                        placeholder="Price"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className="w-full p-2 border rounded"
                    />

                    <textarea
                        placeholder="Description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full p-2 border rounded"
                    />

                    {/* Upload */}
                    <CldUploadButton
                        uploadPreset="bxbblrlt"
                        onSuccess={handleUpload}
                        className="flex items-center justify-center gap-2"
                    >
                        <div className="w-100 h-64 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500 transition overflow-hidden">

                            {/* If image uploaded */}
                            {!form.image ? (


                                <div className="text-center text-gray-500">
                                    <p className="text-lg font-semibold">Click to Upload</p>
                                    <p className="text-sm">or drag & drop</p>
                                </div>
                            ) : (
                                <img src={form.image.url} className="w-40 rounded mt-2" />
                            )}

                        </div>
                    </CldUploadButton>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded">
                        Save Product
                    </button>

                </form>
            </div>
        </>
    );
}