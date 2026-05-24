// ✅ SEO FIX: Split into server wrapper (this file) + client component (ProjectsClient.js)
// Google now sees real project titles and descriptions instead of a blank JS page.

import ProjectsClient from "./ProjectsClient";

export const metadata = {
  title: "Our Projects — Interior Design & Renovation Work",
  description:
    "Browse completed interior design and renovation projects by Siddhi Interiors, Vadodara — kitchens, wardrobes, doors, sofas, site work and more. See our quality craftsmanship.",
  openGraph: {
    title: "Siddhi Interiors Projects — Interior Design Work in Vadodara",
    description:
      "See our completed interior design projects in Vadodara — kitchens, wardrobes, doors, sofas, site work and more.",
    url: "https://www.siddhiinteriors.com/projects",
  },
  alternates: {
    canonical: "https://www.siddhiinteriors.com/projects",
  },
};

// ✅ SEO FIX: Fetch projects server-side so Google sees real content
async function getProjects() {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/project`,
      { next: { revalidate: 120 } }
    );
    const data = await res.json();
    return data?.projects || [];
  } catch {
    return [];
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return <ProjectsClient initialProjects={projects} />;
}
