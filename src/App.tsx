import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { initDatabase } from "@/lib/database";
import Login from "./pages/Login";
import ClinicianDashboard from "./pages/clinician/Dashboard";
import NewPatient from "./pages/clinician/NewPatient";
import PatientDetail from "./pages/clinician/PatientDetail";
import NewVisit from "./pages/clinician/NewVisit";
import PatientDashboard from "./pages/patient/Dashboard";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const App = () => {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => {
        console.log('✅ Database initialized successfully');
        setDbInitialized(true);
      })
      .catch((error) => {
        console.error('❌ Database initialization failed:', error);
        setDbError(error.message);
      });
  }, []);

  if (dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md p-6">
          <div className="text-destructive text-4xl">⚠️</div>
          <h1 className="text-2xl font-bold">Database Error</h1>
          <p className="text-muted-foreground">{dbError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dbInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">Initializing database...</p>
          <p className="text-sm text-muted-foreground">Setting up offline storage</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/login" replace />} />
                
                {/* Clinician Routes */}
                <Route
                  path="/clinician/dashboard"
                  element={
                    <ProtectedRoute requiredRole="clinician">
                      <ClinicianDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clinician/patients/new"
                  element={
                    <ProtectedRoute requiredRole="clinician">
                      <NewPatient />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clinician/patients/:patientId"
                  element={
                    <ProtectedRoute requiredRole="clinician">
                      <PatientDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clinician/patients/:patientId/visit/new"
                  element={
                    <ProtectedRoute requiredRole="clinician">
                      <NewVisit />
                    </ProtectedRoute>
                  }
                />
                
                {/* Patient Routes */}
                <Route
                  path="/patient/dashboard"
                  element={
                    <ProtectedRoute requiredRole="patient">
                      <PatientDashboard />
                    </ProtectedRoute>
                  }
                />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
