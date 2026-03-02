import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BookOpen, Layers, Building2, Footprints, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { phases } from "@/data/teachings";

const phaseIcons = {
  'foundations': BookOpen,
  'essentials': Layers,
  'building-blocks': Building2,
  'moving-on': Footprints,
  'advanced': GraduationCap
};

const PhaseOverview = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12">

          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Learning Phases
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our teachings are organised into themed phases. Start with Foundations 
            if you're new, or jump to the phase that matches your current study.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {phases.map((phase, index) => {
            const Icon = phaseIcons[phase.slug];
            return (
              <motion.div
                key={phase.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}>

                <Link to={`/teachings?phase=${phase.slug}`}>
                  <Card className="h-full hover:shadow-card transition-all hover:border-primary/30 cursor-pointer group">
                    <CardContent className="p-6 rounded-xl">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-heading font-semibold mb-1 group-hover:text-primary transition-colors">
                            {phase.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {phase.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>);

          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center">

          <Button variant="warm" size="lg" asChild>
            <Link to="/teachings" className="flex items-center gap-2">
              Browse All Teachings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>);

};

export default PhaseOverview;