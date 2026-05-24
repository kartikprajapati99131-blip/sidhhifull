"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";

export default function ContactPage() {
    const router = useRouter();
    const [data, setData] = useState([]);


    useEffect(() => {
        loadData();

    }, []);


    const loadData = async () => {
        const res = await fetch("/api/contact/get");
        const data = await res.json();
        setData(data);
    };
    const handleDeleteAll = async () => {
        if (!confirm("Delete ALL contacts? This cannot be undone.")) return;

        try {
            const res = await fetch("/api/contact/delete-all", {
                method: "DELETE",
            });

            const data = await res.json();

            if (!data.success) {
                alert("Delete failed");
                return;
            }

            // ✅ instant UI update
            setData([]);

        } catch (err) {
            console.error(err);
        }
    };
    const handleDelete = async (id) => {
        try {
            const res = await fetch("/api/contact/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id }),
            });

            const data = await res.json();

            if (!data.success) {
                alert("Delete failed");
                return;
            }

            // ✅ instant UI update
            setData((prev) => prev.filter((item) => item._id !== id));

        } catch (err) {
            console.error(err);
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
        <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="flex justify-between mb-6">

                <h1 className="text-3xl font-bold mb-6">All Messages</h1>
                <button onClick={handleDeleteAll} className="text-white bg-red-500 border h-10 p-2  rounded-2xl hover:bg-red-700 text-sm">Delete All</button>
            </div>

            <div className="space-y-4">
                {data.map((item) => (
                    <div
                        key={item._id}
                        className="p-4 border rounded-xl shadow-sm bg-white flex  justify-between items-start"
                    >
                        <div className="flex flex-row justify-center items-center gap-4">
                            <h2 className="font-semibold text-lg">{item.name}</h2>
                            <p className="text-gray-500 text-sm">{item.phone}</p>
                            <p className="">Message:{item.message}</p>
                        </div>

                        {/* ❌ Delete Button */}
                        <button
                            onClick={() => handleDelete(item._id)}
                            className="text-white bg-red-500 border h-10 p-2  rounded-2xl hover:bg-red-700 text-sm "
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>

        </div>
    );
}