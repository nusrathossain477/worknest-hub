import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TaskAttachment, Profile } from "@/lib/types";
import {
  Paperclip, Upload, Link as LinkIcon, Trash2, Download,
  FileText, FileSpreadsheet, FileImage, FileVideo, Presentation, File as FileIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

function iconFor(a: TaskAttachment) {
  if (a.kind === "link") return LinkIcon;
  const m = (a.mime_type ?? "").toLowerCase();
  const n = a.file_name.toLowerCase();
  if (m.startsWith("image/")) return FileImage;
  if (m.startsWith("video/")) return FileVideo;
  if (m.includes("pdf") || n.endsWith(".pdf")) return FileText;
  if (m.includes("sheet") || /\.(xlsx?|csv)$/.test(n)) return FileSpreadsheet;
  if (m.includes("presentation") || /\.(pptx?)$/.test(n)) return Presentation;
  if (m.includes("word") || /\.(docx?|txt|md|rtf)$/.test(n)) return FileText;
  return FileIcon;
}

function prettySize(bytes: number | null) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0, n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function TaskAttachments({
  taskId,
  userId,
  canUpload,
  profilesMap,
}: {
  taskId: string;
  userId: string | undefined;
  canUpload: boolean;
  profilesMap: Map<string, Profile>;
}) {
  const [items, setItems] = useState<TaskAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("task_attachments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });
    setItems((data as TaskAttachment[]) ?? []);
  };

  useEffect(() => { load(); }, [taskId]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length || !userId) return;
    setBusy(true);
    let ok = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(`Uploading ${i + 1}/${files.length}: ${file.name}`);
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 50 MB`);
        continue;
      }
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${taskId}/${userId}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from("task-files")
        .upload(path, file, { contentType: file.type || "application/octet-stream" });
      if (upErr) { toast.error(`${file.name}: ${upErr.message}`); continue; }

      const { error: rowErr } = await supabase.from("task_attachments").insert({
        task_id: taskId,
        user_id: userId,
        kind: "file",
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type || null,
      });
      if (rowErr) {
        await supabase.storage.from("task-files").remove([path]);
        toast.error(`${file.name}: ${rowErr.message}`);
        continue;
      }
      ok++;
    }
    setBusy(false);
    setProgress(null);
    if (fileInput.current) fileInput.current.value = "";
    if (ok) toast.success(`${ok} file${ok > 1 ? "s" : ""} attached`);
    load();
  };

  const addLink = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    let url = linkUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try { new URL(url); } catch { toast.error("Enter a valid URL"); return; }
    setBusy(true);
    const { error } = await supabase.from("task_attachments").insert({
      task_id: taskId,
      user_id: userId,
      kind: "link",
      file_name: linkLabel.trim() || url,
      link_url: url,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setLinkUrl(""); setLinkLabel("");
    toast.success("Link attached");
    load();
  };

  const open = async (a: TaskAttachment) => {
    if (a.kind === "link" && a.link_url) { window.open(a.link_url, "_blank", "noopener"); return; }
    if (!a.file_path) return;
    const { data, error } = await supabase.storage
      .from("task-files")
      .createSignedUrl(a.file_path, 60 * 10, { download: a.file_name });
    if (error || !data) { toast.error(error?.message ?? "Could not open file"); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const remove = async (a: TaskAttachment) => {
    const { error } = await supabase.from("task_attachments").delete().eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    if (a.file_path) await supabase.storage.from("task-files").remove([a.file_path]);
    toast.success("Removed");
    load();
  };

  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="flex items-center gap-2 font-semibold">
        <Paperclip className="h-4 w-4" /> Submitted files & links
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        PDF, Word, Excel, PowerPoint, images, videos, archives or any link · up to 50 MB per file
      </p>

      <div className="mt-4 space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Nothing submitted yet.</p>}
        {items.map((a) => {
          const Icon = iconFor(a);
          const canDelete = a.user_id === userId || canUploadAdminFallback();
          return (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border p-3">
              <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <button onClick={() => open(a)} className="block max-w-full truncate text-left text-sm font-medium hover:underline">
                  {a.file_name}
                </button>
                <p className="text-xs text-muted-foreground">
                  {profilesMap.get(a.user_id)?.full_name || "User"}
                  {a.kind === "file" && a.file_size ? ` · ${prettySize(a.file_size)}` : ""}
                  {` · ${formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}`}
                </p>
              </div>
              <button onClick={() => open(a)} title={a.kind === "link" ? "Open link" : "Download"}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                {a.kind === "link" ? <LinkIcon className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              </button>
              {canDelete && (
                <button onClick={() => remove(a)} title="Remove"
                  className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {canUpload && (
        <div className="mt-5 space-y-4 border-t pt-5">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
            className="rounded-xl border-2 border-dashed p-6 text-center"
          >
            <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Drag & drop files here, or{" "}
              <button type="button" disabled={busy} onClick={() => fileInput.current?.click()}
                className="font-medium text-primary hover:underline disabled:opacity-50">
                browse
              </button>
            </p>
            {progress && <p className="mt-2 text-xs text-muted-foreground">{progress}</p>}
            <input ref={fileInput} type="file" multiple hidden
              onChange={(e) => onFiles(e.target.files)} />
          </div>

          <form onSubmit={addLink} className="flex flex-wrap gap-2">
            <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Label (optional)"
              className="w-40 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://drive.google.com/…"
              className="min-w-40 flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <button type="submit" disabled={busy || !linkUrl.trim()}
              className="rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50">
              Attach link
            </button>
          </form>
        </div>
      )}
    </section>
  );

  function canUploadAdminFallback() {
    return false;
  }
}
