import { Link } from "react-router-dom";
import { BookOpen, ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-secondary/30">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-heading text-lg font-semibold">
                The Christian Theologist
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
              Sound exegesis with context as king. Exploring Scripture through the lens of 
              Contextual Bible Study methodology, making ancient wisdom accessible to all.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/teachings" className="text-muted-foreground hover:text-foreground transition-colors">
                  All Teachings
                </Link>
              </li>
              <li>
                <Link to="/questions" className="text-muted-foreground hover:text-foreground transition-colors">
                  Questions Answered
                </Link>
              </li>
              <li>
                <Link to="/methodology" className="text-muted-foreground hover:text-foreground transition-colors">
                  CBS Methodology
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-muted-foreground hover:text-foreground transition-colors">
                  Search Library
                </Link>
              </li>
            </ul>
          </div>

          {/* External */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://christiantheologist.substack.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  Substack
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            For more in-depth studies with sound exegesis and context as king, visit{" "}
            <a 
              href="https://christiantheologist.substack.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              christiantheologist.substack.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
