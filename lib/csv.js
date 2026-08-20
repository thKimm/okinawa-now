/**
 * Small RFC-4180-ish CSV parser.
 * Handles quoted commas, escaped quotes and embedded newlines without dependencies.
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = "";
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((values) => values.some((value) => String(value).trim() !== ""));
}

export function rowsToObjects(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const headers = rows[0].map((header) => String(header ?? "").trim());
  return rows.slice(1).map((values) => {
    const record = {};
    headers.forEach((header, index) => {
      if (header) record[header] = values[index] ?? "";
    });
    return record;
  });
}
