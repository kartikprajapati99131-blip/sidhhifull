"use client"
import React from 'react'
import { ToastContainer, toast, Bounce } from 'react-toastify';
import { useState } from 'react'
import { createUser } from '@/action/useraction'

import { useRouter } from 'next/navigation'


const app = () => {
  const router = useRouter()

  const [form, setform] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmpassword: "",

  })


  const handleSubmit = async (e) => {
  

    if (!form.name || !form.email || !form.phone) {
      toast.error("All fields are required");
      return;
    }

    if (!form.email.includes("@")) {
      toast.error("Invalid email");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      toast.error("Invalid Indian phone number");
      return;
    }

    if (form.password !== form.confirmpassword) {
      toast.error("Confirm password does not match");
      return;
    }

    try {
      const baseUsername = form.name.replace(/\s+/g, "").toLowerCase();
      const username = baseUsername + Math.floor(1000 + Math.random() * 9000);

      const res = await fetch("/api/user/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...form, username }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.warn(data.message, {
          position: "top-center",
          autoClose: 3000,
          theme: "dark",
        });
        return;
      }

      toast.success("Account Created Successfully ✅");

      setTimeout(() => {
        router.replace("/login");
      }, 2000);

    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }

    setform({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmpassword: "",
    });
  };
  const handleChange = (e) => {
    setform({ ...form, [e.target.name]: e.target.value })
  }
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
      <div>
        <div className='container mx-auto py-5 px-6 '>
          <h1 className='text-center my-5 text-3xl font-bold'>Register</h1>

          <form className="max-w-2xl mx-auto" action={handleSubmit}>

            <div className='my-2'>
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 ">Name</label>
              <input value={form.name ? form.name : ""} onChange={handleChange} type="text" name='name' id="name" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 " />
            </div>
            {/* input for email */}
            <div className="my-2">
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">Email</label>
              <input value={form.email ? form.email : ""} onChange={handleChange} type="email" name='email' id="email" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500" />
            </div>



            {/* input forusername */}
            <div className="my-2">
              <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-900">
                Phone Number
              </label>

              <div className="flex">

                {/* +91 Prefix */}
                <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg">
                  +91
                </span>
                <input value={form.phone ? form.phone : ""} onChange={handleChange} type="tel" name="phone" id="phone" placeholder="Enter phone number" maxLength={10} className="block w-full p-2 text-gray-900 border border-gray-300 rounded-r-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            {/* input for profile picture of input type text */}
            <div className="my-2">
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 ">Password</label>
              <input value={form.password} onChange={handleChange} name="password" type="password" required className="w-full text-slate-900 text-sm border border-slate-300 px-4 py-3 pr-8 rounded-md outline-blue-600" placeholder="Enter password" />
            </div>

            {/* input for cover pic  */}
            <div className="my-2">
              <label htmlFor="coverpic" className="block mb-2 text-sm font-medium text-gray-900 ">Confirm Password</label>
              <input value={form.confirmpassword} onChange={handleChange} name="confirmpassword" type="password" required className="w-full text-slate-900 text-sm border border-slate-300 px-4 py-3 pr-8 rounded-md outline-blue-600" placeholder="Confirm Password" />
            </div>
            {/* <div className="my-2">
            <label htmlFor="razorpayid" className="block mb-2 text-sm font-medium text-gray-900 ">Razorpay Id</label>
            <input value={form.razorpayid ? form.razorpayid : ""} onChange={handleChange} type="text" name='razorpayid' id="razorpayid" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="my-2">
            <label htmlFor="razorpaysecret" className="block mb-2 text-sm font-medium text-gray-900 ">Razorpay Secret</label>
            <input value={form.razorpaysecret ? form.razorpaysecret : ""} onChange={handleChange} type="text" name='razorpaysecret' id="razorpaysecret" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500" />
          </div> */}

            {/* Submit Button  */}
            <div className="my-6">
              <button type="submit" className="block w-full p-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:ring-blue-500 focus:ring-4 focus:outline-none   dark:focus:ring-blue-800 font-medium text-sm">login</button>
            </div>
          </form>


        </div>
      </div >
    </>
  )
}

export default app



