'use client';

import { useMemo, useState } from 'react';

export default function InlineForm({ fields, onSave, submitLabel = 'Save', className = '' }) {
  const initialValues = useMemo(() => {
    const values = {};
    fields.forEach((field) => {
      values[field.name] = field.defaultValue ?? '';
    });
    return values;
  }, [fields]);

  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(values);
      setValues(initialValues);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`rounded-xl border border-gray-200 bg-white p-4 ${className}`}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {fields.map((field) => {
          if (field.type === 'select') {
            return (
              <label key={field.name} className="text-xs font-medium uppercase tracking-wide text-gray-600">
                {field.label}
                <select
                  value={values[field.name]}
                  onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
                  required={field.required}
                >
                  <option value="">Select</option>
                  {(field.options || []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            );
          }

          if (field.type === 'textarea') {
            return (
              <label key={field.name} className="text-xs font-medium uppercase tracking-wide text-gray-600 md:col-span-2">
                {field.label}
                <textarea
                  value={values[field.name]}
                  onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                  className="mt-1 min-h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
                  required={field.required}
                />
              </label>
            );
          }

          return (
            <label key={field.name} className="text-xs font-medium uppercase tracking-wide text-gray-600">
              {field.label}
              <input
                type={field.type || 'text'}
                value={values[field.name]}
                onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
                required={field.required}
              />
            </label>
          );
        })}
      </div>

      <div className="mt-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
