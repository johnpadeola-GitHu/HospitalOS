import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Login from "./auth/Login";
import Platform from "./modules/platform/Platform";
import AppLayout from "./layout/AppLayout";
import ModulePlaceholder from "./pages/ModulePlaceholder";
import NoAccess from "./pages/NoAccess";
import RegistrationADT from "./modules/patients/RegistrationADT";
import Records from "./modules/records/Records";
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
import CriticalCare from "./modules/critical-care/CriticalCare";
import BloodBank from "./modules/blood-bank/BloodBank";
import Maternity from "./modules/maternity/Maternity";
import Specialties from "./modules/specialties/Specialties";
import Oncology from "./modules/oncology/Oncology";
import Reports from "./modules/intelligence/Reports";
import Forecasting from "./modules/intelligence/Forecasting";
import Scheduling from "./modules/operations/Scheduling";
import Facility from "./modules/operations/Facility";
import Support from "./modules/operations/Support";
import Visitor from "./modules/operations/Visitor";
import Facilities from "./modules/system/Facilities";
import Settings from "./modules/system/Settings";
import Security from "./modules/system/Security";
import SysDocuments from "./modules/system/Documents";
import Integration from "./modules/system/Integration";
import Training from "./modules/academic/Training";
import Logbooks from "./modules/academic/Logbooks";
import CME from "./modules/academic/CME";
import Research from "./modules/academic/Research";
import Ethics from "./modules/academic/Ethics";
import Surveillance from "./modules/public-health/Surveillance";
import Immunisation from "./modules/public-health/Immunisation";
import Outreach from "./modules/public-health/Outreach";
import PHReporting from "./modules/public-health/Reporting";
import Radiotherapy from "./modules/radiotherapy/Radiotherapy";
import Rehab from "./modules/rehab/Rehab";
import POCT from "./modules/lab/POCT";
import Help from "./modules/help/Help";
import Instruments from "./modules/instruments/Instruments";
import Formulary from "./modules/pharmacy/Formulary";
import Procurement from "./modules/finance/Procurement";
import Stores from "./modules/finance/Stores";
import MyPatients from "./modules/patients/MyPatients";
import Worklist from "./modules/patients/Worklist";
import Theatre from "./modules/theatre/Theatre";
import Payments from "./modules/finance/Payments";
import Claims from "./modules/finance/Claims";
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
  "/records": Records,
  "/outpatient": OutpatientClinic,
  "/emergency": Emergency,
  "/critical-care": CriticalCare,
  "/theatre": Theatre,
  "/maternity": Maternity,
  "/specialties": Specialties,
  "/oncology": Oncology,
  "/intelligence/reports": Reports,
  "/intelligence/forecasting": Forecasting,
  "/ops/scheduling": Scheduling,
  "/ops/facility": Facility,
  "/ops/support": Support,
  "/ops/visitor": Visitor,
  "/system/facilities": Facilities,
  "/system/settings": Settings,
  "/system/security": Security,
  "/system/documents": SysDocuments,
  "/system/integration": Integration,
  "/academic/training": Training,
  "/academic/logbooks": Logbooks,
  "/academic/cme": CME,
  "/academic/research": Research,
  "/academic/ethics": Ethics,
  "/public-health/surveillance": Surveillance,
  "/public-health/immunisation": Immunisation,
  "/public-health/outreach": Outreach,
  "/public-health/reporting": PHReporting,
  "/radiotherapy": Radiotherapy,
  "/rehab": Rehab,
  "/poct": POCT,
  "/help": Help,
  "/instruments": Instruments,
  "/pharmacy/formulary": Formulary,
  "/finance/procurement": Procurement,
  "/finance/stores": Stores,
  "/patients/mine": MyPatients,
  "/worklist": Worklist,
  "/wards": WardsBoard,
  "/lab": Laboratory,
  "/blood-bank": BloodBank,
  "/radiology": Radiology,
  "/alerts": Alerts,
  "/pharmacy/dispensing": Dispensing,
  "/pharmacy/inventory": Inventory,
  "/finance/billing": Billing,
  "/finance/payments": Payments,
  "/finance/claims": Claims,
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

function Shell() {
  const { signedIn } = useAuth();
  if (!signedIn) return <Login />;
  return (
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
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
