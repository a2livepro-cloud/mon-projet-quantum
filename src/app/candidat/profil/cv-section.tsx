"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Loader2, CheckCircle2, FileWarning } from "lucide-react";

export function CvSection({
  candidatId,
  hasCv,
}: {
  candidatId: string;
  hasCv: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop lourd",
        description: "Maximum 5 Mo.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() ?? "pdf";
    const path = `${candidatId}/cv.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Erreur upload",
        description: uploadError.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    await supabase
      .from("candidats")
      .update({ cv_url: path })
      .eq("id", candidatId);

    toast({ title: hasCv ? "CV remplacé" : "CV déposé" });
    setUploading(false);
    // reset input so same file can be re-uploaded if needed
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {hasCv ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
        ) : (
          <FileWarning className="h-4 w-4 shrink-0 text-slate-500" />
        )}
        <span
          className={`text-sm ${hasCv ? "text-green-400" : "text-slate-500"}`}
        >
          {hasCv ? "CV déposé" : "Aucun CV — déposez le vôtre"}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleUpload}
      />

      <Button
        size="sm"
        variant="ghost"
        className="gap-2 border border-white/10 text-slate-300 hover:border-quantum-cyan/40 hover:text-quantum-cyan"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {uploading ? "Upload…" : hasCv ? "Remplacer le CV" : "Déposer un CV"}
      </Button>

      <p className="text-[11px] text-slate-600">PDF, Word — 5 Mo max</p>
    </div>
  );
}
