import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Database, Check, Copy } from "lucide-react";

const Admin = () => {
  const { toast } = useToast();
  const [transcript, setTranscript] = useState("");
  const [processedContent, setProcessedContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Metadata state
  const [title, setTitle] = useState("");
  const [primaryTheme, setPrimaryTheme] = useState("");
  const [secondaryThemes, setSecondaryThemes] = useState<string[]>([]);
  const [scriptures, setScriptures] = useState<string[]>([]);
  const [doctrines, setDoctrines] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [questionsAnswered, setQuestionsAnswered] = useState<string[]>([]);
  const [quickAnswer, setQuickAnswer] = useState("");

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

  return (
    <>
      <Helmet>
        <title>Admin - The Christian Theologist</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
            Teaching Processor
          </h1>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Input Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Step 1: Paste Transcript
                  </CardTitle>
                  <CardDescription>
                    Paste your raw transcript from Zoom or Otter here
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Paste your transcript here..."
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
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
                    Review the AI-processed content and make any corrections
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Processed content will appear here..."
                    value={processedContent}
                    onChange={(e) => setProcessedContent(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <Button
                    onClick={generateIndex}
                    disabled={isIndexing || !processedContent.trim()}
                    variant="secondary"
                    className="w-full"
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
    </>
  );
};

export default Admin;
