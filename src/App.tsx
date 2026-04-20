import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { RegistrationsProvider } from "@/hooks/useRegistrations";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AIChatWidget } from "@/components/AIChatWidget";
import LoginPage from "./pages/LoginPage";
import AttendeeHome from "./pages/AttendeeHome";
import Schedule from "./pages/Schedule";
import SessionDetail from "./pages/SessionDetail";
import MapPage from "./pages/MapPage";
import TicketPage from "./pages/TicketPage";
import EmergencyPage from "./pages/EmergencyPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <RegistrationsProvider>
            <AIChatWidget />
            <Toaster />
            <Sonner />
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/home" element={<ProtectedRoute requiredRole="attendee"><AttendeeHome /></ProtectedRoute>} />
                <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
                <Route path="/schedule/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
                <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
                <Route path="/ticket" element={<ProtectedRoute><TicketPage /></ProtectedRoute>} />
                <Route path="/emergency" element={<ProtectedRoute><EmergencyPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute requiredRole="organizer"><AdminDashboard /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </RegistrationsProvider>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
