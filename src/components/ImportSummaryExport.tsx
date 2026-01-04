import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, FileText, Check, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportedFile {
  filename: string;
  status: "success" | "failed" | "skipped";
  teachingId?: string | null;
  error?: string;
  stage?: string;
}

interface ImportSummaryExportProps {
  files: ImportedFile[];
  batchId?: string;
  onDismiss: () => void;
}

const ImportSummaryExport = ({ files, batchId, onDismiss }: ImportSummaryExportProps) => {
  const { toast } = useToast();

  const successCount = files.filter(f => f.status === "success").length;
  const failedCount = files.filter(f => f.status === "failed").length;
  const skippedCount = files.filter(f => f.status === "skipped").length;

  const downloadJson = () => {
    const data = {
      batchId,
      timestamp: new Date().toISOString(),
      summary: {
        total: files.length,
        success: successCount,
        failed: failedCount,
        skipped: skippedCount,
      },
      files: files.map(f => ({
        filename: f.filename,
        status: f.status,
        teachingId: f.teachingId || null,
        error: f.error || null,
        stage: f.stage || null,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-summary-${batchId || "batch"}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Import summary saved as JSON",
    });
  };

  const downloadCsv = () => {
    const csv = [
      ["Filename", "Status", "Teaching ID", "Error", "Stage"],
      ...files.map(f => [
        f.filename,
        f.status,
        f.teachingId || "",
        f.error || "",
        f.stage || "",
      ]),
    ]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-summary-${batchId || "batch"}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Import summary saved as CSV",
    });
  };

  const copyFailedFilenames = () => {
    const failedFilenames = files
      .filter(f => f.status === "failed")
      .map(f => f.filename)
      .join("\n");
    
    navigator.clipboard.writeText(failedFilenames);
    toast({
      title: "Copied",
      description: `${failedCount} failed filenames copied`,
    });
  };

  const copySuccessIds = () => {
    const successIds = files
      .filter(f => f.status === "success" && f.teachingId)
      .map(f => f.teachingId)
      .join("\n");
    
    navigator.clipboard.writeText(successIds);
    toast({
      title: "Copied",
      description: `${successCount} teaching IDs copied`,
    });
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Import Summary
        </CardTitle>
        <CardDescription>
          {files.length} files processed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <p className="text-2xl font-bold text-green-600">{successCount}</p>
            <p className="text-xs text-muted-foreground">Success</p>
          </div>
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <p className="text-2xl font-bold text-destructive">{failedCount}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
          <div className="bg-muted border border-border rounded-lg p-3">
            <p className="text-2xl font-bold text-muted-foreground">{skippedCount}</p>
            <p className="text-xs text-muted-foreground">Skipped</p>
          </div>
        </div>

        {/* File list */}
        <ScrollArea className="h-[200px] border rounded-lg">
          <div className="p-2 space-y-1">
            {files.map((file, idx) => (
              <div
                key={idx}
                className={`text-xs p-2 rounded flex items-start gap-2 ${
                  file.status === "success"
                    ? "bg-green-500/5"
                    : file.status === "failed"
                    ? "bg-destructive/5"
                    : "bg-muted/50"
                }`}
              >
                {file.status === "success" ? (
                  <Check className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                ) : file.status === "failed" ? (
                  <X className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{file.filename}</p>
                  {file.error && (
                    <p className="text-destructive truncate">{file.error}</p>
                  )}
                  {file.teachingId && (
                    <p className="text-muted-foreground font-mono">{file.teachingId}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Export actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadJson}>
            <Download className="h-4 w-4 mr-1" />
            JSON
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCsv}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          {failedCount > 0 && (
            <Button variant="outline" size="sm" onClick={copyFailedFilenames}>
              <Copy className="h-4 w-4 mr-1" />
              Copy Failed
            </Button>
          )}
          {successCount > 0 && (
            <Button variant="outline" size="sm" onClick={copySuccessIds}>
              <Copy className="h-4 w-4 mr-1" />
              Copy IDs
            </Button>
          )}
        </div>

        <Button variant="ghost" onClick={onDismiss} className="w-full">
          Dismiss
        </Button>
      </CardContent>
    </Card>
  );
};

export default ImportSummaryExport;
