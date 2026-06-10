import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { openCreateDocument } from "@/components/CreateDocumentDialog";
import {
  Gauge, FilePen, ListChecks, Users, CalendarDays, BookOpen, IdCard, Settings, Plus,
} from "lucide-react";

function useCount(table: "contacts" | "projects" | "documents") {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["count", table, company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("company_id", company!.id);
      return count ?? 0;
    },
  });
}

function DashCard({
  icon: Icon, title, children, onOpen, onCreate, openLabel = "Anzeigen",
}: {
  icon: React.ElementType; title: string; children: React.ReactNode;
  onOpen?: () => void; onCreate?: () => void; openLabel?: string;
}) {
  return (
    <Card className="flex flex-col items-center p-6 text-center">
      <Icon className="mb-2 h-8 w-8 text-muted-foreground" />
      <h3 className="text-base font-medium">{title}</h3>
      <div className="my-2 h-px w-10 bg-border" />
      <div className="flex-1 text-sm text-muted-foreground">{children}</div>
      <div className="mt-4 flex items-center gap-2">
        {onOpen && <Button variant="secondary" size="sm" onClick={onOpen}>{openLabel}</Button>}
        {onCreate && (
          <Button variant="secondary" size="icon" className="h-8 w-8" onClick={onCreate}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const contacts = useCount("contacts");
  const projects = useCount("projects");

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-light">Übersicht</h1>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashCard icon={Gauge} title="Projekte" onOpen={() => navigate("/projekte")} onCreate={() => navigate("/projekte/neu")}>
          Es liegen <span className="text-destructive">0</span> überfällige Projekte vor.
          <br />
          Es befinden sich <span className="text-success">{projects.data ?? 0}</span> aktive Projekte in der Pipeline.
        </DashCard>

        <DashCard icon={FilePen} title="Dokumente" onOpen={() => navigate("/dokumente")} onCreate={openCreateDocument}>
          Erstellen Sie Angebote oder Rechnungen und versenden Sie diese mit einem Klick per E-Mail an den Kunden.
        </DashCard>

        <DashCard icon={ListChecks} title="Aufgaben" onOpen={() => navigate("/aufgaben")} onCreate={() => navigate("/aufgaben?neu=1")}>
          Behalten Sie Ihre offenen Aufgaben im Blick.
        </DashCard>

        <DashCard icon={Users} title="Kontakte" onOpen={() => navigate("/kontakte")} onCreate={() => navigate("/kontakte/neu")}>
          Sie haben <span className="text-success">{contacts.data ?? 0}</span> Kontakte in Ihrem Adressbuch.
        </DashCard>

        <DashCard icon={CalendarDays} title="Einsatzplanung" onOpen={() => navigate("/planung/plantafel")} openLabel="Plantafel anzeigen">
          Planen Sie Ihre Mitarbeiter und Fahrzeuge auf Projekte und behalten Sie den Überblick.
        </DashCard>

        <DashCard icon={BookOpen} title="Buchhaltung" onOpen={() => navigate("/buchhaltung/rechnungen")} openLabel="Zur Buchhaltung">
          Behalten Sie Ihre Rechnungen im Blick und verwalten Sie Ihre Belege.
        </DashCard>

        <DashCard icon={IdCard} title="Mitarbeiterverwaltung" onOpen={() => navigate("/mitarbeiter")} openLabel="Mitarbeiter anzeigen">
          Verwalten Sie Mitarbeiter, Arbeitszeiten und Abwesenheiten.
        </DashCard>

        <DashCard icon={Settings} title="Einstellungen" onOpen={() => navigate("/einstellungen/firmenprofil")} openLabel="Zu den Einstellungen">
          Verwalten Sie Ihre firmeninternen Daten, Mitarbeiter und Rechte.
        </DashCard>
      </div>
    </div>
  );
}
