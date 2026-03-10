import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_URL = "https://yangh9.github.io/ChinaCalendar/cal_holiday.ics";
const TARGET_FILE = path.resolve("src/data/dutyCalendarByYear.js");

const years = process.argv.slice(2).filter((arg) => /^\d{4}$/.test(arg));

function unfoldICSLines(text) {
  return text
    .replace(/\r\n[ \t]/g, "")
    .replace(/\n[ \t]/g, "")
    .split(/\r?\n/);
}

function parseDate(value) {
  if (!/^\d{8}$/.test(value)) return null;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function parseEvents(icsText) {
  const lines = unfoldICSLines(icsText);
  const events = [];
  let current = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current?.date && current?.summary) events.push(current);
      current = null;
      continue;
    }
    if (!current) continue;

    const [rawKey, ...rest] = line.split(":");
    const value = rest.join(":");
    if (!rawKey || !value) continue;

    const key = rawKey.split(";")[0];
    if (key === "DTSTART") {
      current.date = parseDate(value.trim());
    }
    if (key === "SUMMARY") {
      current.summary = value.trim();
    }
  }

  return events;
}

function classifyEvent(summary) {
  if (/(补班|上班)/.test(summary)) return "workday";
  if (/(放假|休息|假期|调休)/.test(summary)) return "offDay";
  return "";
}

function buildCalendarByYear(events, selectedYears) {
  const entries = new Map();

  for (const event of events) {
    const year = event.date.slice(0, 4);
    if (selectedYears.length > 0 && !selectedYears.includes(year)) continue;

    const type = classifyEvent(event.summary);
    if (!type) continue;

    if (!entries.has(year)) {
      entries.set(year, {
        source: "ChinaCalendar + internal review",
        workdays: new Set(),
        offDays: new Set(),
      });
    }

    const target = entries.get(year);
    target[type === "workday" ? "workdays" : "offDays"].add(event.date);
  }

  return Object.fromEntries(
    [...entries.entries()]
      .sort(([left], [right]) => Number(left) - Number(right))
      .map(([year, value]) => [
        year,
        {
          source: value.source,
          workdays: [...value.workdays].sort(),
          offDays: [...value.offDays].sort(),
        },
      ])
  );
}

async function main() {
  const response = await fetch(DEFAULT_URL);
  if (!response.ok) {
    throw new Error(`Failed to download ICS: ${response.status} ${response.statusText}`);
  }

  const icsText = await response.text();
  const events = parseEvents(icsText);
  const nextCalendar = buildCalendarByYear(events, years);
  const output = `export const dutyCalendarByYear = ${JSON.stringify(nextCalendar, null, 2)};\n`;

  await fs.writeFile(TARGET_FILE, output, "utf8");
  const yearsLabel = Object.keys(nextCalendar).join(", ");
  console.log(`Duty calendars written to ${TARGET_FILE}${yearsLabel ? ` for ${yearsLabel}` : ""}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
