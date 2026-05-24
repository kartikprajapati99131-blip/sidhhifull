"use client";
import React, { useEffect, useState } from "react";
import { ToastContainer, toast, Bounce } from 'react-toastify';


const page = () => {
    const [orders, setOrders] = useState([]);
    const [product, setProduct] = useState();

    const loadOrders = async () => {
        const res = await fetch("/api/order/getUserOrders");
        const data = await res.json();
        // ("DATA:", data);
        setOrders(data);
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const steps = ["pending", "processing", "shipped", "delivered"];

    const OrderProgress = ({ status }) => {
        if (status === "cancelled") {
            return <p className="text-red-500 mt-2">Order Cancelled</p>;
        }

        const currentStep = steps.indexOf(status);

        return (
            <div className="flex items-center mt-3">
                {steps.map((step, index) => (
                    <div key={step} className="flex-1 flex items-center">
                        <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs
              ${index <= currentStep
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-300"
                                }`}
                        >
                            {index + 1}
                        </div>

                        {index !== steps.length - 1 && (
                            <div
                                className={`flex-1 h-1 ${index < currentStep ? "bg-green-500" : "bg-gray-300"
                                    }`}
                            ></div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

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




    return (
        <>
            <ToastContainer
                position="top-right" x
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
            <div className="max-w-3xl mx-auto p-6">
                <h1 className="text-2xl font-semibold mb-6">My Orders</h1>

                <div className="space-y-6">
                    {Array.isArray(orders) &&
                        orders.map((order) => (
                            <div key={order._id} className="border rounded-xl p-4 shadow-sm">

                                {/* Top */}
                                <div className="flex justify-between">
                                    <div>
                                        <p className="font-medium">Order ID</p>
                                        <p className="text-sm text-gray-500">{order._id}</p>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-semibold">₹{order.amount}</p>
                                        <p className="text-sm capitalize text-gray-500">
                                            {order.deliveryStatus}
                                        </p>
                                    </div>
                                </div>

                                {/* Products */}
                                <div className="mt-3">
                                    {order.cartItems?.map((item) => (
                                        <p key={item._id} className="text-sm text-gray-700">
                                            {item.name} × {item.qty}
                                        </p>
                                    ))}
                                </div>

                                {/* Progress */}

                                <div className="mt-3 flex justify-between">
                                    <div className="w-full">
                                        <OrderProgress status={order.deliveryStatus} /></div>
                                    <button className="text-red-500 max-w-2xl "
                                        disabled={order.deliveryStatus === "shipped" || order.deliveryStatus === "delivered" || order.deliveryStatus === "cancelled"}
                                        onClick={() => updateDelivery(order._id, "cancelled")}
                                    >Cancel</button>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </>
    );
};

export default page;