const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("tr-TR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(`${iso}T00:00:00`));
}

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

export function isRecent(iso: string, daysWindow = 7): boolean {
  const d = new Date(`${iso}T00:00:00`);
  const diff = Date.now() - d.getTime();
  return diff >= 0 && diff <= daysWindow * 86_400_000;
}
