"use client";

import { useEffect, useState } from "react";
import { CldUploadButton } from "next-cloudinary";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import { useSession } from "next-auth/react";
import { notFound } from "next/navigation";



export default function ProductsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    type: "",
    description: "",
    image: null,
  });
  const confirmDelete = (onConfirm) => {
    toast(
      ({ closeToast }) => (
        <div className="flex flex-col gap-3">
          <p className="font-semibold">Are you sure?</p>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                onConfirm();
                closeToast();
              }}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Yes
            </button>

            <button
              onClick={closeToast}
              className="bg-gray-400 text-white px-3 py-1 rounded"
            >
              No
            </button>
          </div>
        </div>
      ),
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
      }
    );
  };

  const handleDelete = (id) => {
    confirmDelete(async () => {
      try {
        const res = await fetch("/api/product/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        });

        const data = await res.json();

        if (!data.success) {
          toast.error("Delete failed ❌");
          return;
        }

        setProducts((prev) =>
          prev.filter((item) => item._id !== id)
        );

        toast.success("Deleted successfully 🗑️");

      } catch (err) {
        console.error(err);
        toast.error("Something went wrong ❌");
      }
    });
  };
  const [products, setProducts] = useState([]);
  const [type, setType] = useState("");

  useEffect(() => {
    fetchProducts();
  }, [type]);

  const fetchProducts = async () => {
    const res = await fetch("/api/type?type=" + type);
    const data = await res.json();
    setProducts(data);
  };
  const handleUpdate = async () => {
    try {
      const res = await fetch("/api/product/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editItem._id,
          data: form,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error("Update failed ❌");
        return;
      }

      toast.success("Product updated successfully ✅");

      setProducts((prev) =>
        prev.map((item) =>
          item._id === editItem._id ? data.product : item
        )
      );

      setEditItem(null);

    } catch (err) {
      console.error(err);
      toast.error("Something went wrong ❌");
    }
  };
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

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />
      <div className="p-5 w-full max-w-6xl mx-auto">

        {/* 🔽 Filter */}
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mb-6 p-2 border rounded"
        >
          <option value="">All</option>
          <option value="Laminate">Laminate</option>
          <option value="Plywood">Plywood</option>
          <option value="Glass">Glass</option>
          <option value="UPVC">UPVC</option>
          <option value="Hardware">Hardware</option>
        </select>
        {editItem && (
          <div className="p-4 border rounded mb-6 bg-gray-50">

            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
              className="border p-2 w-full mb-2"
            />

            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Price"
              className="border p-2 w-full mb-2"
            />

            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="border p-2 w-full mb-2"
            >
              <option value="">Select Type</option>
              <option value="Laminate">Laminate</option>
              <option value="Plywood">Plywood</option>
              <option value="Glass">Glass</option>
              <option value="UPVC">UPVC</option>
              <option value="Hardware">Hardware</option>
            </select>
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

            <button
              onClick={handleUpdate}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Update
            </button>

          </div>
        )}
        {/* 🧱 Grid */}
        <div className="space-y-4">
          {products.map((p) => (
            <div
              key={p._id}
              className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border"
            >

              {/* Left Section */}
              <div className="flex items-center gap-4">

                {/* Image */}
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center shadow-sm">
                  <img
                    src={p.image?.url}
                    alt={p.name}
                    className="w-14 h-14 object-contain"
                  />
                </div>

                {/* Details */}
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-10">

                  <h2 className="font-semibold text-lg">{p.name}</h2>

                  <p className="text-gray-500 text-sm">
                    ₹ {p.price}
                  </p>

                  <p className="text-gray-400 text-sm">
                    {p.type}
                  </p>

                  <p className="text-gray-400 text-sm md:max-w-xs">{p.description}</p>

                </div>

              </div>

              {/* Right Section (Optional Button) */}
              <div className="flex gap-2 max-md:flex-col">
                <button
                  onClick={() => {
                    setEditItem(p);
                    setForm({
                      name: p.name,
                      price: p.price,
                      type: p.type,
                      description: p.description,
                      image: p.image,
                    });
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                >
                  Edit
                </button>
                <button onClick={() => handleDelete(p._id)}
                  className="text-white bg-red-500 px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                >
                  Delete
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>
    </>
  );
}