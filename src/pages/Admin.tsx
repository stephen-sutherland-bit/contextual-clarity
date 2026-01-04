import { useState, useCallback, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileUp, Check, AlertCircle, RefreshCw, Download, Copy, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
  
  // Core wizard state
  const [step, setStep] = useState<"upload" | "importing" | "results">("upload");
  
  // PDF queue
  const [pdfQueue, setPdfQueue] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Import progress
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentFile: "", stage: "" });
  
  // Results
  const [results, setResults] = useState<ImportResult[]>([]);
  const [batchId, setBatchId] = useState<string>("");
  
  // Already imported files (for auto-skip)
  const [alreadyImported, setAlreadyImported] = useState<Set<string>>(new Set());
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  // Check which files are already in the database
  const checkAlreadyImported = useCallback(async (filenames: string[]) => {
    if (filenames.length === 0) return;
    setIsCheckingDb(true);
    
    try {
      const { data } = await supabase
        .from("teachings")
        .select("source_filename")
        .not("source_filename", "is", null);
      
      const imported = new Set((data || []).map(t => t.source_filename as string));
      setAlreadyImported(imported);
    } catch (err) {
      console.error("Error checking DB:", err);
    } finally {
      setIsCheckingDb(false);
    }
  }, []);

  // When PDF queue changes, check which are already imported
  useEffect(() => {
    if (pdfQueue.length > 0) {
      checkAlreadyImported(pdfQueue.map(f => f.name));
    } else {
      setAlreadyImported(new Set());
    }
  }, [pdfQueue, checkAlreadyImported]);

  // Handle file drop
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
    setStep("upload");
  };

  // Helper to extract error message
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

  // Start the import process
  const startImport = async (skipAlreadyImported = true) => {
    if (pdfQueue.length === 0) return;
    
    setStep("importing");
    setIsImporting(true);
    setResults([]);
    
    const newBatchId = crypto.randomUUID();
    setBatchId(newBatchId);
    
    // Create import run record
    await supabase.from("import_runs").insert({
      id: newBatchId,
      total_files: pdfQueue.length,
      status: "running",
    });
    
    // Insert all files as queued
    await supabase.from("import_run_files").insert(
      pdfQueue.map(f => ({ run_id: newBatchId, filename: f.name, status: "queued" }))
    );
    
    // Get current max reading_order
    const { data: maxOrderData } = await supabase
      .from("teachings")
      .select("reading_order")
      .order("reading_order", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    
    let nextReadingOrder = (maxOrderData?.reading_order || 0) + 1;
    
    const importResults: ImportResult[] = [];
    
    for (let i = 0; i < pdfQueue.length; i++) {
      const file = pdfQueue[i];
      
      // Skip if already imported
      if (skipAlreadyImported && alreadyImported.has(file.name)) {
        importResults.push({ filename: file.name, status: "skipped" });
        setResults([...importResults]);
        continue;
      }
      
      setProgress({ current: i + 1, total: pdfQueue.length, currentFile: file.name, stage: "Parsing" });
      
      // Update file status
      await supabase.from("import_run_files")
        .update({ status: "processing", stage: "parsing", started_at: new Date().toISOString() })
        .eq("run_id", newBatchId)
        .eq("filename", file.name);
      
      try {
        // Step 1: Convert to base64 and parse PDF
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
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
        
        if (!parseResponse.ok) {
          throw new Error(await extractErrorMessage(parseResponse, "Parsing"));
        }
        const { text: content } = await parseResponse.json();
        
        // Step 2: Generate metadata
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
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ content, title: "" }),
          }
        );
        
        if (!indexResponse.ok) {
          throw new Error(await extractErrorMessage(indexResponse, "Metadata"));
        }
        const metadata = await indexResponse.json();
        
        // Step 3: Generate cover (non-fatal if fails)
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
        } catch {
          // Cover failure is non-fatal
        }
        
        // Step 4: Save to database
        setProgress(prev => ({ ...prev, stage: "Saving" }));
        await supabase.from("import_run_files")
          .update({ stage: "saving" })
          .eq("run_id", newBatchId)
          .eq("filename", file.name);
        
        const { count } = await supabase
          .from("teachings")
          .select("*", { count: "exact", head: true });
        
        const documentId = `D-${String((count || 0) + 1).padStart(3, "0")}`;
        
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
        
        // Success
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
      
      // Small delay between files
      if (i < pdfQueue.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Update import run status
    const failCount = importResults.filter(r => r.status === "failed").length;
    await supabase.from("import_runs")
      .update({ status: failCount > 0 ? "completed_with_errors" : "completed" })
      .eq("id", newBatchId);
    
    setIsImporting(false);
    setStep("results");
    
    const successCount = importResults.filter(r => r.status === "success").length;
    const skippedCount = importResults.filter(r => r.status === "skipped").length;
    
    toast({
      title: "Import complete",
      description: `${successCount} imported, ${failCount} failed${skippedCount > 0 ? `, ${skippedCount} skipped` : ""}`,
    });
  };

  // Retry only failed files
  const retryFailed = () => {
    const failedFilenames = results.filter(r => r.status === "failed").map(r => r.filename);
    const failedFiles = pdfQueue.filter(f => failedFilenames.includes(f.name));
    
    if (failedFiles.length === 0) {
      toast({ title: "No failed files to retry", variant: "destructive" });
      return;
    }
    
    setPdfQueue(failedFiles);
    setResults([]);
    setStep("upload");
    
    toast({ title: "Ready to retry", description: `${failedFiles.length} failed file(s) ready to reimport` });
  };

  // Download results as JSON
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

  // Copy failed filenames
  const copyFailedFilenames = () => {
    const failed = results.filter(r => r.status === "failed").map(r => r.filename);
    navigator.clipboard.writeText(failed.join("\n"));
    toast({ title: "Copied", description: `${failed.length} failed filename(s) copied` });
  };

  // Computed values
  const newFilesCount = pdfQueue.filter(f => !alreadyImported.has(f.name)).length;
  const alreadyImportedCount = pdfQueue.filter(f => alreadyImported.has(f.name)).length;
  const successCount = results.filter(r => r.status === "success").length;
  const failedCount = results.filter(r => r.status === "failed").length;
  const skippedCount = results.filter(r => r.status === "skipped").length;

  return (
    <>
      <Helmet>
        <title>Import Teachings - The Berean Press</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2 text-center">
            Import Teachings
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Upload PDFs → We'll do the rest
          </p>

          {/* Step 1: Upload */}
          {step === "upload" && (
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
                {/* Drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <FileUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Drop PDF files here, or click to browse
                  </p>
                  <label>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      multiple
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <Button variant="outline" asChild>
                      <span>Choose Files</span>
                    </Button>
                  </label>
                </div>

                {/* Queue info */}
                {pdfQueue.length > 0 && (
                  <div className="space-y-4">
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
                      
                      {/* File list */}
                      <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
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
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => startImport(true)} 
                        className="flex-1"
                        disabled={newFilesCount === 0 && alreadyImportedCount > 0}
                      >
                        {newFilesCount === 0 ? 'All Already Imported' : `Import ${newFilesCount} New`}
                      </Button>
                      {alreadyImportedCount > 0 && (
                        <Button 
                          variant="outline" 
                          onClick={() => startImport(false)}
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

          {/* Step 2: Importing */}
          {step === "importing" && (
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
                
                <p className="text-xs text-muted-foreground">
                  Progress is saved. You can safely close this page and check results later.
                </p>
                
                {/* Live results */}
                {results.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1 pt-4 border-t">
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
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Results */}
          {step === "results" && (
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
                {/* Results list */}
                <div className="max-h-60 overflow-y-auto space-y-2">
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

                {/* Actions */}
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
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Admin;
