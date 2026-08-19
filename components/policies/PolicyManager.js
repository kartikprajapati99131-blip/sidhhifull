"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, Plus, Download, ChevronDown, Loader2, ShieldCheck, Inbox,
} from "lucide-react";
import CategorySidebar, { CategoryIcon } from "./CategorySidebar";
import PolicyCard from "./PolicyCard";
import PolicyFormModal from "./PolicyFormModal";
import CategoryFormModal from "./CategoryFormModal";
import PolicyDetailModal from "./PolicyDetailModal";
import {
  exportPolicyPDF,
  exportCategoryPDF,
  exportAllPoliciesPDF,
} from "@/utils/policyPdfExport";

// Set to false to hide create/edit/delete controls for read-only (e.g. staff) views.
// Wire this to your NextAuth session role check, e.g.:
//   const { data: session } = useSession();
//   const canManage = ["admin", "subadmin"].includes(session?.user?.role);
const DEFAULT_CAN_MANAGE = true;

export default function PolicyManager({ canManage = DEFAULT_CAN_MANAGE }) {
  const [categories, setCategories] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingAll, setExportingAll] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const [activeCategory, setActiveCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [viewingPolicy, setViewingPolicy] = useState(null);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/policy-categories");
    const json = await res.json();
    if (json.success) setCategories(json.data);
  }, []);

  const loadPolicies = useCallback(async () => {
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (searchTerm.trim()) params.set("search", searchTerm.trim());

    const res = await fetch(`/api/policies?${params.toString()}`);
    const json = await res.json();
    if (json.success) setPolicies(json.data);
  }, [activeCategory, statusFilter, searchTerm]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadCategories(), loadPolicies()]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPolicies();
    }, 250); // debounce search
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, statusFilter, searchTerm]);

  const totalPolicyCount = useMemo(
    () => categories.reduce((sum, c) => sum + (c.policyCount || 0), 0),
    [categories]
  );

  const activeCategoryData = categories.find((c) => c.slug === activeCategory);
  const isGeneralView = activeCategory === "all";

  // For the "General" view, group every rule/policy under its own category
  // section instead of dumping everything into one undifferentiated grid.
  const groupedPolicies = useMemo(() => {
    if (!isGeneralView) return null;

    const bySlug = new Map(categories.map((c) => [c.slug, { category: c, items: [] }]));
    const uncategorized = { category: null, items: [] };

    for (const policy of policies) {
      const slug = policy.category?.slug;
      const bucket = (slug && bySlug.get(slug)) || uncategorized;
      bucket.items.push(policy);
    }

    const groups = categories
      .map((c) => bySlug.get(c.slug))
      .filter((g) => g.items.length > 0);

    if (uncategorized.items.length > 0) groups.push(uncategorized);
    return groups;
  }, [isGeneralView, categories, policies]);

  function handleCategorySaved(savedCategory) {
    const wasEditing = Boolean(editingCategory);
    const previousSlug = editingCategory?.slug;

    setShowCategoryModal(false);
    setEditingCategory(null);
    loadCategories();

    if (!wasEditing) {
      // Newly created category: jump straight into it.
      setActiveCategory(savedCategory.slug);
    } else if (activeCategory === previousSlug && savedCategory.slug !== previousSlug) {
      // Renamed the category currently being viewed: follow the new slug.
      setActiveCategory(savedCategory.slug);
    }
  }

  async function handleDeleteCategory(category) {
    if (category.policyCount > 0) {
      alert(
        `Cannot delete "${category.name}": ${category.policyCount} polic${
          category.policyCount === 1 ? "y is" : "ies are"
        } still assigned to it. Move or delete those policies first.`
      );
      return;
    }
    if (!confirm(`Delete the "${category.name}" category? This cannot be undone.`)) return;

    const res = await fetch(`/api/policy-categories/${category._id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      if (activeCategory === category.slug) setActiveCategory("all");
      loadCategories();
    } else {
      alert(json.message || "Failed to delete category");
    }
  }

  function handlePolicySaved() {
    setShowPolicyModal(false);
    setEditingPolicy(null);
    loadCategories();
    loadPolicies();
  }

  async function handleDeletePolicy(policy) {
    if (!confirm(`Delete "${policy.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/policies/${policy._id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      loadCategories();
      loadPolicies();
    } else {
      alert(json.message || "Failed to delete policy");
    }
  }

  async function handleExportSingle(policy) {
    await exportPolicyPDF(policy);
  }

  async function handleExportCurrentView() {
    setExportMenuOpen(false);
    if (activeCategory === "all") {
      return handleExportAll();
    }
    if (!activeCategoryData) return;
    setExportingAll(true);
    try {
      await exportCategoryPDF(activeCategoryData, policies);
    } finally {
      setExportingAll(false);
    }
  }

  async function handleExportAll() {
    setExportMenuOpen(false);
    setExportingAll(true);
    try {
      // Fetch every policy per category so the export always covers the
      // full handbook, regardless of the current filter/search state.
      const results = await Promise.all(
        categories.map(async (cat) => {
          const res = await fetch(`/api/policies?category=${cat.slug}&status=all`);
          const json = await res.json();
          return [cat.slug, json.success ? json.data : []];
        })
      );
      const policiesByCategory = Object.fromEntries(results);
      await exportAllPoliciesPDF(categories, policiesByCategory);
    } finally {
      setExportingAll(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {isGeneralView ? "General" : activeCategoryData?.name || "Company Policies"}
          </h1>
          <p className="text-sm text-slate-500">
            {isGeneralView
              ? `Every rule and policy — ${totalPolicyCount} across ${categories.length} categor${
                  categories.length === 1 ? "y" : "ies"
                }`
              : activeCategoryData?.description ||
                `${policies.length} polic${policies.length === 1 ? "y" : "ies"} in this category`}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <CategorySidebar
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          totalPolicyCount={totalPolicyCount}
          onAddCategory={() => {
            setEditingCategory(null);
            setShowCategoryModal(true);
          }}
          onEditCategory={(cat) => {
            setEditingCategory(cat);
            setShowCategoryModal(true);
          }}
          onDeleteCategory={handleDeleteCategory}
          canManage={canManage}
        />

        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search policies and rules..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <div className="relative">
              <button
                onClick={() => setExportMenuOpen((v) => !v)}
                disabled={exportingAll}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                {exportingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export PDF
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {exportMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-1.5 z-20">
                  <button
                    onClick={handleExportCurrentView}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {activeCategory === "all"
                      ? "Export all policies"
                      : `Export "${activeCategoryData?.name}" only`}
                  </button>
                  <button
                    onClick={handleExportAll}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Export full handbook (all categories)
                  </button>
                </div>
              )}
            </div>

            {canManage && (
              <button
                onClick={() => {
                  setEditingPolicy(null);
                  setShowPolicyModal(true);
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                New Policy
              </button>
            )}
          </div>

          {/* Policy grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : policies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
              <Inbox className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No policies found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : canManage
                  ? "Create your first policy to get started."
                  : "Nothing has been published in this category yet."}
              </p>
              {canManage && !searchTerm && statusFilter === "all" && (
                <button
                  onClick={() => {
                    setEditingPolicy(null);
                    setShowPolicyModal(true);
                  }}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Policy
                </button>
              )}
            </div>
          ) : isGeneralView ? (
            <div className="space-y-8">
              {groupedPolicies.map((group) => (
                <section key={group.category?._id || "uncategorized"}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${group.category?.color || "#64748b"}1A` }}
                    >
                      <CategoryIcon
                        name={group.category?.icon}
                        className="w-4 h-4"
                        style={{ color: group.category?.color || "#64748b" }}
                      />
                    </span>
                    <h2 className="text-sm font-semibold text-slate-800">
                      {group.category?.name || "Uncategorized"}
                    </h2>
                    <span className="text-xs font-medium text-slate-400">
                      {group.items.length} polic{group.items.length === 1 ? "y" : "ies"}
                    </span>
                    {group.category && (
                      <button
                        onClick={() => setActiveCategory(group.category.slug)}
                        className="ml-auto text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        View category →
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {group.items.map((policy) => (
                      <PolicyCard
                        key={policy._id}
                        policy={policy}
                        canManage={canManage}
                        onView={setViewingPolicy}
                        onEdit={(p) => {
                          setEditingPolicy(p);
                          setShowPolicyModal(true);
                        }}
                        onDelete={handleDeletePolicy}
                        onExport={handleExportSingle}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {policies.map((policy) => (
                <PolicyCard
                  key={policy._id}
                  policy={policy}
                  canManage={canManage}
                  onView={setViewingPolicy}
                  onEdit={(p) => {
                    setEditingPolicy(p);
                    setShowPolicyModal(true);
                  }}
                  onDelete={handleDeletePolicy}
                  onExport={handleExportSingle}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCategoryModal && (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSaved={handleCategorySaved}
        />
      )}

      {showPolicyModal && (
        <PolicyFormModal
          policy={editingPolicy}
          categories={categories}
          defaultCategorySlug={activeCategory}
          onClose={() => {
            setShowPolicyModal(false);
            setEditingPolicy(null);
          }}
          onSaved={handlePolicySaved}
        />
      )}

      {viewingPolicy && (
        <PolicyDetailModal
          policy={viewingPolicy}
          onClose={() => setViewingPolicy(null)}
          onEdit={(p) => {
            setViewingPolicy(null);
            setEditingPolicy(p);
            setShowPolicyModal(true);
          }}
        />
      )}
    </div>
  );
}
