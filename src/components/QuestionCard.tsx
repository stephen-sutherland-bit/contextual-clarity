import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface QuestionCardProps {
  question: string;
  teachingId: string;
  teachingTitle: string;
  quickAnswer: string;
  index: number;
}

const QuestionCard = ({ question, teachingId, teachingTitle, quickAnswer, index }: QuestionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.5) }}
      viewport={{ once: true }}
    >
      <Link to={`/teaching/${teachingId}`}>
        <Card variant="question" className="group h-full">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <HelpCircle className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                  {question}
                </p>
                <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
                  From: <span className="text-foreground/70">{teachingTitle}</span>
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default QuestionCard;
