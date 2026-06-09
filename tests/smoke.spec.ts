import { test, expect, type Page } from "@playwright/test";

const ROUTES = [
  "/", "/auswertungen",
  "/kontakte", "/projekte",
  "/dokumente", "/dokumente/neu", "/dokumente/texte", "/dokumente/vorlagen", "/dokumente/konfigurator",
  "/artikel", "/leistungen", "/verkaufspreise",
  "/lager", "/lager/einbuchungen", "/lager/ausbuchungen", "/lager/lagerbuch",
  "/wartungsvertraege", "/auftraege", "/aufgaben",
  "/planung/termine", "/planung/kalender", "/planung/plantafel", "/planung/einstellungen",
  "/buchhaltung/rechnungen", "/buchhaltung/belege", "/buchhaltung/mahnungen", "/buchhaltung/einstellungen",
  "/profil",
  "/mitarbeiter", "/mitarbeiter/abwesenheiten", "/mitarbeiter/zeiterfassung", "/mitarbeiter/zeitkategorien", "/mitarbeiter/pausen", "/mitarbeiter/lohngruppen",
  "/einstellungen/firmenprofil", "/einstellungen/darstellung", "/einstellungen/niederlassungen",
  "/einstellungen/email-templates", "/einstellungen/infodokumente", "/einstellungen/zugriffsrechte",
  "/einstellungen/projekttypen", "/einstellungen/nummernkreise", "/einstellungen/ordner",
  "/einstellungen/checklisten", "/einstellungen/quellen", "/einstellungen/mailserver", "/einstellungen/eigene-felder",
];

async function signup(page: Page) {
  await page.goto("/auth");
  await page.getByRole("tab", { name: "Registrieren" }).click();
  const email = `pw${Date.now()}@example.at`;
  await page.locator("#fn").fill("PW");
  await page.locator("#ln").fill("Tester");
  await page.locator("#cn").fill("Playwright GmbH");
  await page.locator("#email2").fill(email);
  await page.locator("#password2").fill("demo123456");
  await page.getByRole("button", { name: "Konto erstellen" }).click();
  // Warten bis Dashboard geladen (Sidebar sichtbar)
  await expect(page.getByText("Übersicht").first()).toBeVisible({ timeout: 20_000 });
}

test("Smoke: alle Routen laden ohne Laufzeitfehler", async ({ page }) => {
  const errors: string[] = [];
  let currentRoute = "";
  page.on("pageerror", (e) => errors.push(`[${currentRoute}] PAGEERROR: ${e.message}`));

  await signup(page);

  const failed: string[] = [];
  for (const route of ROUTES) {
    currentRoute = route;
    const before = errors.length;
    await page.goto(route, { waitUntil: "domcontentloaded" }).catch(() => {});
    // Der Dokumenteneditor (Vollseite) hat statt h1 eine Toolbar mit "Dokumente"-Zurück-Button.
    const marker = route === "/dokumente/neu"
      ? page.getByText("Dokumenttyp", { exact: true }).first()
      : page.locator("h1").first();
    const ok = await marker.waitFor({ state: "visible", timeout: 8000 }).then(() => true).catch(() => false);
    const newErrors = errors.length - before;
    if (newErrors > 0 || !ok) {
      failed.push(`${route} (ok=${ok}, errors=${newErrors})`);
    }
  }

  console.log("\n=== SMOKE-ERGEBNIS ===");
  console.log(`Routen getestet: ${ROUTES.length}, fehlerhaft: ${failed.length}`);
  if (failed.length) console.log("FEHLER:\n" + failed.join("\n"));
  if (errors.length) console.log("\nPAGE-ERRORS:\n" + errors.join("\n"));

  expect(failed, `Routen mit Problemen:\n${failed.join("\n")}\n\nFehlerdetails:\n${errors.join("\n")}`).toEqual([]);
});
