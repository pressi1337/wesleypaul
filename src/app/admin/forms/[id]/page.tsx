"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Trash2, Plus, X, Languages, CheckCircle, AlertCircle } from "lucide-react";

interface FormField {
  id: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "date" | "number";
  label: string;
  placeholder: string;
  required: boolean;
  options: string[];
}

interface FormData {
  id?: number;
  name: string;
  description: string;
  fields_json: string;
  success_message: string;
}

interface Submission {
  id: number;
  form_name: string;
  data_json: string;
  status: "new" | "read";
  created_at: string;
}

interface LangTranslation {
  fields: FormField[];
  success_message: string;
}

const FIELD_TYPES: Array<{ type: FormField["type"]; label: string; icon: string }> = [
  { type: "text",     label: "Text",      icon: "T" },
  { type: "email",    label: "Email",     icon: "@" },
  { type: "phone",    label: "Phone",     icon: "📞" },
  { type: "textarea", label: "Textarea",  icon: "¶" },
  { type: "select",   label: "Select",    icon: "▼" },
  { type: "checkbox", label: "Checkbox",  icon: "☑" },
  { type: "date",     label: "Date",      icon: "📅" },
  { type: "number",   label: "Number",    icon: "#" },
];

interface LangEntry { code: string; label: string; flag: string; }

function generateId() {
  return "f" + Math.random().toString(36).slice(2, 8);
}

async function translateOne(text: string, target: string): Promise<string> {
  if (!text.trim()) return text;
  try {
    const r = await fetch("/api/admin/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, target }),
    });
    const d = await r.json() as { translated?: string };
    return d.translated || text;
  } catch {
    return text;
  }
}

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isNew = id === "new";

  const [activeTab, setActiveTab] = useState<"builder" | "submissions" | "translations">(
    searchParams.get("tab") === "submissions" ? "submissions" :
    searchParams.get("tab") === "translations" ? "translations" : "builder"
  );

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    fields_json: "[]",
    success_message: "Thank you! Your submission has been received.",
  });
  const [fields, setFields] = useState<FormField[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Translations state
  const [langs, setLangs] = useState<LangEntry[]>([]);
  const [storedTranslations, setStoredTranslations] = useState<Record<string, LangTranslation>>({});
  const [selectedLang, setSelectedLang] = useState("");
  const [currentTranslation, setCurrentTranslation] = useState<LangTranslation | null>(null);
  const [translating, setTranslating] = useState(false);
  const [savingTranslation, setSavingTranslation] = useState(false);
  const [translateProgress, setTranslateProgress] = useState("");

  // Fetch active languages from site settings
  useEffect(() => {
    fetch("/api/languages")
      .then(r => r.json())
      .then((d: { languages?: { code: string; label: string; nativeLabel?: string; flag: string }[] }) => {
        if (Array.isArray(d.languages) && d.languages.length > 0) {
          const mapped: LangEntry[] = d.languages.map(l => ({ code: l.code, label: l.label, flag: l.flag }));
          setLangs(mapped);
          setSelectedLang(prev => prev || mapped[0].code);
        }
      })
      .catch(() => {});
  }, []);

  const loadTranslations = useCallback(async () => {
    if (isNew) return;
    try {
      const r = await fetch(`/api/admin/forms/${id}/translations`);
      const d = await r.json() as { translations?: Record<string, LangTranslation> };
      setStoredTranslations(d.translations || {});
    } catch { /* ignore */ }
  }, [id, isNew]);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/forms/${id}`)
        .then(r => r.json())
        .then(d => {
          const f = (d as { form?: FormData }).form;
          if (f) {
            setFormData(f);
            const rawFields = f.fields_json as unknown;
            if (Array.isArray(rawFields)) {
              setFields(rawFields as FormField[]);
            } else if (typeof rawFields === "string") {
              try { setFields(JSON.parse(rawFields) as FormField[]); } catch { setFields([]); }
            } else {
              setFields([]);
            }
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));

      void loadTranslations();
    }
  }, [id, isNew, loadTranslations]);

  useEffect(() => {
    if (!isNew && activeTab === "submissions") {
      fetch(`/api/admin/form-submissions?form_id=${id}`)
        .then(r => r.json())
        .then(d => setSubmissions((d as { submissions: Submission[] }).submissions || []))
        .catch(() => {});
    }
    if (!isNew && activeTab === "translations") {
      void loadTranslations();
    }
  }, [id, isNew, activeTab, loadTranslations]);

  // Sync selected lang → currentTranslation (load stored or clone from fields)
  useEffect(() => {
    if (storedTranslations[selectedLang]) {
      setCurrentTranslation(storedTranslations[selectedLang]);
    } else {
      setCurrentTranslation({
        fields: fields.map(f => ({ ...f, options: [...f.options] })),
        success_message: formData.success_message,
      });
    }
  }, [selectedLang, storedTranslations, fields, formData.success_message]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = useCallback(async () => {
    if (!formData.name) { showToast("Form name is required", "error"); return; }
    setSaving(true);
    const payload = { ...formData, fields_json: JSON.stringify(fields) };
    try {
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/admin/forms" : `/api/admin/forms/${id}`;
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json() as { form?: FormData; error?: string };
      if (data.form) {
        showToast("Saved!");
        if (isNew) setTimeout(() => router.push("/admin/forms"), 800);
      } else {
        showToast(data.error || "Save failed", "error");
      }
    } catch {
      showToast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  }, [formData, fields, isNew, id, router]);

  const addField = (type: FormField["type"]) => {
    const newField: FormField = { id: generateId(), type, label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`, placeholder: "", required: false, options: type === "select" ? ["Option 1"] : [] };
    setFields(prev => [...prev, newField]);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const removeField = (fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId));
  };

  const deleteSubmission = async (subId: number) => {
    if (!confirm("Delete this submission?")) return;
    await fetch("/api/admin/form-submissions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: subId }) });
    setSubmissions(prev => prev.filter(s => s.id !== subId));
  };

  const updateTranslationField = (fieldId: string, updates: Partial<FormField>) => {
    setCurrentTranslation(prev => {
      if (!prev) return prev;
      return { ...prev, fields: prev.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f) };
    });
  };

  const autoTranslate = async () => {
    if (!currentTranslation) return;
    setTranslating(true);
    setTranslateProgress("Preparing…");
    const lang = selectedLang;
    const translated: FormField[] = currentTranslation.fields.map(f => ({ ...f, options: [...f.options] }));
    let translatedSuccess = currentTranslation.success_message;

    const total = fields.reduce((acc, f) => acc + 2 + f.options.length, 0) + 1;
    let done = 0;
    const tick = (label: string) => {
      done++;
      setTranslateProgress(`${label} (${done}/${total})`);
    };

    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (f.label) { translated[i].label = await translateOne(f.label, lang); tick(`Label: ${f.label.slice(0, 20)}`); }
      else tick("");
      if (f.placeholder) { translated[i].placeholder = await translateOne(f.placeholder, lang); tick(`Placeholder`); }
      else tick("");
      for (let oi = 0; oi < f.options.length; oi++) {
        if (f.options[oi]) { translated[i].options[oi] = await translateOne(f.options[oi], lang); tick(`Option`); }
        else tick("");
      }
    }

    if (formData.success_message) {
      translatedSuccess = await translateOne(formData.success_message, lang);
      tick("Success message");
    }

    setCurrentTranslation({ fields: translated, success_message: translatedSuccess });
    setTranslating(false);
    setTranslateProgress("");
  };

  const saveTranslation = async () => {
    if (!currentTranslation) return;
    setSavingTranslation(true);
    try {
      const r = await fetch(`/api/admin/forms/${id}/translations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language_code: selectedLang,
          fields: currentTranslation.fields,
          success_message: currentTranslation.success_message,
        }),
      });
      const d = await r.json() as { success?: boolean; error?: string };
      if (d.success) {
        setStoredTranslations(prev => ({ ...prev, [selectedLang]: currentTranslation }));
        showToast(`${langs.find(l => l.code === selectedLang)?.label} translation saved!`);
      } else {
        showToast(d.error || "Save failed", "error");
      }
    } catch {
      showToast("Save failed", "error");
    } finally {
      setSavingTranslation(false);
    }
  };

  const clearTranslation = async () => {
    if (!confirm("Clear this translation?")) return;
    try {
      await fetch(`/api/admin/forms/${id}/translations?lang=${selectedLang}`, { method: "DELETE" });
      setStoredTranslations(prev => { const n = { ...prev }; delete n[selectedLang]; return n; });
      setCurrentTranslation({
        fields: fields.map(f => ({ ...f, options: [...f.options] })),
        success_message: formData.success_message,
      });
      showToast("Translation cleared");
    } catch {
      showToast("Failed to clear", "error");
    }
  };

  const fs: React.CSSProperties = { width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" };
  const lb: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading…</div>;

  const tabs = [
    { key: "builder" as const, label: "Form Builder" },
    ...(isNew ? [] : [
      { key: "translations" as const, label: "Translations" },
      { key: "submissions" as const, label: "Submissions" },
    ]),
  ];

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <button onClick={() => router.push("/admin/forms")}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 7, background: "#fff", fontSize: 13, color: "#64748b", cursor: "pointer" }}>
          <ArrowLeft size={14} /> Back
        </button>
        <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
          style={{ flex: 1, padding: "9px 14px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 18, fontWeight: 700, outline: "none", minWidth: 180 }}
          placeholder="Form name…" />
        <button onClick={handleSave} disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: saving ? "#94a3b8" : "#2070B8", color: "#fff", border: "none", borderRadius: 7, fontSize: 13.5, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
          <Save size={14} /> {saving ? "Saving…" : "Save Form"}
        </button>
      </div>

      {toast && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 8, background: toast.type === "success" ? "#dcfce7" : "#fef2f2", color: toast.type === "success" ? "#15803d" : "#C0185A", fontWeight: 600, fontSize: 13.5 }}>
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "#f1f5f9", borderRadius: 8, padding: 4, width: "fit-content" }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ padding: "6px 16px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", background: activeTab === tab.key ? "#fff" : "transparent", color: activeTab === tab.key ? "#0f172a" : "#64748b", boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Builder Tab ─────────────────────────────────────────────────────── */}
      {activeTab === "builder" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 20 }}>
          <div>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, marginBottom: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={lb}>Description</label>
                <textarea style={{ ...fs, minHeight: 64, resize: "vertical" }} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Short description of this form…" />
              </div>
              <div>
                <label style={lb}>Success Message</label>
                <input style={fs} value={formData.success_message} onChange={e => setFormData(p => ({ ...p, success_message: e.target.value }))} />
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 16, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Fields ({fields.length})</h3>
              {fields.length === 0 && (
                <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Add fields from the panel on the right →</p>
              )}
              {fields.map((field, idx) => (
                <div key={field.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "14px 16px", marginBottom: 10, background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", background: "#e2e8f0", padding: "2px 8px", borderRadius: 4 }}>{field.type.toUpperCase()}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>#{idx + 1}</span>
                      <button onClick={() => removeField(field.id)} style={{ background: "none", border: "none", color: "#C0185A", cursor: "pointer", padding: 2 }}><X size={14} /></button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={lb}>Label</label>
                      <input style={fs} value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} />
                    </div>
                    <div>
                      <label style={lb}>Placeholder</label>
                      <input style={fs} value={field.placeholder} onChange={e => updateField(field.id, { placeholder: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" id={`req-${field.id}`} checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} />
                    <label htmlFor={`req-${field.id}`} style={{ fontSize: 12, color: "#374151", cursor: "pointer" }}>Required</label>
                  </div>
                  {field.type === "select" && (
                    <div style={{ marginTop: 10 }}>
                      <label style={lb}>Options</label>
                      {field.options.map((opt, oi) => (
                        <div key={oi} style={{ display: "flex", gap: 6, marginBottom: 5 }}>
                          <input style={{ ...fs, flex: 1 }} value={opt}
                            onChange={e => { const opts = [...field.options]; opts[oi] = e.target.value; updateField(field.id, { options: opts }); }} />
                          <button onClick={() => updateField(field.id, { options: field.options.filter((_, i) => i !== oi) })}
                            style={{ padding: "4px 8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 5, color: "#C0185A", cursor: "pointer", fontSize: 11 }}>✕</button>
                        </div>
                      ))}
                      <button onClick={() => updateField(field.id, { options: [...field.options, ""] })}
                        style={{ fontSize: 11, padding: "4px 10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 5, cursor: "pointer", color: "#2070B8", marginTop: 2 }}>
                        + Add Option
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: add field palette */}
          <div>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, position: "sticky", top: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Add Field</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {FIELD_TYPES.map(ft => (
                  <button key={ft.type} onClick={() => addField(ft.type)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "#374151" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.color = "#2070B8"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#374151"; }}>
                    <span style={{ fontSize: 16 }}>{ft.icon}</span>
                    {ft.label}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: "10px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 7, fontSize: 12, color: "#15803d" }}>
                <Plus size={12} style={{ display: "inline", marginRight: 4 }} />
                Click a field type to add it to your form
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Translations Tab ────────────────────────────────────────────────── */}
      {activeTab === "translations" && langs.length === 0 && (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading languages…</div>
      )}
      {activeTab === "translations" && langs.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 20, alignItems: "start" }}>
          {/* Main translation editor */}
          <div>
            {/* Language bar */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16, marginBottom: 16, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Languages size={16} style={{ color: "#64748b", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginRight: 4 }}>Language:</span>
              {langs.map(l => {
                const saved = !!storedTranslations[l.code];
                const active = selectedLang === l.code;
                return (
                  <button key={l.code} onClick={() => setSelectedLang(l.code)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                      borderRadius: 7, border: `2px solid ${active ? "#2070B8" : "#e2e8f0"}`,
                      background: active ? "#eff6ff" : "#f8fafc",
                      color: active ? "#2070B8" : "#374151",
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                    }}>
                    <span>{l.flag}</span>
                    {l.label}
                    {saved && <CheckCircle size={12} style={{ color: "#16a34a" }} />}
                  </button>
                );
              })}
            </div>

            {/* Translation fields */}
            {currentTranslation && (
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                      {langs.find(l => l.code === selectedLang)?.flag} {langs.find(l => l.code === selectedLang)?.label} Translation
                    </h3>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0" }}>
                      Edit translations manually or click Auto Translate to fill all fields automatically.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {storedTranslations[selectedLang] && (
                      <button onClick={clearTranslation}
                        style={{ padding: "7px 14px", background: "#fef2f2", color: "#C0185A", border: "1px solid #fecaca", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                        Clear
                      </button>
                    )}
                    <button onClick={autoTranslate} disabled={translating}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: translating ? "#94a3b8" : "#7c3aed", color: "#fff", border: "none", borderRadius: 7, cursor: translating ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
                      <Languages size={14} />
                      {translating ? "Translating…" : "Auto Translate"}
                    </button>
                    <button onClick={saveTranslation} disabled={savingTranslation}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: savingTranslation ? "#94a3b8" : "#16a34a", color: "#fff", border: "none", borderRadius: 7, cursor: savingTranslation ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
                      <Save size={14} />
                      {savingTranslation ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {translateProgress && (
                  <div style={{ marginBottom: 16, padding: "10px 14px", background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 8, fontSize: 12.5, color: "#7c3aed", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>🔄</span>
                    {translateProgress}
                  </div>
                )}

                {/* Original vs Translation comparison */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>🇺🇸 Original (English)</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#2070B8", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                    {langs.find(l => l.code === selectedLang)?.flag} {langs.find(l => l.code === selectedLang)?.label}
                  </div>
                </div>

                {currentTranslation.fields.map((trField, i) => {
                  const origField = fields[i];
                  if (!origField) return null;
                  return (
                    <div key={trField.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "3px 8px", borderRadius: 4, display: "inline-block", marginBottom: 8 }}>
                        {origField.type.toUpperCase()} #{i + 1}
                      </div>
                      {/* Label */}
                      {origField.label && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 6 }}>
                          <div>
                            <label style={lb}>Label</label>
                            <div style={{ padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, background: "#f8fafc", color: "#64748b" }}>{origField.label}</div>
                          </div>
                          <div>
                            <label style={{ ...lb, color: "#2070B8" }}>Label</label>
                            <input style={fs} value={trField.label} onChange={e => updateTranslationField(trField.id, { label: e.target.value })} />
                          </div>
                        </div>
                      )}
                      {/* Placeholder */}
                      {origField.placeholder && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 6 }}>
                          <div>
                            <label style={lb}>Placeholder</label>
                            <div style={{ padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, background: "#f8fafc", color: "#64748b" }}>{origField.placeholder}</div>
                          </div>
                          <div>
                            <label style={{ ...lb, color: "#2070B8" }}>Placeholder</label>
                            <input style={fs} value={trField.placeholder} onChange={e => updateTranslationField(trField.id, { placeholder: e.target.value })} />
                          </div>
                        </div>
                      )}
                      {/* Select options */}
                      {origField.type === "select" && origField.options.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div>
                            <label style={lb}>Options</label>
                            {origField.options.map((opt, oi) => (
                              <div key={oi} style={{ padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12.5, background: "#f8fafc", color: "#64748b", marginBottom: 4 }}>{opt}</div>
                            ))}
                          </div>
                          <div>
                            <label style={{ ...lb, color: "#2070B8" }}>Options</label>
                            {(trField.options.length ? trField.options : origField.options).map((opt, oi) => (
                              <input key={oi} style={{ ...fs, marginBottom: 4, fontSize: 12.5 }}
                                value={trField.options[oi] ?? opt}
                                onChange={e => {
                                  const opts = [...(trField.options.length ? trField.options : origField.options)];
                                  opts[oi] = e.target.value;
                                  updateTranslationField(trField.id, { options: opts });
                                }} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Success message */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={lb}>Success Message</label>
                    <div style={{ padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, background: "#f8fafc", color: "#64748b", minHeight: 64, lineHeight: 1.6 }}>{formData.success_message}</div>
                  </div>
                  <div>
                    <label style={{ ...lb, color: "#2070B8" }}>Success Message</label>
                    <textarea
                      style={{ ...fs, minHeight: 64, resize: "vertical" }}
                      value={currentTranslation.success_message}
                      onChange={e => setCurrentTranslation(prev => prev ? { ...prev, success_message: e.target.value } : prev)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar: language status */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16, position: "sticky", top: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 12 }}>Translation Status</h3>
            {langs.map(l => {
              const saved = !!storedTranslations[l.code];
              return (
                <div key={l.code} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span>{l.flag}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#374151" }}>{l.label}</span>
                  {saved
                    ? <CheckCircle size={14} style={{ color: "#16a34a" }} />
                    : <AlertCircle size={14} style={{ color: "#f59e0b" }} />
                  }
                  <span style={{ fontSize: 11, color: saved ? "#16a34a" : "#f59e0b", fontWeight: 600 }}>{saved ? "Saved" : "None"}</span>
                </div>
              );
            })}
            <div style={{ marginTop: 14, padding: "10px 12px", background: "#fafafa", border: "1px solid #f1f5f9", borderRadius: 8, fontSize: 11.5, color: "#64748b", lineHeight: 1.6 }}>
              Saved translations are used on the public site. If no translation is saved, the site translates automatically on the fly.
            </div>
          </div>
        </div>
      )}

      {/* ── Submissions Tab ─────────────────────────────────────────────────── */}
      {activeTab === "submissions" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {submissions.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "#94a3b8" }}>No submissions yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Date", "Status", "Data", ""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "11px 20px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => {
                  let parsed: Record<string, string> = {};
                  try { parsed = JSON.parse(sub.data_json) as Record<string, string>; } catch { /* ok */ }
                  return (
                    <tr key={sub.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "13px 20px", fontSize: 12.5, color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {new Date(sub.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: sub.status === "new" ? "#fef9c3" : "#f1f5f9", color: sub.status === "new" ? "#92400e" : "#64748b" }}>
                          {sub.status}
                        </span>
                      </td>
                      <td style={{ padding: "13px 20px", fontSize: 12.5, color: "#4a5568", maxWidth: 440 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {Object.entries(parsed).slice(0, 4).map(([k, v]) => (
                            <span key={k} style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, fontSize: 11.5 }}>
                              <strong>{k}:</strong> {String(v).slice(0, 40)}
                            </span>
                          ))}
                          {Object.keys(parsed).length > 4 && <span style={{ fontSize: 11.5, color: "#94a3b8" }}>+{Object.keys(parsed).length - 4} more</span>}
                        </div>
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        <button onClick={() => deleteSubmission(sub.id)}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, background: "#fef2f2", color: "#C0185A", border: "1px solid #fecaca", cursor: "pointer" }}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
