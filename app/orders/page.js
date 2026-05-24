"use client"
import React from 'react'
import { useEffect, useState } from 'react'
import { ToastContainer, toast, Bounce } from 'react-toastify';
import { useSession } from "next-auth/react";
import { notFound } from "next/navigation";

const page = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { data: session, status } = useSession();

    const loadOrders = async () => {
        const res = await fetch("/api/order/get");
        const data = await res.json();

        

        setOrders(Array.isArray(data) ? data : []);
    };
    useEffect(() => {
        if (status === "authenticated" && isAdmin) {
            loadOrders();
        }

    }, [status]);

    const updateDelivery = async (id, status) => {
        try {
            const res = await fetch("/api/order/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id,
                    deliveryStatus: status,
                }),
            });

            const data = await res.json();

            if (!data.success) {
                toast.error("Update failed ❌");
                return;
            }

            toast.success("Status updated ✅");

            // 🔥 Optimistic UI update (better than reload)
            setOrders((prev) =>
                prev.map((order) =>
                    order._id === id
                        ? { ...order, deliveryStatus: status }
                        : order
                )
            );

        } catch (err) {
            console.error(err);
            toast.error("Something went wrong ❌");
        }
    };
    const [filter, setFilter] = useState("all");
    const filteredOrders =
        filter === "all"
            ? orders
            : orders.filter((order) => order.deliveryStatus === filter);

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        const isBadA =
            a.deliveryStatus === "cancelled" || a.status !== "paid";

        const isBadB =
            b.deliveryStatus === "cancelled" || b.status !== "paid";

        // Push "bad" orders to bottom
        if (isBadA && !isBadB) return 1;
        if (!isBadA && isBadB) return -1;

        return 0;
    });
    const handleDelete = async (id) => {
        const res = await fetch("/api/order/delete", {
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

        setOrders((prev) => prev.filter((item) => item._id !== id));

        toast.success("Deleted successfully 🗑️");
    };
    const isAdmin = session?.user?.role === "admin";
    if (status === "loading") {
        return <p>Loading...</p>;
    } else if (!session || !isAdmin) {
        return <p>404 - Not Found</p>;
    }


    return (
        <>


            <div className="p-6 max-w-3xl mx-auto">
                <div className="mb-6 flex justify-between items-center">

                    <h1 className="text-2xl font-semibold">Orders<p className="text-2xl font-semibold">({filteredOrders.length})</p>
                    </h1>

                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="border p-2 rounded-lg"
                    >
                        <option value="all">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <div className="space-y-8">
                    {sortedOrders.map((order) => (


                        <div key={order._id} className="bg-white rounded-2xl p-6 shadow-sm">

                            {/* Top Row */}
                            <div className="flex justify-between items-start mb-4">

                                {/* Customer */}
                                <div>
                                    <p className="text-sm text-gray-500">Customer</p>
                                    <h2 className="text-lg font-medium">
                                        {order.address?.name}
                                    </h2>
                                </div>

                                {/* Amount + Status */}
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Amount</p>
                                    <p className="text-lg font-semibold">
                                        ₹{order.amount.toLocaleString("en-IN")}
                                    </p>
                                    <p className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                        {order.status === "paid" ? "Paid" : "Pending"}
                                    </p>
                                </div>
                                <div className="gap-4 transform-fill">
                                    <select
                                        value={order.deliveryStatus}
                                        onChange={(e) => updateDelivery(order._id, e.target.value)}
                                        className="mt-3 p-2 rounded"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    {order.deliveryStatus === "delivered" && <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={() => handleDelete(order._id)}>delete</button>}
                                </div>
                            </div>

                            {/* Address */}
                            <div className="mb-4">
                                <div className="flex items-center mb-2">
                                    <p className="text-sm text-gray-500 mb-1">Phone:</p>
                                    <p className="text-gray-800">
                                        <a href={`tel:+91${order.address?.phone}`}> +91 {order.address?.phone}</a>
                                    </p>
                                </div>
                                <div className="flex items-center ">
                                    <p className="text-sm text-gray-500 ">Address:</p>
                                    <p className="text-gray-800 leading-relaxed">
                                        {order.address?.addressLine}, {order.address?.city} - {order.address?.pincode}
                                    </p>
                                </div>
                            </div>

                            {/* Products */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <p className="text-sm text-gray-500 mb-2">Products</p>
                                    <p className="text-sm text-gray-500 mb-2">Order Id: {order._id}</p>
                                </div>
                                <div className="overflow-x-auto rounded-xl border shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                                            <tr>
                                                <th className="p-3 text-left">Product</th>
                                                <th className="p-3 text-left">Qty</th>
                                                <th className="p-3 text-left">Type</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {order.cartItems?.map((item, index) => (
                                                <tr
                                                    key={item._id}
                                                    className={`border-t ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                                        } hover:bg-gray-100 transition`}
                                                >
                                                    <td className="p-3 font-medium">{item.name}</td>
                                                    <td className="p-3">{item.qty}</td>
                                                    <td className="p-3 text-gray-500">{item.type}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>

                    ))}
                </div>

            </div>

        </>
    )
}

export default page
