import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ClientProvider } from "@/contexts/ClientContext";
import { SplashScreen } from "@/components/SplashScreen";
import { MagicLinkCallback } from "@/components/MagicLinkCallback";
import Index from "@/pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <ClientProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<SplashScreen />} />
                <Route path="/auth/verify" element={<MagicLinkCallback />} />

                {/* Protected routes */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
            <Toaster />
            <Sonner />
          </ClientProvider>
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;