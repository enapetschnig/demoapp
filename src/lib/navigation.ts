import {
  LayoutGrid, PieChart, Contact, FolderKanban, FileText, List, Boxes,
  ClipboardList, Briefcase, CheckSquare, CalendarDays, BookOpen, User,
  Users, Settings, type LucideIcon,
} from "lucide-react";

export interface NavSub {
  label: string;
  to: string;
}
export interface NavItem {
  label: string;
  icon: LucideIcon;
  to?: string;
  children?: NavSub[];
}

// Hauptnavigation laut Anforderungsdokument (Abschnitt 1).
export const NAV: NavItem[] = [
  { label: "Übersicht", icon: LayoutGrid, to: "/" },
  { label: "Auswertungen", icon: PieChart, to: "/auswertungen" },
  { label: "Kontakte", icon: Contact, to: "/kontakte" },
  {
    label: "Projekte", icon: FolderKanban,
    children: [
      { label: "Alle Projekte", to: "/projekte" },
      { label: "Überfällige Projekte", to: "/projekte?filter=ueberfaellig" },
      { label: "Alle Offenen", to: "/projekte?filter=offen" },
    ],
  },
  {
    label: "Dokumente", icon: FileText,
    children: [
      { label: "Dokumentenübersicht", to: "/dokumente" },
      { label: "Texte & Titel", to: "/dokumente/texte" },
      { label: "Vorlagen", to: "/dokumente/vorlagen" },
      { label: "Konfigurator", to: "/dokumente/konfigurator" },
    ],
  },
  {
    label: "Artikelstamm", icon: List,
    children: [
      { label: "Artikel", to: "/artikel" },
      { label: "Leistungen", to: "/leistungen" },
      { label: "Verkaufspreise", to: "/verkaufspreise" },
    ],
  },
  {
    label: "Lager", icon: Boxes,
    children: [
      { label: "Lagerartikel", to: "/lager" },
      { label: "Einbuchungen", to: "/lager/einbuchungen" },
      { label: "Ausbuchungen", to: "/lager/ausbuchungen" },
      { label: "Lagerbuch", to: "/lager/lagerbuch" },
    ],
  },
  { label: "Wartungsverträge", icon: ClipboardList, to: "/wartungsvertraege" },
  {
    label: "Aufträge", icon: Briefcase,
    children: [
      { label: "Offen", to: "/auftraege?status=offen" },
      { label: "Alle", to: "/auftraege" },
      { label: "Zugewiesen", to: "/auftraege?status=zugewiesen" },
      { label: "Erledigt", to: "/auftraege?status=erledigt" },
    ],
  },
  { label: "Aufgaben", icon: CheckSquare, to: "/aufgaben" },
  {
    label: "Planung", icon: CalendarDays,
    children: [
      { label: "Termine", to: "/planung/termine" },
      { label: "Kalender", to: "/planung/kalender" },
      { label: "Plantafel", to: "/planung/plantafel" },
      { label: "Einstellungen", to: "/planung/einstellungen" },
    ],
  },
  {
    label: "Buchhaltung", icon: BookOpen,
    children: [
      { label: "Rechnungen", to: "/buchhaltung/rechnungen" },
      { label: "Belege", to: "/buchhaltung/belege" },
      { label: "Mahnungen", to: "/buchhaltung/mahnungen" },
      { label: "Einstellungen", to: "/buchhaltung/einstellungen" },
    ],
  },
  { label: "Persönliche Daten", icon: User, to: "/profil" },
  {
    label: "Mitarbeiterverwaltung", icon: Users,
    children: [
      { label: "Mitarbeiter", to: "/mitarbeiter" },
      { label: "Abwesenheitsanträge", to: "/mitarbeiter/abwesenheiten" },
      { label: "Zeiterfassung", to: "/mitarbeiter/zeiterfassung" },
      { label: "Zeitkategorien", to: "/mitarbeiter/zeitkategorien" },
      { label: "Pausenverwaltung", to: "/mitarbeiter/pausen" },
      { label: "Lohngruppen", to: "/mitarbeiter/lohngruppen" },
    ],
  },
  {
    label: "Firmeneinstellungen", icon: Settings,
    children: [
      { label: "Firmenprofil", to: "/einstellungen/firmenprofil" },
      { label: "Seitendarstellung", to: "/einstellungen/darstellung" },
      { label: "Niederlassungen", to: "/einstellungen/niederlassungen" },
      { label: "Email-Templates", to: "/einstellungen/email-templates" },
      { label: "Informationsdokumente", to: "/einstellungen/infodokumente" },
      { label: "Zugriffsrechte", to: "/einstellungen/zugriffsrechte" },
      { label: "Projekttypen", to: "/einstellungen/projekttypen" },
      { label: "Nummernkreise", to: "/einstellungen/nummernkreise" },
      { label: "Dokumentenordner", to: "/einstellungen/ordner" },
      { label: "Checklisten", to: "/einstellungen/checklisten" },
      { label: "Quellen", to: "/einstellungen/quellen" },
      { label: "Mailserver", to: "/einstellungen/mailserver" },
      { label: "Eigene Felder", to: "/einstellungen/eigene-felder" },
    ],
  },
];

// Schnellanlegen ("+ Neu")
export const QUICK_CREATE: NavSub[] = [
  { label: "Projekt", to: "/projekte/neu" },
  { label: "Kontakt", to: "/kontakte/neu" },
  { label: "Aufgabe", to: "/aufgaben?neu=1" },
  { label: "Dokument", to: "/dokumente/neu" },
  { label: "Termin", to: "/planung/termine?neu=1" },
  { label: "Auftrag", to: "/auftraege?neu=1" },
];
