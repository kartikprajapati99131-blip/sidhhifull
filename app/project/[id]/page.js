import connectDB from "@/db/connectDb";
import Project from "@/models/project";
import ProjectClient from "./ProjectClient";

// ── SEO METADATA ────────────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const { id } = await params;
  await connectDB();
  const project = await Project.findById(id).lean();

  if (!project) {
    return {
      title: "Project Not Found",
      description: "This project does not exist.",
    };
  }

  const image = project.images?.[0];

  return {
    title: `${project.title} | SIDDHI`,
    description:
      project.description?.slice(0, 155) ||
      `Explore the ${project.title} project — a showcase of modern design and craftsmanship by SIDDHI.`,
    keywords: [
      project.title,
      project.category,
      "interior design",
      "SIDDHI",
      "furniture",
      "home decor",
    ]
      .filter(Boolean)
      .join(", "),
    openGraph: {
      title: project.title,
      description: project.description?.slice(0, 155) || "",
      images: image ? [{ url: image, width: 1200, height: 630, alt: project.title }] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.description?.slice(0, 155) || "",
      images: image ? [image] : [],
    },
    alternates: {
      canonical: `/project/${id}`,
    },
  };
}

// ── PAGE ────────────────────────────────────────────────────────────────────
export default async function ProjectPage({ params }) {
  const { id } = await params;
  await connectDB();

  const project = await Project.findById(id).lean();

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F5F0]">
        <div className="text-center">
          <p className="text-5xl mb-4">404</p>
          <p className="text-gray-500 text-sm">Project not found</p>
        </div>
      </div>
    );
  }

  return <ProjectClient project={JSON.parse(JSON.stringify(project))} />;
}