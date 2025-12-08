import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import TeachingCard from "./TeachingCard";
import { teachings } from "@/data/teachings";

const RecommendedPath = () => {
  // Get teachings sorted by reading order
  const sortedTeachings = [...teachings]
    .filter(t => t.readingOrder)
    .sort((a, b) => (a.readingOrder || 0) - (b.readingOrder || 0))
    .slice(0, 3);

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
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-highlight-soft rounded-full">
            <GraduationCap className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium">Recommended for Newcomers</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Where to Start Your Journey
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            New to contextual Bible study? These teachings are carefully ordered to build 
            your foundation—each one preparing you for the next.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {sortedTeachings.map((teaching, index) => (
            <TeachingCard 
              key={teaching.id} 
              teaching={teaching} 
              index={index}
              showReadingOrder 
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
            <Link to="/teachings?path=recommended" className="flex items-center gap-2">
              View Full Reading Path
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default RecommendedPath;
