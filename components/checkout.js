"use client";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import Script from "next/script";
import { useState } from "react";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import { useRouter } from "next/navigation";


export default function CartSummary() {
    const router = useRouter();
    const [address, setAddress] = useState({
        name: "",
        phone: "",
        addressLine: "",
        city: "",
        pincode: "",
    });


    const handleChange = (e) => {
        setAddress({
            ...address,
            [e.target.name]: e.target.value,
        });
    };
    const isAddressValid =
        address.name &&
        address.phone &&
        address.addressLine &&
        address.city &&
        address.pincode;
    const {
        total,
        cart,
        clearCart,
    } = useCart();
    const { data: session } = useSession();

    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);

    const handleCheckout = async () => {
        if (!session || !session.user) {
            toast.warn('Please login to checkout!', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
                transition: Bounce,
            });;
            return;
        }

        const res = await fetch("/api/order/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: session.user.id,
                cart,
                total,
                address,
            }),
        });

        const data = await res.json();

        const options = {
            key: process.env.NEXT_PUBLIC_KEY_ID,
            amount: data.amount, // 👈 use backend amount
            currency: "INR",
            name: "Siddhi",
            description: "Order Payment",
            order_id: data.orderId,

            handler: async function (response) {
                const res = await fetch("/api/order/verify", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(response),
                });

                const result = await res.json();

                if (result.success) {
                    setTimeout(() => {
                        router.push("/yourorders");
                    }, 3000);
                    toast.success("Order placed successfully ✅");
                    clearCart();
                    setAddress({
                        name: "",
                        phone: "",
                        addressLine: "",
                        city: "",
                        pincode: "",
                    })
                    // window.location.href = "/success";
                } else {
                    alert("Verification failed ❌");
                }
            },

            prefill: {
                name: session.user.name,
                email: session.user.email,
            },

            theme: {
                color: "#3399cc",
            },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
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
                theme="dark"
                transition={Bounce}
            />
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="lazyOnload"
            />
            <div className="flex flex-col ">
                <div className="mt-4 space-y-3 mx-4 rounded-lg md:w-1/2 md:mx-auto max-w-sm mb-10mx-auto">
                    <h2 className="text-lg font-semibold">Delivery Details</h2>

                    <input
                        name="name"
                        placeholder="Full Name"
                        value={address.name}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />

                    <input
                        name="phone"
                        placeholder="Phone Number"
                        value={address.phone}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />

                    <input
                        name="addressLine"
                        placeholder="Address"
                        value={address.addressLine}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />

                    <input
                        name="city"
                        placeholder="City"
                        value={address.city}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />

                    <input
                        name="pincode"
                        placeholder="Pincode"
                        value={address.pincode}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="bg-gray-200 p-6 m-4 rounded-lg md:w-1/2 md:mx-auto max-w-sm mb-10">

                    {/* Subtotal */}
                    <p className="text-lg">
                        Subtotal ({totalQty} item{totalQty > 1 && "s"}):{" "}
                        <span className="font-bold">
                            {total.toLocaleString("en-IN", {
                                style: "currency",
                                currency: "INR",
                            })}
                        </span>
                    </p>
                    {/* Checkout button */}

                    <button className="mt-5 w-full bg-yellow-400 hover:bg-yellow-500 transition py-3 rounded-full font-medium"
                        disabled={!isAddressValid}
                        onClick={handleCheckout}>
                        Proceed to checkout
                    </button>
                </div>
            </div>
        </>
    );
}