import { Link } from "react-router-dom";
import { BookOpen, ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative border-t-2 border-accent/20 bg-primary/90 text-primary-foreground">
      <div className="absolute inset-0 texture-leather pointer-events-none" />
      <div className="container relative px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/90 text-accent-foreground">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-heading text-lg font-semibold">
                The Berean Press
              </span>
            </Link>
            <p className="text-primary-foreground/70 text-sm max-w-md leading-relaxed mb-2">
              Correcting misinterpretations through Covenantal Contextual Methodology. 
              Exploring Scripture with context as king, making ancient wisdom accessible to all.
            </p>
            <p className="text-xs text-primary-foreground/50 italic">
              Like the Bereans of Acts 17:11, we examine the Scriptures diligently.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4 text-accent">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/teachings" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  All Teachings
                </Link>
              </li>
              <li>
                <Link to="/questions" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  Questions Answered
                </Link>
              </li>
              <li>
                <Link to="/methodology" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  CCM Methodology
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  Search Library
                </Link>
              </li>
            </ul>
          </div>

          {/* External */}
          <div>
            <h4 className="font-heading font-semibold mb-4 text-accent">Connect</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-primary-foreground/10">
          <p className="text-xs text-primary-foreground/40 text-center">
            Teachings derived from{" "}
            <a 
              href="https://christiantheologist.substack.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent/80 hover:text-accent hover:underline inline-flex items-center gap-1"
            >
              The Christian Theologist
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
