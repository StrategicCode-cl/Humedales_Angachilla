// Event dates arrive as ISO ("2026-10-15", from the admin panel) or as written Spanish
// ("Sábado 26 de Septiembre, 2026", older data saved in the browser). Both become local dates here.

const MONTHS: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11
};

export function parseEventDate(value: string): Date | null {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const written = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .match(/(\d{1,2})\s+de\s+([a-z]+),?\s+(?:de\s+)?(\d{4})/);
  if (written && written[2] in MONTHS) return new Date(Number(written[3]), MONTHS[written[2]], Number(written[1]));
  return null;
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function eventDateKey(value: string): string | null {
  const date = parseEventDate(value);
  return date ? dateKey(date) : null;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// "Sábado 26 de septiembre de 2026", or the stored text if it cannot be read
export function formatEventDate(value: string, { withYear = true }: { withYear?: boolean } = {}): string {
  const date = parseEventDate(value);
  if (!date) return value;
  return capitalize(
    date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}) })
  );
}

// "sáb 26 sep"
export function formatEventDateShort(value: string): string {
  const date = parseEventDate(value);
  if (!date) return value;
  return date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
}
