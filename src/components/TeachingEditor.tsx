import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { phases, type Phase } from "@/data/teachings";

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
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

const TeachingEditor = ({ teaching, open, onOpenChange, onSave }: TeachingEditorProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
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
        })
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
              <Label htmlFor="fullContent">Full Content</Label>
              <Textarea
                id="fullContent"
                value={fullContent}
                onChange={(e) => setFullContent(e.target.value)}
                rows={12}
                className="font-mono text-sm"
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
