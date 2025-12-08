import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import QuestionCard from "./QuestionCard";
import { featuredQuestions } from "@/data/teachings";

const FeaturedQuestions = () => {
  // Show first 6 questions on homepage
  const displayedQuestions = featuredQuestions.slice(0, 6);

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
          {displayedQuestions.map((question, index) => (
            <QuestionCard key={question} question={question} index={index} />
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
