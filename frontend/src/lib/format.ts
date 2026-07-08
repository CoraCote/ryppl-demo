export function money(n: number): string {
  return `$${(n ?? 0).toFixed(2)}`;
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function initials(name: string): string {
  const parts = (name || "").trim().split(/\s+/);
  return (parts[0]?.[0] ?? "R") + (parts[1]?.[0] ?? "");
}
