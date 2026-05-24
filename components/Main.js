import React from 'react'
import Image from 'next/image'
import Animationtext from './animatedtext'
import Link from 'next/link'

const Main = () => {
    return (
        <>

            <div className=' relative min-h-screen  '>
                <div className='  relative flex flex-col items-center justify-center  lg:-mt-130'>
                    <div className=' logo justify-center items-center  '>
                        {/* <Animationtext /> */}
                        <div className='product gride   md:w-[100vh]'>
                            <div className="grid max-md:grid-cols-2 md:grid-cols-3 gap-10  mx-auto">
                                {[
                                    { name: "Laminate", role: "Laminate", src: "/Product/laminate.png", href: "/shop?type=Laminate" },
                                    { name: "Plywood", role: "Plywood", src: "/Product/plywood.png", href: "/shop?type=Plywood" },
                                    { name: "Glass", role: "Glass", src: "/Product/glass.png", href: "/shop?type=Glass" },
                                    { name: "UPVC", role: "Windows", src: "/Product/upvc.png", href: "/shop?type=UPVC" },
                                    { name: "Hardware", role: "Hardware", src: "/Product/hardware.jpg", href: "/shop?type=Hardware" },
                                    { name: "Aluminium Section", role: "Shutters & Windows", src: "/Product/Aluminium.jpg", href: "/shop?type=Aluminium" },
                                ].map((member, i) => (
                                    <Link key={i} href={member.href}>
                                        <div className=' bg-gray-100 text-center backdrop-blur-md shadow-lg rounded-2xl p-4 hover:scale-105 transition w-full'>
                                             <Image
                                                src={member.src}
                                                alt={member.name}
                                                width={128}
                                                height={128}
                                                loading="lazy"
                                                className=" object-contain w-32 h-32 mx-auto  bg-gray-200 rounded-2xl mb-4 shadow-sm"
                                            />
                                            <h3 className="text-lg font-semibold">{member.name}</h3>
                                            <p className="text-gray-500 text-sm">{member.role}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <Image src="/covers/Cover.png" alt="cover" width={1800} height={1200} priority className="  opacity-50 object-cover h-auto w-full mt-5 "></Image>
                            <div className="grid max-md:grid-cols-2 md:grid-cols-3 gap-10  mx-auto mt-5">
                                {[
                                    { name: "Lock", role: "Door-Lock", src: "/Product/lock.png", href: "/shop?type=Lock" },
                                    { name: "Handle", role: "Door-Lock", src: "/Product/handle.png", href: "/shop?type=Handle" },
                                    { name: "Hinges", role: "Hinges", src: "/Product/hingis.png", href: "/shop?type=Hinges" },
                                    { name: "Wood", role: "Wood", src: "/Product/wood.png", href: "/shop?type=Wood" },
                                ].map((member, i) => (
                                    <Link key={i} href={member.href}>
                                        <div className=' bg-gray-100 text-center backdrop-blur-md shadow-lg rounded-2xl p-4 hover:scale-105 transition w-full'>
                                            <Image
                                                src={member.src}
                                                alt={member.name}
                                                width={128}
                                                height={128}
                                                loading="lazy"
                                                className=" object-contain w-32 h-32 mx-auto  bg-gray-200 rounded-2xl mb-4 shadow-sm"
                                            />
                                            <h3 className="text-lg font-semibold">{member.name}</h3>
                                            <p className="text-gray-500 text-sm">{member.role}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Main
