"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { translateBatch } from "@/lib/translate-client";

interface FormField {
  id: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "date" | "number";
  label: string;
  placeholder: string;
  required: boolean;
  options: string[];
}

interface StoredTranslation {
  fields: FormField[];
  success_message: string;
}

interface Props {
  formId: number;
  fields: FormField[];
  successMessage: string;
  submitLabel?: string;
  storedTranslations?: Record<string, StoredTranslation> | null;
}

export default function CustomFormRenderer({ formId, fields: rawFields, successMessage, submitLabel = "Submit", storedTranslations }: Props) {
  const [fields, setFields] = useState<FormField[]>(rawFields);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [translatedSuccess, setTranslatedSuccess] = useState(successMessage);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (submitted) successRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [submitted]);

  // Detect language from URL
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") ?? "en";

  // Auto-translate field labels, placeholders, options & success message
  useEffect(() => {
    if (lang === "en" || rawFields.length === 0) {
      setFields(rawFields);
      setTranslatedSuccess(successMessage);
      return;
    }
    // Use admin-saved translations if available for this language
    if (storedTranslations?.[lang]) {
      const stored = storedTranslations[lang];
      setFields(stored.fields.length ? stored.fields : rawFields);
      setTranslatedSuccess(stored.success_message || successMessage);
      return;
    }

    const cacheKey = `custom_form_${formId}_tr_v1_${lang}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { fields: FormField[]; success: string };
        setFields(parsed.fields);
        setTranslatedSuccess(parsed.success);
        return;
      }
    } catch { /* ignore */ }

    // Build a flat list of strings to translate:
    // For each field: label, placeholder, ...options
    // Plus the successMessage at the end
    const texts: string[] = [];
    const map: Array<{ fieldIdx: number; kind: "label" | "placeholder" | "option"; optionIdx?: number }> = [];

    rawFields.forEach((f, fi) => {
      texts.push(f.label || ""); map.push({ fieldIdx: fi, kind: "label" });
      texts.push(f.placeholder || ""); map.push({ fieldIdx: fi, kind: "placeholder" });
      (f.options ?? []).forEach((opt, oi) => {
        texts.push(opt); map.push({ fieldIdx: fi, kind: "option", optionIdx: oi });
      });
    });
    texts.push(successMessage); // last item

    if (window.self !== window.top) return; // preview: only show saved translations
    translateBatch(texts, lang)
      .then(results => {
        const translated: FormField[] = rawFields.map(f => ({ ...f, options: [...(f.options ?? [])] }));
        results.slice(0, results.length - 1).forEach((val, i) => {
          const { fieldIdx, kind, optionIdx } = map[i];
          if (kind === "label") translated[fieldIdx].label = val;
          else if (kind === "placeholder") translated[fieldIdx].placeholder = val;
          else if (kind === "option" && optionIdx !== undefined) translated[fieldIdx].options[optionIdx] = val;
        });
        const trSuccess = results[results.length - 1] || successMessage;
        setFields(translated);
        setTranslatedSuccess(trSuccess);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ fields: translated, success: trSuccess }));
        } catch { /* ignore */ }
      })
      .catch(() => {
        // On failure keep original — don't cache
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, formId]);

  const setValue = (id: string, val: string) => {
    setValues(prev => ({ ...prev, [id]: val }));
    if (errors[id]) setErrors(prev => { const e = { ...prev }; delete e[id]; return e; });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const res = await fetch(`/api/form-submit/${formId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json() as { success?: boolean; errors?: Record<string, string>; error?: string };
      if (data.success) {
        setSubmitted(true);
      } else if (data.errors) {
        setErrors(data.errors);
      } else {
        setErrors({ _form: data.error || "Submission failed. Please try again." });
      }
    } catch {
      setErrors({ _form: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box" as const,
    background: "#fff",
  };

  if (submitted) {
    return (
      <div ref={successRef} style={{ padding: "40px 24px", textAlign: "center", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
        <p style={{ fontSize: 18, fontWeight: 700, color: "#15803d", marginBottom: 8 }}>Submitted!</p>
        <p style={{ color: "#374151", fontSize: 15 }}>{translatedSuccess}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {errors._form && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", borderRadius: 8, color: "#C0185A", fontSize: 14 }}>
          {errors._form}
        </div>
      )}

      {fields.map(field => (
        <div key={field.id}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            {field.label}
            {field.required && <span style={{ color: "#C0185A", marginLeft: 3 }}>*</span>}
          </label>

          {field.type === "textarea" ? (
            <textarea
              style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
              placeholder={field.placeholder}
              value={values[field.id] || ""}
              onChange={e => setValue(field.id, e.target.value)}
              required={field.required}
            />
          ) : field.type === "select" ? (
            <select
              style={inputStyle}
              value={values[field.id] || ""}
              onChange={e => setValue(field.id, e.target.value)}
              required={field.required}>
              <option value="">Select…</option>
              {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : field.type === "checkbox" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                id={`field-${field.id}`}
                checked={values[field.id] === "true"}
                onChange={e => setValue(field.id, e.target.checked ? "true" : "false")}
              />
              <label htmlFor={`field-${field.id}`} style={{ fontSize: 14, color: "#374151", cursor: "pointer" }}>
                {field.placeholder || field.label}
              </label>
            </div>
          ) : (
            <input
              type={field.type === "phone" ? "tel" : field.type}
              style={inputStyle}
              placeholder={field.placeholder}
              value={values[field.id] || ""}
              onChange={e => setValue(field.id, e.target.value)}
              required={field.required}
            />
          )}

          {errors[field.id] && (
            <p style={{ fontSize: 12.5, color: "#C0185A", marginTop: 4 }}>{errors[field.id]}</p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: "13px 28px",
          background: submitting ? "#94a3b8" : "#C0185A",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 700,
          cursor: submitting ? "not-allowed" : "pointer",
          alignSelf: "stretch",
          transition: "background 0.15s",
          letterSpacing: "0.02em",
        }}>
        {submitting ? "Submitting…" : submitLabel}
      </button>
    </form>
  );
}
