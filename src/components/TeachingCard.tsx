import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Teaching } from "@/data/teachings";

interface TeachingCardProps {
  teaching: Teaching;
  index: number;
  showReadingOrder?: boolean;
}

const TeachingCard = ({ teaching, index, showReadingOrder = false }: TeachingCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Card variant="teaching" className="h-full flex flex-col group">
        <CardHeader>
          {showReadingOrder && teaching.readingOrder && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Start Here: #{teaching.readingOrder}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Calendar className="h-3.5 w-3.5" />
            {teaching.date}
          </div>
          <CardTitle className="group-hover:text-primary transition-colors">
            {teaching.title}
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {teaching.primaryTheme}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {teaching.quickAnswer}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {teaching.scriptures.slice(0, 3).map((scripture) => (
              <span 
                key={scripture} 
                className="text-xs px-2 py-0.5 bg-scripture-bg text-scripture rounded"
              >
                {scripture}
              </span>
            ))}
            {teaching.scriptures.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{teaching.scriptures.length - 3} more
              </span>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" size="sm" className="group/btn" asChild>
            <Link to={`/teaching/${teaching.id}`} className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Read Teaching
              <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default TeachingCard;
