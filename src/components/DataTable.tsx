import { useMemo, useState, ReactNode } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  accessor?: (row: T) => string | number | null | undefined;
  sortable?: boolean;
  filterable?: boolean;
  className?: string;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  getRowId?: (row: T) => string;
  emptyText?: string;
  toolbar?: ReactNode;
}

const PAGE_SIZES = [25, 50, 100, 250];

export function DataTable<T>({
  data, columns, loading, onRowClick, getRowId, emptyText = "Keine passenden Einträge gefunden", toolbar,
}: DataTableProps<T>) {
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const accessorFor = (col: Column<T>) => (row: T) => {
    if (col.accessor) return col.accessor(row);
    return (row as Record<string, unknown>)[col.key] as string | number | null | undefined;
  };

  const filtered = useMemo(() => {
    let rows = data;
    for (const col of columns) {
      const f = filters[col.key]?.trim().toLowerCase();
      if (f) {
        const acc = accessorFor(col);
        rows = rows.filter((r) => String(acc(r) ?? "").toLowerCase().includes(f));
      }
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col) {
        const acc = accessorFor(col);
        rows = [...rows].sort((a, b) => {
          const av = acc(a), bv = acc(b);
          if (av == null) return 1;
          if (bv == null) return -1;
          if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
          return sortDir === "asc"
            ? String(av).localeCompare(String(bv), "de")
            : String(bv).localeCompare(String(av), "de");
        });
      }
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, columns, filters, sortKey, sortDir]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(current * pageSize, current * pageSize + pageSize);

  const toggleSort = (col: Column<T>) => {
    if (col.sortable === false) return;
    if (sortKey === col.key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(col.key); setSortDir("asc"); }
  };

  const hasFilterRow = columns.some((c) => c.filterable);

  return (
    <div className="space-y-3">
      {/* Steuerleiste */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Zeige</span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
            <SelectTrigger className="h-8 w-[72px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <span>Einträge</span>
          <span className="ml-2 font-medium text-foreground">{total}</span>
          <span>Einträge gefunden</span>
        </div>
        {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
      </div>

      {/* Tabelle */}
      <div className="overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col) => (
                <TableHead key={col.key} className={cn(col.className)} style={{ width: col.width }}>
                  <button
                    type="button"
                    onClick={() => toggleSort(col)}
                    className={cn("inline-flex items-center gap-1", col.sortable === false ? "cursor-default" : "hover:text-foreground")}
                  >
                    {col.header}
                    {col.sortable !== false && (
                      sortKey === col.key
                        ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)
                        : <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </button>
                </TableHead>
              ))}
            </TableRow>
            {hasFilterRow && (
              <TableRow className="bg-muted/20">
                {columns.map((col) => (
                  <TableHead key={col.key} className="py-1">
                    {col.filterable && (
                      <Input
                        value={filters[col.key] ?? ""}
                        onChange={(e) => { setFilters((f) => ({ ...f, [col.key]: e.target.value })); setPage(0); }}
                        className="h-7 text-xs"
                        placeholder="Filter…"
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row, i) => (
                <TableRow
                  key={getRowId ? getRowId(row) : i}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Seitennavigation */}
      {pageCount > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <button className="rounded px-2 py-1 hover:bg-muted disabled:opacity-40" disabled={current === 0} onClick={() => setPage(current - 1)}>‹</button>
          <span>Seite {current + 1} von {pageCount}</span>
          <button className="rounded px-2 py-1 hover:bg-muted disabled:opacity-40" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}>›</button>
        </div>
      )}
    </div>
  );
}
