import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Handle GitHub Pages SPA redirect
// When 404.html redirects here with ?redirect=/path, we restore the original route
const handleGitHubPagesRedirect = () => {
  const params = new URLSearchParams(window.location.search);
  const redirectPath = params.get('redirect');
  
  if (redirectPath) {
    // Remove the redirect param from URL and navigate to the intended path
    const cleanUrl = window.location.origin + window.location.pathname.replace(/\/$/, '') + redirectPath;
    window.history.replaceState(null, '', cleanUrl);
  }
};

handleGitHubPagesRedirect();

createRoot(document.getElementById("root")!).render(<App />);
