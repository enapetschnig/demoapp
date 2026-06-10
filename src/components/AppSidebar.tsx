import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { NAV, type NavItem } from "@/lib/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useProjectTypes } from "@/hooks/queries/useProjects";
import { cn } from "@/lib/utils";
import { ChevronDown, Search, Hammer, PanelLeftClose, FolderKanban } from "lucide-react";

function MenuEntry({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const location = useLocation();
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;
  const here = location.pathname + location.search;
  const childActive = item.children?.some((c) => (c.to.includes("?") ? here === c.to : location.pathname === c.to));
  const selfActive = item.to && (item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to));
  const [open, setOpen] = useState<boolean>(!!childActive);

  const rowClass = (active: boolean) =>
    cn(
      "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
      active
        ? "font-medium"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    );
  const activeStyle = (active: boolean) =>
    active
      ? {
          backgroundColor: "hsl(var(--sidebar-active-bg))",
          color: "hsl(var(--sidebar-active-fg))",
          boxShadow: "inset 3px 0 0 0 hsl(var(--sidebar-active-bar))",
        }
      : undefined;

  if (!hasChildren && item.to) {
    return (
      <NavLink
        to={item.to}
        className={() => rowClass(!!selfActive)}
        style={activeStyle(!!selfActive)}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={rowClass(!!childActive)}
        style={activeStyle(!!childActive)}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{item.label}</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </>
        )}
      </button>
      {open && !collapsed && (
        <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
          {item.children!.map((c) => {
            const here = location.pathname + location.search;
            const active = c.to.includes("?") ? here === c.to : location.pathname === c.to;
            return (
              <NavLink
                key={c.to}
                to={c.to}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px] transition-colors",
                  active
                    ? "text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                style={active ? { color: "hsl(var(--sidebar-active-fg))" } : undefined}
              >
                {c.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AppSidebar({ collapsed, onToggle, onOpenSearch }: { collapsed: boolean; onToggle: () => void; onOpenSearch?: () => void }) {
  const { company } = useAuth();
  const { data: projectTypes = [] } = useProjectTypes();

  // Statisches "Projekte" durch dynamische Gewerk-Pipelines (je project_type) ersetzen.
  const nav = useMemo<NavItem[]>(() => {
    return NAV.flatMap((item) => {
      if (item.label !== "Projekte") return [item];
      const gewerke: NavItem[] = projectTypes.map((pt) => ({
        label: pt.name,
        icon: FolderKanban,
        children: [
          { label: "Alle Offenen", to: `/projekte?type=${pt.id}` },
          { label: "Überfällige Projekte", to: `/projekte?type=${pt.id}&filter=ueberfaellig` },
          ...(pt.steps ?? []).map((s) => ({ label: s.name, to: `/projekte?type=${pt.id}&step=${s.id}` })),
        ],
      }));
      return [{ label: "Projekte", icon: FolderKanban, to: "/projekte" }, ...gewerke];
    });
  }, [projectTypes]);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4">
        {company?.logo_url ? (
          <img src={company.logo_url} alt="Logo" className="h-8 w-8 rounded object-contain" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
            <Hammer className="h-4 w-4" />
          </div>
        )}
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{company?.name ?? "Mein Betrieb"}</div>
            <div className="truncate text-[10px] uppercase tracking-wide text-sidebar-foreground/50">
              Handwerker Software
            </div>
          </div>
        )}
      </div>

      {/* Suche */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex w-full items-center gap-2 rounded-md bg-sidebar-accent px-2.5 py-1.5 text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left text-sm">Suche</span>
            <kbd className="rounded bg-sidebar/60 px-1.5 py-0.5 text-[10px]">Strg K</kbd>
          </button>
        </div>
      )}
      {collapsed && (
        <div className="px-3 pb-2">
          <button type="button" onClick={onOpenSearch} className="flex w-full justify-center rounded-md bg-sidebar-accent py-1.5 text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <Search className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {nav.map((item, i) => (
          <MenuEntry key={`${item.label}-${i}`} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent"
        >
          <PanelLeftClose className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Einklappen</span>}
        </button>
        {!collapsed && (
          <div className="mt-1 flex gap-3 px-2 text-[10px] text-sidebar-foreground/40">
            <a href="#" className="cursor-pointer hover:text-sidebar-foreground/70 hover:underline">AGB</a>
            <a href="#" className="cursor-pointer hover:text-sidebar-foreground/70 hover:underline">Datenschutz</a>
            <a href="#" className="cursor-pointer hover:text-sidebar-foreground/70 hover:underline">Impressum</a>
          </div>
        )}
      </div>
    </aside>
  );
}
