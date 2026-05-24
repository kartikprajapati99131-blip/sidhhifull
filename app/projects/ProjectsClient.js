"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AddProjectModal from "@/components/addProjectmodel";
import { useSession } from "next-auth/react";

const CATEGORIES = ["All", "Site", "Door", "Sofa", "Kitchen", "Wardrobe"];

// ── PROJECT CARD ─────────────────────────────────────────────────────────────
function ProjectCard({ project, isAdmin, onDelete }) {
  const img = project.images?.[0] || project.image;

  return (
    <div className="group relative bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col">

      {/* Clickable image → detail page */}
      <Link href={`/project/${project._id}`} aria-label={`View ${project.title}`} className="block">
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-stone-100">
          {img ? (
            <>
              <img
                src={img}
                alt={project.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-stone-100 to-stone-200 text-stone-400">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <span className="text-[10px] uppercase tracking-widest">No image</span>
            </div>
          )}

          {project.category && (
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-stone-700 text-[10px] font-medium tracking-[0.1em] uppercase px-2.5 py-1 rounded-full border border-white/60">
              {project.category}
            </span>
          )}

          <div className="absolute bottom-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 shadow-md">
            <svg className="w-3.5 h-3.5 text-stone-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      </Link>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/project/${project._id}`} className="block">
          <h2 className="font-display text-lg font-medium text-stone-900 leading-snug hover:text-stone-600 transition-colors line-clamp-1">
            {project.title || "Untitled Project"}
          </h2>
        </Link>

        {project.description && (
          <p className="text-stone-500 text-xs leading-relaxed mt-1 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="mt-3 pt-3 flex items-center justify-between border-t border-stone-100">
          <span className="text-[10px] text-stone-400 uppercase tracking-widest">
            {project.createdAt
              ? new Date(project.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric",
                })
              : "—"}
          </span>

          {isAdmin && (
            <button
              onClick={() => onDelete(project)}
              title="Delete project"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 text-stone-400 opacity-0 group-hover:opacity-100 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── DELETE CONFIRM DIALOG ─────────────────────────────────────────────────────
function DeleteDialog({ project, onCancel, onConfirm, loading }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm">
        <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-500">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M9 6V4h6v2"/></svg>
        </div>
        <h3 className="font-display text-xl font-medium text-stone-900 mb-2">Delete Project</h3>
        <p className="text-stone-500 text-sm leading-relaxed mb-6">
          Permanently delete <strong className="text-stone-700">"{project?.title}"</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm border border-stone-200 rounded-lg text-stone-600 hover:border-stone-400 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {loading && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const loadProjects = async () => {
    try {
      const res = await fetch("/api/project");
      const data = await res.json();
      setProjects(data?.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/project/${deleteTarget._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setProjects((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      setDeleteTarget(null);
      showToast("Project deleted successfully");
    } catch {
      showToast("Failed to delete project", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredProjects =
    activeCategory === "All"
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F8F5F0]">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&display=swap'); .font-display{font-family:'Cormorant Garamond',serif;}`}</style>
        <div className="w-7 h-7 border-2 border-stone-200 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-[11px] text-stone-400 uppercase tracking-widest">Loading projects</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Cormorant Garamond', serif; }
        .scrollbar-none::-webkit-scrollbar{display:none}
        .scrollbar-none{scrollbar-width:none}
        .line-clamp-1{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
        .line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      `}</style>

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-30 bg-[#F8F5F0]/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
          <span className="font-display text-xl font-medium text-stone-900 tracking-wide">
            Our <span className="text-amber-600">Projects</span>
          </span>
          {isAdmin && (
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 bg-stone-900 text-white text-xs font-medium tracking-widest uppercase px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Project
            </button>
          )}
        </div>
      </header>

      {/* CATEGORY FILTER */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center gap-3 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-stone-400 whitespace-nowrap flex-shrink-0">
            Filter
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide border transition-all duration-150 ${
                activeCategory === cat
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-transparent text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        {filteredProjects.length > 0 && (
          <p className="text-xs text-stone-400 uppercase tracking-widest mb-6">
            <span className="font-display text-2xl text-stone-900 font-medium normal-case tracking-normal mr-1">
              {filteredProjects.length}
            </span>
            {filteredProjects.length === 1 ? "project" : "projects"}
            {activeCategory !== "All" && ` · ${activeCategory}`}
          </p>
        )}

        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-stone-200 rounded-2xl bg-white">
            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-4 text-stone-400">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            </div>
            <h2 className="font-display text-2xl font-medium text-stone-800 mb-1">
              {activeCategory === "All" ? "No projects yet" : `No ${activeCategory} projects`}
            </h2>
            <p className="text-stone-400 text-sm mb-6">
              {activeCategory === "All" ? "Start building your portfolio." : `Nothing in "${activeCategory}" yet.`}
            </p>
            {isAdmin && (
              <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 bg-stone-900 text-white text-xs font-medium tracking-widest uppercase px-5 py-2.5 rounded-lg hover:bg-amber-700 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((p) => (
              <ProjectCard key={p._id} project={p} isAdmin={isAdmin} onDelete={setDeleteTarget} />
            ))}
          </div>
        )}
      </main>

      <AddProjectModal open={open} setOpen={setOpen} refresh={loadProjects} setProjects={setProjects} />

      {deleteTarget && (
        <DeleteDialog
          project={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm text-white ${toast.type === "error" ? "bg-red-600" : "bg-stone-900"}`}>
          {toast.type === "error"
            ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>
            : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          }
          {toast.msg}
        </div>
      )}
    </div>
  );
}