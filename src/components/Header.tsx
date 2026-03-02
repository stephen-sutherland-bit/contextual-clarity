import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Search, Menu, X, Settings, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-gradient-to-b from-primary/95 to-primary/85 backdrop-blur supports-[backdrop-filter]:bg-primary/90 shadow-md">
      <div className="absolute inset-0 texture-leather pointer-events-none" />
      <div className="container relative flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/90 text-accent-foreground shadow-soft group-hover:shadow-card transition-shadow">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-semibold leading-tight text-primary-foreground">
              The Berean Press
            </span>
            <span className="text-xs text-primary-foreground/60 hidden sm:block">
              Context is King
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/methodology" 
            className="text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            CCM Methodology
          </Link>
          <Link 
            to="/teachings" 
            className="text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            Teachings
          </Link>
          <Link 
            to="/questions" 
            className="text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            Questions Answered
          </Link>
          <Link 
            to="/about" 
            className="text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            About
          </Link>
          {isAdmin && (
            <Link 
              to="/admin" 
              className="text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors flex items-center gap-1"
            >
              <Settings className="h-4 w-4" />
              Admin
            </Link>
          )}
          <Button variant="warm" size="sm" asChild>
            <Link to="/search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Link>
          </Button>
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="flex items-center gap-2 ml-4 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth" className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-primary-foreground hover:bg-primary-foreground/10"
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
            className="md:hidden border-t border-primary-foreground/10 bg-primary/95"
          >
            <div className="container py-4 space-y-2">
              <Link 
                to="/methodology" 
                className="block px-4 py-2 rounded-md text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                CCM Methodology
              </Link>
              <Link 
                to="/teachings" 
                className="block px-4 py-2 rounded-md text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Teachings
              </Link>
              <Link 
                to="/questions" 
                className="block px-4 py-2 rounded-md text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Questions Answered
              </Link>
              <Link 
                to="/about" 
                className="block px-4 py-2 rounded-md text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                to="/search" 
                className="block px-4 py-2 rounded-md text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Search
              </Link>
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="block px-4 py-2 rounded-md text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              {user ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 rounded-md text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <Link 
                  to="/auth" 
                  className="block px-4 py-2 rounded-md text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
