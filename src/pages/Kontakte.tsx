import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { ContactDialog } from "@/components/ContactDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContacts, type Contact } from "@/hooks/queries/useContacts";
import { Plus, User, Building2 } from "lucide-react";

const TABS = [
  { v: "alle", l: "Alle" },
  { v: "kunde", l: "Kunden" },
  { v: "lieferant", l: "Lieferanten" },
  { v: "partner", l: "Partner" },
  { v: "ansprechpartner", l: "Ansprechpartner" },
  { v: "archiv", l: "Archiv" },
];

const CAT_LABEL: Record<string, string> = {
  kunde: "Kunde", lieferant: "Lieferant", partner: "Partner", ansprechpartner: "Ansprechpartner",
};

export default function Kontakte({ autoNew }: { autoNew?: boolean }) {
  const navigate = useNavigate();
  const { data = [], isLoading } = useContacts();
  const [tab, setTab] = useState("alle");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => { if (autoNew) setDialogOpen(true); }, [autoNew]);

  const rows = useMemo(() => {
    if (tab === "alle") return data.filter((c) => !c.is_archived);
    if (tab === "archiv") return data.filter((c) => c.is_archived);
    return data.filter((c) => c.category === tab && !c.is_archived);
  }, [data, tab]);

  const columns: Column<Contact>[] = [
    {
      key: "type", header: "Typ", width: "56px", sortable: false,
      render: (r) => r.type === "firma"
        ? <Building2 className="h-4 w-4 text-muted-foreground" />
        : <User className="h-4 w-4 text-muted-foreground" />,
    },
    { key: "customer_number", header: "Kundennummer", filterable: true,
      render: (r) => <span className="text-link">{r.customer_number ?? "—"}</span> },
    { key: "company_name", header: "Firmenname", filterable: true },
    { key: "first_name", header: "Vorname", filterable: true,
      render: (r) => <span className="text-link">{r.first_name ?? ""}</span> },
    { key: "last_name", header: "Nachname", filterable: true,
      render: (r) => <span className="text-link">{r.last_name ?? ""}</span> },
    { key: "email", header: "E-Mail", filterable: true },
    { key: "category", header: "Kategorie",
      render: (r) => <Badge variant="secondary">{CAT_LABEL[r.category] ?? r.category}</Badge> },
    { key: "address_city", header: "Ort", filterable: true },
  ];

  return (
    <div>
      <PageHeader
        title="Kontakte"
        subtitle="CRM / Adressbuch"
        actions={
          <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Kontakt
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          {TABS.map((t) => <TabsTrigger key={t.v} value={t.v}>{t.l}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => navigate(`/kontakte/${r.id}`)}
      />

      <ContactDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
