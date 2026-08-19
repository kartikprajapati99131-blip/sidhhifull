"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Plus, Trash2, GripVertical } from "lucide-react";

export default function PolicyFormModal({ policy, categories, defaultCategorySlug, onClose, onSaved }) {
  const isEdit = Boolean(policy);

  const defaultCategoryId =
    categories.find((c) => c.slug === defaultCategorySlug)?._id || categories[0]?._id || "";

  const [form, setForm] = useState({
    title: policy?.title || "",
    category: policy?.category?._id || policy?.category || defaultCategoryId,
    description: policy?.description || "",
    status: policy?.status || "active",
    version: policy?.version || "1.0",
    rules: policy?.rules?.length ? policy.rules.map((r) => r.text) : [""],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "");
  }, []);

  function updateRule(index, value) {
    const rules = [...form.rules];
    rules[index] = value;
    setForm({ ...form, rules });
  }

  function addRule() {
    setForm({ ...form, rules: [...form.rules, ""] });
  }

  function removeRule(index) {
    const rules = form.rules.filter((_, i) => i !== index);
    setForm({ ...form, rules: rules.length ? rules : [""] });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) return setError("Policy title is required");
    if (!form.category) return setError("Please select a category");
    const cleanRules = form.rules.filter((r) => r.trim());
    if (cleanRules.length === 0) return setError("Add at least one rule");

    setSaving(true);
    try {
      const url = isEdit ? `/api/policies/${policy._id}` : "/api/policies";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          rules: cleanRules.map((text) => ({ text })),
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Something went wrong");
        return;
      }
      onSaved(json.data);
    } catch (err) {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-semibold text-slate-900">
            {isEdit ? "Edit Policy" : "New Policy"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Leave & Attendance Policy"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Version</label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                placeholder="1.0"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Description <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="One or two lines summarizing this policy"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Rules <span className="text-slate-400 font-normal">(shown numbered, and in the PDF export)</span>
              </label>
            </div>
            <div className="space-y-2">
              {form.rules.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="flex items-center justify-center w-8 h-10 shrink-0 text-slate-300">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <span className="flex items-center justify-center w-6 h-10 shrink-0 text-xs font-semibold text-slate-400">
                    {idx + 1}
                  </span>
                  <textarea
                    value={rule}
                    onChange={(e) => updateRule(idx, e.target.value)}
                    rows={1}
                    placeholder={`Rule ${idx + 1}...`}
                    className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeRule(idx)}
                    className="flex items-center justify-center w-10 h-10 shrink-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addRule}
              className="mt-2 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Add rule
            </button>
          </div>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </form>

        <div className="flex items-center gap-2 px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Policy"}
          </button>
        </div>
      </div>
    </div>
  );
}
