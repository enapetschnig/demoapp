I'll create the prioritized fix list directly from the findings. No need to read files since the findings already contain the analysis.

Here is the audit:

# Schluss-Audit — Priorisierte Fix-Liste

## P0 — Design-/Funktionsbugs (blockierend für Design-Treue & Kernfunktion)

| Was | Datei | Fix (1 Satz) |
|---|---|---|
| HERO Community-Menüpunkt fehlt komplett (soll am Ende der Sidebar vor "Einklappen") | `/Users/christophnapetschnig/Developer/neuedemoapp/src/lib/navigation.ts` | Menüeintrag "HERO Community" mit rundem Logo-Icon am Listenende hinzufügen. |
| Werkzeugleiste im Editor ohne Reiter "Entwurf"/"PDF-Vorschau" und ohne Icon-Buttons | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/DokumentEditor.tsx` | Ansichts-Reiter (Entwurf grün unterstrichen / PDF-Vorschau) plus graue Icon-Button-Reihe als Toolbar-Header ergänzen. |
| "Mehr"-Menü im Editor fehlt (Einstellungen, MwSt, IDS Connect, Preise aktualisieren, UGL/GAEB/OpenTrans) | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/DokumentEditor.tsx` | Pfeil-Button mit Dropdown anlegen, der die acht genannten Aktionen enthält. |
| Button "Dokument abschließen" (Nummernfestschreibung) fehlt | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/DokumentEditor.tsx` | Grünen Häkchen-Button hinzufügen, der die Dokumentnummer festschreibt und den Status finalisiert. |
| PDF-Infoblock ohne Ansprechpartner, Mobil, E-Mail (Daten in `PdfRecipient` vorhanden, aber nicht ausgegeben) | `/Users/christophnapetschnig/Developer/neuedemoapp/src/lib/documentPdf.ts` | In `buildDocumentHtml()` Ansprechpartner, Mobil und E-Mail im Infoblock rendern. |
| Editor übergibt Mobil/E-Mail des Kontakts nicht an die PDF-Daten (Z. 203-208) | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/DokumentEditor.tsx` | `recipient.mobile` und `recipient.email` aus dem Kontakt befüllen. |
| Stundensatz wird nicht berechnet (nur Ertrag) | `/Users/christophnapetschnig/Developer/neuedemoapp/src/lib/documentCalculations.ts` | `stundensatz = profit / arbeitszeit` in `CalcResult` ergänzen und im Übersichts-Panel anzeigen. |
| Dialog "Einstellungen" (Editor) ohne Reiter VERSIONEN/ERSTE SEITE/FOLGESEITEN | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/dokumente/Konfigurator.tsx` | Reiter-Navigation um die drei fehlenden Tabs mit den jeweiligen Layout-/Versions-Inhalten erweitern. |
| Buchhaltungs-Einstellungen ohne BUCHUNGSKONTEN/KOSTENSTELLEN/UMSATZSTEUERREGELUNG/NUMMERNKREISE | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/buchhaltung/BuchhaltungEinstellungen.tsx` | Vier fehlende Reiter neben ALLGEMEIN/MAHNWESEN mit Verwaltungsmasken ergänzen. |
| Wartungsvertrag → Auftrag-Überführung fehlt (Kernworkflow Anf. 9) | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/Wartungsvertraege.tsx` | Aktion "In Auftrag überführen" implementieren, die aus dem Vertrag einen Auftrag generiert. |
| Auftrag → Rechnung-Erstellung fehlt | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/Auftraege.tsx` | Aktion "Rechnung erstellen" ergänzen, die aus dem Auftrag eine Rechnung anlegt. |
| Zentrale CSV/Excel-Exportfunktion fehlt (Grundlage aller Listen-Exports) | `/Users/christophnapetschnig/Developer/neuedemoapp/src/lib` | Generische Export-Utility (CSV/Excel) bereitstellen, die `DataTable` und alle Listen nutzen können. |

## P1 — Sinnvolle Lücken

| Was | Datei | Fix (1 Satz) |
|---|---|---|
| Benachrichtigungs-Badge zeigt nur Punkt statt Zahl (z.B. "13") | `/Users/christophnapetschnig/Developer/neuedemoapp/src/components/AppHeader.tsx` | Punkt durch grünen Zähler-Badge mit numerischem Wert ersetzen. |
| Sidebar-Footer AGB/Datenschutz/Impressum sind nur Text, keine Links | `/Users/christophnapetschnig/Developer/neuedemoapp/src/components/AppSidebar.tsx` | Texte als klickbare `<a>`-Links auf die jeweiligen Seiten umstellen. |
| ProjektDetail ohne Reiter "Ausschreibungen (GAEB)" | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/ProjektDetail.tsx` | GAEB-Reiter mit Import-/Verwaltungs-Dialog hinzufügen. |
| ProjektDetail ohne Reiter "Lagerverwaltung" (projektbezogene Materialentnahmen) | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/ProjektDetail.tsx` | Reiter für projektbezogene Lager-/Materialentnahmen inkl. Belegverlinkung ergänzen. |
| DataTable ohne Massenauswahl (Checkbox-Spalte + Gruppenaktion-Toolbar) | `/Users/christophnapetschnig/Developer/neuedemoapp/src/components/DataTable.tsx` | Header-Checkbox, Zeilen-Checkboxen und Gruppenaktions-Leiste zentral implementieren. |
| DataTable ohne Spaltenkonfiguration | `/Users/christophnapetschnig/Developer/neuedemoapp/src/components/DataTable.tsx` | Spalten-Menü-Button mit Dialog für sichtbare Spalten ergänzen (dann auf Kontakte/Dokumente/Projekte/Artikel anwenden). |
| Export-Button fehlt in Kontakte | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/Kontakte.tsx` | Export-Button anbinden, sobald zentrale Export-Utility steht. |
| Export-Button fehlt in Dokumente-Übersicht | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/Dokumente.tsx` | Export-Button in der Steuerleiste ergänzen. |
| Export-Button fehlt in Projekte | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/Projekte.tsx` | Export-Button plus Spalten-Menü in der Steuerleiste ergänzen. |
| Export-Button fehlt in Artikel/Leistungen/Aufgaben/Aufträge/Wartungsverträge/Mitarbeiter | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/Artikel.tsx` (analog Leistungen.tsx, Aufgaben.tsx, Auftraege.tsx, Wartungsvertraege.tsx, mitarbeiter/Mitarbeiter.tsx) | Jeweils Export-Button über die zentrale Utility nachrüsten. |
| Dokumenten-Vorlagen-Management nicht implementiert | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/dokumente/Vorlagen.tsx` | Speichern/Laden kompletter wiederverwendbarer Dokumente realisieren. |
| Editor-Werkzeug-Icons Euro/Uhr/Listen fehlen | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/DokumentEditor.tsx` | Euro (Preise aktualisieren), Uhr (Versionshistorie), Listen (Positionen) als funktionale Icon-Buttons ergänzen. |
| Interner Kalkulationsblock nicht unter Positionstabelle sichtbar | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/DokumentEditor.tsx` | Summenblock (EK Gesamt/Material/Lohn, Arbeitszeit, Rabatt, Aufschlag €/%, Gesamt) unter der Positionstabelle rendern. |
| Gliederung ohne klickbare Sprungmarken | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/DokumentEditor.tsx` | Titel der Gliederungs-Box als Anker-Links auf die jeweilige Dokumentstelle umsetzen. |
| Versionshistorie nicht implementiert | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/DokumentEditor.tsx` | Versionierung speichern und im Uhr-Icon/VERSIONEN-Reiter einsehbar machen. |
| Plantafel ohne Filter Kategorie/Gewerk und Import/Export | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/planung/Plantafel.tsx` | Trichter-Filter-Buttons (Kategorie/Gewerk) und Import/Export-Dropdown (Kalender-Icon) ergänzen. |
| Zeiterfassung ohne Reiter "STUNDENAUSGLEICH" | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/mitarbeiter/Zeiterfassung.tsx` | STUNDENAUSGLEICH-Reiter ergänzen. |
| Zugriffsrechte ohne dokumenttyp-spezifische Rechte | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/admin/Zugriffsrechte.tsx` | Unteren Block mit Rechten je Dokumenttyp/Rolle ergänzen. |
| Belege ohne "Beleg erfassen"-Button mit Dropdown | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/buchhaltung/Belege.tsx` | Erfassungs-Button mit Dropdown zur Erfassungsfunktion hinzufügen. |
| Globale Suche (Ctrl+K) ohne Funktion | (Layout/Header) `/Users/christophnapetschnig/Developer/neuedemoapp/src/components/AppHeader.tsx` | Such-Modal über Projekte/Kontakte/Dokumente per Strg+K anbinden. |

## P2 — Politur

| Was | Datei | Fix (1 Satz) |
|---|---|---|
| Logo-Icon ist Hammer statt Diamant | `/Users/christophnapetschnig/Developer/neuedemoapp/src/components/AppSidebar.tsx` | Hammer-Icon durch stilisiertes Diamant-Symbol ersetzen. |
| Dashboard ohne zweiten Button "Zum Mahnwesen" | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/Dashboard.tsx` | Zweiten Button neben dem bestehenden in der Buchhaltung-Kachel ergänzen. |
| Rechnungen ohne "Rechnungen herunterladen"-Button | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/buchhaltung/Rechnungen.tsx` | Download-Icon-Button in der Steuerleiste ergänzen. |
| Email-Templates ohne Einstellungen-Zahnrad | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/admin/EmailTemplates.tsx` | Zahnrad-Button mit Einstellungs-Dialog (Design-Optionen) ergänzen. |
| Mitarbeiter ohne Zeilen-"Mehr"-Menü | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/mitarbeiter/Mitarbeiter.tsx` | Aktions-Dropdown pro Zeile rechts ergänzen. |
| Texte & Titel ohne Such-/Filterfunktion | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/dokumente/TexteTitel.tsx` | Suchfeld zum Filtern der Textbausteine ergänzen. |
| Artikel ohne "Artikelstämme"/"Als Lagerartikel"/Spaltenkonfig | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/Artikel.tsx` | Artikelstämme-Button, "Als Lagerartikel erstellen" und Spalten-Menü nachrüsten. |
| Lager ohne QR-Codes-Export | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/Lager.tsx` | QR-Code-Druck-Export-Button ergänzen. |
| Stift-Icon (Bearbeitungsmodus) im Editor fehlt | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/DokumentEditor.tsx` | Stift-Button zur Umschaltung des Bearbeitungsmodus ergänzen. |
| Projekte ohne Filter-Dropdown "Alle anzeigen" | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/Projekte.tsx` | Status-/Phasen-Filter-Dropdown "Alle anzeigen" ergänzen. |
| ProjektDetail ohne Termin-Export | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/ProjektDetail.tsx` | Termine-Export (CSV/Excel) über zentrale Utility anbinden. |
| Plantafel ohne Zahnrad-Einstellungen | `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/planung/Plantafel.tsx` | Zahnrad-Einstellungs-Button ergänzen. |

## Gesamturteil — Design-Treue und Vollständigkeit

Die Anwendung erreicht eine sehr hohe visuelle Design-Treue: Sidebar, Header, Farbschema (grüne Akzentfarbe, blaue Links, rote Warnungen), Typografie, Karten- und Tabellen-Look sowie das konfigurierbare Laufzeit-Theme entsprechen der Vorlage nahezu vollständig, mit nur wenigen kosmetischen Abweichungen (Diamant-Logo, numerischer Benachrichtigungs-Badge, Footer-Links). Funktional ist die Modulbreite beeindruckend — CRM, Projekte mit Pipeline und Detail-Tabs, Dokumenten-Editor, Buchhaltung, Mitarbeiter, Planung und der komplette Admin-Bereich sind angelegt. Die kritischen Schwächen liegen jedoch in der Tiefe: Der Dokumenten-Editor ist die größte Lücke (fehlende obere Werkzeugleiste mit Ansichts-Reitern, Mehr-Menü, Abschluss-Button, Versionierung, unvollständiger PDF-Infoblock und fehlender Stundensatz), gefolgt von fehlenden Workflow-Überführungen (Wartungsvertrag→Auftrag, Auftrag→Rechnung), unvollständigen Einstellungs-Dialogen (Buchhaltung, Konfigurator) und dem durchgängig fehlenden Querschnitts-Feature für Export und Spalten-/Massenaktionen. Insgesamt ist das Grundgerüst design-treu und strukturell weitgehend vollständig, aber für Produktionsreife müssen vor allem die P0-Editor-, Workflow- und Export-Lücken geschlossen werden, da sie zentrale Geschäftsabläufe betreffen.