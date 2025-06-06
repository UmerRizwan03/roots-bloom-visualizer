// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom"; // Added Outlet
import Index from "./pages/Index";
import Members from "./pages/Members";
import Magazines from "./pages/Magazines";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import MobileNavigationLayout from "./components/MobileNavigationLayout"; // Import the new layout

const queryClient = new QueryClient();

// Layout component to wrap routes that need the sidebar
const AppLayout = () => (
  <MobileNavigationLayout>
    <Outlet /> {/* Child routes will render here */}
  </MobileNavigationLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Routes with the sidebar */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/members" element={<Members />} />
              <Route path="/magazines" element={<Magazines />} />
            </Route>

            {/* Routes without the sidebar (e.g., login, admin, if any) can be defined outside AppLayout */}
            {/* For example: <Route path="/login" element={<LoginPage />} /> */}

            {/* Catch-all Not Found route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
