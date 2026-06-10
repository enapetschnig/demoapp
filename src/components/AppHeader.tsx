import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { QUICK_CREATE } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Bell, HelpCircle } from "lucide-react";

export function AppHeader() {
  const navigate = useNavigate();
  const { profile, company, signOut } = useAuth();
  const initials = `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.toUpperCase() || "U";

  // Benachrichtigungen: offene Aufgaben des Mandanten
  const { data: openCount = 0 } = useQuery({
    queryKey: ["notif-open-tasks", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { count } = await supabase.from("tasks").select("*", { count: "exact", head: true })
        .eq("company_id", company!.id).is("done_at", null);
      return count ?? 0;
    },
  });

  return (
    <header className="flex h-14 items-center justify-end gap-2 border-b bg-card px-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Neu
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Schnell anlegen</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {QUICK_CREATE.map((q) => (
            <DropdownMenuItem key={q.to} onClick={() => navigate(q.to)}>
              {q.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
        <HelpCircle className="h-5 w-5" />
      </Button>

      <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground" onClick={() => navigate("/aufgaben")} title="Offene Aufgaben">
        <Bell className="h-5 w-5" />
        {openCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
            {openCount > 99 ? "99+" : openCount}
          </span>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="ml-1 flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {profile?.first_name} {profile?.last_name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/profil")}>Profil</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/einstellungen/firmenprofil")}>Firmeneinstellungen</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>Abmelden</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
