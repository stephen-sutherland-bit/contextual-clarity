import { Link } from "react-router-dom";
import { BookOpen, Search, Menu, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft group-hover:shadow-card transition-shadow">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-semibold leading-tight">
              The Christian Theologist
            </span>
            <span className="text-xs text-muted-foreground hidden sm:block">
              Context is King
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/teachings" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Teachings
          </Link>
          <Link 
            to="/questions" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Questions Answered
          </Link>
          <Link 
            to="/methodology" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            CBS Methodology
          </Link>
          <Link 
            to="/about" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link 
            to="/admin" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Settings className="h-4 w-4" />
            Admin
          </Link>
          <Button variant="warm" size="sm" asChild>
            <Link to="/search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Link>
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/50 bg-background"
          >
            <div className="container py-4 space-y-2">
              <Link 
                to="/teachings" 
                className="block px-4 py-2 rounded-md hover:bg-secondary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Teachings
              </Link>
              <Link 
                to="/questions" 
                className="block px-4 py-2 rounded-md hover:bg-secondary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Questions Answered
              </Link>
              <Link 
                to="/methodology" 
                className="block px-4 py-2 rounded-md hover:bg-secondary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                CBS Methodology
              </Link>
              <Link 
                to="/about" 
                className="block px-4 py-2 rounded-md hover:bg-secondary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                to="/search" 
                className="block px-4 py-2 rounded-md hover:bg-secondary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Search
              </Link>
              <Link 
                to="/admin" 
                className="block px-4 py-2 rounded-md hover:bg-secondary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
