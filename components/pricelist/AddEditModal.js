// components/pricelist/AddEditModal.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * Generic modal for Add / Edit operations.
 *
 * Props
 * ─────
 * isOpen      : boolean
 * onClose     : () => void
 * onSubmit    : (formData) => void | Promise<void>
 * title       : string
 * fields      : Array<{ name, label, type?, required?, placeholder? }>
 * initialData : object   (for edit mode; keys match field names)
 * isLoading   : boolean
 */
export default function AddEditModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields = [],
  initialData = {},
  isLoading = false,
}) {
  const [formData, setFormData] = useState({});
  const firstInputRef = useRef(null);

  // Reset form whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      const defaults = {};
      fields.forEach((f) => {
        defaults[f.name] = initialData[f.name] ?? "";
      });
      setFormData(defaults);
      // Focus first input after animation
      setTimeout(() => firstInputRef.current?.focus(), 80);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && !isLoading && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isLoading, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-700">
          <h2 id="modal-title" className="text-lg font-semibold text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-white/70 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {fields.map((field, i) => (
            <div key={field.name} className="flex flex-col gap-1">
              <label
                htmlFor={field.name}
                className="text-sm font-medium text-slate-700"
              >
                {field.label}
                {field.required && (
                  <span className="text-red-500 ml-0.5">*</span>
                )}
              </label>
              <input
                ref={i === 0 ? firstInputRef : null}
                id={field.name}
                name={field.name}
                type={field.type || "text"}
                placeholder={field.placeholder || ""}
                required={field.required}
                value={formData[field.name] ?? ""}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           disabled:bg-slate-50 disabled:text-slate-400 transition"
              />
            </div>
          ))}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100
                         rounded-lg hover:bg-slate-200 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700
                         rounded-lg hover:bg-blue-800 transition disabled:opacity-60
                         flex items-center gap-2"
            >
              {isLoading && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}