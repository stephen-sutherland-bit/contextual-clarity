import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import QuestionCard from "./QuestionCard";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface QuestionWithTeaching {
  question: string;
  teachingId: string;
  teachingTitle: string;
  quickAnswer: string;
}

const FeaturedQuestions = () => {
  const [displayedQuestions, setDisplayedQuestions] = useState<QuestionWithTeaching[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("teachings")
        .select("id, title, quick_answer, questions_answered")
        .limit(10);

      if (error) {
        console.error("Error fetching questions:", error);
      } else if (data) {
        const questions: QuestionWithTeaching[] = [];
        data.forEach((t) => {
          (t.questions_answered || []).forEach((q: string) => {
            if (questions.length < 6 && !questions.some(existing => existing.question === q)) {
              questions.push({
                question: q,
                teachingId: t.id,
                teachingTitle: t.title,
                quickAnswer: t.quick_answer || "",
              });
            }
          });
        });
        setDisplayedQuestions(questions);
      }
      setIsLoading(false);
    };

    fetchQuestions();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-background">
        <div className="container px-4 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (displayedQuestions.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Questions Finally Answered
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Click any question to get a quick answer—then dive deeper into the full teaching 
            if you want to understand the context behind it.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {displayedQuestions.map((q, index) => (
            <QuestionCard
              key={`${q.teachingId}-${q.question}`}
              question={q.question}
              teachingId={q.teachingId}
              teachingTitle={q.teachingTitle}
              quickAnswer={q.quickAnswer}
              index={index}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button variant="warm" size="lg" asChild>
            <Link to="/questions" className="flex items-center gap-2">
              View All Questions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedQuestions;