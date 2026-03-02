import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuestionCard from "@/components/QuestionCard";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";

interface QuestionWithTeaching {
  question: string;
  teachingId: string;
  teachingTitle: string;
  quickAnswer: string;
}

const Questions = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [allQuestions, setAllQuestions] = useState<QuestionWithTeaching[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("teachings")
        .select("id, title, quick_answer, questions_answered");

      if (error) {
        console.error("Error fetching questions:", error);
      } else if (data) {
        const questionsWithTeaching: QuestionWithTeaching[] = [];
        data.forEach((teaching) => {
          (teaching.questions_answered || []).forEach((q: string) => {
            questionsWithTeaching.push({
              question: q,
              teachingId: teaching.id,
              teachingTitle: teaching.title,
              quickAnswer: teaching.quick_answer || "",
            });
          });
        });
        setAllQuestions(questionsWithTeaching);
      }
      setIsLoading(false);
    };

    fetchQuestions();
  }, []);

  const filteredQuestions = useMemo(() => {
    if (searchQuery === "") return allQuestions;
    return allQuestions.filter((q) =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allQuestions, searchQuery]);

  return (
    <>
      <Helmet>
        <title>Questions Answered | The Berean Press</title>
        <meta
          name="description"
          content="Find answers to common biblical questions. Quick answers with links to full contextual teachings. What is the Trinity? What does 'the world' mean? And more."
        />
      </Helmet>
      <div className="min-h-screen flex flex-col texture-paper">
        <Header />
        <main className="flex-1">
          {/* Page Header */}
          <section className="relative bg-gradient-hero py-12 md:py-16 border-b border-border/50 texture-leather">
            <div className="container px-4 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl"
              >
                <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4 hero-text letterpress">
                  Questions Answered
                </h1>
                <p className="text-lg hero-text-muted">
                  Click any question to get a quick answer. Then, if you want to
                  understand the full context and reasoning, dive into the
                  complete teaching.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Search */}
          <section className="border-b border-border/50 bg-background sticky top-16 z-40">
            <div className="container px-4 py-4">
              <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </section>

          {/* Questions Grid */}
          <section className="py-8 md:py-12">
            <div className="container px-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="mb-6 text-sm text-muted-foreground">
                    {filteredQuestions.length} questions
                  </div>

                  {filteredQuestions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredQuestions.map((q, index) => (
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
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        {allQuestions.length === 0
                          ? "No teachings have been added yet."
                          : "No questions found matching your search."}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Questions;