"use client";

/**
 * RichTextEditor — lightweight contenteditable WYSIWYG.
 * Outputs/accepts HTML. No external dependencies.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link, Image as ImageIcon, Quote,
  Heading1, Heading2, Heading3, Minus, Undo, Redo, X,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  onImagePick?: () => void; // opens external media picker; caller sets value via insertImage()
  minHeight?: number;
  placeholder?: string;
}

// Exposed so parent can call editorRef.current?.insertImage(url)
export interface RichEditorHandle {
  insertImage: (url: string) => void;
  focus: () => void;
}

const BTN: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 28, height: 28, border: "none", borderRadius: 5, cursor: "pointer",
  background: "transparent", color: "#374151", flexShrink: 0,
  transition: "background 0.1s, color 0.1s",
};
const ACTIVE_BTN: React.CSSProperties = { ...BTN, background: "#eff6ff", color: "#2070B8" };
const SEP: React.CSSProperties = { width: 1, height: 20, background: "#e2e8f0", margin: "0 3px", flexShrink: 0 };

function ToolbarBtn({ title, active, onClick, children }: {
  title: string; active?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      style={active ? ACTIVE_BTN : BTN}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, onImagePick, minHeight = 320, placeholder = "Write your content here…" }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const savedRangeRef = useRef<Range | null>(null);

  // Keep editor HTML in sync when value changes externally
  const lastValueRef = useRef<string>("");
  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== lastValueRef.current) {
      editorRef.current.innerHTML = value || "";
      lastValueRef.current = value;
    }
  }, [value]);

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  }, []);

  const isActive = (cmd: string) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    lastValueRef.current = html;
    onChange(html);
  };

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreRange = () => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const insertLink = () => {
    restoreRange();
    if (linkUrl && linkUrl !== "https://") exec("createLink", linkUrl);
    setLinkDialogOpen(false);
    setLinkUrl("https://");
  };

  const insertImage = useCallback((url: string) => {
    restoreRange();
    exec("insertImage", url);
  }, [exec]);

  // Expose insertImage via ref
  useEffect(() => {
    if (editorRef.current) {
      (editorRef.current as HTMLDivElement & { insertImage?: (u: string) => void }).insertImage = insertImage;
    }
  }, [insertImage]);

  const [, forceRender] = useState(0);
  const tick = () => forceRender(n => n + 1);

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", background: "#fff", fontFamily: "system-ui,sans-serif" }}>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, padding: "6px 8px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}
        onMouseUp={tick}>

        {/* History */}
        <ToolbarBtn title="Undo" onClick={() => exec("undo")}><Undo size={13} /></ToolbarBtn>
        <ToolbarBtn title="Redo" onClick={() => exec("redo")}><Redo size={13} /></ToolbarBtn>
        <div style={SEP} />

        {/* Headings */}
        <ToolbarBtn title="Heading 1" active={isActive("h1")} onClick={() => exec("formatBlock", "<h1>")}><Heading1 size={14} /></ToolbarBtn>
        <ToolbarBtn title="Heading 2" active={isActive("h2")} onClick={() => exec("formatBlock", "<h2>")}><Heading2 size={14} /></ToolbarBtn>
        <ToolbarBtn title="Heading 3" active={isActive("h3")} onClick={() => exec("formatBlock", "<h3>")}><Heading3 size={14} /></ToolbarBtn>
        <ToolbarBtn title="Paragraph" onClick={() => exec("formatBlock", "<p>")} >
          <span style={{ fontSize: 11, fontWeight: 700 }}>P</span>
        </ToolbarBtn>
        <div style={SEP} />

        {/* Inline */}
        <ToolbarBtn title="Bold" active={isActive("bold")} onClick={() => { exec("bold"); tick(); }}><Bold size={13} /></ToolbarBtn>
        <ToolbarBtn title="Italic" active={isActive("italic")} onClick={() => { exec("italic"); tick(); }}><Italic size={13} /></ToolbarBtn>
        <ToolbarBtn title="Underline" active={isActive("underline")} onClick={() => { exec("underline"); tick(); }}><Underline size={13} /></ToolbarBtn>
        <ToolbarBtn title="Blockquote" onClick={() => exec("formatBlock", "<blockquote>")}><Quote size={13} /></ToolbarBtn>
        <div style={SEP} />

        {/* Align */}
        <ToolbarBtn title="Align Left"   onClick={() => exec("justifyLeft")}><AlignLeft   size={13} /></ToolbarBtn>
        <ToolbarBtn title="Align Center" onClick={() => exec("justifyCenter")}><AlignCenter size={13} /></ToolbarBtn>
        <ToolbarBtn title="Align Right"  onClick={() => exec("justifyRight")}><AlignRight  size={13} /></ToolbarBtn>
        <div style={SEP} />

        {/* Lists */}
        <ToolbarBtn title="Bullet list"   onClick={() => exec("insertUnorderedList")}><List        size={13} /></ToolbarBtn>
        <ToolbarBtn title="Numbered list" onClick={() => exec("insertOrderedList")}><ListOrdered  size={13} /></ToolbarBtn>
        <ToolbarBtn title="Horizontal rule" onClick={() => exec("insertHorizontalRule")}><Minus size={13} /></ToolbarBtn>
        <div style={SEP} />

        {/* Link */}
        <ToolbarBtn title="Insert link" onClick={() => { saveRange(); setLinkDialogOpen(true); }}><Link size={13} /></ToolbarBtn>

        {/* Image */}
        {onImagePick && (
          <ToolbarBtn title="Insert image from library" onClick={() => { saveRange(); onImagePick(); }}>
            <ImageIcon size={13} />
          </ToolbarBtn>
        )}
        <ToolbarBtn title="Insert image by URL" onClick={() => {
          saveRange();
          const url = window.prompt("Image URL:", "https://");
          if (url) insertImage(url);
        }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: "#64748b" }}>IMG</span>
        </ToolbarBtn>
      </div>

      {/* ── Link dialog ── */}
      {linkDialogOpen && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#eff6ff", borderBottom: "1px solid #bfdbfe" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#2070B8", whiteSpace: "nowrap" }}>Insert Link:</span>
          <input
            autoFocus
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") insertLink(); if (e.key === "Escape") setLinkDialogOpen(false); }}
            style={{ flex: 1, padding: "5px 10px", border: "1px solid #bfdbfe", borderRadius: 5, fontSize: 13, outline: "none" }}
            placeholder="https://example.com"
          />
          <button onMouseDown={e => { e.preventDefault(); insertLink(); }}
            style={{ padding: "5px 14px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Insert
          </button>
          <button onMouseDown={e => { e.preventDefault(); setLinkDialogOpen(false); }}
            style={{ display: "flex", background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Editable area ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={tick}
        onMouseUp={tick}
        data-placeholder={placeholder}
        style={{
          minHeight,
          padding: "16px 18px",
          outline: "none",
          fontSize: 15,
          lineHeight: 1.8,
          color: "#1e293b",
          overflowY: "auto",
        }}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        [contenteditable] h1 { font-size: 2rem; font-weight: 800; margin: 1.2em 0 0.5em; color: #0f172a; }
        [contenteditable] h2 { font-size: 1.5rem; font-weight: 700; margin: 1em 0 0.5em; color: #0f172a; }
        [contenteditable] h3 { font-size: 1.2rem; font-weight: 700; margin: 1em 0 0.4em; color: #0f172a; }
        [contenteditable] p  { margin: 0 0 1em; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 1.6em; margin: 0 0 1em; }
        [contenteditable] li { margin-bottom: 0.3em; }
        [contenteditable] blockquote { border-left: 4px solid #C0185A; margin: 1em 0; padding: 8px 16px; background: #fff5f5; color: #475569; font-style: italic; border-radius: 0 6px 6px 0; }
        [contenteditable] a  { color: #2070B8; text-decoration: underline; }
        [contenteditable] img { max-width: 100%; border-radius: 6px; margin: 8px 0; display: block; }
        [contenteditable] hr { border: none; border-top: 2px solid #e2e8f0; margin: 1.5em 0; }
      `}</style>
    </div>
  );
}
