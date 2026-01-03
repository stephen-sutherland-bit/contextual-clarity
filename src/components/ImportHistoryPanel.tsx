import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { History, ExternalLink, FileText, Mic, Edit3, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface ImportedTeaching {
  id: string;
  title: string;
  source_filename: string | null;
  imported_via: string | null;
  created_at: string;
  phase: string;
}

interface ImportHistoryPanelProps {
  limit?: number;
}

const phaseLabels: Record<string, string> = {
  foundations: "Foundations",
  essentials: "Essentials",
  "building-blocks": "Building Blocks",
  "moving-on": "Moving On",
  advanced: "Advanced",
};

const ImportHistoryPanel = ({ limit = 10 }: ImportHistoryPanelProps) => {
  const [teachings, setTeachings] = useState<ImportedTeaching[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("teachings")
        .select("id, title, source_filename, imported_via, created_at, phase")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;
      setTeachings(data || []);
    } catch (err) {
      console.error("Error fetching import history:", err);
      setError("Failed to load import history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [limit]);

  const getImportIcon = (importedVia: string | null) => {
    switch (importedVia) {
      case "audio":
        return <Mic className="h-3.5 w-3.5" />;
      case "pdf":
        return <FileText className="h-3.5 w-3.5" />;
      case "manual":
        return <Edit3 className="h-3.5 w-3.5" />;
      default:
        return <FileText className="h-3.5 w-3.5" />;
    }
  };

  const getImportBadgeClass = (importedVia: string | null) => {
    switch (importedVia) {
      case "audio":
        return "bg-secondary text-secondary-foreground";
      case "pdf":
        return "bg-primary/10 text-primary";
      case "manual":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" />
              Import History
            </CardTitle>
            <CardDescription>
              Last {limit} imported teachings
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchHistory} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        ) : teachings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No teachings imported yet
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {teachings.map((teaching) => (
              <div
                key={teaching.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getImportBadgeClass(
                        teaching.imported_via
                      )}`}
                    >
                      {getImportIcon(teaching.imported_via)}
                      {teaching.imported_via || "unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {phaseLabels[teaching.phase] || teaching.phase}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate" title={teaching.title}>
                    {teaching.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{format(new Date(teaching.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                    {teaching.source_filename && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[150px]" title={teaching.source_filename}>
                          {teaching.source_filename}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to={`/teaching/${teaching.id}`} title="View teaching">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImportHistoryPanel;
