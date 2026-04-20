import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Google Services Registration
import { firebaseApp, analytics } from "@/integrations/firebase/client";
if (analytics) {
  console.debug("Google Firebase Analytics Active:", firebaseApp.name);
}

createRoot(document.getElementById('root')!).render(<App />);
