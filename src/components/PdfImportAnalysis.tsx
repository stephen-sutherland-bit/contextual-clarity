import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle, FileQuestion, FileUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

interface PdfFile {
  name: string;
}

interface PdfImportAnalysisProps {
  pdfQueue: File[];
  dbImportedFilenames: string[];
  onProcessOnlyNew: (files: File[]) => void;
  onProcessAll: (files: File[]) => void;
  onClearQueue: () => void;
}

// Normalize for fuzzy matching
const normalize = (s: string): string =>
  s
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Calculate word overlap similarity
const wordSimilarity = (a: string, b: string): number => {
  const normA = normalize(a);
  const normB = normalize(b);
  
  if (normA === normB) return 1;
  if (normA.includes(normB) || normB.includes(normA)) return 0.85;
  
  const wordsA = new Set(normA.split(" ").filter(w => w.length > 2));
  const wordsB = new Set(normB.split(" ").filter(w => w.length > 2));
  
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  
  const intersection = [...wordsA].filter(w => wordsB.has(w));
  return intersection.length / Math.min(wordsA.size, wordsB.size);
};

interface AnalyzedFile {
  file: File;
  status: "imported" | "possibly_imported" | "new";
  matchedFilename?: string;
  confidence?: number;
}

const PdfImportAnalysis = ({
  pdfQueue,
  dbImportedFilenames,
  onProcessOnlyNew,
  onProcessAll,
  onClearQueue,
}: PdfImportAnalysisProps) => {
  // Analyze each file
  const analyzedFiles = useMemo<AnalyzedFile[]>(() => {
    return pdfQueue.map(file => {
      // Exact match by filename
      if (dbImportedFilenames.includes(file.name)) {
        return { file, status: "imported" as const, matchedFilename: file.name, confidence: 1 };
      }

      // Fuzzy match
      let bestMatch: { filename: string; score: number } | null = null;
      for (const existingFilename of dbImportedFilenames) {
        const score = wordSimilarity(file.name, existingFilename);
        if (score > 0.6 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { filename: existingFilename, score };
        }
      }

      if (bestMatch && bestMatch.score >= 0.8) {
        return { 
          file, 
          status: "imported" as const, 
          matchedFilename: bestMatch.filename, 
          confidence: bestMatch.score 
        };
      }

      if (bestMatch) {
        return { 
          file, 
          status: "possibly_imported" as const, 
          matchedFilename: bestMatch.filename, 
          confidence: bestMatch.score 
        };
      }

      return { file, status: "new" as const };
    });
  }, [pdfQueue, dbImportedFilenames]);

  const importedCount = analyzedFiles.filter(f => f.status === "imported").length;
  const possiblyImportedCount = analyzedFiles.filter(f => f.status === "possibly_imported").length;
  const newCount = analyzedFiles.filter(f => f.status === "new").length;

  const newFiles = analyzedFiles.filter(f => f.status === "new").map(f => f.file);
  const possiblyNewFiles = analyzedFiles.filter(f => f.status === "possibly_imported").map(f => f.file);

  if (pdfQueue.length === 0) {
    return null;
  }

  return (
    <Card className="border-blue-500/30 bg-blue-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
          <FileQuestion className="h-5 w-5" />
          Import Analysis
        </CardTitle>
        <CardDescription>
          Breakdown of {pdfQueue.length} PDFs in queue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <p className="text-2xl font-bold text-green-600">{importedCount}</p>
            <p className="text-xs text-muted-foreground">Already Imported</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-2xl font-bold text-amber-600">{possiblyImportedCount}</p>
            <p className="text-xs text-muted-foreground">Maybe Imported</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-2xl font-bold text-blue-600">{newCount}</p>
            <p className="text-xs text-muted-foreground">New</p>
          </div>
        </div>

        {/* File list grouped by status */}
        <ScrollArea className="h-[300px] border rounded-lg">
          <div className="p-2 space-y-4">
            {/* Already imported */}
            {importedCount > 0 && (
              <div>
                <p className="text-xs font-medium text-green-600 mb-2 px-2 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Already imported ({importedCount})
                </p>
                <div className="space-y-1">
                  {analyzedFiles
                    .filter(f => f.status === "imported")
                    .map(f => (
                      <div
                        key={f.file.name}
                        className="text-xs p-2 bg-green-500/5 rounded flex items-center gap-2"
                      >
                        <Check className="h-3 w-3 text-green-600 shrink-0" />
                        <span className="truncate flex-1 text-muted-foreground">{f.file.name}</span>
                        {f.matchedFilename !== f.file.name && (
                          <span className="text-xs text-green-600 shrink-0">
                            ~{Math.round((f.confidence || 0) * 100)}%
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Possibly imported */}
            {possiblyImportedCount > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-600 mb-2 px-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Possibly imported ({possiblyImportedCount})
                </p>
                <div className="space-y-1">
                  {analyzedFiles
                    .filter(f => f.status === "possibly_imported")
                    .map(f => (
                      <div
                        key={f.file.name}
                        className="text-xs p-2 bg-amber-500/5 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-3 w-3 text-amber-600 shrink-0" />
                          <span className="truncate flex-1">{f.file.name}</span>
                          <span className="text-xs text-amber-600 shrink-0">
                            ~{Math.round((f.confidence || 0) * 100)}%
                          </span>
                        </div>
                        {f.matchedFilename && (
                          <p className="text-muted-foreground ml-5 truncate">
                            → {f.matchedFilename}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* New files */}
            {newCount > 0 && (
              <div>
                <p className="text-xs font-medium text-blue-600 mb-2 px-2 flex items-center gap-1">
                  <FileUp className="h-3 w-3" /> New ({newCount})
                </p>
                <div className="space-y-1">
                  {analyzedFiles
                    .filter(f => f.status === "new")
                    .map(f => (
                      <div
                        key={f.file.name}
                        className="text-xs p-2 bg-blue-500/5 rounded flex items-center gap-2"
                      >
                        <FileUp className="h-3 w-3 text-blue-600 shrink-0" />
                        <span className="truncate flex-1">{f.file.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {newCount > 0 && (
            <Button 
              onClick={() => onProcessOnlyNew(newFiles)}
              className="w-full"
            >
              <FileUp className="h-4 w-4 mr-2" />
              Process {newCount} New File{newCount !== 1 ? "s" : ""} Only
            </Button>
          )}
          {possiblyImportedCount > 0 && newCount > 0 && (
            <Button 
              onClick={() => onProcessOnlyNew([...newFiles, ...possiblyNewFiles])}
              variant="outline"
              className="w-full"
            >
              Process New + Maybe Imported ({newCount + possiblyImportedCount})
            </Button>
          )}
          {importedCount > 0 && (
            <Button 
              onClick={() => onProcessAll(pdfQueue)}
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              Re-import All ({pdfQueue.length}) — overwrites existing
            </Button>
          )}
          <Button variant="ghost" onClick={onClearQueue} className="w-full">
            Clear Queue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PdfImportAnalysis;
