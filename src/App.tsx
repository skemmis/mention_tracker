import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PixelHeader from "@/components/PixelHeader";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import PhraseTimeline from "./pages/PhraseTimeline";
import WhatIsThis from "./pages/WhatIsThis";
import WhoMadeThis from "./pages/WhoMadeThis";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <PixelHeader />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/phrase/:phrase" element={<PhraseTimeline />} />
            <Route path="/what-is-this" element={<WhatIsThis />} />
            <Route path="/who-made-this" element={<WhoMadeThis />} />
            <Route path="/search" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
