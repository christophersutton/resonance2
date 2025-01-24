import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "./components/ui/sidebar";
import { ClientProvider } from "./contexts/ClientContext";
import { MessageProvider } from "./contexts/MessageContext";
import { SplashScreen } from "./components/SplashScreen";
import { MagicLinkCallback } from "./components/MagicLinkCallback";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SidebarProvider>
        <ClientProvider>
          <MessageProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<SplashScreen />} />
                <Route path="/auth/verify" element={<MagicLinkCallback />} />

                {/* Protected routes */}
                <Route path="/*" element={<Index />} />
              </Routes>
            </Router>
            <Toaster />
            <Sonner />
          </MessageProvider>
        </ClientProvider>
      </SidebarProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;