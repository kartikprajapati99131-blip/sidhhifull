"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AddProjectModal from "@/components/addProjectmodel";
import { useSession } from "next-auth/react";
import { CldUploadButton } from "next-cloudinary";

const CATEGORIES = ["All", "Site", "Door", "Sofa", "Kitchen", "Wardrobe"];
const EDIT_CATEGORIES = ["Site", "Door", "Sofa", "Kitchen", "Wardrobe"];

// ── EDIT MODAL ────────────────────────────────────────────────────────────────
function EditModal({ project, onCancel, onSave }) {
  const [form, setForm] = useState({
    title: project.title || "",
    category: project.category || "",
    description: project.description || "",
    images: project.images || [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const removeImage = (idx) =>
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/project/${project._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      onSave(data.project);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
          <h3 className="font-display text-xl font-medium text-stone-900">Edit Project</h3>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-stone-500 block mb-1.5">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Project title"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 transition"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-stone-500 block mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 transition"
            >
              <option value="">Select category</option>
              {EDIT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-stone-500 block mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Project description"
              rows={3}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 transition resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-stone-500 block mb-1.5">
              Images ({form.images.length})
            </label>
            <CldUploadButton
              uploadPreset="bxbblrlt"
              onSuccess={(result) => {
                const url = result.info.secure_url;
                setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
              }}
              className="block w-full"
            >
              <div className="w-full h-24 border-2 border-dashed border-stone-200 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition text-stone-400 hover:text-amber-600">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span className="text-xs font-medium">Upload image</span>
              </div>
            </CldUploadButton>

            {form.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {form.images.map((img, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-stone-100">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                    {i === 0 && (
                      <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Cover</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 justify-end px-6 pb-6">
          <button onClick={onCancel} disabled={saving} className="px-4 py-2 text-sm border border-stone-200 rounded-lg text-stone-600 hover:border-stone-400 transition disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-60 flex items-center gap-2">
            {saving && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PROJECT CARD ─────────────────────────────────────────────────────────────
function ProjectCard({ project, isAdmin, onDelete, onEdit }) {
  const img = project.images?.[0] || project.image;

  return (
    <div className="group relative bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col">

      <Link href={`/project/${project._id}`} aria-label={`View ${project.title}`} className="block">
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-stone-100">
          {img ? (
            <>
              <img src={img} alt={project.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
          <p className="text-stone-500 text-xs leading-relaxed mt-1 line-clamp-2">{project.description}</p>
        )}

        <div className="mt-3 pt-3 border-t border-stone-100">
          <span className="text-[10px] text-stone-400 uppercase tracking-widest">
            {project.createdAt
              ? new Date(project.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
              : "—"}
          </span>

          {/* ✅ Admin buttons — always visible, no hover needed */}
          {isAdmin && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={(e) => { e.preventDefault(); onEdit(project); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
              <button
                onClick={(e) => { e.preventDefault(); onDelete(project); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-300 bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M9 6V4h6v2"/></svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── DELETE CONFIRM DIALOG ─────────────────────────────────────────────────────
function DeleteDialog({ project, onCancel, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm">
        <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-500">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M9 6V4h6v2"/></svg>
        </div>
        <h3 className="font-display text-xl font-medium text-stone-900 mb-2">Delete Project</h3>
        <p className="text-stone-500 text-sm leading-relaxed mb-6">
          Permanently delete <strong className="text-stone-700">"{project?.title}"</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading} className="px-4 py-2 text-sm border border-stone-200 rounded-lg text-stone-600 hover:border-stone-400 transition disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-60 flex items-center gap-2">
            {loading && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function ProjectsClient({ initialProjects = [] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(initialProjects.length === 0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const { data: session, status } = useSession();

  // ✅ Show admin UI for admin, staff, mistry, architect — adjust roles as needed
  const isAdmin = ["admin", "staff"].includes(session?.user?.role) || session?.user?.role === "admin";

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

  useEffect(() => {
    if (initialProjects.length === 0) loadProjects();
  }, []);

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

  const handleEditSave = (updatedProject) => {
    setProjects((prev) => prev.map((p) => (p._id === updatedProject._id ? updatedProject : p)));
    setEditTarget(null);
    showToast("Project updated successfully");
  };

  const filteredProjects = activeCategory === "All" ? projects : projects.filter((p) => p.category === activeCategory);

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
            <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-stone-900 text-white text-xs font-medium tracking-widest uppercase px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Project
            </button>
          )}
        </div>
      </header>

      {/* CATEGORY FILTER */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center gap-3 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-stone-400 whitespace-nowrap flex-shrink-0">Filter</span>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide border transition-all duration-150 ${activeCategory === cat ? "bg-stone-900 text-white border-stone-900" : "bg-transparent text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-800"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        {filteredProjects.length > 0 && (
          <p className="text-xs text-stone-400 uppercase tracking-widest mb-6">
            <span className="font-display text-2xl text-stone-900 font-medium normal-case tracking-normal mr-1">{filteredProjects.length}</span>
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
              <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-stone-900 text-white text-xs font-medium tracking-widest uppercase px-5 py-2.5 rounded-lg hover:bg-amber-700 transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((p) => (
              <ProjectCard key={p._id} project={p} isAdmin={isAdmin} onDelete={setDeleteTarget} onEdit={setEditTarget} />
            ))}
          </div>
        )}
      </main>

      <AddProjectModal open={open} setOpen={setOpen} refresh={loadProjects} setProjects={setProjects} />

      {editTarget && <EditModal project={editTarget} onCancel={() => setEditTarget(null)} onSave={handleEditSave} />}

      {deleteTarget && <DeleteDialog project={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} loading={deleteLoading} />}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm text-white ${toast.type === "error" ? "bg-red-600" : "bg-stone-900"}`}>
          {toast.type === "error"
            ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>
            : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
          {toast.msg}
        </div>
      )}
    </div>
  );
}