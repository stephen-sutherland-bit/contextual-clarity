import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Loader2, Info } from "lucide-react";

interface UsageSummary {
  totalCost: number;
  transcriptionCost: number;
  processingCost: number;
  indexingCost: number;
  aiGenerationCost: number; // Covers illustration, pondered questions, phase suggestions
  operationCount: number;
}

const ApiUsageCard = () => {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        // Get first day of current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const { data, error } = await supabase
          .from("api_usage")
          .select("*")
          .gte("created_at", startOfMonth.toISOString());

        if (error) throw error;

        const summary: UsageSummary = {
          totalCost: 0,
          transcriptionCost: 0,
          processingCost: 0,
          indexingCost: 0,
          aiGenerationCost: 0,
          operationCount: data?.length || 0,
        };

        data?.forEach((row) => {
          const cost = Number(row.estimated_cost) || 0;
          summary.totalCost += cost;
          
          if (row.operation_type === "transcription") {
            summary.transcriptionCost += cost;
          } else if (row.operation_type === "processing") {
            summary.processingCost += cost;
          } else if (row.operation_type === "indexing") {
            summary.indexingCost += cost;
          } else if (
            row.operation_type === "illustration" ||
            row.operation_type === "generate-pondered-questions" ||
            row.operation_type === "phase-suggestion"
          ) {
            summary.aiGenerationCost += cost;
          }
          // Note: pdf_parse is always $0 and other types will be included in totalCost
        });

        setUsage(summary);
      } catch (error) {
        console.error("Error fetching usage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsage();
  }, []);

  const formatCost = (cost: number) => `$${cost.toFixed(2)}`;

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const monthName = new Date().toLocaleString("en-NZ", { month: "long" });

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-primary" />
          API Usage - {monthName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Total</p>
            <p className="text-xl font-bold text-primary">
              {formatCost(usage?.totalCost || 0)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Transcription</p>
            <p className="font-medium">{formatCost(usage?.transcriptionCost || 0)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Processing</p>
            <p className="font-medium">{formatCost(usage?.processingCost || 0)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Indexing</p>
            <p className="font-medium">{formatCost(usage?.indexingCost || 0)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">AI Generation</p>
            <p className="font-medium">{formatCost(usage?.aiGenerationCost || 0)}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          <span>{usage?.operationCount || 0} operations this month</span>
        </div>
        <Alert variant="default" className="mt-3 bg-muted/30 border-muted">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs text-muted-foreground">
            This only tracks API usage within this app. Direct OpenAI or AssemblyAI usage (e.g., ChatGPT, DeepSeek) is not included.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ApiUsageCard;
