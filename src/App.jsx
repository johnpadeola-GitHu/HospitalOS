import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import AppLayout from "./layout/AppLayout";
import ModulePlaceholder from "./pages/ModulePlaceholder";
import NoAccess from "./pages/NoAccess";
import RegistrationADT from "./modules/patients/RegistrationADT";
import WardsBoard from "./modules/wards/WardsBoard";
import OutpatientClinic from "./modules/outpatient/OutpatientClinic";
import Laboratory from "./modules/lab/Laboratory";
import Alerts from "./modules/alerts/Alerts";
import Dashboard from "./modules/dashboard/Dashboard";
import Dispensing from "./modules/pharmacy/Dispensing";
import Inventory from "./modules/pharmacy/Inventory";
import Billing from "./modules/finance/Billing";
import Radiology from "./modules/radiology/Radiology";
import Emergency from "./modules/emergency/Emergency";
import Users from "./modules/system/Users";
import CSSD from "./modules/operations/CSSD";
import Biomedical from "./modules/operations/Biomedical";
import Fleet from "./modules/operations/Fleet";
import Analytics from "./modules/intelligence/Analytics";
import { ALL_ROUTES } from "./nav/navGroups";

// Routes with a real module built. Everything else falls back to the placeholder.
const MODULES = {
  "/": Dashboard,
  "/patients/adt": RegistrationADT,
  "/outpatient": OutpatientClinic,
  "/emergency": Emergency,
  "/wards": WardsBoard,
  "/lab": Laboratory,
  "/radiology": Radiology,
  "/alerts": Alerts,
  "/pharmacy/dispensing": Dispensing,
  "/pharmacy/inventory": Inventory,
  "/finance/billing": Billing,
  "/ops/cssd": CSSD,
  "/ops/biomedical": Biomedical,
  "/ops/fleet": Fleet,
  "/intelligence/analytics": Analytics,
  "/system/users": Users,
};

// Gate a route by its nav-group permission. If the role lacks it, show NoAccess.
function Guarded({ route }) {
  const { can } = useAuth();
  if (!can(route.groupId)) return <NoAccess group={route.groupLabel} />;
  const Built = MODULES[route.path];
  return Built ? <Built /> : <ModulePlaceholder title={route.label} group={route.groupLabel} />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {ALL_ROUTES.map((r) => (
              <Route key={r.id} path={r.path} element={<Guarded route={r} />} />
            ))}
            <Route path="*" element={<ModulePlaceholder title="Not found" group="" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
