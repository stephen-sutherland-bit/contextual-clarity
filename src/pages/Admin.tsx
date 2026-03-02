import { useState, useCallback, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, FileUp, Check, AlertCircle, RefreshCw, Download, Copy, X, 
  Mic, FileText, Image, Play, Square, ShieldX, BookOpen, Upload, Shield
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ApiUsageCard from "@/components/ApiUsageCard";
import ImportHistoryPanel from "@/components/ImportHistoryPanel";

// Natural alphanumeric sort for multi-part teachings (Part 2 before Part 10)
const naturalSort = (a: File, b: File): number => {
  const nameA = a.name.replace('.pdf', '').toLowerCase();
  const nameB = b.name.replace('.pdf', '').toLowerCase();
  return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
};

interface FailedFile {
  filename: string;
  error: string;
  stage: string;
}

interface ImportResult {
  filename: string;
  status: "success" | "failed" | "skipped";
  teachingId?: string;
  error?: string;
}

const Admin = () => {
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // ============== PDF IMPORT STATE ==============
  const [pdfStep, setPdfStep] = useState<"upload" | "importing" | "results">("upload");
  const [pdfQueue, setPdfQueue] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentFile: "", stage: "" });
  const [results, setResults] = useState<ImportResult[]>([]);
  const [batchId, setBatchId] = useState<string>("");
  const [alreadyImported, setAlreadyImported] = useState<Set<string>>(new Set());
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [preserveTitle, setPreserveTitle] = useState(false);
  const [manualTitle, setManualTitle] = useState("");

  // ============== AUDIO IMPORT STATE ==============
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedText, setProcessedText] = useState("");
  const [isSavingAudio, setIsSavingAudio] = useState(false);
  const [audioSaveStage, setAudioSaveStage] = useState("");

  // ============== BATCH COVER STATE ==============
  const [teachingsWithoutCovers, setTeachingsWithoutCovers] = useState<Array<{ id: string; title: string }>>([]);
  const [isScanningCovers, setIsScanningCovers] = useState(false);
  const [isGeneratingCovers, setIsGeneratingCovers] = useState(false);
  const [coverProgress, setCoverProgress] = useState({ current: 0, total: 0 });

  // ============== CCM OUTLINE STATE ==============
  const [ccmOutline, setCcmOutline] = useState<{ content: string; updated_at: string } | null>(null);
  const [isLoadingOutline, setIsLoadingOutline] = useState(false);
  const [isUploadingOutline, setIsUploadingOutline] = useState(false);
  const [outlineDragOver, setOutlineDragOver] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [pendingOutlineFile, setPendingOutlineFile] = useState<File | null>(null);

  // ============== CCM VERIFY STATE ==============
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyReport, setVerifyReport] = useState("");

  // ============== FETCH CCM OUTLINE ==============
  const fetchOutline = useCallback(async () => {
    setIsLoadingOutline(true);
    try {
      const { data, error } = await supabase
        .from('system_documents')
        .select('content, updated_at')
        .eq('document_key', 'ccm_outline')
        .single();
      
      if (error) {
        console.error('Error fetching outline:', error);
        setCcmOutline(null);
      } else {
        setCcmOutline(data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoadingOutline(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchOutline();
    }
  }, [isAdmin, fetchOutline]);

  // ============== CCM OUTLINE UPLOAD ==============
  const handleOutlineUpload = async (file: File) => {
    if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
      toast({ title: "Invalid file", description: "Please upload a PDF file", variant: "destructive" });
      return;
    }

    // If outline already exists, show confirmation dialog
    if (ccmOutline) {
      setPendingOutlineFile(file);
      setShowReplaceDialog(true);
      return;
    }

    await processOutlineUpload(file);
  };

  const processOutlineUpload = async (file: File) => {
    setIsUploadingOutline(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      // Parse PDF
      const parseResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ pdfBase64: base64, filename: file.name }),
        }
      );

      if (!parseResponse.ok) {
        const errData = await parseResponse.json().catch(() => ({ error: 'Parse failed' }));
        throw new Error(errData.error || 'PDF parsing failed');
      }

      const { text } = await parseResponse.json();

      if (!text || text.trim().length < 100) {
        throw new Error('Extracted text is too short — the PDF may be image-only or corrupt');
      }

      // Upsert into system_documents
      const { error: upsertError } = await supabase
        .from('system_documents')
        .upsert({
          document_key: 'ccm_outline',
          title: 'CCM Methodology Outline',
          content: text.trim(),
          updated_at: new Date().toISOString(),
          updated_by: session.user.id,
        }, { onConflict: 'document_key' });

      if (upsertError) throw new Error(upsertError.message);

      toast({ title: "CCM Outline updated", description: `${text.length.toLocaleString()} characters extracted and saved` });
      await fetchOutline();
    } catch (err) {
      console.error("Outline upload error:", err);
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsUploadingOutline(false);
      setPendingOutlineFile(null);
    }
  };

  // ============== CCM VERIFY ==============
  const verifyCCMCompliance = async () => {
    if (!processedText) return;
    setIsVerifying(true);
    setVerifyReport("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-ccm-compliance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ teaching_text: processedText }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Verification failed' }));
        throw new Error(errData.error || 'Verification failed');
      }

      const { report } = await response.json();
      setVerifyReport(report);
      toast({ title: "CCM verification complete" });
    } catch (err) {
      console.error("Verify error:", err);
      toast({
        title: "Verification failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // ============== PDF IMPORT LOGIC ==============
  
  // Normalize a string for fuzzy matching (lowercase, remove punctuation, strip .pdf)
  const normalizeForMatch = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/\.pdf$/i, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  };

  // Find if a filename matches any existing teaching (by source_filename or title)
  const findMatchingTeaching = (
    filename: string, 
    teachings: Array<{ source_filename: string | null; title: string }>
  ): { match: { source_filename: string | null; title: string }; type: 'exact' | 'fuzzy' } | null => {
    // First check exact source_filename match
    const exactMatch = teachings.find(t => t.source_filename === filename);
    if (exactMatch) return { match: exactMatch, type: 'exact' };
    
    // Then try fuzzy title match
    const normalizedFilename = normalizeForMatch(filename);
    const titleMatch = teachings.find(t => {
      const normalizedTitle = normalizeForMatch(t.title);
      // Check if filename is contained in title or title's first part (before colon) matches filename
      const titleFirstPart = normalizeForMatch(t.title.split(':')[0]);
      return normalizedTitle.includes(normalizedFilename) || 
             normalizedFilename.includes(normalizedTitle) ||
             titleFirstPart === normalizedFilename ||
             normalizedFilename.includes(titleFirstPart);
    });
    if (titleMatch) return { match: titleMatch, type: 'fuzzy' };
    
    return null;
  };

  // Compute which files are already in the database (by filename OR title match)
  const computeAlreadyImportedSet = useCallback(async (filenames: string[]) => {
    if (filenames.length === 0) return new Set<string>();

    const { data } = await supabase
      .from("teachings")
      .select("source_filename, title");

    const teachings = data || [];
    const importedSet = new Set<string>();

    for (const filename of filenames) {
      const match = findMatchingTeaching(filename, teachings);
      if (match) importedSet.add(filename);
    }

    return importedSet;
  }, []);

  // Check which files are already in the database (by filename OR title match)
  const checkAlreadyImported = useCallback(async (filenames: string[]) => {
    if (filenames.length === 0) return;
    setIsCheckingDb(true);

    try {
      const importedSet = await computeAlreadyImportedSet(filenames);
      setAlreadyImported(importedSet);
    } catch (err) {
      console.error("Error checking DB:", err);
    } finally {
      setIsCheckingDb(false);
    }
  }, [computeAlreadyImportedSet]);

  useEffect(() => {
    if (pdfQueue.length > 0) {
      checkAlreadyImported(pdfQueue.map(f => f.name));
    } else {
      setAlreadyImported(new Set());
    }
  }, [pdfQueue, checkAlreadyImported]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf' || file.name.endsWith('.pdf')
    );
    
    if (files.length === 0) {
      toast({ title: "No PDFs found", description: "Please upload PDF files only", variant: "destructive" });
      return;
    }
    
    setPdfQueue(prev => [...prev, ...files].sort(naturalSort));
  }, [toast]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
      setPdfQueue(prev => [...prev, ...pdfFiles].sort(naturalSort));
    }
  };

  const clearQueue = () => {
    setPdfQueue([]);
    setResults([]);
    setPdfStep("upload");
  };

  const extractErrorMessage = async (response: Response, stage: string): Promise<string> => {
    try {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return json.error || json.message || `${stage} failed (HTTP ${response.status})`;
      } catch {
        return text.slice(0, 200) || `${stage} failed (HTTP ${response.status})`;
      }
    } catch {
      return `${stage} failed (HTTP ${response.status})`;
    }
  };

  const startImport = async (skipAlreadyImported = true) => {
    if (pdfQueue.length === 0) return;

    // Ensure we have the latest duplicate scan before we decide what to import.
    // This prevents "Retry Failed" / fast clicks from re-processing everything.
    let importedSet = alreadyImported;
    if (skipAlreadyImported) {
      setIsCheckingDb(true);
      try {
        importedSet = await computeAlreadyImportedSet(pdfQueue.map(f => f.name));
        setAlreadyImported(importedSet);
      } finally {
        setIsCheckingDb(false);
      }
    }

    // Filter queue to only files that need importing
    const filesToImport = skipAlreadyImported
      ? pdfQueue.filter(f => !importedSet.has(f.name))
      : pdfQueue;

    const skippedFiles = skipAlreadyImported
      ? pdfQueue.filter(f => importedSet.has(f.name))
      : [];

    if (filesToImport.length === 0) {
      toast({
        title: "Nothing to import",
        description: "All files have already been imported.",
      });
      return;
    }
    
    setPdfStep("importing");
    setIsImporting(true);
    
    // Pre-populate results with skipped files
    const importResults: ImportResult[] = skippedFiles.map(f => ({ 
      filename: f.name, 
      status: "skipped" as const 
    }));
    setResults([...importResults]);
    
    const newBatchId = crypto.randomUUID();
    setBatchId(newBatchId);
    
    await supabase.from("import_runs").insert({
      id: newBatchId,
      total_files: filesToImport.length, // Only count files actually being imported
      status: "running",
    });
    
    await supabase.from("import_run_files").insert(
      filesToImport.map(f => ({ run_id: newBatchId, filename: f.name, status: "queued" }))
    );
    
    const { data: maxOrderData } = await supabase
      .from("teachings")
      .select("reading_order")
      .order("reading_order", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    
    let nextReadingOrder = (maxOrderData?.reading_order || 0) + 1;
    
    for (let i = 0; i < filesToImport.length; i++) {
      const file = filesToImport[i];
      
      setProgress({ current: i + 1, total: filesToImport.length, currentFile: file.name, stage: "Parsing" });
      
      await supabase.from("import_run_files")
        .update({ status: "processing", stage: "parsing", started_at: new Date().toISOString() })
        .eq("run_id", newBatchId)
        .eq("filename", file.name);
      
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
        });
        
        // Get current session for auth token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("Not authenticated - please log in again");
        }
        
        const parseResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-pdf`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ pdfBase64: base64, filename: file.name }),
          }
        );
        
        if (!parseResponse.ok) {
          throw new Error(await extractErrorMessage(parseResponse, "Parsing"));
        }
        const { text: content } = await parseResponse.json();
        
        setProgress(prev => ({ ...prev, stage: "Generating metadata" }));
        await supabase.from("import_run_files")
          .update({ stage: "metadata" })
          .eq("run_id", newBatchId)
          .eq("filename", file.name);
        
        const indexResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-index`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ 
              content, 
              title: preserveTitle && manualTitle.trim() ? manualTitle.trim() : "",
              preserve_title: preserveTitle && manualTitle.trim() ? true : false
            }),
          }
        );
        
        if (!indexResponse.ok) {
          throw new Error(await extractErrorMessage(indexResponse, "Metadata"));
        }
        const metadata = await indexResponse.json();
        
        setProgress(prev => ({ ...prev, stage: "Generating cover" }));
        await supabase.from("import_run_files")
          .update({ stage: "cover" })
          .eq("run_id", newBatchId)
          .eq("filename", file.name);
        
        let coverImageUrl = "";
        try {
          const coverResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-illustration`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                title: metadata.suggested_title || file.name,
                theme: metadata.primary_theme || "Biblical Studies",
                scriptures: metadata.scriptures || [],
              }),
            }
          );
          if (coverResponse.ok) {
            const coverData = await coverResponse.json();
            coverImageUrl = coverData.imageUrl;
          }
        } catch {
          // Cover failure is non-fatal
        }
        
        setProgress(prev => ({ ...prev, stage: "Saving" }));
        await supabase.from("import_run_files")
          .update({ stage: "saving" })
          .eq("run_id", newBatchId)
          .eq("filename", file.name);
        
        const documentId = `D-${newBatchId.slice(0, 8)}-${String(i + 1).padStart(3, "0")}`;
        
        const { data: insertedTeaching, error: insertError } = await supabase.from("teachings").insert({
          document_id: documentId,
          title: metadata.suggested_title || file.name.replace('.pdf', ''),
          primary_theme: metadata.primary_theme || "Uncategorized",
          secondary_themes: metadata.secondary_themes || [],
          scriptures: metadata.scriptures || [],
          doctrines: metadata.doctrines || [],
          keywords: metadata.keywords || [],
          questions_answered: metadata.questions_answered || [],
          quick_answer: metadata.quick_answer || "",
          full_content: content,
          phase: metadata.suggested_phase || "foundations",
          cover_image: coverImageUrl || null,
          reading_order: nextReadingOrder,
          source_filename: file.name,
          import_batch_id: newBatchId,
          imported_via: 'pdf',
        }).select("id").single();
        
        if (insertError) throw new Error(`Saving: ${insertError.message}`);
        
        await supabase.from("import_run_files")
          .update({ status: "success", finished_at: new Date().toISOString(), teaching_id: insertedTeaching?.id })
          .eq("run_id", newBatchId)
          .eq("filename", file.name);
        
        nextReadingOrder++;
        importResults.push({ filename: file.name, status: "success", teachingId: insertedTeaching?.id });
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`Failed: ${file.name}`, errorMessage);
        
        await supabase.from("import_run_files")
          .update({ status: "failed", error_message: errorMessage, finished_at: new Date().toISOString() })
          .eq("run_id", newBatchId)
          .eq("filename", file.name);
        
        importResults.push({ filename: file.name, status: "failed", error: errorMessage });
      }
      
      setResults([...importResults]);
      
      if (i < filesToImport.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const failCount = importResults.filter(r => r.status === "failed").length;
    await supabase.from("import_runs")
      .update({ status: failCount > 0 ? "completed_with_errors" : "completed" })
      .eq("id", newBatchId);
    
    setIsImporting(false);
    setPdfStep("results");
    
    const successCount = importResults.filter(r => r.status === "success").length;
    const skippedCount = importResults.filter(r => r.status === "skipped").length;
    
    toast({
      title: "Import complete",
      description: `${successCount} imported, ${failCount} failed${skippedCount > 0 ? `, ${skippedCount} skipped` : ""}`,
    });
  };

  const retryFailed = () => {
    const failedFilenames = results.filter(r => r.status === "failed").map(r => r.filename);
    const failedFiles = pdfQueue.filter(f => failedFilenames.includes(f.name));
    
    if (failedFiles.length === 0) {
      toast({ title: "No failed files to retry", variant: "destructive" });
      return;
    }
    
    setPdfQueue(failedFiles);
    setResults([]);
    setPdfStep("upload");
    
    toast({ title: "Ready to retry", description: `${failedFiles.length} failed file(s) ready to reimport` });
  };

  const downloadResults = () => {
    const data = {
      batchId,
      timestamp: new Date().toISOString(),
      results,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-${batchId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyFailedFilenames = () => {
    const failed = results.filter(r => r.status === "failed").map(r => r.filename);
    navigator.clipboard.writeText(failed.join("\n"));
    toast({ title: "Copied", description: `${failed.length} failed filename(s) copied` });
  };

  // ============== AUDIO IMPORT LOGIC ==============
  
  // File size limits for audio uploads
  const MAX_AUDIO_SIZE_MB = 50;
  const MAX_AUDIO_SIZE_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024;
  const WARN_AUDIO_SIZE_MB = 25;
  const WARN_AUDIO_SIZE_BYTES = WARN_AUDIO_SIZE_MB * 1024 * 1024;

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileSizeMB = file.size / 1024 / 1024;
      
      // Block files over 50MB
      if (file.size > MAX_AUDIO_SIZE_BYTES) {
        toast({
          title: "File too large",
          description: `Maximum size is ${MAX_AUDIO_SIZE_MB}MB. Your file is ${fileSizeMB.toFixed(1)}MB. Try compressing to 64kbps mono MP3 to reduce size by ~80%.`,
          variant: "destructive"
        });
        e.target.value = ''; // Reset the input
        return;
      }
      
      // Warn for files between 25-50MB
      if (file.size > WARN_AUDIO_SIZE_BYTES) {
        toast({
          title: "Large file detected",
          description: `${fileSizeMB.toFixed(1)}MB file may take longer to upload. Consider compressing for faster processing.`,
        });
      }
      
      setAudioFile(file);
      setTranscriptText("");
      setProcessedText("");
      setVerifyReport("");
    }
  };

  const transcribeAudio = async () => {
    if (!audioFile) return;
    
    setIsTranscribing(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(audioFile);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
      });
      
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated - please log in again");
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ audio: base64, mimeType: audioFile.type }),
        }
      );
      
      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, "Transcription"));
      }
      
      const { transcript } = await response.json();
      setTranscriptText(transcript);
      toast({ title: "Transcription complete" });
    } catch (err) {
      console.error("Transcription error:", err);
      toast({ 
        title: "Transcription failed", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const processTranscript = async () => {
    if (!transcriptText) return;
    
    setIsProcessing(true);
    setProcessedText("");
    setVerifyReport("");
    
    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated - please log in again");
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-transcript`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ transcript: transcriptText }),
        }
      );
      
      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, "Processing"));
      }
      
      // Stream the response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");
      
      const decoder = new TextDecoder();
      let fullText = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                setProcessedText(fullText);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
      
      toast({ title: "Processing complete" });
    } catch (err) {
      console.error("Processing error:", err);
      toast({ 
        title: "Processing failed", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const saveAudioTeaching = async () => {
    if (!processedText || !audioFile) return;
    
    setIsSavingAudio(true);
    
    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated - please log in again");
      }
      
      // Step 1: Generate metadata
      setAudioSaveStage("Generating metadata...");
      const indexResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-index`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ content: processedText, title: "" }),
        }
      );
      
      if (!indexResponse.ok) {
        throw new Error(await extractErrorMessage(indexResponse, "Metadata"));
      }
      const metadata = await indexResponse.json();
      
      // Step 2: Generate cover
      setAudioSaveStage("Generating cover...");
      let coverImageUrl = "";
      try {
        const coverResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-illustration`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              title: metadata.suggested_title || audioFile.name,
              theme: metadata.primary_theme || "Biblical Studies",
              scriptures: metadata.scriptures || [],
            }),
          }
        );
        if (coverResponse.ok) {
          const coverData = await coverResponse.json();
          coverImageUrl = coverData.imageUrl;
        }
      } catch {
        // Cover failure is non-fatal
      }
      
      // Step 3: Save to database
      setAudioSaveStage("Saving...");
      
      const { data: maxOrderData } = await supabase
        .from("teachings")
        .select("reading_order")
        .order("reading_order", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      
      const nextReadingOrder = (maxOrderData?.reading_order || 0) + 1;
      const documentId = `D-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      
      const { error: insertError } = await supabase.from("teachings").insert({
        document_id: documentId,
        title: metadata.suggested_title || audioFile.name.replace(/\.[^/.]+$/, ''),
        primary_theme: metadata.primary_theme || "Uncategorized",
        secondary_themes: metadata.secondary_themes || [],
        scriptures: metadata.scriptures || [],
        doctrines: metadata.doctrines || [],
        keywords: metadata.keywords || [],
        questions_answered: metadata.questions_answered || [],
        quick_answer: metadata.quick_answer || "",
        full_content: processedText,
        phase: metadata.suggested_phase || "foundations",
        cover_image: coverImageUrl || null,
        reading_order: nextReadingOrder,
        source_filename: audioFile.name,
        imported_via: 'audio',
      });
      
      if (insertError) throw new Error(`Saving: ${insertError.message}`);
      
      toast({ title: "Teaching saved successfully!" });
      
      setAudioFile(null);
      setTranscriptText("");
      setProcessedText("");
      setVerifyReport("");
      
    } catch (err) {
      console.error("Save error:", err);
      toast({ 
        title: "Save failed", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setIsSavingAudio(false);
      setAudioSaveStage("");
    }
  };

  // ============== BATCH COVER LOGIC ==============

  const scanForMissingCovers = async () => {
    setIsScanningCovers(true);
    try {
      const { data, error } = await supabase
        .from("teachings")
        .select("id, title")
        .is("cover_image", null)
        .order("title");
      
      if (error) throw error;
      setTeachingsWithoutCovers(data || []);
      
      if ((data?.length || 0) === 0) {
        toast({ title: "All teachings have covers!" });
      }
    } catch (err) {
      console.error("Scan error:", err);
      toast({ title: "Scan failed", variant: "destructive" });
    } finally {
      setIsScanningCovers(false);
    }
  };

  const generateAllCovers = async () => {
    if (teachingsWithoutCovers.length === 0) return;
    
    setIsGeneratingCovers(true);
    setCoverProgress({ current: 0, total: teachingsWithoutCovers.length });
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < teachingsWithoutCovers.length; i++) {
      const teaching = teachingsWithoutCovers[i];
      setCoverProgress({ current: i + 1, total: teachingsWithoutCovers.length });
      
      try {
        // Get teaching details for better cover generation
        const { data: fullTeaching } = await supabase
          .from("teachings")
          .select("primary_theme, scriptures")
          .eq("id", teaching.id)
          .single();
        
        const coverResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-illustration`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              title: teaching.title,
              theme: fullTeaching?.primary_theme || "Biblical Studies",
              scriptures: fullTeaching?.scriptures || [],
            }),
          }
        );
        
        if (coverResponse.ok) {
          const coverData = await coverResponse.json();
          
          await supabase
            .from("teachings")
            .update({ cover_image: coverData.imageUrl })
            .eq("id", teaching.id);
          
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(`Cover failed for ${teaching.title}:`, err);
        failCount++;
      }
      
      // Delay between requests
      if (i < teachingsWithoutCovers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    setIsGeneratingCovers(false);
    setTeachingsWithoutCovers([]);
    
    toast({
      title: "Cover generation complete",
      description: `${successCount} generated, ${failCount} failed`,
    });
  };

  // Computed values for PDF import
  const newFilesCount = pdfQueue.filter(f => !alreadyImported.has(f.name)).length;
  const alreadyImportedCount = pdfQueue.filter(f => alreadyImported.has(f.name)).length;
  const successCount = results.filter(r => r.status === "success").length;
  const failedCount = results.filter(r => r.status === "failed").length;
  const skippedCount = results.filter(r => r.status === "skipped").length;

  // Auth guards
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (!isAdmin) {
    return (
      <>
        <Helmet>
          <title>Access Denied - The Berean Press</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-16 max-w-lg">
            <Card variant="elevated" className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <ShieldX className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="font-heading text-2xl">Access Denied</CardTitle>
                <CardDescription>
                  You don't have permission to access the admin panel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Admin privileges are required to manage teachings and import content.
                </p>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Return to Home
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin - The Berean Press</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6 text-center">
            Admin
          </h1>

          {/* API Usage Card */}
          <ApiUsageCard />

          {/* Main Tabs */}
          <Tabs defaultValue="pdf" className="mb-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pdf" className="flex items-center gap-2">
                <FileUp className="h-4 w-4" />
                <span className="hidden sm:inline">PDF Import</span>
                <span className="sm:hidden">PDF</span>
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Audio Import</span>
                <span className="sm:hidden">Audio</span>
              </TabsTrigger>
              <TabsTrigger value="covers" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Cover Art</span>
                <span className="sm:hidden">Covers</span>
              </TabsTrigger>
              <TabsTrigger value="ccm" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">CCM Outline</span>
                <span className="sm:hidden">CCM</span>
              </TabsTrigger>
            </TabsList>

            {/* PDF Import Tab */}
            <TabsContent value="pdf" className="space-y-4">
              {/* Info note about PDF import */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">PDF Import is for pre-processed documents</p>
                  <p className="text-muted-foreground mt-1">
                    Use this for finished teaching PDFs that are already formatted and ready to publish.
                    For raw audio recordings or transcripts that need cleanup, use the <strong>Audio Import</strong> tab instead.
                  </p>
                </div>
              </div>

              {pdfStep === "upload" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileUp className="h-5 w-5" />
                      Upload PDFs
                    </CardTitle>
                    <CardDescription>
                      Drag and drop your teaching PDFs here
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Drop PDFs here or click to browse
                      </p>
                      <label>
                        <input
                          type="file"
                          multiple
                          accept=".pdf"
                          onChange={handleFileInput}
                          className="hidden"
                        />
                        <Button variant="outline" size="sm" asChild>
                          <span>Browse Files</span>
                        </Button>
                      </label>
                    </div>

                    {pdfQueue.length > 0 && (
                      <div className="space-y-3">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{pdfQueue.length} PDF{pdfQueue.length !== 1 ? 's' : ''} selected</span>
                            <Button variant="ghost" size="sm" onClick={clearQueue}>
                              <X className="h-4 w-4 mr-1" />
                              Clear
                            </Button>
                          </div>
                          
                          {isCheckingDb ? (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Checking for already imported...
                            </p>
                          ) : alreadyImportedCount > 0 ? (
                            <div className="text-sm space-y-1">
                              <p className="text-green-600">{alreadyImportedCount} already imported (will be skipped)</p>
                              <p>{newFilesCount} new file{newFilesCount !== 1 ? 's' : ''} to import</p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">{newFilesCount} file{newFilesCount !== 1 ? 's' : ''} ready to import</p>
                          )}
                          
                          <ScrollArea className="mt-3 max-h-40">
                            <div className="space-y-1">
                              {pdfQueue.map((file, idx) => {
                                const isImported = alreadyImported.has(file.name);
                                return (
                                  <div 
                                    key={idx} 
                                    className={`text-xs flex items-center gap-2 ${isImported ? 'text-green-600' : 'text-muted-foreground'}`}
                                  >
                                    {isImported ? <Check className="h-3 w-3" /> : <span className="w-3">•</span>}
                                    <span className="truncate">{file.name}</span>
                                    {isImported && <span className="text-xs">(imported)</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </div>

                        {/* Preserve Title Option */}
                        <div className="bg-muted/30 rounded-lg p-4 space-y-3 border border-border">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="preserveTitle" 
                              checked={preserveTitle}
                              onCheckedChange={(checked) => setPreserveTitle(checked === true)}
                            />
                            <Label htmlFor="preserveTitle" className="text-sm font-medium cursor-pointer">
                              Use this title (don't let AI change it)
                            </Label>
                          </div>
                          {preserveTitle && (
                            <Input
                              placeholder="Enter the original title..."
                              value={manualTitle}
                              onChange={(e) => setManualTitle(e.target.value)}
                              className="mt-2"
                            />
                          )}
                          {preserveTitle && !manualTitle.trim() && (
                            <p className="text-xs text-amber-600">Enter a title above, or uncheck to let AI generate one</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={() => startImport(true)} 
                            className="flex-1"
                            disabled={isCheckingDb || (newFilesCount === 0 && alreadyImportedCount > 0)}
                          >
                            {isCheckingDb
                              ? "Checking…"
                              : newFilesCount === 0
                                ? "All Already Imported"
                                : `Import ${newFilesCount} New`}
                          </Button>
                          {alreadyImportedCount > 0 && (
                            <Button 
                              variant="outline" 
                              onClick={() => startImport(false)}
                              disabled={isCheckingDb}
                            >
                              Re-import All
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {pdfStep === "importing" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Importing...
                    </CardTitle>
                    <CardDescription>
                      {progress.current} of {progress.total} • {progress.stage}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={(progress.current / progress.total) * 100} className="w-full" />
                    
                    <p className="text-sm text-muted-foreground truncate">
                      {progress.currentFile}
                    </p>
                    
                    {results.length > 0 && (
                      <ScrollArea className="max-h-40 pt-4 border-t">
                        <div className="space-y-1">
                          {results.map((r, idx) => (
                            <div 
                              key={idx} 
                              className={`text-xs flex items-center gap-2 ${
                                r.status === "success" ? "text-green-600" : 
                                r.status === "failed" ? "text-destructive" : 
                                "text-muted-foreground"
                              }`}
                            >
                              {r.status === "success" ? <Check className="h-3 w-3" /> : 
                               r.status === "failed" ? <AlertCircle className="h-3 w-3" /> : 
                               <span className="w-3">–</span>}
                              <span className="truncate flex-1">{r.filename}</span>
                              {r.status === "skipped" && <span>(skipped)</span>}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              )}

              {pdfStep === "results" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {failedCount === 0 ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                      Import Complete
                    </CardTitle>
                    <CardDescription>
                      {successCount} imported, {failedCount} failed{skippedCount > 0 ? `, ${skippedCount} skipped` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ScrollArea className="max-h-60">
                      <div className="space-y-2">
                        {results.map((r, idx) => (
                          <div 
                            key={idx} 
                            className={`rounded p-2 text-sm ${
                              r.status === "success" ? "bg-green-500/10" : 
                              r.status === "failed" ? "bg-destructive/10" : 
                              "bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {r.status === "success" ? <Check className="h-4 w-4 text-green-600" /> : 
                               r.status === "failed" ? <AlertCircle className="h-4 w-4 text-destructive" /> : 
                               <span className="w-4 text-center">–</span>}
                              <span className="truncate flex-1 font-medium">{r.filename}</span>
                            </div>
                            {r.error && (
                              <p className="text-xs text-destructive mt-1 pl-6">{r.error}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <div className="flex gap-2 flex-wrap">
                      {failedCount > 0 && (
                        <>
                          <Button onClick={retryFailed} variant="destructive">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry {failedCount} Failed
                          </Button>
                          <Button onClick={copyFailedFilenames} variant="outline" size="icon">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button onClick={downloadResults} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download Summary
                      </Button>
                      <Button onClick={clearQueue} variant="ghost" className="ml-auto">
                        Start New Import
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Audio Import Tab */}
            <TabsContent value="audio" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    Audio Import
                  </CardTitle>
                  <CardDescription>
                    Upload audio → Transcribe → Process → Save
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Step 1: Upload Audio */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">1. Upload Audio File</label>
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="audio/*,.mp3,.m4a,.wav,.ogg,.opus,.aac,.flac,.wma,.webm"
                          onChange={handleAudioFileChange}
                          className="hidden"
                        />
                        <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                          {audioFile ? (
                            <div className="space-y-1">
                              <p className="text-sm font-medium truncate">{audioFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(audioFile.size / 1024 / 1024).toFixed(1)} MB
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Click to select audio file (max 50MB)</p>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Step 2: Transcribe */}
                  {audioFile && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">2. Transcribe</label>
                      <Button 
                        onClick={transcribeAudio} 
                        disabled={isTranscribing}
                        className="w-full"
                      >
                        {isTranscribing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Transcribing...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Start Transcription
                          </>
                        )}
                      </Button>
                      
                      {transcriptText && (
                        <ScrollArea className="h-40 border rounded-lg p-3">
                          <p className="text-sm whitespace-pre-wrap">{transcriptText}</p>
                        </ScrollArea>
                      )}
                    </div>
                  )}

                  {/* Step 3: Process */}
                  {transcriptText && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">3. Process with CCM Methodology</label>
                      <Button 
                        onClick={processTranscript} 
                        disabled={isProcessing}
                        className="w-full"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Process Transcript
                          </>
                        )}
                      </Button>
                      
                      {processedText && (
                        <ScrollArea className="h-60 border rounded-lg p-3">
                          <p className="text-sm whitespace-pre-wrap">{processedText}</p>
                        </ScrollArea>
                      )}
                    </div>
                  )}

                  {/* Step 3.5: Verify CCM Compliance */}
                  {processedText && !isProcessing && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        3.5 Verify CCM Compliance (Optional)
                      </label>
                      <Button 
                        onClick={verifyCCMCompliance} 
                        disabled={isVerifying}
                        variant="outline"
                        className="w-full"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Verifying against CCM...
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Verify CCM Compliance
                          </>
                        )}
                      </Button>
                      
                      {verifyReport && (
                        <ScrollArea className="h-60 border rounded-lg p-3 bg-muted/30">
                          <p className="text-sm whitespace-pre-wrap">{verifyReport}</p>
                        </ScrollArea>
                      )}
                    </div>
                  )}

                  {/* Step 4: Save */}
                  {processedText && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">4. Save Teaching</label>
                      <Button 
                        onClick={saveAudioTeaching} 
                        disabled={isSavingAudio}
                        className="w-full"
                        variant="default"
                      >
                        {isSavingAudio ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {audioSaveStage}
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Save Teaching
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Batch Cover Generation Tab */}
            <TabsContent value="covers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Batch Cover Generation
                  </CardTitle>
                  <CardDescription>
                    Generate cover art for teachings without images
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={scanForMissingCovers}
                    disabled={isScanningCovers}
                    variant="outline"
                    className="w-full"
                  >
                    {isScanningCovers ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      "Scan for Missing Covers"
                    )}
                  </Button>

                  {teachingsWithoutCovers.length > 0 && (
                    <>
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                        <p className="font-medium text-amber-700 dark:text-amber-400">
                          {teachingsWithoutCovers.length} teachings without cover art
                        </p>
                      </div>
                      
                      <ScrollArea className="h-40 border rounded-lg">
                        <div className="p-2 space-y-1">
                          {teachingsWithoutCovers.map((t) => (
                            <p key={t.id} className="text-xs text-muted-foreground truncate">
                              {t.title}
                            </p>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      <Button 
                        onClick={generateAllCovers}
                        disabled={isGeneratingCovers}
                        className="w-full"
                      >
                        {isGeneratingCovers ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating {coverProgress.current}/{coverProgress.total}...
                          </>
                        ) : (
                          `Generate All ${teachingsWithoutCovers.length} Covers`
                        )}
                      </Button>
                      
                      {isGeneratingCovers && (
                        <Progress value={(coverProgress.current / coverProgress.total) * 100} />
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* CCM Outline Tab */}
            <TabsContent value="ccm" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    CCM Methodology Outline
                  </CardTitle>
                  <CardDescription>
                    The AI references this document as its governing rules when processing teachings.
                    Upload a new PDF to update the methodology.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingOutline ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : ccmOutline ? (
                    <>
                      {/* Current outline info */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            Outline loaded
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Updated: {new Date(ccmOutline.updated_at).toLocaleDateString('en-NZ', { 
                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Preview */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Content Preview</label>
                        <ScrollArea className="h-60 border rounded-lg p-4 bg-muted/20">
                          <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                            {ccmOutline.content}
                          </p>
                        </ScrollArea>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ccmOutline.content.length.toLocaleString()} characters
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        No CCM Outline uploaded yet. Upload a PDF below to get started.
                      </p>
                    </div>
                  )}

                  {/* Upload zone */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {ccmOutline ? 'Replace Outline' : 'Upload Outline'}
                    </label>
                    <div
                      onDrop={(e) => {
                        e.preventDefault();
                        setOutlineDragOver(false);
                        const file = e.dataTransfer.files[0];
                        if (file) handleOutlineUpload(file);
                      }}
                      onDragOver={(e) => { e.preventDefault(); setOutlineDragOver(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setOutlineDragOver(false); }}
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        outlineDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      } ${isUploadingOutline ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {isUploadingOutline ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="text-sm">Parsing PDF and saving...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Drop a PDF here or click to browse
                          </p>
                          <label>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleOutlineUpload(file);
                                e.target.value = '';
                              }}
                              className="hidden"
                            />
                            <Button variant="outline" size="sm" asChild>
                              <span>Browse Files</span>
                            </Button>
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

          {/* Import History */}
          <ImportHistoryPanel limit={10} />
        </main>
        
        <Footer />
      </div>

      {/* Replace CCM Outline Confirmation Dialog */}
      <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace CCM Outline?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current CCM Methodology Outline. The AI will use the new version 
              for all future rewrites. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingOutlineFile(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowReplaceDialog(false);
              if (pendingOutlineFile) processOutlineUpload(pendingOutlineFile);
            }}>
              Replace Outline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Admin;
