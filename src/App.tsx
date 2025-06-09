import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom"; // Changed BrowserRouter to HashRouter
import Index from "./pages/Index";
import Members from "./pages/Members";
import Magazines from "./pages/Magazines";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext"; // Import AuthProvider

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider> {/* Wrap with AuthProvider */}
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter> {/* Changed BrowserRouter to HashRouter */}
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/members" element={<Members />} />
            <Route path="/magazines" element={<Magazines />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter> {/* Changed BrowserRouter to HashRouter */}
      </TooltipProvider>
    </AuthProvider> {/* Close AuthProvider */}
  </QueryClientProvider>
);

export default App;
