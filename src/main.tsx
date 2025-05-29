import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './components/react-flow-overrides.css' // Added import for React Flow overrides
import { ThemeProvider } from 'next-themes'

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <App />
  </ThemeProvider>
);
