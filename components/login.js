import React from 'react'
import Loginbutton from './loginbutton'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signIn, signOut } from "next-auth/react"
import { ToastContainer, toast, Bounce } from 'react-toastify';
import { loginUser } from '@/action/useraction'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const login = () => {
    const router = useRouter()
    const { data: session, status } = useSession()


    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSignIn = async () => {
        const res = await signIn("credentials", { email, password, redirect: false });
        if (!res || res.error) {
            toast.error("Invalid credentials", {
                position: "top-center",
                autoClose: 3000,
                theme: "dark",
            });
            return;
        }
        router.replace("/");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "email") {
            setEmail(value);
        } else if (name === "password") {
            setPassword(value);
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
            <div className=' relative w-full min-h-screen'>
                <div className='flex justify-center'>
                    <Image src="/Background.jpg" alt="Get Me Chai Logo" fill  className=" opacity-70 object-cover h-auto "></Image>
                </div>
                <div className=" pt-20 max-md:pt-10 pb-5 absolute inset-0">
                    <div className=" flex flex-col items-center justify-center ">
                        <div className="md:max-w-[480px] max-md:px-2 w-full  ">


                            <div className="p-6 sm:p-8 bg-white/70 rounded-2xl bg-white border border-gray-200 shadow-sm">
                                <h1 className='text-center font-bold text-2xl'>Login to Get Started</h1>
                                <form className="mt-12 space-y-6" action={handleSignIn}>

                                    <div>
                                        <label className="text-slate-900 text-sm font-medium mb-2 block">Email</label>
                                        <div className="relative flex items-center">
                                            <input onChange={handleChange} name="email" type="text" required className="w-full text-slate-900 text-sm border border-slate-300 px-4 py-3 pr-8 rounded-md outline-blue-600" placeholder="Enter user name" />
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="#bbb"
                                                stroke="#bbb"
                                                className="w-4 h-4 absolute right-4"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M20 4H4a2 2 0 0 0-2 2v1l10 6 10-6V6a2 2 0 0 0-2-2z"></path>
                                                <path d="M22 9l-10 6L2 9v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9z"></path>
                                            </svg>

                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-slate-900 text-sm font-medium mb-2 block">Password</label>
                                        <div className="relative flex items-center">
                                            <input onChange={handleChange} name="password" type="password" required className="w-full text-slate-900 text-sm border border-slate-300 px-4 py-3 pr-8 rounded-md outline-blue-600" placeholder="Enter password" />
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="#bbb" stroke="#bbb" className="w-4 h-4 absolute right-4 cursor-pointer" viewBox="0 0 128 128">
                                                <path d="M64 104C22.127 104 1.367 67.496.504 65.943a4 4 0 0 1 0-3.887C1.367 60.504 22.127 24 64 24s62.633 36.504 63.496 38.057a4 4 0 0 1 0 3.887C126.633 67.496 105.873 104 64 104zM8.707 63.994C13.465 71.205 32.146 96 64 96c31.955 0 50.553-24.775 55.293-31.994C114.535 56.795 95.854 32 64 32 32.045 32 13.447 56.775 8.707 63.994zM64 88c-13.234 0-24-10.766-24-24s10.766-24 24-24 24 10.766 24 24-10.766 24-24 24zm0-40c-8.822 0-16 7.178-16 16s7.178 16 16 16 16-7.178 16-16-7.178-16-16-16z" data-original="#000000"></path>
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center">
                                            <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 shrink-0 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
                                            <label htmlFor="remember-me" className="ml-3 block text-sm text-slate-900">
                                                Remember me
                                            </label>
                                        </div>

                                    </div>

                                    <div className="!mt-12">
                                        <button onClick={handleSignIn} type="button" className="w-full py-2 px-4 text-[15px] font-medium tracking-wide rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none cursor-pointer">
                                            Sign in
                                        </button>
                                    </div>
                                    <p className="text-slate-900 text-sm !mt-6 text-center">Don't have an account?
                                        <Link href="/register" className="text-blue-600 hover:underline ml-1 whitespace-nowrap font-semibold">Register here</Link>
                                    </p>
                                    <Loginbutton />
                                </form>
                            </div>
                        </div>
                    </div>
                </div >
            </div>
        </>
    )
}

export default login
