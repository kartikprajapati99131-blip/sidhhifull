"use client";
import { CldUploadButton } from "next-cloudinary";
import Link from "next/link";

export default function ProjectCard({ project, isAdmin, refresh }) {
    if (!project) return null;

    const images = project?.images || [];

    return (
        <>
            <Link href={`/project/${project._id}`}>
                <div className="mt-4 text-center">
                    <h2 className="font-semibold text-lg">{project.title}</h2>
                    <p className="text-sm text-gray-500">{project.category}</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-2xl mb-8 shadow-sm max-md:w-full md:w-1/2 mx-auto hover:shadow-lg transition duration-300 border">

                    <div className="grid grid-cols-2 gap-3">

                        {/* BIG IMAGE */}
                        <div className="h-[220px] overflow-hidden rounded-xl">
                            <img
                                src={images?.[0] || "/placeholder.png"}
                                className="w-full h-full object-cover hover:scale-105 transition"
                                alt="project"
                            />
                        </div>

                        {/* RIGHT GRID */}
                        <div className="grid grid-cols-2 gap-3">

                            {images.slice(1, 5).map((img, i) => (
                                <div key={i} className="overflow-hidden rounded-xl">
                                    <img
                                        src={img}
                                        className="h-[100px] w-full object-cover hover:scale-105 transition"
                                        alt="project"
                                    />
                                </div>
                            ))}

                            {/* ✅ ADD IMAGE TILE */}
                            {isAdmin && (
                                <CldUploadButton
                                    uploadPreset="bxbblrlt"
                                    onSuccess={async (result) => {
                                        const url = result.info.secure_url;

                                        // update project
                                        await fetch(`/api/project/${project._id}`, {
                                            method: "PUT",
                                            headers: {
                                                "Content-Type": "application/json",
                                            },
                                            body: JSON.stringify({
                                                newImage: url,
                                            }),
                                        });

                                       
                                    }}
                                    className="cursor-pointer"
                                >
                                    <div className="h-[100px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center hover:bg-gray-50">
                                        <span className="text-2xl">+</span>
                                        <span className="text-xs text-gray-500">Add Image</span>
                                    </div>
                                </CldUploadButton>
                            )}
                        </div>
                    </div>

                    {/* DETAILS */}


                </div>
            </Link>
        </>
    );
}