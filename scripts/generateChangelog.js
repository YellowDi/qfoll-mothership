#!/usr/bin/env node
/**
 * Generate changelog.json from git commits.
 * Parses conventional commit format (feat:, fix:, chore:, style:, refactor:, docs:).
 * Run before build: pnpm run generate:changelog
 */
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outputPath = join(root, "src", "data", "changelog.json");

const TYPES = {
  feat: { label: "新增", icon: "ri-rocket-line", color: "brand" },
  fix: { label: "修复", icon: "ri-bug-line", color: "green" },
  chore: { label: "维护", icon: "ri-tools-line", color: "secondary" },
  style: { label: "样式", icon: "ri-palette-line", color: "purple" },
  refactor: { label: "重构", icon: "ri-refresh-line", color: "blue" },
  docs: { label: "文档", icon: "ri-file-text-line", color: "orange" },
};

function parseType(subject) {
  const lower = subject.toLowerCase();
  for (const [key] of Object.entries(TYPES)) {
    if (lower.startsWith(`${key}:`) || lower.startsWith(`${key}(`)) return key;
  }
  return "other";
}

function parseScope(subject) {
  const match = subject.match(/^[a-z]+\(([^)]+)\)/i);
  return match ? match[1].trim() : null;
}

function stripPrefix(subject) {
  return subject
    .replace(/^(feat|fix|chore|style|refactor|docs)(\([^)]+\))?:\s*/i, "")
    .trim();
}

function runGitLog() {
  try {
    return execSync(
      'git log --pretty=format:"%h|%ad|%s|%an" --date=short',
      { cwd: root, encoding: "utf-8" }
    );
  } catch {
    return "";
  }
}

function buildChangelog() {
  const raw = runGitLog();
  const lines = raw.split("\n").filter(Boolean);

  const byDate = new Map();

  for (const line of lines) {
    const [hash, date, subject, author] = line.split("|");
    if (!hash || !date || !subject) continue;

    const type = parseType(subject);
    const scope = parseScope(subject);
    const message = stripPrefix(subject);

    const entry = {
      hash,
      date,
      subject,
      message,
      author,
      type,
      scope,
      typeInfo: TYPES[type] || {
        label: "其他",
        icon: "ri-commit-line",
        color: "secondary",
      },
    };

    const list = byDate.get(date) || [];
    list.push(entry);
    byDate.set(date, list);
  }

  const dates = [...byDate.keys()].sort((a, b) => (b > a ? 1 : -1));
  const entries = dates.map((date) => ({
    date,
    commits: byDate.get(date),
  }));

  return { entries, types: TYPES };
}

const changelog = buildChangelog();
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(changelog, null, 2), "utf-8");
console.log(`Changelog written to ${outputPath} (${changelog.entries.length} days, ${changelog.entries.reduce((s, e) => s + e.commits.length, 0)} commits)`);
