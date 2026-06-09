import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { fmtEUR } from "@/lib/format";
import { useArticles, useUpsertArticle, type Article } from "@/hooks/queries/useCatalog";
import { Plus } from "lucide-react";

function ArticleDialog({ open, onOpenChange, article }: { open: boolean; onOpenChange: (o: boolean) => void; article?: Article | null }) {
  const upsert = useUpsertArticle();
  const [f, setF] = useState<Partial<Article>>({});
  useEffect(() => { if (open) setF(article ?? { unit: "Stk", vat_rate: 20, purchase_price: 0, sale_price: 0 }); }, [open, article]);
  const set = (k: keyof Article, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const num = (v: string) => (v === "" ? 0 : Number(v.replace(",", ".")));

  const save = async () => {
    if (!f.name) return toast.error("Bitte einen Artikelnamen angeben.");
    try { await upsert.mutateAsync(f); toast.success("Artikel gespeichert"); onOpenChange(false); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{article ? "Artikel bearbeiten" : "Artikel erstellen"}</DialogTitle></DialogHeader>
        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Informationen</TabsTrigger>
            <TabsTrigger value="kalk">Kalkulation</TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="grid grid-cols-2 gap-4 pt-3">
            <div className="space-y-1.5"><Label>Artikelname</Label><Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Artikelnummer</Label><Input value={f.article_number ?? ""} onChange={(e) => set("article_number", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Kategorie</Label><Input value={f.category ?? ""} onChange={(e) => set("category", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Einheit</Label><Input value={f.unit ?? ""} onChange={(e) => set("unit", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>EAN</Label><Input value={f.ean ?? ""} onChange={(e) => set("ean", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Hersteller</Label><Input value={f.manufacturer ?? ""} onChange={(e) => set("manufacturer", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Lieferant</Label><Input value={f.supplier ?? ""} onChange={(e) => set("supplier", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Lieferanten-Nr.</Label><Input value={f.supplier_number ?? ""} onChange={(e) => set("supplier_number", e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Beschreibung</Label><Textarea rows={3} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
          </TabsContent>
          <TabsContent value="kalk" className="grid grid-cols-2 gap-4 pt-3">
            <div className="space-y-1.5"><Label>Einkaufspreis (€)</Label><Input value={String(f.purchase_price ?? 0)} onChange={(e) => set("purchase_price", num(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Listenpreis (€)</Label><Input value={String(f.list_price ?? 0)} onChange={(e) => set("list_price", num(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Verkaufspreis VK (€)</Label><Input value={String(f.sale_price ?? 0)} onChange={(e) => set("sale_price", num(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>MwSt. (%)</Label><Input value={String(f.vat_rate ?? 20)} onChange={(e) => set("vat_rate", num(e.target.value))} /></div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={save} disabled={upsert.isPending}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Artikel() {
  const { data = [], isLoading } = useArticles();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Article | null>(null);

  const columns: Column<Article>[] = [
    { key: "article_number", header: "Artikelnummer", filterable: true, render: (r) => <span className="text-link">{r.article_number ?? "—"}</span> },
    { key: "name", header: "Name", filterable: true },
    { key: "category", header: "Kategorie", filterable: true },
    { key: "description", header: "Beschreibung", sortable: false },
    { key: "purchase_price", header: "EK", className: "text-right", render: (r) => fmtEUR(Number(r.purchase_price)) },
    { key: "sale_price", header: "VK VK1", className: "text-right", render: (r) => fmtEUR(Number(r.sale_price)) },
  ];

  return (
    <div>
      <PageHeader title="Artikel" subtitle="Verwaltung für Artikel"
        actions={<Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5"><Plus className="h-4 w-4" /> Artikel hinzufügen</Button>} />
      <DataTable data={data} columns={columns} loading={isLoading} getRowId={(r) => r.id}
        onRowClick={(r) => { setEdit(r); setOpen(true); }} />
      <ArticleDialog open={open} onOpenChange={setOpen} article={edit} />
    </div>
  );
}
