"use client";

import * as Icons from "lucide-react";
import { Plus, Layers, Pencil, Trash2 } from "lucide-react";

export function CategoryIcon({ name, className, style }) {
  const IconComponent = Icons[name] || Icons.FileText;
  return <IconComponent className={className} style={style} />;
}

export default function CategorySidebar({
  categories,
  activeCategory,
  onSelectCategory,
  totalPolicyCount,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  canManage = true,
}) {
  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="lg:sticky lg:top-6">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Categories
            </h2>
          </div>

          <nav className="p-2 max-h-[60vh] lg:max-h-[calc(100vh-220px)] overflow-y-auto">
            <button
              onClick={() => onSelectCategory("all")}
              className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                activeCategory === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Every rule and policy, grouped by category"
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    activeCategory === "all" ? "bg-white/20" : "bg-indigo-50"
                  }`}
                >
                  <Layers
                    className="w-3.5 h-3.5"
                    style={{ color: activeCategory === "all" ? "#fff" : "#6366f1" }}
                  />
                </span>
                General
              </span>
              <span
                className={`text-xs rounded-full px-2 py-0.5 font-semibold ${
                  activeCategory === "all"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {totalPolicyCount}
              </span>
            </button>

            <div className="mt-2 mb-1 px-3">
              <div className="h-px bg-slate-100" />
            </div>

            <div className="space-y-1">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.slug;
                return (
                  <div
                    key={cat._id}
                    className={`group flex items-center rounded-xl transition-colors ${
                      isActive ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <button
                      onClick={() => onSelectCategory(cat.slug)}
                      className="flex-1 flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium min-w-0 text-left"
                      title={cat.description || cat.name}
                    >
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: isActive ? "rgba(255,255,255,0.2)" : `${cat.color}1A`,
                        }}
                      >
                        <CategoryIcon
                          name={cat.icon}
                          className="w-3.5 h-3.5"
                          style={{ color: isActive ? "#fff" : cat.color }}
                        />
                      </span>
                      <span className="truncate">{cat.name}</span>
                    </button>

                    <div className="flex items-center gap-0.5 pr-2 shrink-0">
                      {canManage && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditCategory(cat);
                            }}
                            className={`opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg transition-opacity ${
                              isActive ? "hover:bg-white/20 text-white" : "hover:bg-slate-200 text-slate-500"
                            }`}
                            title="Edit category"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCategory(cat);
                            }}
                            className={`opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg transition-opacity ${
                              isActive ? "hover:bg-white/20 text-white" : "hover:bg-rose-50 text-rose-500"
                            }`}
                            title="Delete category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <span
                        className={`text-xs rounded-full px-2 py-0.5 font-semibold ${
                          isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {cat.policyCount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {categories.length === 0 && (
              <p className="px-3 py-4 text-xs text-slate-400 text-center">
                No categories yet. Create your first one below.
              </p>
            )}
          </nav>

          {canManage && (
            <div className="p-2 border-t border-slate-100">
              <button
                onClick={onAddCategory}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Category
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
