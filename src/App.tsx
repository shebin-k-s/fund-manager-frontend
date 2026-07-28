import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, defaultShouldDehydrateQuery } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
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
import CalendarPage from "@/features/calendar/pages/CalendarPage";
import StatementsPage from "@/features/statements/pages/StatementsPage";
import NotFound from "./pages/NotFound";

import UnlockPage from "./features/unlock/UnlockPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/publicRoute";

const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // Keep cache for 7 days

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      gcTime: CACHE_MAX_AGE,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister,
      maxAge: CACHE_MAX_AGE,
      dehydrateOptions: {
        // Keep queries that still have data even if the last background
        // revalidation errored (e.g. offline) — otherwise a failed refetch
        // wipes that query from localStorage on the next persist save.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.data !== undefined,
      },
    }}
  >
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <Routes>
          <Route
            path="/unlock"
            element={
              <PublicRoute>
                <UnlockPage />
              </PublicRoute>
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
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="statements" element={<StatementsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </PersistQueryClientProvider>
);

export default App;