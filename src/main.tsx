import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Handle GitHub Pages SPA redirect
// When 404.html redirects here with ?redirect=/path, we restore the original route
const handleGitHubPagesRedirect = () => {
  const params = new URLSearchParams(window.location.search);
  const redirectPath = params.get('redirect');
  
  if (redirectPath) {
    // Only handle redirect in production (GitHub Pages)
    // In development/preview, the redirect param shouldn't be present
    const basePath = import.meta.env.PROD ? '/contextual-clarity' : '';
    const cleanUrl = window.location.origin + basePath + redirectPath;
    window.history.replaceState(null, '', cleanUrl);
  }
};

// Only run redirect handler if there's a redirect param
if (window.location.search.includes('redirect=')) {
  handleGitHubPagesRedirect();
}

createRoot(document.getElementById("root")!).render(<App />);
