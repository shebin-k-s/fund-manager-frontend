import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "@/components/Layout";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import FundsPage from "@/features/funds/pages/FundsPage";
import CreateFundPage from "@/features/funds/pages/CreateFundPage";
import EditFundPage from "@/features/funds/pages/EditFundPage";
import FundDetailPage from "@/features/funds/pages/FundDetailPage";
import CreditCardsPage from "@/features/credit-cards/pages/CreditCardsPage";
import AddCreditCardPage from "@/features/credit-cards/pages/AddCreditCardPage";
import EditCreditCardPage from "@/features/credit-cards/pages/EditCreditCardPage";
import CreditCardDetailPage from "@/features/credit-cards/pages/CreditCardDetailPage";
import NotFound from "./pages/NotFound";

import UnlockPage from "./features/unlock/UnlockPage";
import ProtectedRoute from "./routes/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <Routes>
          <Route
            path="/unlock"
            element={
              localStorage.getItem("auth_token") ? (
                <Navigate to="/" replace />
              ) : (
                <UnlockPage />
              )
            }
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="funds" element={<FundsPage />} />
            <Route path="funds/new" element={<CreateFundPage />} />
            <Route path="funds/:id" element={<FundDetailPage />} />
            <Route path="funds/:id/edit" element={<EditFundPage />} />
            <Route path="cards" element={<CreditCardsPage />} />
            <Route path="cards/new" element={<AddCreditCardPage />} />
            <Route path="cards/:id" element={<CreditCardDetailPage />} />
            <Route path="cards/:id/edit" element={<EditCreditCardPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;