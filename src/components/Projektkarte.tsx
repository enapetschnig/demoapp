import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useProjects, type ProjectRow } from "@/hooks/queries/useProjects";
import { Loader2, MapPin } from "lucide-react";

const addressOf = (p: ProjectRow) =>
  [p.address_street, `${p.address_zip ?? ""} ${p.address_city ?? ""}`.trim(), "Österreich"].filter(Boolean).join(", ");

// Best-effort-Geocoding via OpenStreetMap Nominatim (gedrosselt, gecacht).
const geoCache = new Map<string, { lat: number; lon: number } | null>();
async function geocode(q: string): Promise<{ lat: number; lon: number } | null> {
  if (geoCache.has(q)) return geoCache.get(q)!;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, {
      headers: { "Accept-Language": "de" },
    });
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    const hit = data[0] ? { lat: Number(data[0].lat), lon: Number(data[0].lon) } : null;
    geoCache.set(q, hit);
    return hit;
  } catch {
    geoCache.set(q, null);
    return null;
  }
}

export function Projektkarte() {
  const { data: projects = [] } = useProjects();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [located, setLocated] = useState(0);

  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;
    const map = L.map(mapRef.current).setView([47.6, 14.1], 7);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    mapObj.current = map;
    return () => { map.remove(); mapObj.current = null; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map = mapObj.current;
      if (!map) return;
      setLoading(true);
      let count = 0;
      const withAddr = projects.filter((p) => p.address_city || p.address_street).slice(0, 40);
      for (const p of withAddr) {
        if (cancelled) return;
        const hit = await geocode(addressOf(p));
        if (cancelled) return;
        if (hit) {
          count++;
          L.circleMarker([hit.lat, hit.lon], { radius: 8, color: p.project_types?.color ?? "#22c55e", fillOpacity: 0.7 })
            .addTo(map)
            .bindPopup(`<b>${p.project_types?.code ?? "PRJ"}-${p.project_number}</b><br/>${p.name ?? ""}<br/>${addressOf(p)}`);
        }
        await new Promise((r) => setTimeout(r, 1100)); // Nominatim Rate-Limit
      }
      if (!cancelled) { setLocated(count); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [projects]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        {loading ? "Projekte werden geografisch verortet…" : `${located} Projekte auf der Karte`}
      </div>
      <div ref={mapRef} className="h-[520px] w-full overflow-hidden rounded-md border" />
    </div>
  );
}
