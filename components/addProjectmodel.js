"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { CldUploadButton } from "next-cloudinary";

const CATEGORIES = ["All","Site", "Door", "Sofa", "Kitchen", "Wardrobe"];
export default function AddProjectModal({ open, setOpen, refresh }) {

    const { data: session } = useSession();

    const [form, setForm] = useState({
        title: "",
        category: "",
        description: "",
        images: [],
    });

    if (!open) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        await fetch("/api/project", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
        });

        // reset
        setForm({
            title: "",
            category: "",
            description: "",
            images: [],
        });

        setOpen(false);
        refresh();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-xl w-96 space-y-3"
            >
                <h2 className="text-xl font-bold">Add Project</h2>

                <input
                    placeholder="Title"
                    className="border p-2 w-full"
                    onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                    }
                />

                <select
                    className="border p-2 w-full rounded-md"
                    value={form.category}
                    onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                    }
                >
                    <option value="">Select Category</option>

                    {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
                {/* const CATEGORIES = ["All","Site", "Door", "Sofa", "Kitchen", "Wardrobe"]; */}

                <textarea
                    placeholder="Description"
                    className="border p-2 w-full"
                    onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                    }
                />

                {/* 🔥 IMAGE UPLOAD */}
                <CldUploadButton
                    uploadPreset="bxbblrlt"
                    onSuccess={(result) => {
                        const url = result.info.secure_url;

                        setForm((prev) => ({
                            ...prev,
                            images: [...prev.images, url],
                        }));
                    }}
                    className="block "
                >
                    <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500 transition overflow-hidden">

                        {form.images.length === 0 ? (
                            <div className="text-center text-gray-500">
                                <p className="text-lg font-semibold">Click to Upload</p>
                                <p className="text-sm">or drag & drop</p>
                            </div>
                        ) : (
                            <img
                                src={form.images[0]}
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                </CldUploadButton>

                {/* 🔥 PREVIEW MULTIPLE */}
                <div className="flex gap-2 flex-wrap">
                    {form.images.map((img, i) => (
                        <img key={i} src={img} className="w-16 h-16 rounded object-cover" />
                    ))}
                </div>

                <button className=" text-black w-full py-2 rounded">
                    Save
                </button>
            </form>
        </div>
    );
}