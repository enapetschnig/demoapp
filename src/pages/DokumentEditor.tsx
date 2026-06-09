import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useContacts } from "@/hooks/queries/useContacts";
import {
  useDocument, useSaveDocument, useFinalizeDocument, useCatalogSearch, type SaveItem,
} from "@/hooks/queries/useDocuments";
import { calcDocument, type CalcItem } from "@/lib/documentCalculations";
import { downloadDocumentPdf, type PdfItem } from "@/lib/documentPdf";
import { DOC_TYPES, getDocConfig, docLabel } from "@/lib/documentTypes";
import { fmtEUR, fmtNumber, toISODate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, CheckCircle2, FileDown, Plus, Trash2, Search, Loader2 } from "lucide-react";

interface EItem {
  key: string; kind: "artikel" | "leistung" | "titel" | "text";
  article_id?: string | null; service_id?: string | null;
  name: string; description?: string; quantity: number; unit?: string;
  unit_price: number; purchase_price?: number; discount_percent?: number; vat_rate: number; time_minutes?: number;
}

let _k = 0;
const nk = () => `i${++_k}`;

export default function DokumentEditor() {
  const { id } = useParams();
  const isNew = !id || id === "neu";
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { company } = useAuth();
  const { data: contacts = [] } = useContacts();
  const saveDoc = useSaveDocument();
  const finalize = useFinalizeDocument();

  const { data: loaded } = useDocument(isNew ? undefined : id);

  const [docId, setDocId] = useState<string | null>(isNew ? null : id!);
  const [baseType, setBaseType] = useState<string>(sp.get("type") ?? "angebot");
  const [customerId, setCustomerId] = useState<string>(sp.get("customer") ?? "");
  const [projectId] = useState<string>(sp.get("project") ?? "");
  const [subject, setSubject] = useState("");
  const [docDate, setDocDate] = useState(toISODate());
  const [introText, setIntroText] = useState("");
  const [outroText, setOutroText] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [items, setItems] = useState<EItem[]>([]);
  const [number, setNumber] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("entwurf");
  const [initialized, setInitialized] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [search, setSearch] = useState("");

  // Standard-Textbausteine laden
  const { data: texts = [] } = useQuery({
    queryKey: ["doc-texts", company?.id],
    enabled: !!company?.id,
    queryFn: async () => (await supabase.from("document_texts").select("*").eq("company_id", company!.id)).data ?? [],
  });
  const catalog = useCatalogSearch(search);

  // Bestehendes Dokument laden
  useEffect(() => {
    if (!isNew && loaded?.doc && !initialized) {
      const d = loaded.doc;
      setDocId(d.id); setBaseType(d.base_type); setCustomerId(d.customer_id ?? "");
      setSubject(d.subject ?? ""); setDocDate(d.doc_date); setIntroText(d.intro_text ?? "");
      setOutroText(d.outro_text ?? ""); setDiscountPercent(Number(d.discount_percent ?? 0));
      setNumber(d.number); setStatus(d.status);
      setItems((loaded.items ?? []).map((it) => ({
        key: nk(), kind: it.kind as EItem["kind"], article_id: it.article_id, service_id: it.service_id,
        name: it.name ?? "", description: it.description ?? "", quantity: Number(it.quantity ?? 1),
        unit: it.unit ?? "", unit_price: Number(it.unit_price ?? 0), purchase_price: Number(it.purchase_price ?? 0),
        discount_percent: Number(it.discount_percent ?? 0), vat_rate: Number(it.vat_rate ?? 20), time_minutes: it.time_minutes ?? 0,
      })));
      setInitialized(true);
    }
    // Neues Dokument: Einleitungstext vorbelegen
    if (isNew && !initialized && texts.length) {
      const intro = texts.find((t) => t.base_type === baseType && t.placement === "einleitung");
      const outro = texts.find((t) => t.base_type === baseType && t.placement === "abschluss");
      if (intro) setIntroText(intro.content ?? "");
      if (outro) setOutroText(outro.content ?? "");
      setInitialized(true);
    }
  }, [isNew, loaded, initialized, texts, baseType]);

  const cfg = getDocConfig(baseType);
  const calcItems: CalcItem[] = items.map((i) => ({
    kind: i.kind, quantity: i.quantity, unit_price: i.unit_price, purchase_price: i.purchase_price,
    discount_percent: i.discount_percent, vat_rate: i.vat_rate, time_minutes: i.time_minutes,
  }));
  const calc = useMemo(() => calcDocument(calcItems, { discountPercent }), [calcItems, discountPercent]);

  const customer = contacts.find((c) => c.id === customerId);
  const updateItem = (key: string, patch: Partial<EItem>) => setItems((arr) => arr.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  const removeItem = (key: string) => setItems((arr) => arr.filter((i) => i.key !== key));
  const addEmpty = (kind: EItem["kind"]) =>
    setItems((arr) => [...arr, { key: nk(), kind, name: "", quantity: 1, unit: kind === "leistung" ? "Std" : "Stk", unit_price: 0, vat_rate: cfg.defaultVatRate }]);

  const addArticle = (a: { id: string; name: string; unit: string | null; sale_price: number | null; purchase_price: number | null; vat_rate: number | null }) =>
    setItems((arr) => [...arr, { key: nk(), kind: "artikel", article_id: a.id, name: a.name, quantity: 1, unit: a.unit ?? "Stk", unit_price: Number(a.sale_price ?? 0), purchase_price: Number(a.purchase_price ?? 0), vat_rate: Number(a.vat_rate ?? 20) }]);
  const addService = (s: { id: string; name: string; unit: string | null; price: number | null; vat_rate: number | null; time_minutes: number | null }) =>
    setItems((arr) => [...arr, { key: nk(), kind: "leistung", service_id: s.id, name: s.name, quantity: 1, unit: s.unit ?? "Std", unit_price: Number(s.price ?? 0), vat_rate: Number(s.vat_rate ?? 20), time_minutes: s.time_minutes ?? 60 }]);

  const buildPayload = () => ({
    id: docId ?? undefined, base_type: baseType, customer_id: customerId || null,
    project_id: projectId || null, subject, doc_date: docDate,
    intro_text: introText, outro_text: outroText, discount_percent: discountPercent,
    items: items.map<SaveItem>((i) => ({
      kind: i.kind, article_id: i.article_id ?? null, service_id: i.service_id ?? null,
      name: i.name, description: i.description, quantity: i.quantity, unit: i.unit,
      unit_price: i.unit_price, purchase_price: i.purchase_price, discount_percent: i.discount_percent,
      vat_rate: i.vat_rate, time_minutes: i.time_minutes,
    })),
  });

  const save = async (): Promise<string | null> => {
    try {
      const newId = await saveDoc.mutateAsync(buildPayload());
      setDocId(newId);
      if (isNew) navigate(`/dokumente/${newId}`, { replace: true });
      toast.success("Gespeichert");
      return newId;
    } catch (e) { toast.error((e as Error).message); return null; }
  };

  const doFinalize = async () => {
    const sid = await save();
    if (!sid) return;
    try {
      const num = await finalize.mutateAsync(sid);
      setNumber(num); setStatus("erstellt");
      toast.success(`Abgeschlossen: ${num}`);
    } catch (e) { toast.error((e as Error).message); }
  };

  const exportPdf = async () => {
    setPdfBusy(true);
    try {
      let pos = 0;
      const pdfItems: PdfItem[] = items.map((i) => ({
        position: i.kind === "titel" ? 0 : ++pos, name: i.name, description: i.description,
        quantity: i.quantity, unit: i.unit, unit_price: i.unit_price,
        line_net: i.kind === "artikel" || i.kind === "leistung" ? i.quantity * i.unit_price * (1 - (i.discount_percent ?? 0) / 100) : 0,
        kind: i.kind,
      }));
      await downloadDocumentPdf({
        company: {
          name: company?.name ?? "Mein Betrieb", street: company?.address_street ?? undefined,
          zip: company?.address_zip ?? undefined, city: company?.address_city ?? undefined,
          phone: company?.phone ?? undefined, logo_url: company?.logo_url,
          iban: company?.iban ?? undefined, bic: company?.bic ?? undefined, vat_id: company?.vat_id ?? undefined,
        },
        recipient: {
          name: [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || customer?.company_name || "",
          company: customer?.type === "firma" ? customer?.company_name ?? undefined : undefined,
          street: customer?.address_street ?? undefined, zip: customer?.address_zip ?? undefined,
          city: customer?.address_city ?? undefined, customerNumber: customer?.customer_number ?? undefined,
        },
        docTitle: docLabel(baseType), number: number ?? "ENTWURF",
        date: new Intl.DateTimeFormat("de-AT").format(new Date(`${docDate}T12:00:00`)),
        subject, introHtml: introText, outroHtml: outroText,
        items: pdfItems, calc, showPrices: cfg.showPositions && baseType !== "lieferschein",
      }, `${docLabel(baseType)}_${number ?? "Entwurf"}.pdf`);
    } catch (e) { toast.error("PDF-Fehler: " + (e as Error).message); }
    finally { setPdfBusy(false); }
  };

  const isFinalized = status !== "entwurf" && status !== "in_bearbeitung";
  const contactLabel = (c: typeof contacts[number]) =>
    [c.first_name, c.last_name].filter(Boolean).join(" ") || c.company_name || c.customer_number || "Kontakt";

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate("/dokumente")}>
          <ArrowLeft className="h-4 w-4" /> Dokumente
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {number && <Badge variant="default">{number}</Badge>}
          <Badge variant="secondary">{status}</Badge>
          <Button variant="secondary" className="gap-1.5" onClick={save} disabled={saveDoc.isPending}>
            <Save className="h-4 w-4" /> Speichern
          </Button>
          <Button variant="secondary" className="gap-1.5" onClick={exportPdf} disabled={pdfBusy}>
            {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} PDF
          </Button>
          {!isFinalized && (
            <Button className="gap-1.5" onClick={doFinalize} disabled={finalize.isPending}>
              <CheckCircle2 className="h-4 w-4" /> Dokument abschließen
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        {/* Dokumentvorschau / Bearbeitung */}
        <Card className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Dokumenttyp</Label>
              <Select value={baseType} onValueChange={setBaseType} disabled={isFinalized}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {Object.values(DOC_TYPES).map((t) => <SelectItem key={t.base} value={t.base}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Kunde</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Kunde" /></SelectTrigger>
                <SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={c.id}>{contactLabel(c)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Datum</Label><Input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Betreff (BV)</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
          </div>

          <div className="space-y-1.5">
            <Label>Einleitungstext</Label>
            <RichTextEditor value={introText} onChange={setIntroText} rows={4} />
          </div>

          {/* Positionen */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Positionen</Label>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" onClick={() => addEmpty("artikel")}><Plus className="mr-1 h-3 w-3" />Artikel</Button>
                <Button size="sm" variant="outline" onClick={() => addEmpty("leistung")}><Plus className="mr-1 h-3 w-3" />Leistung</Button>
                <Button size="sm" variant="outline" onClick={() => addEmpty("titel")}><Plus className="mr-1 h-3 w-3" />Titel</Button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs">
                  <tr>
                    <th className="w-10 p-2">Pos</th><th className="w-20 p-2">Menge</th><th className="w-20 p-2">Einheit</th>
                    <th className="p-2">Bezeichnung</th><th className="w-28 p-2 text-right">Einzelpreis</th>
                    <th className="w-16 p-2 text-right">MwSt</th><th className="w-28 p-2 text-right">Gesamt</th><th className="w-8 p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">Noch keine Positionen — rechts aus dem Artikelstamm hinzufügen.</td></tr>}
                  {items.map((it, idx) => it.kind === "titel" || it.kind === "text" ? (
                    <tr key={it.key} className="border-t bg-muted/20">
                      <td className="p-2"></td>
                      <td colSpan={5} className="p-2">
                        <Input value={it.name} placeholder={it.kind === "titel" ? "Titel" : "Text"} onChange={(e) => updateItem(it.key, { name: e.target.value })} className="h-8 font-medium" />
                      </td>
                      <td></td>
                      <td className="p-2"><button onClick={() => removeItem(it.key)}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></button></td>
                    </tr>
                  ) : (
                    <tr key={it.key} className="border-t align-top">
                      <td className="p-2 text-muted-foreground">{items.slice(0, idx + 1).filter((x) => x.kind === "artikel" || x.kind === "leistung").length}</td>
                      <td className="p-2"><Input type="number" value={it.quantity} onChange={(e) => updateItem(it.key, { quantity: Number(e.target.value) || 0 })} className="h-8" /></td>
                      <td className="p-2"><Input value={it.unit ?? ""} onChange={(e) => updateItem(it.key, { unit: e.target.value })} className="h-8" /></td>
                      <td className="p-2">
                        <Input value={it.name} onChange={(e) => updateItem(it.key, { name: e.target.value })} className="h-8" />
                        <Input value={it.description ?? ""} placeholder="Beschreibung (optional)" onChange={(e) => updateItem(it.key, { description: e.target.value })} className="mt-1 h-7 text-xs" />
                      </td>
                      <td className="p-2"><Input type="number" value={it.unit_price} onChange={(e) => updateItem(it.key, { unit_price: Number(e.target.value) || 0 })} className="h-8 text-right" /></td>
                      <td className="p-2"><Input type="number" value={it.vat_rate} onChange={(e) => updateItem(it.key, { vat_rate: Number(e.target.value) || 0 })} className="h-8 text-right" /></td>
                      <td className="p-2 text-right font-medium">{fmtEUR(it.quantity * it.unit_price * (1 - (it.discount_percent ?? 0) / 100))}</td>
                      <td className="p-2"><button onClick={() => removeItem(it.key)}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summen */}
            <div className="mt-3 ml-auto w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Nettobetrag</span><span>{fmtEUR(calc.net)}</span></div>
              {calc.vatGroups.map((g) => (
                <div key={g.rate} className="flex justify-between text-muted-foreground"><span>zzgl. {fmtNumber(g.rate, 0)}% MwSt.</span><span>{fmtEUR(g.vat)}</span></div>
              ))}
              <div className="flex justify-between border-t pt-1 text-base font-semibold"><span>Gesamtsumme</span><span>{fmtEUR(calc.gross)}</span></div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Schlusstext</Label>
            <RichTextEditor value={outroText} onChange={setOutroText} rows={3} />
          </div>
        </Card>

        {/* Seitenpanel */}
        <div className="space-y-4">
          <Card className="p-4">
            <Tabs defaultValue="artikel">
              <TabsList className="w-full">
                <TabsTrigger value="artikel" className="flex-1">Artikel & Leistungen</TabsTrigger>
                <TabsTrigger value="texte" className="flex-1">Texte & Titel</TabsTrigger>
              </TabsList>
              <TabsContent value="artikel" className="pt-3">
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Artikel oder Leistung" className="pl-8" />
                </div>
                <div className="max-h-80 space-y-1 overflow-y-auto">
                  {catalog.data?.services.map((s) => (
                    <button key={s.id} onClick={() => addService(s)} className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-muted">
                      <span><Badge variant="outline" className="mr-1 text-[10px]">Leistung</Badge>{s.name}</span>
                      <span className="text-muted-foreground">{fmtEUR(Number(s.price))}</span>
                    </button>
                  ))}
                  {catalog.data?.articles.map((a) => (
                    <button key={a.id} onClick={() => addArticle(a)} className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-muted">
                      <span><Badge variant="outline" className="mr-1 text-[10px]">Artikel</Badge>{a.name}</span>
                      <span className="text-muted-foreground">{fmtEUR(Number(a.sale_price))}</span>
                    </button>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="texte" className="pt-3">
                <div className="space-y-1">
                  {texts.map((t) => (
                    <button key={t.id} onClick={() => {
                      if (t.placement === "abschluss") setOutroText(t.content ?? "");
                      else setIntroText(t.content ?? "");
                      toast.success(`"${t.title}" eingefügt`);
                    }} className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-muted">
                      <span>{t.title}</span>
                      <Badge variant="outline" className="text-[10px]">{t.placement ?? t.kind}</Badge>
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Übersicht */}
          <Card className="p-4 text-sm">
            <h4 className="mb-2 font-medium">Übersicht</h4>
            <div className="space-y-1 text-muted-foreground">
              <Row l="Positionen" v={String(calc.articleCount + calc.serviceCount)} />
              <Row l="Artikel" v={String(calc.articleCount)} />
              <Row l="Leistungen" v={String(calc.serviceCount)} />
              <Row l="EK Material" v={fmtEUR(calc.ekTotal)} />
              <Row l="Arbeitszeit" v={`${fmtNumber(calc.workMinutes / 60, 1)} h`} />
              <Row l="Gesamt netto" v={fmtEUR(calc.net)} />
              <Row l="Ertrag" v={fmtEUR(calc.profit)} />
              <Row l="Gesamt brutto" v={fmtEUR(calc.gross)} bold />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ l, v, bold }: { l: string; v: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "border-t pt-1 font-semibold text-foreground" : ""}`}><span>{l}</span><span>{v}</span></div>;
}
