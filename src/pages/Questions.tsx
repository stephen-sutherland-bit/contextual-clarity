import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuestionCard from "@/components/QuestionCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { teachings } from "@/data/teachings";
import { Helmet } from "react-helmet-async";

const Questions = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Get all unique questions
  const allQuestions = useMemo(() => {
    const questions = new Set<string>();
    teachings.forEach(t => {
      t.questionsAnswered.forEach(q => questions.add(q));
    });
    return Array.from(questions);
  }, []);

  const filteredQuestions = useMemo(() => {
    if (searchQuery === "") return allQuestions;
    return allQuestions.filter(q => 
      q.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allQuestions, searchQuery]);

  return (
    <>
      <Helmet>
        <title>Questions Answered | The Christian Theologist</title>
        <meta 
          name="description" 
          content="Find answers to common biblical questions. Quick answers with links to full contextual teachings. What is the Trinity? What does 'the world' mean? And more." 
        />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {/* Page Header */}
          <section className="bg-gradient-hero py-12 md:py-16 border-b border-border/50">
            <div className="container px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl"
              >
                <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                  Questions Answered
                </h1>
                <p className="text-lg text-muted-foreground">
                  Click any question to get a quick answer. Then, if you want to understand 
                  the full context and reasoning, dive into the complete teaching.
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
              <div className="mb-6 text-sm text-muted-foreground">
                {filteredQuestions.length} questions
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredQuestions.map((question, index) => (
                  <QuestionCard key={question} question={question} index={index} />
                ))}
              </div>

              {filteredQuestions.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No questions found matching your search.
                  </p>
                </div>
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
