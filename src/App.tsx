import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";

import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Placeholder from "@/pages/Placeholder";
import Kontakte from "@/pages/Kontakte";
import KontaktDetail from "@/pages/KontaktDetail";
import Artikel from "@/pages/Artikel";
import Leistungen from "@/pages/Leistungen";
import Verkaufspreise from "@/pages/Verkaufspreise";
import Projekte from "@/pages/Projekte";
import ProjektDetail from "@/pages/ProjektDetail";
import Dokumente from "@/pages/Dokumente";
import DokumentEditor from "@/pages/DokumentEditor";
import Auswertungen from "@/pages/Auswertungen";
// Belege & Aufträge
import Aufgaben from "@/pages/Aufgaben";
import Auftraege from "@/pages/Auftraege";
import Wartungsvertraege from "@/pages/Wartungsvertraege";
import Lager from "@/pages/Lager";
import Lagerbuch from "@/pages/Lagerbuch";
import LagerBewegungen from "@/pages/LagerBewegungen";
import Profil from "@/pages/Profil";
// Buchhaltung
import Rechnungen from "@/pages/buchhaltung/Rechnungen";
import Belege from "@/pages/buchhaltung/Belege";
import Mahnungen from "@/pages/buchhaltung/Mahnungen";
import BuchhaltungEinstellungen from "@/pages/buchhaltung/BuchhaltungEinstellungen";
// Mitarbeiter / Zeit
import Mitarbeiter from "@/pages/mitarbeiter/Mitarbeiter";
import Lohngruppen from "@/pages/mitarbeiter/Lohngruppen";
import Abwesenheiten from "@/pages/mitarbeiter/Abwesenheiten";
import Zeiterfassung from "@/pages/mitarbeiter/Zeiterfassung";
import Zeitkategorien from "@/pages/mitarbeiter/Zeitkategorien";
import Pausenverwaltung from "@/pages/mitarbeiter/Pausenverwaltung";
// Planung
import Termine from "@/pages/planung/Termine";
import Kalender from "@/pages/planung/Kalender";
import Plantafel from "@/pages/planung/Plantafel";
import PlanungEinstellungen from "@/pages/planung/PlanungEinstellungen";
// Admin
import Firmenprofil from "@/pages/admin/Firmenprofil";
import Seitendarstellung from "@/pages/admin/Seitendarstellung";
import Niederlassungen from "@/pages/admin/Niederlassungen";
import Quellen from "@/pages/admin/Quellen";
import Ordner from "@/pages/admin/Ordner";
import EigeneFelder from "@/pages/admin/EigeneFelder";
import Checklisten from "@/pages/admin/Checklisten";
import EmailTemplates from "@/pages/admin/EmailTemplates";
import Projekttypen from "@/pages/admin/Projekttypen";
import Nummernkreise from "@/pages/admin/Nummernkreise";
import Zugriffsrechte from "@/pages/admin/Zugriffsrechte";
import Mailserver from "@/pages/admin/Mailserver";
import Informationsdokumente from "@/pages/admin/Informationsdokumente";
// Dokumente-Config
import TexteTitel from "@/pages/dokumente/TexteTitel";
import Vorlagen from "@/pages/dokumente/Vorlagen";
import Konfigurator from "@/pages/dokumente/Konfigurator";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

const P = (title: string, subtitle?: string) => <Placeholder title={title} subtitle={subtitle} />;

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/auswertungen" element={<Auswertungen />} />

                <Route path="/kontakte" element={<Kontakte />} />
                <Route path="/kontakte/neu" element={<Kontakte autoNew />} />
                <Route path="/kontakte/:id" element={<KontaktDetail />} />

                <Route path="/projekte" element={<Projekte />} />
                <Route path="/projekte/neu" element={<Projekte autoNew />} />
                <Route path="/projekte/:id" element={<ProjektDetail />} />

                <Route path="/dokumente" element={<Dokumente />} />
                <Route path="/dokumente/neu" element={<DokumentEditor />} />
                <Route path="/dokumente/:id" element={<DokumentEditor />} />
                <Route path="/dokumente/texte" element={<TexteTitel />} />
                <Route path="/dokumente/vorlagen" element={<Vorlagen />} />
                <Route path="/dokumente/konfigurator" element={<Konfigurator />} />

                <Route path="/artikel" element={<Artikel />} />
                <Route path="/leistungen" element={<Leistungen />} />
                <Route path="/verkaufspreise" element={<Verkaufspreise />} />

                <Route path="/lager" element={<Lager />} />
                <Route path="/lager/einbuchungen" element={<LagerBewegungen type="einbuchung" />} />
                <Route path="/lager/ausbuchungen" element={<LagerBewegungen type="ausbuchung" />} />
                <Route path="/lager/lagerbuch" element={<Lagerbuch />} />

                <Route path="/wartungsvertraege" element={<Wartungsvertraege />} />
                <Route path="/auftraege" element={<Auftraege />} />
                <Route path="/aufgaben" element={<Aufgaben />} />

                <Route path="/planung/termine" element={<Termine />} />
                <Route path="/planung/kalender" element={<Kalender />} />
                <Route path="/planung/plantafel" element={<Plantafel />} />
                <Route path="/planung/einstellungen" element={<PlanungEinstellungen />} />

                <Route path="/buchhaltung/rechnungen" element={<Rechnungen />} />
                <Route path="/buchhaltung/belege" element={<Belege />} />
                <Route path="/buchhaltung/mahnungen" element={<Mahnungen />} />
                <Route path="/buchhaltung/einstellungen" element={<BuchhaltungEinstellungen />} />

                <Route path="/profil" element={<Profil />} />

                <Route path="/mitarbeiter" element={<Mitarbeiter />} />
                <Route path="/mitarbeiter/abwesenheiten" element={<Abwesenheiten />} />
                <Route path="/mitarbeiter/zeiterfassung" element={<Zeiterfassung />} />
                <Route path="/mitarbeiter/zeitkategorien" element={<Zeitkategorien />} />
                <Route path="/mitarbeiter/pausen" element={<Pausenverwaltung />} />
                <Route path="/mitarbeiter/lohngruppen" element={<Lohngruppen />} />

                <Route path="/einstellungen/firmenprofil" element={<Firmenprofil />} />
                <Route path="/einstellungen/darstellung" element={<Seitendarstellung />} />
                <Route path="/einstellungen/niederlassungen" element={<Niederlassungen />} />
                <Route path="/einstellungen/email-templates" element={<EmailTemplates />} />
                <Route path="/einstellungen/infodokumente" element={<Informationsdokumente />} />
                <Route path="/einstellungen/zugriffsrechte" element={<Zugriffsrechte />} />
                <Route path="/einstellungen/projekttypen" element={<Projekttypen />} />
                <Route path="/einstellungen/nummernkreise" element={<Nummernkreise />} />
                <Route path="/einstellungen/ordner" element={<Ordner />} />
                <Route path="/einstellungen/checklisten" element={<Checklisten />} />
                <Route path="/einstellungen/quellen" element={<Quellen />} />
                <Route path="/einstellungen/mailserver" element={<Mailserver />} />
                <Route path="/einstellungen/eigene-felder" element={<EigeneFelder />} />

                <Route path="*" element={P("Seite nicht gefunden")} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
