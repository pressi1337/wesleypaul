"use client";

/**
 * CKEditorField — CKEditor 5 Classic loaded from CDN.
 * No npm package needed. Version 41.4.2 (last fully-free build).
 * Includes "Open in new tab" checkbox in the link dialog by default.
 */

import { useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
  placeholder?: string;
}

interface CKInstance {
  getData(): string;
  setData(v: string): void;
  destroy(): Promise<void>;
  model: { document: { on(event: string, cb: () => void): void } };
}

declare global {
  interface Window {
    ClassicEditor?: {
      create(el: HTMLElement, config: object): Promise<CKInstance>;
    };
  }
}

const CDN_JS  = "https://cdn.ckeditor.com/ckeditor5/41.4.2/classic/ckeditor.js";
const CDN_CSS = "https://cdn.ckeditor.com/ckeditor5/41.4.2/classic/ckeditor.css";

function injectCss() {
  if (document.querySelector(`link[href="${CDN_CSS}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet"; l.href = CDN_CSS;
  document.head.appendChild(l);
}

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.ClassicEditor) { resolve(); return; }
    if (document.querySelector(`script[src="${CDN_JS}"]`)) {
      // Script tag exists but ClassicEditor not yet ready — wait for it
      const existing = document.querySelector(`script[src="${CDN_JS}"]`) as HTMLScriptElement;
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = CDN_JS;
    s.onload  = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function CKEditorField({
  value,
  onChange,
  minHeight = 220,
  placeholder = "Write content here…",
}: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const editorRef     = useRef<CKInstance | null>(null);
  const onChangeRef   = useRef(onChange);
  const isTypingRef   = useRef(false); // true while CKEditor is the source of truth
  onChangeRef.current = onChange;

  // ── Mount: load CKEditor and initialise ──────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!containerRef.current) return;
      injectCss();
      await loadScript();
      if (cancelled || !containerRef.current || !window.ClassicEditor) return;

      const editor = await window.ClassicEditor.create(containerRef.current, {
        placeholder,
        toolbar: {
          items: [
            "heading", "|",
            "bold", "italic", "underline", "|",
            "link", "bulletedList", "numberedList", "|",
            "blockQuote", "insertTable", "horizontalLine", "|",
            "undo", "redo",
          ],
        },
        link: {
          defaultProtocol: "https://",
          decorators: {
            openInNewTab: {
              mode: "manual",
              label: "Open in a new tab",
              defaultValue: true,
              attributes: {
                target: "_blank",
                rel: "noopener noreferrer",
              },
            },
          },
        },
        table: {
          contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
        },
      });

      if (cancelled) { editor.destroy(); return; }

      editor.setData(value);

      editor.model.document.on("change:data", () => {
        isTypingRef.current = true;
        onChangeRef.current(editor.getData());
        // reset after React has a chance to re-render
        setTimeout(() => { isTypingRef.current = false; }, 0);
      });

      editorRef.current = editor;
    };

    init().catch(console.error);

    return () => {
      cancelled = true;
      editorRef.current?.destroy().catch(() => {});
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync externally-changed value into the editor ────────────────────
  useEffect(() => {
    if (isTypingRef.current) return; // user is typing — don't override
    const ed = editorRef.current;
    if (ed && ed.getData() !== value) ed.setData(value);
  }, [value]);

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", minHeight }}>
      <div ref={containerRef} />
      <style>{`
        /* Fit CKEditor inside the admin panel */
        .ck.ck-editor { border: none !important; }
        .ck.ck-editor__top .ck-sticky-panel .ck-toolbar {
          border-radius: 8px 8px 0 0 !important;
          border-bottom: 1px solid #e2e8f0 !important;
          background: #f8fafc !important;
          padding: 4px 8px !important;
        }
        .ck.ck-editor__main > .ck-editor__editable {
          min-height: ${minHeight - 46}px;
          border-radius: 0 0 8px 8px !important;
          border: none !important;
          padding: 14px 18px !important;
          font-family: system-ui, sans-serif !important;
          font-size: 15px !important;
          line-height: 1.8 !important;
          color: #1e293b !important;
        }
        .ck.ck-editor__main > .ck-editor__editable:focus { box-shadow: none !important; }
        /* Link dialog "Open in new tab" checkbox */
        .ck.ck-link-form .ck-labeled-field-view { flex: 1; }
      `}</style>
    </div>
  );
}
