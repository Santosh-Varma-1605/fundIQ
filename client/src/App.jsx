import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ThemeProvider } from "./ThemeContext";

import Home               from "./pages/Home";
import InvestorLogin      from "./pages/Investorlogin";
import StartupLogin       from "./pages/Startuplogin";
import VerifyEmailSent from "./pages/VerifyEmailSent";
import ForgotPassword     from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import InvestorDashboard  from "./pages/Investordashboard";
import InvestorProfile        from "./pages/Investorprofile";
import InvestorMatching       from "./pages/Investormatching";
import InvestorAdvisor        from "./pages/Investoradvisor";
import InvestorCostOptimizer  from "./pages/Investorcostoptimizer";
import InvestorTopPicks       from "./pages/Investortoppicks";
import InvestorTransactions   from "./pages/Investortransactions";
import StartupDashboard   from "./pages/StartupDashboard";

import StartupProfile        from "./pages/Startupprofile";
import StartupMatching       from "./pages/Startupmatching";
import StartupViability      from "./pages/Startupviability";
import StartupCostOptimizer  from "./pages/Startupcostoptimizer";
import StartupTopPicks       from "./pages/Startuptoppicks";
import StartupPitchCorrector from "./pages/Startuppitchcorrector";
import StartupTransactions   from "./pages/Startuptransactions";
import ProtectedRoute from "./components/ProtectedRoute";
import Arbiter from "./pages/Arbiter";
import InvestorView from "./pages/InvestorView";
import StartupView  from "./pages/StartupView";

import SmartMatch  from "./pages/SmartMatch";
import Connections from "./pages/Connections";


/* Scroll to top on every route change */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Landing */}
          <Route path="/"                    element={<Home              />} />

          {/* Investor portal */}
          <Route path="/investor-login"      element={<InvestorLogin     />} />
          <Route path="/investor-forgot"     element={<ForgotPassword role="investor" />} />

          {/* Startup portal */}
          <Route path="/startup-login"       element={<StartupLogin      />} />
          <Route path="/startup-forgot"      element={<ForgotPassword role="startup"  />} />
          <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Dashboards */}
          <Route
            path="/investor-dashboard"
            element={
              <ProtectedRoute roleRequired="investor">
                <InvestorDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/investor-profile"         element={<ProtectedRoute roleRequired="investor"><InvestorProfile /></ProtectedRoute>} />
          <Route path="/investor-matching"        element={<ProtectedRoute roleRequired="investor"><InvestorMatching /></ProtectedRoute>} />
          <Route path="/investor-advisor"         element={<ProtectedRoute roleRequired="investor"><InvestorAdvisor /></ProtectedRoute>} />
          <Route path="/investor-cost-optimizer"  element={<ProtectedRoute roleRequired="investor"><InvestorCostOptimizer /></ProtectedRoute>} />
          <Route path="/investor-top-picks"       element={<ProtectedRoute roleRequired="investor"><InvestorTopPicks /></ProtectedRoute>} />
          <Route path="/investor-transactions"    element={<ProtectedRoute roleRequired="investor"><InvestorTransactions /></ProtectedRoute>} />
          <Route path="/investor-arbiter"         element={<ProtectedRoute roleRequired="investor"><Arbiter role="investor" /></ProtectedRoute>} />
          <Route
            path="/startup-dashboard"
            element={
              <ProtectedRoute roleRequired="startup">
                <StartupDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/startup-profile"         element={<ProtectedRoute roleRequired="startup"><StartupProfile /></ProtectedRoute>} />
          <Route path="/startup-matching"        element={<ProtectedRoute roleRequired="startup"><StartupMatching /></ProtectedRoute>} />
          <Route path="/startup-viability"       element={<ProtectedRoute roleRequired="startup"><StartupViability /></ProtectedRoute>} />
          <Route path="/startup-cost-optimizer"  element={<ProtectedRoute roleRequired="startup"><StartupCostOptimizer /></ProtectedRoute>} />
          <Route path="/startup-top-picks"       element={<ProtectedRoute roleRequired="startup"><StartupTopPicks /></ProtectedRoute>} />
          <Route path="/startup-pitch-corrector" element={<ProtectedRoute roleRequired="startup"><StartupPitchCorrector /></ProtectedRoute>} />
          <Route path="/startup-transactions"    element={<ProtectedRoute roleRequired="startup"><StartupTransactions /></ProtectedRoute>} />
          <Route path="/startup-arbiter"         element={<ProtectedRoute roleRequired="startup"><Arbiter role="startup" /></ProtectedRoute>} />
          <Route path="/investor-view/:investor_id" element={<InvestorView />} />
          <Route path="/startup-view/:startup_id"   element={<StartupView />} />
          <Route path="/investor-smart-match"  element={<ProtectedRoute roleRequired="investor"><SmartMatch role="investor" /></ProtectedRoute>} />
          <Route path="/investor-connections"  element={<ProtectedRoute roleRequired="investor"><Connections role="investor" /></ProtectedRoute>} />
          <Route path="/startup-smart-match"   element={<ProtectedRoute roleRequired="startup"><SmartMatch role="startup" /></ProtectedRoute>} />
          <Route path="/startup-connections"   element={<ProtectedRoute roleRequired="startup"><Connections role="startup" /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}