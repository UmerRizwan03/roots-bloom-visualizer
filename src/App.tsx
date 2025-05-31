
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Members from "./pages/Members";
import Magazines from "./pages/Magazines";
import NotFound from "./pages/NotFound";
import AdminLoginPage from "./pages/AdminLoginPage"; // Import AdminLoginPage
import { AuthProvider } from "./contexts/AuthContext"; // Import AuthProvider

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider> {/* Wrap with AuthProvider */}
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
          <Route path="/members" element={<Members />} />
          <Route path="/magazines" element={<Magazines />} />
            <Route path="/login" element={<AdminLoginPage />} /> {/* Add Admin Login Route */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
