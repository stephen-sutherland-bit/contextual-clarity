import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BookMarked, History, Scale, Eye, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const principles = [
  {
    icon: BookMarked,
    title: "Covenantal Location",
    description: "Every passage belongs to a specific covenant—Mosaic or New. Identify which governs."
  },
  {
    icon: History,
    title: "The Imminent Horizon",
    description: "Jesus' prophecies had a first-century fulfilment—AD 70 marked the end of the Mosaic age."
  },
  {
    icon: Scale,
    title: "Two Instrumental Modes",
    description: "Mosaic: material, external, national. New Covenant: spiritual, internal, universal."
  },
  {
    icon: Eye,
    title: "Transition Literature",
    description: "The NT was written during the overlap of two covenants—read it as such."
  }
];

const MethodologyPreview = () => {
  return (
    <section className="relative py-16 md:py-24 bg-secondary/50 border-y border-border">
      <div className="container px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-3 py-1 mb-4 text-sm font-medium text-primary bg-primary/10 rounded-full">
              Our Approach
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Covenantal Contextual Methodology
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Most confusion in biblical interpretation comes from reading ancient texts through 
              modern lenses. CCM places every passage in its proper historical and 
              covenantal context—the way the original audience would have understood it.
            </p>
            <div className="space-y-3 mb-8">
              {[
                "No futurist speculation—focus on what was fulfilled",
                "Understand symbolic language as ancients did",
                "Distinguish between covenants properly",
                "Accessible to newcomers, rigorous for scholars"
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{point}</span>
                </div>
              ))}
            </div>
            <Button variant="hero" asChild>
              <Link to="/methodology" className="flex items-center gap-2">
                Learn the Full Methodology
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {principles.map((principle, index) => (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card variant="elevated" className="h-full">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <principle.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-heading font-semibold mb-2">{principle.title}</h3>
                    <p className="text-sm text-muted-foreground">{principle.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MethodologyPreview;
