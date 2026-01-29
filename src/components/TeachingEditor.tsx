import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Loader2, X, Plus, Trash2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { phases, type Phase } from "@/data/teachings";

interface PonderedQuestion {
  topic: string;
  question: string;
  commonAnswer: string;
  cbsAnswer: string;
}

interface TeachingEditorProps {
  teaching: {
    id: string;
    title: string;
    date: string;
    primaryTheme: string;
    secondaryThemes: string[];
    scriptures: string[];
    keywords: string[];
    questionsAnswered: string[];
    quickAnswer: string;
    fullContent: string;
    phase: Phase;
    module?: string;
    moduleOrder?: number;
  };
  ponderedQuestions?: PonderedQuestion[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

const TeachingEditor = ({ teaching, ponderedQuestions: initialPondered = [], open, onOpenChange, onSave }: TeachingEditorProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isGeneratingPondered, setIsGeneratingPondered] = useState(false);
  const [reprocessProgress, setReprocessProgress] = useState(0);
  
  // Form state
  const [title, setTitle] = useState(teaching.title);
  const [date, setDate] = useState(teaching.date);
  const [primaryTheme, setPrimaryTheme] = useState(teaching.primaryTheme);
  const [secondaryThemes, setSecondaryThemes] = useState<string[]>(teaching.secondaryThemes);
  const [scriptures, setScriptures] = useState<string[]>(teaching.scriptures);
  const [keywords, setKeywords] = useState<string[]>(teaching.keywords);
  const [questionsAnswered, setQuestionsAnswered] = useState<string[]>(teaching.questionsAnswered);
  const [quickAnswer, setQuickAnswer] = useState(teaching.quickAnswer);
  const [fullContent, setFullContent] = useState(teaching.fullContent);
  const [phase, setPhase] = useState<Phase>(teaching.phase);
  const [module, setModule] = useState(teaching.module || "");
  const [moduleOrder, setModuleOrder] = useState<number | "">(teaching.moduleOrder ?? "");
  const [ponderedQuestions, setPonderedQuestions] = useState<PonderedQuestion[]>(initialPondered);
  
  // New item inputs
  const [newTheme, setNewTheme] = useState("");
  const [newScripture, setNewScripture] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [newQuestion, setNewQuestion] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from("teachings")
        .update({
          title,
          date,
          primary_theme: primaryTheme,
          secondary_themes: secondaryThemes,
          scriptures,
          keywords,
          questions_answered: questionsAnswered,
          quick_answer: quickAnswer,
          full_content: fullContent,
          phase,
          module: module || null,
          module_order: moduleOrder === "" ? null : moduleOrder,
          pondered_questions: ponderedQuestions,
        } as any)
        .eq("id", teaching.id);

      if (error) throw error;

      toast({
        title: "Teaching updated",
        description: "Your changes have been saved successfully.",
      });
      
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating teaching:", error);
      toast({
        title: "Save failed",
        description: "Could not save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from("teachings")
        .delete()
        .eq("id", teaching.id);

      if (error) throw error;

      toast({
        title: "Teaching deleted",
        description: "The teaching has been permanently removed.",
      });
      
      onOpenChange(false);
      navigate("/teachings");
    } catch (error) {
      console.error("Error deleting teaching:", error);
      toast({
        title: "Delete failed",
        description: "Could not delete teaching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReprocess = async () => {
    setIsReprocessing(true);
    setReprocessProgress(5);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to reprocess content");
      }

      toast({
        title: "Reprocessing started",
        description: "The AI is rewriting the content. This may take a minute...",
      });

      setReprocessProgress(10);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-transcript`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ transcript: fullContent }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "AI processing failed");
      }

      setReprocessProgress(20);

      // Stream the response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream available");

      const decoder = new TextDecoder();
      let processedContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                processedContent += content;
                // Update progress based on content length estimate
                const progress = Math.min(90, 20 + (processedContent.length / fullContent.length) * 70);
                setReprocessProgress(progress);
              }
            } catch {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }

      if (processedContent.trim()) {
        setFullContent(processedContent);
        setReprocessProgress(100);
        
        toast({
          title: "Reprocessing complete",
          description: "Content has been rewritten. Click 'Save Changes' to keep it.",
        });
      } else {
        throw new Error("No content received from AI");
      }
    } catch (error) {
      console.error("Reprocess error:", error);
      toast({
        title: "Reprocessing failed",
        description: error instanceof Error ? error.message : "Could not reprocess content",
        variant: "destructive",
      });
    } finally {
      setIsReprocessing(false);
      setReprocessProgress(0);
    }
  };

  const handleGeneratePondered = async () => {
    setIsGeneratingPondered(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to generate questions");
      }

      toast({
        title: "Generating questions",
        description: "AI is analysing the teaching to find key questions it answers...",
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pondered-questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ content: fullContent, title }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate questions");
      }

      const data = await response.json();
      
      if (data.questions && Array.isArray(data.questions)) {
        setPonderedQuestions(data.questions);
        toast({
          title: "Questions generated",
          description: `Found ${data.questions.length} key questions. Click 'Save Changes' to keep them.`,
        });
      } else {
        throw new Error("No questions returned from AI");
      }
    } catch (error) {
      console.error("Generate pondered questions error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Could not generate questions",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPondered(false);
    }
  };

  const addTag = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    inputSetter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (value.trim()) {
      setter(prev => [...prev, value.trim()]);
      inputSetter("");
    }
  };

  const removeTag = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const TagInput = ({
    label,
    tags,
    setTags,
    newValue,
    setNewValue,
    placeholder,
  }: {
    label: string;
    tags: string[];
    setTags: React.Dispatch<React.SetStateAction<string[]>>;
    newValue: string;
    setNewValue: React.Dispatch<React.SetStateAction<string>>;
    placeholder: string;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag, i) => (
          <Badge key={i} variant="secondary" className="flex items-center gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i, setTags)}
              className="ml-1 rounded-full hover:bg-muted p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(newValue, setTags, setNewValue);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => addTag(newValue, setTags, setNewValue)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Edit Teaching</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="px-6 py-4 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Date and Phase */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phase">Phase</Label>
                <Select value={phase} onValueChange={(v) => setPhase(v as Phase)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map((p) => (
                      <SelectItem key={p.slug} value={p.slug}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Module Assignment */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="module">Module</Label>
                <Select value={module || "__none__"} onValueChange={(v) => setModule(v === "__none__" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select module..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No Module</SelectItem>
                    {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map((m) => (
                      <SelectItem key={m} value={m}>
                        Module {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="moduleOrder">Order in Module</Label>
                <Input
                  id="moduleOrder"
                  type="number"
                  min={1}
                  placeholder="e.g., 1, 2, 3..."
                  value={moduleOrder}
                  onChange={(e) => setModuleOrder(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                />
              </div>
            </div>

            {/* Primary Theme */}
            <div className="space-y-2">
              <Label htmlFor="primaryTheme">Primary Theme</Label>
              <Input
                id="primaryTheme"
                value={primaryTheme}
                onChange={(e) => setPrimaryTheme(e.target.value)}
              />
            </div>

            {/* Quick Answer */}
            <div className="space-y-2">
              <Label htmlFor="quickAnswer">Summary</Label>
              <Textarea
                id="quickAnswer"
                value={quickAnswer}
                onChange={(e) => setQuickAnswer(e.target.value)}
                rows={3}
              />
            </div>

            {/* Full Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="fullContent">Full Content</Label>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={isReprocessing}
                      className="gap-1.5"
                    >
                      {isReprocessing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Reprocess with AI
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reprocess Content with AI?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will send the current content through the CBS methodology AI to rewrite it in essay form. 
                        The original content will be replaced. Make sure you have a backup if needed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleReprocess}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Reprocess Now
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {isReprocessing && (
                <div className="space-y-1">
                  <Progress value={reprocessProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    AI is rewriting content... {Math.round(reprocessProgress)}%
                  </p>
                </div>
              )}
              <Textarea
                id="fullContent"
                value={fullContent}
                onChange={(e) => setFullContent(e.target.value)}
                rows={12}
                className="font-mono text-sm"
                disabled={isReprocessing}
              />
            </div>

            {/* Tag Inputs */}
            <TagInput
              label="Secondary Themes"
              tags={secondaryThemes}
              setTags={setSecondaryThemes}
              newValue={newTheme}
              setNewValue={setNewTheme}
              placeholder="Add a theme..."
            />

            <TagInput
              label="Scripture References"
              tags={scriptures}
              setTags={setScriptures}
              newValue={newScripture}
              setNewValue={setNewScripture}
              placeholder="e.g., Matthew 24:1-3"
            />

            <TagInput
              label="Keywords"
              tags={keywords}
              setTags={setKeywords}
              newValue={newKeyword}
              setNewValue={setNewKeyword}
              placeholder="Add a keyword..."
            />

            <TagInput
              label="Questions Answered"
              tags={questionsAnswered}
              setTags={setQuestionsAnswered}
              newValue={newQuestion}
              setNewValue={setNewQuestion}
              placeholder="Add a question..."
            />

            {/* Pondered Questions Section */}
            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Have You Ever Pondered?</Label>
                  <p className="text-xs text-muted-foreground">
                    Structured Q&A section showing common misconceptions vs CBS answers
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPonderedQuestions(prev => [...prev, {
                      topic: "",
                      question: "",
                      commonAnswer: "",
                      cbsAnswer: ""
                    }])}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Question
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePondered}
                    disabled={isGeneratingPondered}
                    className="gap-1.5"
                  >
                    {isGeneratingPondered ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {ponderedQuestions.length > 0 ? "Regenerate" : "Generate"}
                  </Button>
                </div>
              </div>
              
              {ponderedQuestions.length > 0 && (
                <div className="space-y-4 bg-muted/50 rounded-lg p-4">
                  {ponderedQuestions.map((q, idx) => (
                    <div key={idx} className="space-y-2 pb-4 border-b last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Question {idx + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setPonderedQuestions(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        value={q.topic}
                        onChange={(e) => setPonderedQuestions(prev => 
                          prev.map((item, i) => i === idx ? { ...item, topic: e.target.value } : item)
                        )}
                        placeholder="Topic (e.g., 'The Angel of the Lord')"
                        className="text-sm"
                      />
                      <Input
                        value={q.question}
                        onChange={(e) => setPonderedQuestions(prev => 
                          prev.map((item, i) => i === idx ? { ...item, question: e.target.value } : item)
                        )}
                        placeholder="Question"
                        className="text-sm"
                      />
                      <Textarea
                        value={q.commonAnswer}
                        onChange={(e) => setPonderedQuestions(prev => 
                          prev.map((item, i) => i === idx ? { ...item, commonAnswer: e.target.value } : item)
                        )}
                        placeholder="Common (wrong) answer..."
                        rows={2}
                        className="text-sm"
                      />
                      <Textarea
                        value={q.cbsAnswer}
                        onChange={(e) => setPonderedQuestions(prev => 
                          prev.map((item, i) => i === idx ? { ...item, cbsAnswer: e.target.value } : item)
                        )}
                        placeholder="This Teaching's Clear Answer..."
                        rows={3}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delete Section */}
            <div className="pt-4 border-t border-destructive/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete this teaching
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete Teaching
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Teaching?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{teaching.title}". This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeachingEditor;
