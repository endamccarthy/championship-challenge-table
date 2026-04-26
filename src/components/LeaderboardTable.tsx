import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "preact/hooks";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type FilterFn,
} from "@tanstack/react-table";
import type { LeaderboardEntry } from "../types";

const PAGE_SIZE = 50;

function stripDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const accentInsensitiveFilter: FilterFn<LeaderboardEntry> = (
  row,
  columnId,
  filterValue,
) => {
  const value = stripDiacritics(
    String(row.getValue(columnId) ?? ""),
  ).toLowerCase();
  const filter = stripDiacritics(String(filterValue)).toLowerCase();
  return value.includes(filter);
};

const columnHelper = createColumnHelper<LeaderboardEntry>();

const columns = [
  columnHelper.display({
    id: "position",
    header: "#",
    cell: (info) => info.row.index + 1,
    enableGlobalFilter: false,
    size: 50,
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("points", {
    header: "Points",
    cell: (info) => info.getValue(),
    enableGlobalFilter: false,
  }),
  columnHelper.accessor("munsterWinner", {
    header: "Munster Winner",
    cell: (info) => info.getValue(),
    enableGlobalFilter: false,
  }),
  columnHelper.accessor("leinsterWinner", {
    header: "Leinster Winner",
    cell: (info) => info.getValue(),
    enableGlobalFilter: false,
  }),
  columnHelper.accessor("topScorerMunster", {
    header: "Top Scorer (Munster)",
    cell: (info) => info.getValue(),
    enableGlobalFilter: false,
  }),
  columnHelper.accessor("topScorerLeinster", {
    header: "Top Scorer (Leinster)",
    cell: (info) => info.getValue(),
    enableGlobalFilter: false,
  }),
];

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
}

export function LeaderboardTable({ data }: LeaderboardTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const tableData = useMemo(() => data, [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: accentInsensitiveFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const allRows = table.getRowModel().rows;
  const visibleRows = useMemo(
    () => allRows.slice(0, visibleCount),
    [allRows, visibleCount],
  );
  const hasMore = visibleCount < allRows.length;

  // Reset visible count when filter/sort changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [globalFilter, sorting]);

  // Intersection observer for infinite scroll
  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, allRows.length));
  }, [allRows.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "600px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div class="table-container">
      <div class="table-controls">
        <div class="search-wrapper">
          <svg
            class="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Search by name..."
            value={globalFilter}
            onInput={(e) =>
              setGlobalFilter((e.target as HTMLInputElement).value)
            }
            class="search-input"
            aria-label="Search leaderboard"
          />
        </div>
      </div>

      <div class="table-scroll">
        <table role="grid" class="leaderboard-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    class={header.column.getCanSort() ? "sortable" : ""}
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : "none"
                    }
                    style={{
                      width:
                        header.getSize() !== 150
                          ? `${header.getSize()}px`
                          : undefined,
                    }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {header.column.getIsSorted() === "asc" ? " ▲" : ""}
                    {header.column.getIsSorted() === "desc" ? " ▼" : ""}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {allRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} class="no-results">
                  No results found
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      data-label={cell.column.columnDef.header as string}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div class="card-list">
        {allRows.length === 0 ? (
          <div
            class="no-results"
            style={{ padding: "2rem", textAlign: "center" }}
          >
            No results found
          </div>
        ) : (
          visibleRows.map((row, index) => {
            const entry = row.original;
            const position = row.index + 1;
            const visualPosition = index + 1;
            const isFirstPage = index < PAGE_SIZE;
            return (
              <div
                class={`leaderboard-card${isFirstPage ? "" : " no-anim"}`}
                key={row.id}
                style={
                  isFirstPage
                    ? { animationDelay: `${index * 0.04}s` }
                    : undefined
                }
              >
                <div
                  class={`card-position${visualPosition <= 3 ? ` top-${visualPosition}` : ""}`}
                >
                  {position}
                </div>
                <div class="card-body">
                  <div class="card-header-row">
                    <span class="card-name">{entry.name}</span>
                    <span class="card-points">
                      {entry.points} <small>pts</small>
                    </span>
                  </div>
                  <div class="card-picks">
                    <div class="pick">
                      <span class="pick-label">Munster</span>
                      <span class="pick-value">{entry.munsterWinner}</span>
                    </div>
                    <div class="pick">
                      <span class="pick-label">Top Scorer</span>
                      <span class="pick-value">{entry.topScorerMunster}</span>
                    </div>
                    <div class="pick">
                      <span class="pick-label">Leinster</span>
                      <span class="pick-value">{entry.leinsterWinner}</span>
                    </div>
                    <div class="pick">
                      <span class="pick-label">Top Scorer</span>
                      <span class="pick-value">{entry.topScorerLeinster}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {hasMore && (
        <div ref={sentinelRef} class="scroll-sentinel">
          <span class="scroll-loading">Loading more…</span>
        </div>
      )}

      {!hasMore && allRows.length > 0 && (
        <div class="scroll-end">Showing all {allRows.length} entries</div>
      )}
    </div>
  );
}
