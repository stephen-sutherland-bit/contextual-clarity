import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link, Check, X, Download, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UnmatchedTeaching {
  id: string;
  title: string;
  source_filename: string | null;
  suggested_filename?: string;
  confidence?: "high" | "medium" | "low";
}

interface TeachingMatcherProps {
  onMatchComplete?: () => void;
}

// Normalize strings for fuzzy matching
const normalize = (s: string): string =>
  s
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Calculate similarity score between two strings
const similarity = (a: string, b: string): number => {
  const normA = normalize(a);
  const normB = normalize(b);
  
  // Exact match
  if (normA === normB) return 1;
  
  // One contains the other
  if (normA.includes(normB) || normB.includes(normA)) return 0.8;
  
  // Word overlap
  const wordsA = new Set(normA.split(" "));
  const wordsB = new Set(normB.split(" "));
  const intersection = [...wordsA].filter(w => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);
  
  if (union.size === 0) return 0;
  return intersection.length / union.size;
};

const TeachingMatcher = ({ onMatchComplete }: TeachingMatcherProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [teachings, setTeachings] = useState<UnmatchedTeaching[]>([]);
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Load teachings without source_filename
  useEffect(() => {
    const loadTeachings = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("teachings")
          .select("id, title, source_filename")
          .is("source_filename", null)
          .order("title", { ascending: true });

        if (error) throw error;
        setTeachings(data || []);
      } catch (err) {
        console.error("Error loading teachings:", err);
        toast({
          title: "Error",
          description: "Failed to load teachings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTeachings();
  }, [toast]);

  // Filter teachings by search query
  const filteredTeachings = useMemo(() => {
    if (!searchQuery.trim()) return teachings;
    const query = searchQuery.toLowerCase();
    return teachings.filter(t => 
      t.title.toLowerCase().includes(query) ||
      manualInputs[t.id]?.toLowerCase().includes(query)
    );
  }, [teachings, searchQuery, manualInputs]);

  // Auto-suggest filenames based on title
  const suggestFilename = (title: string): { filename: string; confidence: "high" | "medium" | "low" } => {
    // Simple suggestion: title + .pdf
    const suggested = title.replace(/[^a-zA-Z0-9\s-]/g, "").trim() + ".pdf";
    return { filename: suggested, confidence: "low" };
  };

  // Match a single teaching
  const matchTeaching = async (teachingId: string, filename: string) => {
    if (!filename.trim()) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("teachings")
        .update({ 
          source_filename: filename.endsWith(".pdf") ? filename : filename + ".pdf" 
        })
        .eq("id", teachingId);

      if (error) throw error;

      setTeachings(prev => prev.filter(t => t.id !== teachingId));
      setManualInputs(prev => {
        const next = { ...prev };
        delete next[teachingId];
        return next;
      });

      toast({
        title: "Matched",
        description: "Teaching linked to source filename",
      });
    } catch (err) {
      console.error("Error matching teaching:", err);
      toast({
        title: "Error",
        description: "Failed to save match",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Bulk match all with manual inputs
  const matchAll = async () => {
    const toMatch = Object.entries(manualInputs).filter(([id, filename]) => filename.trim());
    if (toMatch.length === 0) {
      toast({
        title: "No matches",
        description: "Enter filenames for teachings you want to match",
      });
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    let failCount = 0;

    for (const [teachingId, filename] of toMatch) {
      try {
        const { error } = await supabase
          .from("teachings")
          .update({ 
            source_filename: filename.endsWith(".pdf") ? filename : filename + ".pdf" 
          })
          .eq("id", teachingId);

        if (error) throw error;
        successCount++;
      } catch {
        failCount++;
      }
    }

    // Reload teachings
    const { data } = await supabase
      .from("teachings")
      .select("id, title, source_filename")
      .is("source_filename", null)
      .order("title", { ascending: true });

    setTeachings(data || []);
    setManualInputs({});
    
    toast({
      title: "Bulk match complete",
      description: `${successCount} matched${failCount > 0 ? `, ${failCount} failed` : ""}`,
    });

    setIsSaving(false);
    onMatchComplete?.();
  };

  // Export unmatched titles
  const exportTitles = () => {
    const titles = teachings.map(t => t.title).join("\n");
    navigator.clipboard.writeText(titles);
    toast({
      title: "Copied",
      description: `${teachings.length} titles copied to clipboard`,
    });
  };

  // Download as CSV
  const downloadCsv = () => {
    const csv = [
      ["Teaching Title", "Suggested Filename"],
      ...teachings.map(t => [t.title, manualInputs[t.id] || ""]),
    ]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "unmatched-teachings.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (teachings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Match Teachings to PDFs
          </CardTitle>
          <CardDescription>
            All teachings have source filenames assigned
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
              <Check className="h-4 w-4" />
              All {teachings.length} teachings are matched
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Match Teachings to PDFs
        </CardTitle>
        <CardDescription>
          {teachings.length} teachings without source filenames. Link them to enable resume detection.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachings..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportTitles}>
              Copy Titles
            </Button>
            <Button variant="outline" size="sm" onClick={downloadCsv}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>

        {/* Teaching list */}
        <ScrollArea className="h-[400px] border rounded-lg">
          <div className="p-2 space-y-2">
            {filteredTeachings.map(teaching => (
              <div
                key={teaching.id}
                className="flex items-center gap-2 p-2 bg-muted/30 rounded"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{teaching.title}</p>
                </div>
                <Input
                  placeholder="filename.pdf"
                  value={manualInputs[teaching.id] || ""}
                  onChange={e => setManualInputs(prev => ({ 
                    ...prev, 
                    [teaching.id]: e.target.value 
                  }))}
                  className="w-48 text-xs h-8"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => matchTeaching(teaching.id, manualInputs[teaching.id] || "")}
                  disabled={!manualInputs[teaching.id]?.trim() || isSaving}
                  className="h-8 w-8 p-0"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setManualInputs(prev => {
                    const next = { ...prev };
                    delete next[teaching.id];
                    return next;
                  })}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Bulk match button */}
        {Object.values(manualInputs).filter(v => v.trim()).length > 0 && (
          <Button onClick={matchAll} disabled={isSaving} className="w-full">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Match All ({Object.values(manualInputs).filter(v => v.trim()).length})
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TeachingMatcher;
