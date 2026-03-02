import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-28 texture-leather">
      {/* Corner flourishes */}
      <div className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-accent/30 rounded-tl-sm opacity-60 z-10" />
      <div className="absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2 border-accent/30 rounded-tr-sm opacity-60 z-10" />
      <div className="absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2 border-accent/30 rounded-bl-sm opacity-60 z-10" />
      <div className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-accent/30 rounded-br-sm opacity-60 z-10" />
      
      <div className="container relative px-4 z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="gold-ribbon mb-6 inline-block">
              Correcting Misinterpretations Through Covenantal Contextual Methodology
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight mb-6 hero-text letterpress"
          >
            Answers Your Pastor{" "}
            <span className="text-accent">Couldn't Explain</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl hero-text-muted mb-8 leading-relaxed"
          >
            Discover biblical teachings where context is king. No more confusing analogies 
            or contradictory explanations—just sound exegesis that makes ancient Scripture 
            accessible and logical.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button variant="hero" size="xl" asChild>
              <Link to="/questions" className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Find Your Answers
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="warm" size="xl" asChild>
              <Link to="/methodology" className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Learn the Methodology
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Warm glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/10 rounded-full blur-3xl pointer-events-none"
        />
      </div>
    </section>
  );
};

export default HeroSection;
