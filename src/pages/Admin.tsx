import { useState, useCallback, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Database, Check, Copy, Upload, Mic, BookOpen, FileUp, ImagePlus } from "lucide-react";
import BookPreview from "@/components/BookPreview";
import { Progress } from "@/components/ui/progress";
import ApiUsageCard from "@/components/ApiUsageCard";

const MAX_CHUNK_SIZE = 20 * 1024 * 1024; // 20MB to stay under Whisper's 25MB limit

// Natural alphanumeric sort to handle multi-part teachings correctly
// e.g., "Part 2" before "Part 10", keeps related teachings together
const naturalSort = (a: File, b: File): number => {
  const nameA = a.name.replace('.pdf', '').toLowerCase();
  const nameB = b.name.replace('.pdf', '').toLowerCase();
  
  return nameA.localeCompare(nameB, undefined, { 
    numeric: true, 
    sensitivity: 'base' 
  });
};

// LocalStorage key for batch import state
const BATCH_IMPORT_STATE_KEY = 'bulk_import_state';

interface BatchImportState {
  processedFiles: string[];
  failedFiles: string[];
  phase: string;
  startTime: number;
  nextReadingOrder: number;
}

const saveBatchState = (state: BatchImportState) => {
  localStorage.setItem(BATCH_IMPORT_STATE_KEY, JSON.stringify(state));
};

const loadBatchState = (): BatchImportState | null => {
  const saved = localStorage.getItem(BATCH_IMPORT_STATE_KEY);
  return saved ? JSON.parse(saved) : null;
};

const clearBatchState = () => {
  localStorage.removeItem(BATCH_IMPORT_STATE_KEY);
};

const Admin = () => {
  const { toast } = useToast();
  const [transcript, setTranscript] = useState("");
  const [processedContent, setProcessedContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPdfDragOver, setIsPdfDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [contentSource, setContentSource] = useState<'audio' | 'pdf' | 'manual' | null>(null);
  
  // Metadata state
  const [title, setTitle] = useState("");
  const [primaryTheme, setPrimaryTheme] = useState("");
  const [secondaryThemes, setSecondaryThemes] = useState<string[]>([]);
  const [scriptures, setScriptures] = useState<string[]>([]);
  const [doctrines, setDoctrines] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [questionsAnswered, setQuestionsAnswered] = useState<string[]>([]);
  const [quickAnswer, setQuickAnswer] = useState("");
  const [phase, setPhase] = useState<string>("foundations");
  const [showBookPreview, setShowBookPreview] = useState(false);
  const [coverImage, setCoverImage] = useState<string>("");
  
  // Batch cover generation state
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentTitle: "" });

  // Bulk PDF import state
  const [pdfQueue, setPdfQueue] = useState<File[]>([]);
  const [isBatchImporting, setIsBatchImporting] = useState(false);
  const [batchImportProgress, setBatchImportProgress] = useState({ 
    current: 0, 
    total: 0, 
    currentFile: "", 
    stage: "" 
  });
  const [bulkPhase, setBulkPhase] = useState<string>("foundations");
  
  // Duplicate detection state
  const [duplicates, setDuplicates] = useState<{ file: File; existingTitle: string }[]>([]);
  const [skippedDuplicates, setSkippedDuplicates] = useState<string[]>([]);
  
  // Resume state for interrupted imports
  const [resumableState, setResumableState] = useState<BatchImportState | null>(null);
  const [processedInSession, setProcessedInSession] = useState<string[]>([]);
  const [failedInSession, setFailedInSession] = useState<string[]>([]);

  // Check for resumable state on mount
  useEffect(() => {
    const savedState = loadBatchState();
    if (savedState && savedState.processedFiles.length > 0) {
      setResumableState(savedState);
    }
  }, []);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/mp3;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  // Split large audio file into chunks (for files > 20MB)
  const splitAudioFile = async (file: File): Promise<{ base64: string; start: number; end: number }[]> => {
    const chunks: { base64: string; start: number; end: number }[] = [];
    const totalSize = file.size;
    
    if (totalSize <= MAX_CHUNK_SIZE) {
      // File is small enough, no need to split
      const base64 = await fileToBase64(file);
      return [{ base64, start: 0, end: totalSize }];
    }
    
    // For larger files, we need to split them
    // Note: This is a simplified approach - for production, you'd want to split on audio boundaries
    let start = 0;
    while (start < totalSize) {
      const end = Math.min(start + MAX_CHUNK_SIZE, totalSize);
      const chunk = file.slice(start, end);
      const chunkFile = new File([chunk], file.name, { type: file.type });
      const base64 = await fileToBase64(chunkFile);
      chunks.push({ base64, start, end });
      start = end;
    }
    
    return chunks;
  };

  // Transcribe audio file
  const transcribeAudio = async (file: File) => {
    setIsTranscribing(true);
    setTranscriptionProgress(0);

    try {
      const chunks = await splitAudioFile(file);
      const totalChunks = chunks.length;
      let fullTranscript = "";

      toast({
        title: "Transcribing",
        description: `Processing ${totalChunks} chunk${totalChunks > 1 ? 's' : ''}...`,
      });

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              audio: chunk.base64,
              mimeType: file.type,
              chunkIndex: i,
              totalChunks,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Transcription failed");
        }

        const result = await response.json();
        fullTranscript += (fullTranscript ? " " : "") + result.text;
        
        setTranscriptionProgress(((i + 1) / totalChunks) * 100);
      }

      setTranscript(fullTranscript);
      toast({
        title: "Success",
        description: "Audio transcribed successfully",
      });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to transcribe audio",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
      setTranscriptionProgress(0);
    }
  };

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/x-m4a'];
      
      if (validTypes.includes(file.type) || file.name.match(/\.(mp3|wav|m4a|mp4|webm|ogg)$/i)) {
        transcribeAudio(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an audio file (MP3, WAV, M4A, MP4, WebM, or OGG)",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Handle file input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      transcribeAudio(files[0]);
      setContentSource('audio');
    }
  };

  // Parse PDF file
  const parsePdf = async (file: File) => {
    setIsParsing(true);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });

      toast({
        title: "Parsing PDF",
        description: "Extracting text from your PDF...",
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            pdfBase64: base64,
            filename: file.name,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to parse PDF");
      }

      const result = await response.json();
      
      // Set the extracted text directly to processed content (skipping transcript step)
      setProcessedContent(result.text);
      setContentSource('pdf');
      
      toast({
        title: "Success",
        description: `PDF parsed successfully (${result.charCount.toLocaleString()} characters)`,
      });
    } catch (error) {
      console.error("Error parsing PDF:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to parse PDF",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
    }
  };

  // Handle PDF drop (supports multiple files for bulk import)
  const handlePdfDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsPdfDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(
      file => file.type === 'application/pdf' || file.name.endsWith('.pdf')
    );
    
    if (pdfFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF files",
        variant: "destructive",
      });
      return;
    }

    if (pdfFiles.length === 1) {
      // Single file - use original flow
      parsePdf(pdfFiles[0]);
    } else {
      // Multiple files - add to queue and sort naturally
      setPdfQueue(prev => [...prev, ...pdfFiles].sort(naturalSort));
      toast({
        title: "PDFs added to queue",
        description: `${pdfFiles.length} files added. Select phase and start processing.`,
      });
    }
  }, [toast]);

  const handlePdfDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsPdfDragOver(true);
  }, []);

  const handlePdfDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsPdfDragOver(false);
  }, []);

  // Handle PDF file input (supports multiple files)
  const handlePdfFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const pdfFiles = Array.from(files);
      if (pdfFiles.length === 1) {
        parsePdf(pdfFiles[0]);
      } else {
        setPdfQueue(prev => [...prev, ...pdfFiles].sort(naturalSort));
        toast({
          title: "PDFs added to queue",
          description: `${pdfFiles.length} files added. Select phase and start processing.`,
        });
      }
    }
  };

  // Clear the PDF queue
  const clearPdfQueue = () => {
    setPdfQueue([]);
    setDuplicates([]);
    setSkippedDuplicates([]);
    toast({
      title: "Queue cleared",
      description: "All PDFs removed from the queue",
    });
  };

  // Check for duplicates before batch processing
  const checkForDuplicates = async (): Promise<boolean> => {
    setBatchImportProgress({ current: 0, total: pdfQueue.length, currentFile: "", stage: "Checking for duplicates" });
    
    const foundDuplicates: { file: File; existingTitle: string }[] = [];
    
    // Fetch all existing teaching titles
    const { data: existingTeachings } = await supabase
      .from("teachings")
      .select("title");
    
    const existingTitles = (existingTeachings || []).map(t => t.title?.toLowerCase().trim());
    
    for (const file of pdfQueue) {
      // Check by filename (without extension) as a rough match
      const fileTitle = file.name.replace('.pdf', '').toLowerCase().trim();
      
      const matchingTitle = existingTitles.find(title => 
        title === fileTitle || 
        title?.includes(fileTitle) || 
        fileTitle.includes(title || '')
      );
      
      if (matchingTitle) {
        const original = existingTeachings?.find(t => t.title?.toLowerCase().trim() === matchingTitle);
        foundDuplicates.push({ file, existingTitle: original?.title || matchingTitle });
      }
    }
    
    if (foundDuplicates.length > 0) {
      setDuplicates(foundDuplicates);
      return true;
    }
    
    return false;
  };

  // Allow a duplicate to be imported anyway
  const allowDuplicate = (file: File) => {
    setDuplicates(prev => prev.filter(d => d.file !== file));
  };

  // Skip a duplicate (remove from queue)
  const skipDuplicate = (file: File) => {
    setSkippedDuplicates(prev => [...prev, file.name]);
    setPdfQueue(prev => prev.filter(f => f !== file));
    setDuplicates(prev => prev.filter(d => d.file !== file));
  };

  // Allow all duplicates
  const allowAllDuplicates = () => {
    setDuplicates([]);
  };

  // Skip all duplicates
  const skipAllDuplicates = () => {
    const dupFiles = duplicates.map(d => d.file);
    setSkippedDuplicates(prev => [...prev, ...dupFiles.map(f => f.name)]);
    setPdfQueue(prev => prev.filter(f => !dupFiles.includes(f)));
    setDuplicates([]);
  };

  // Clear resume state and start fresh
  const clearResumeState = () => {
    clearBatchState();
    setResumableState(null);
    setProcessedInSession([]);
    setFailedInSession([]);
  };

  // Process the PDF queue in batch (with resume support)
  const processPdfBatch = async (isResume = false) => {
    if (pdfQueue.length === 0 && !isResume) return;

    // Check for duplicates first (if not already checked and not resuming)
    if (!isResume && duplicates.length === 0) {
      const hasDuplicates = await checkForDuplicates();
      if (hasDuplicates) {
        toast({
          title: "Duplicates detected",
          description: "Review the potential duplicates below before continuing.",
        });
        return;
      }
    }

    setIsBatchImporting(true);
    
    // Determine which files to process
    let filesToProcess = pdfQueue;
    let alreadyProcessed: string[] = [];
    let alreadyFailed: string[] = [];
    let nextReadingOrder: number;

    if (isResume && resumableState) {
      // Filter out already processed files
      alreadyProcessed = resumableState.processedFiles;
      alreadyFailed = resumableState.failedFiles;
      filesToProcess = pdfQueue.filter(f => 
        !alreadyProcessed.includes(f.name) && !alreadyFailed.includes(f.name)
      );
      nextReadingOrder = resumableState.nextReadingOrder;
      setProcessedInSession(alreadyProcessed);
      setFailedInSession(alreadyFailed);
      
      toast({
        title: "Resuming import",
        description: `Skipping ${alreadyProcessed.length} already processed files`,
      });
    } else {
      // Get the current max reading_order to assign sequential values
      const { data: maxOrderData } = await supabase
        .from("teachings")
        .select("reading_order")
        .order("reading_order", { ascending: false, nullsFirst: false })
        .limit(1)
        .single();
      
      nextReadingOrder = (maxOrderData?.reading_order || 0) + 1;
      
      // Initialize batch state
      saveBatchState({
        processedFiles: [],
        failedFiles: [],
        phase: bulkPhase,
        startTime: Date.now(),
        nextReadingOrder,
      });
    }

    setBatchImportProgress({ 
      current: alreadyProcessed.length, 
      total: pdfQueue.length, 
      currentFile: "", 
      stage: "" 
    });

    let successCount = alreadyProcessed.length;
    let failCount = alreadyFailed.length;
    const processedFiles = [...alreadyProcessed];
    const failedFiles = [...alreadyFailed];

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      const overallIndex = alreadyProcessed.length + alreadyFailed.length + i + 1;
      
      setBatchImportProgress({ 
        current: overallIndex, 
        total: pdfQueue.length, 
        currentFile: file.name, 
        stage: "Parsing PDF" 
      });

      try {
        // Step 1: Parse PDF
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
        });

        const parseResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-pdf`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ pdfBase64: base64, filename: file.name }),
          }
        );

        if (!parseResponse.ok) throw new Error("Failed to parse PDF");
        const parseResult = await parseResponse.json();
        const content = parseResult.text;

        // Step 2: Generate metadata
        setBatchImportProgress(prev => ({ ...prev, stage: "Generating metadata" }));
        
        const indexResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-index`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ content, title: "" }),
          }
        );

        if (!indexResponse.ok) throw new Error("Failed to generate metadata");
        const metadata = await indexResponse.json();

        // Step 3: Generate cover
        setBatchImportProgress(prev => ({ ...prev, stage: "Generating cover" }));
        
        let coverImageUrl = "";
        try {
          const coverResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-illustration`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
        } catch (coverErr) {
          console.error("Cover generation failed for", file.name, coverErr);
        }

        // Step 4: Save to database
        setBatchImportProgress(prev => ({ ...prev, stage: "Saving" }));

        const { count } = await supabase
          .from("teachings")
          .select("*", { count: "exact", head: true });
        
        const documentId = `D-${String((count || 0) + 1).padStart(3, "0")}`;

        const { error: insertError } = await supabase.from("teachings").insert({
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
          phase: bulkPhase,
          cover_image: coverImageUrl || null,
          reading_order: nextReadingOrder,
        });

        if (insertError) throw insertError;

        nextReadingOrder++;
        successCount++;
        processedFiles.push(file.name);
        setProcessedInSession([...processedFiles]);
        
        // Save state after each successful file
        saveBatchState({
          processedFiles,
          failedFiles,
          phase: bulkPhase,
          startTime: resumableState?.startTime || Date.now(),
          nextReadingOrder,
        });
      } catch (err) {
        console.error(`Failed to process ${file.name}:`, err);
        failCount++;
        failedFiles.push(file.name);
        setFailedInSession([...failedFiles]);
        
        // Save state after each failed file too
        saveBatchState({
          processedFiles,
          failedFiles,
          phase: bulkPhase,
          startTime: resumableState?.startTime || Date.now(),
          nextReadingOrder,
        });
      }

      // Small delay between processing to avoid rate limiting
      if (i < filesToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    toast({
      title: "Batch import complete",
      description: `${successCount} teachings saved${failCount > 0 ? `, ${failCount} failed` : ""}`,
    });

    // Clear state on completion
    clearBatchState();
    setResumableState(null);
    setPdfQueue([]);
    setProcessedInSession([]);
    setFailedInSession([]);
    setIsBatchImporting(false);
    setBatchImportProgress({ current: 0, total: 0, currentFile: "", stage: "" });
  };

  const processTranscript = async () => {
    if (!transcript.trim()) {
      toast({
        title: "Error",
        description: "Please paste a transcript first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessedContent("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-transcript`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ transcript }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to process transcript");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.slice(6));
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                content += delta;
                setProcessedContent(content);
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      toast({
        title: "Success",
        description: "Transcript processed successfully",
      });
    } catch (error) {
      console.error("Error processing transcript:", error);
      toast({
        title: "Error",
        description: "Failed to process transcript. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateIndex = async () => {
    if (!processedContent.trim()) {
      toast({
        title: "Error",
        description: "Please process a transcript first",
        variant: "destructive",
      });
      return;
    }

    setIsIndexing(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-index`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ content: processedContent, title }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate index");
      }

      const metadata = await response.json();
      
      setTitle(metadata.suggested_title || "");
      setPrimaryTheme(metadata.primary_theme || "");
      setSecondaryThemes(metadata.secondary_themes || []);
      setScriptures(metadata.scriptures || []);
      setDoctrines(metadata.doctrines || []);
      setKeywords(metadata.keywords || []);
      setQuestionsAnswered(metadata.questions_answered || []);
      setQuickAnswer(metadata.quick_answer || "");

      toast({
        title: "Success",
        description: "Index generated successfully",
      });
    } catch (error) {
      console.error("Error generating index:", error);
      toast({
        title: "Error",
        description: "Failed to generate index. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsIndexing(false);
    }
  };

  const saveTeaching = async () => {
    if (!title || !primaryTheme || !processedContent) {
      toast({
        title: "Error",
        description: "Please fill in title, primary theme, and content",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Generate cover image first
      toast({
        title: "Generating cover...",
        description: "Creating AI illustration for the teaching",
      });
      
      let generatedCoverImage = coverImage;
      if (!generatedCoverImage) {
        try {
          generatedCoverImage = await generateCoverIllustration();
        } catch (coverError) {
          console.error("Cover generation failed:", coverError);
          toast({
            title: "Warning",
            description: "Cover image generation failed, saving without cover",
          });
        }
      }

      // Generate a document ID
      const { count } = await supabase
        .from("teachings")
        .select("*", { count: "exact", head: true });
      
      const documentId = `D-${String((count || 0) + 1).padStart(3, "0")}`;

      const { error } = await supabase.from("teachings").insert({
        document_id: documentId,
        title,
        primary_theme: primaryTheme,
        secondary_themes: secondaryThemes,
        scriptures,
        doctrines,
        keywords,
        questions_answered: questionsAnswered,
        quick_answer: quickAnswer,
        full_content: processedContent,
        phase,
        cover_image: generatedCoverImage || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Teaching saved with ID: ${documentId}`,
      });

      // Reset form
      setTranscript("");
      setProcessedContent("");
      setTitle("");
      setPrimaryTheme("");
      setSecondaryThemes([]);
      setScriptures([]);
      setDoctrines([]);
      setKeywords([]);
      setQuestionsAnswered([]);
      setQuickAnswer("");
      setPhase("foundations");
      setCoverImage("");
    } catch (error) {
      console.error("Error saving teaching:", error);
      toast({
        title: "Error",
        description: "Failed to save teaching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard",
    });
  };

  const generateCoverIllustration = async (): Promise<string> => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-illustration`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          title: title || "Untitled Teaching",
          theme: primaryTheme || "Biblical Studies",
          scriptures,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate illustration");
    }

    const data = await response.json();
    setCoverImage(data.imageUrl);
    return data.imageUrl;
  };

  const generateBatchCovers = async () => {
    setIsBatchGenerating(true);
    setBatchProgress({ current: 0, total: 0, currentTitle: "" });

    try {
      // Fetch all teachings without cover images
      const { data: teachings, error } = await supabase
        .from("teachings")
        .select("id, title, primary_theme, scriptures")
        .is("cover_image", null)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!teachings || teachings.length === 0) {
        toast({
          title: "All done!",
          description: "All teachings already have cover images",
        });
        setIsBatchGenerating(false);
        return;
      }

      setBatchProgress({ current: 0, total: teachings.length, currentTitle: "" });

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < teachings.length; i++) {
        const teaching = teachings[i];
        setBatchProgress({ 
          current: i + 1, 
          total: teachings.length, 
          currentTitle: teaching.title 
        });

        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-illustration`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({
                title: teaching.title,
                theme: teaching.primary_theme,
                scriptures: teaching.scriptures,
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Generation failed");
          }

          const data = await response.json();

          // Update the teaching with the new cover image
          const { error: updateError } = await supabase
            .from("teachings")
            .update({ cover_image: data.imageUrl })
            .eq("id", teaching.id);

          if (updateError) throw updateError;

          successCount++;
        } catch (err) {
          console.error(`Failed to generate cover for "${teaching.title}":`, err);
          failCount++;
        }
      }

      toast({
        title: "Batch generation complete",
        description: `Generated ${successCount} covers${failCount > 0 ? `, ${failCount} failed` : ""}`,
      });
    } catch (error) {
      console.error("Error in batch generation:", error);
      toast({
        title: "Error",
        description: "Failed to fetch teachings for batch generation",
        variant: "destructive",
      });
    } finally {
      setIsBatchGenerating(false);
      setBatchProgress({ current: 0, total: 0, currentTitle: "" });
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin - The Berean Press</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
            Teaching Processor
          </h1>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <ApiUsageCard />
            
            {/* Batch Cover Generation Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImagePlus className="h-5 w-5" />
                  Batch Cover Generation
                </CardTitle>
                <CardDescription>
                  Generate AI cover illustrations for all teachings without covers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isBatchGenerating ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Generating {batchProgress.current} of {batchProgress.total}
                      </span>
                    </div>
                    <Progress 
                      value={(batchProgress.current / batchProgress.total) * 100} 
                      className="w-full" 
                    />
                    <p className="text-xs text-muted-foreground truncate">
                      Current: {batchProgress.currentTitle}
                    </p>
                  </div>
                ) : (
                  <Button 
                    onClick={generateBatchCovers}
                    variant="outline"
                    className="w-full"
                  >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Generate Missing Covers
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Input Section */}
            <div className="space-y-6">
              {/* Resume Import Card (shown only if there's resumable state) */}
              {resumableState && !isBatchImporting && (
                <Card className="border-amber-500/50 bg-amber-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-600">
                      <FileUp className="h-5 w-5" />
                      Resume Interrupted Import
                    </CardTitle>
                    <CardDescription>
                      A previous import was interrupted. {resumableState.processedFiles.length} files were successfully processed.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <p>Phase: <span className="font-medium capitalize">{resumableState.phase.replace('-', ' ')}</span></p>
                      <p>Processed: <span className="font-medium">{resumableState.processedFiles.length}</span> files</p>
                      {resumableState.failedFiles.length > 0 && (
                        <p>Failed: <span className="font-medium text-destructive">{resumableState.failedFiles.length}</span> files</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          setBulkPhase(resumableState.phase);
                          processPdfBatch(true);
                        }} 
                        className="flex-1"
                        disabled={pdfQueue.length === 0}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Resume Import
                      </Button>
                      <Button variant="outline" onClick={clearResumeState}>
                        Clear & Start Fresh
                      </Button>
                    </div>
                    {pdfQueue.length === 0 && (
                      <p className="text-xs text-amber-600">
                        Re-upload your PDF files to resume from where you left off
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Bulk PDF Import Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileUp className="h-5 w-5" />
                    Bulk PDF Import
                  </CardTitle>
                  <CardDescription>
                    Upload multiple PDFs at once — they'll be processed one at a time automatically
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isBatchImporting ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            Processing {batchImportProgress.current} of {batchImportProgress.total}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {processedInSession.length > 0 && (
                            <span className="text-green-600">✓ {processedInSession.length}</span>
                          )}
                          {failedInSession.length > 0 && (
                            <span className="text-destructive">✗ {failedInSession.length}</span>
                          )}
                        </div>
                      </div>
                      <Progress 
                        value={(batchImportProgress.current / batchImportProgress.total) * 100} 
                        className="w-full" 
                      />
                      <p className="text-xs text-muted-foreground truncate">
                        {batchImportProgress.currentFile}
                      </p>
                      <p className="text-xs text-primary font-medium">
                        {batchImportProgress.stage}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Progress is saved automatically. You can safely close this page and resume later.
                      </p>
                    </div>
                  ) : pdfQueue.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-muted rounded-lg p-4">
                        <p className="text-sm font-medium mb-2">
                          {pdfQueue.length} PDF{pdfQueue.length > 1 ? 's' : ''} queued
                          {resumableState && (
                            <span className="text-green-600 ml-2">
                              ({resumableState.processedFiles.length} already processed)
                            </span>
                          )}
                        </p>
                        <ul className="text-xs text-muted-foreground max-h-32 overflow-y-auto space-y-1">
                          {pdfQueue.map((file, idx) => {
                            const isAlreadyProcessed = resumableState?.processedFiles.includes(file.name);
                            const hasFailed = resumableState?.failedFiles.includes(file.name);
                            return (
                              <li 
                                key={idx} 
                                className={`truncate flex items-center gap-1 ${
                                  isAlreadyProcessed ? 'text-green-600' : hasFailed ? 'text-destructive' : ''
                                }`}
                              >
                                {isAlreadyProcessed ? '✓' : hasFailed ? '✗' : '•'} 
                                <span className="flex-1 truncate">{file.name}</span>
                                {isAlreadyProcessed && <span className="text-xs">(done)</span>}
                                {hasFailed && <span className="text-xs">(failed)</span>}
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      {/* Duplicate detection warnings */}
                      {duplicates.length > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                              {duplicates.length} potential duplicate{duplicates.length > 1 ? 's' : ''} found
                            </p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={allowAllDuplicates} className="text-xs h-7">
                                Allow All
                              </Button>
                              <Button size="sm" variant="ghost" onClick={skipAllDuplicates} className="text-xs h-7">
                                Skip All
                              </Button>
                            </div>
                          </div>
                          <ul className="space-y-2 max-h-40 overflow-y-auto">
                            {duplicates.map((dup, idx) => (
                              <li key={idx} className="bg-background/50 rounded p-2 flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{dup.file.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    Matches: "{dup.existingTitle}"
                                  </p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => allowDuplicate(dup.file)}
                                    className="text-xs h-7 px-2"
                                  >
                                    Allow
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => skipDuplicate(dup.file)}
                                    className="text-xs h-7 px-2"
                                  >
                                    Skip
                                  </Button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {skippedDuplicates.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {skippedDuplicates.length} file{skippedDuplicates.length > 1 ? 's' : ''} skipped as duplicates
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phase for all teachings:</label>
                        <Select value={bulkPhase} onValueChange={setBulkPhase}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="foundations">Foundations</SelectItem>
                            <SelectItem value="essentials">Essentials</SelectItem>
                            <SelectItem value="building-blocks">Building Blocks</SelectItem>
                            <SelectItem value="moving-on">Moving On</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => processPdfBatch(false)} className="flex-1" disabled={duplicates.length > 0}>
                          <FileText className="h-4 w-4 mr-2" />
                          {duplicates.length > 0 ? 'Resolve duplicates first' : 'Start Processing'}
                        </Button>
                        <Button variant="outline" onClick={clearPdfQueue}>
                          Clear
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDrop={handlePdfDrop}
                      onDragOver={handlePdfDragOver}
                      onDragLeave={handlePdfDragLeave}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isPdfDragOver
                          ? "border-primary bg-primary/5"
                          : isParsing
                            ? "border-primary"
                            : "border-border hover:border-primary/50"
                      }`}
                    >
                      {isParsing ? (
                        <div className="space-y-4">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                          <p className="text-sm text-muted-foreground">Parsing PDF...</p>
                        </div>
                      ) : (
                        <>
                          <FileUp className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Drag and drop PDF files here
                          </p>
                          <p className="text-xs text-muted-foreground mb-4">
                            Single file → review flow | Multiple files → batch import
                          </p>
                          <label>
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              multiple
                              onChange={handlePdfFileInput}
                              className="hidden"
                            />
                            <Button variant="outline" size="sm" asChild>
                              <span>Or click to browse</span>
                            </Button>
                          </label>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Audio Upload Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    Upload Audio (Optional)
                  </CardTitle>
                  <CardDescription>
                    Drag and drop an audio file to transcribe it automatically
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {isTranscribing ? (
                      <div className="space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="text-sm text-muted-foreground">Transcribing audio...</p>
                        <Progress value={transcriptionProgress} className="w-full max-w-xs mx-auto" />
                        <p className="text-xs text-muted-foreground">{Math.round(transcriptionProgress)}%</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Drag and drop an audio file here
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Supports MP3, WAV, M4A, MP4, WebM, OGG
                        </p>
                        <label>
                          <input
                            type="file"
                            accept="audio/*,.mp3,.wav,.m4a,.mp4,.webm,.ogg"
                            onChange={handleFileInput}
                            className="hidden"
                          />
                          <Button variant="outline" size="sm" asChild>
                            <span>Or click to browse</span>
                          </Button>
                        </label>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Transcript Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Step 1: Paste Transcript
                  </CardTitle>
                  <CardDescription>
                    Paste your raw transcript from Zoom or Otter here, or use the audio upload above
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Paste your transcript here or upload an audio file above..."
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="min-h-[250px] font-mono text-sm"
                  />
                  <Button
                    onClick={processTranscript}
                    disabled={isProcessing || !transcript.trim()}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Process Transcript"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Output Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Step 2: Review & Edit
                      {contentSource && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          contentSource === 'pdf' 
                            ? 'bg-primary/10 text-primary' 
                            : contentSource === 'audio'
                            ? 'bg-secondary text-secondary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {contentSource === 'pdf' ? 'From PDF' : contentSource === 'audio' ? 'From Audio' : 'Manual'}
                        </span>
                      )}
                    </span>
                    {processedContent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(processedContent)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {contentSource === 'pdf' 
                      ? "Review the imported PDF content and generate metadata"
                      : "Review the AI-processed content and make any corrections"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Processed content will appear here..."
                    value={processedContent}
                    onChange={(e) => setProcessedContent(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={generateIndex}
                      disabled={isIndexing || !processedContent.trim()}
                      variant="secondary"
                      className="flex-1"
                    >
                      {isIndexing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Index...
                        </>
                      ) : (
                        <>
                          <Database className="mr-2 h-4 w-4" />
                          Generate Index
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowBookPreview(true)}
                      disabled={!processedContent.trim()}
                      variant="outline"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Preview as Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Metadata Section */}
          {(title || primaryTheme || questionsAnswered.length > 0) && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Step 3: Review Metadata & Save
                </CardTitle>
                <CardDescription>
                  Review the extracted metadata and save to the database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Teaching title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Primary Theme</label>
                    <Input
                      value={primaryTheme}
                      onChange={(e) => setPrimaryTheme(e.target.value)}
                      placeholder="Main theme"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Quick Answer</label>
                  <Textarea
                    value={quickAnswer}
                    onChange={(e) => setQuickAnswer(e.target.value)}
                    placeholder="2-3 sentence summary..."
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Questions Answered ({questionsAnswered.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {questionsAnswered.map((q, i) => (
                      <span key={i} className="bg-accent/10 text-accent-foreground px-3 py-1 rounded-full text-sm">
                        {q}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Secondary Themes ({secondaryThemes.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {secondaryThemes.map((t, i) => (
                      <span key={i} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Scriptures ({scriptures.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {scriptures.map((s, i) => (
                      <span key={i} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Keywords ({keywords.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((k, i) => (
                      <span key={i} className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Phase Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Learning Phase</label>
                  <Select value={phase} onValueChange={setPhase}>
                    <SelectTrigger className="w-full md:w-[300px]">
                      <SelectValue placeholder="Select a phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="foundations">1. Foundations – Basics of Biblical Interpretation</SelectItem>
                      <SelectItem value="essentials">2. Essentials – Covenant Basics</SelectItem>
                      <SelectItem value="building-blocks">3. Building Blocks – Mosaic to New Covenant</SelectItem>
                      <SelectItem value="moving-on">4. Moving On – Life in the New Covenant</SelectItem>
                      <SelectItem value="advanced">5. Advanced – Doctrinal Deep Dives</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose the thematic phase for this teaching based on its content
                  </p>
                </div>

                <Button
                  onClick={saveTeaching}
                  disabled={isSaving || !title || !primaryTheme}
                  className="w-full"
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save Teaching to Database
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </main>

        <Footer />
      </div>

      {/* Book Preview Modal */}
      {showBookPreview && (
        <BookPreview
          title={title || "Untitled Teaching"}
          primaryTheme={primaryTheme || "Biblical Studies"}
          content={processedContent}
          scriptures={scriptures}
          questionsAnswered={questionsAnswered}
          quickAnswer={quickAnswer || "This teaching explores key biblical concepts through contextual study."}
          onClose={() => setShowBookPreview(false)}
          coverImage={coverImage}
          onGenerateCover={generateCoverIllustration}
        />
      )}
    </>
  );
};

export default Admin;
