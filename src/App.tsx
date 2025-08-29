import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { POSInterface } from "@/components/POS/POSInterface";
import { CartView } from "./pages/CartView";
import NotFound from "./pages/NotFound";
import { POSProvider } from "@/contexts/POSContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <POSProvider>
          <Routes>
            <Route path="/" element={<POSInterface />} />
            <Route path="/cart" element={<CartView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </POSProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
