import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';

const require = createRequire(import.meta.url);
const { getChromePath, launch } = require('chrome-launcher');
const execFileAsync = promisify(execFile);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'audits');
const axeBin = path.join(root, 'node_modules/@axe-core/cli/dist/src/bin/cli.js');
const routes = ['/', '/login', '/signup', '/forgot-password'];
const baseUrl = (process.env.AUDIT_BASE_URL || 'https://brightedtech.com.br').replace(/\/$/, '');

const impactOrder = ['critical', 'serious', 'moderate', 'minor'];

function pageUrl(route) {
  return route === '/' ? `${baseUrl}/` : `${baseUrl}${route}`;
}

function slug(route) {
  return route === '/' ? 'home' : route.replace(/^\//, '').replaceAll('/', '-');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function readDriverEnv() {
  const envFile = path.join(os.homedir(), '.browser-driver-manager', '.env');
  try {
    const text = await readFile(envFile, 'utf8');
    const values = {};
    for (const line of text.split('\n')) {
      const match = line.match(/^(?:export\s+)?([A-Z0-9_]+)=(.*)$/);
      if (match) values[match[1]] = match[2].trim().replace(/^"|"$/g, '');
    }
    return values;
  } catch {
    return {};
  }
}

async function resolveChromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const driverEnv = await readDriverEnv();
  if (driverEnv.CHROME_TEST_PATH) return driverEnv.CHROME_TEST_PATH;
  return getChromePath();
}

async function runLighthouse(url, chromePath, htmlPath) {
  const chrome = await launch({
    chromePath,
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: 'html',
      onlyCategories: ['accessibility'],
      locale: 'pt',
      logLevel: 'error',
    });

    if (!result?.lhr || !result.report) {
      throw new Error(`Lighthouse não gerou relatório para ${url}`);
    }

    const report = Array.isArray(result.report) ? result.report[0] : result.report;
    await writeFile(htmlPath, report);
    const score = result.lhr.categories?.accessibility?.score;
    return score == null ? null : Math.round(score * 100);
  } finally {
    await chrome.kill();
  }
}

function axeResults(outcome) {
  const list = Array.isArray(outcome) ? outcome : [outcome];
  const result = list[0];
  if (!result || !Array.isArray(result.violations)) {
    throw new Error('O axe não devolveu uma lista de violações.');
  }
  return result;
}

async function runAxe(url, chromePath, jsonName) {
  const jsonPath = path.join(outDir, jsonName);
  await execFileAsync(process.execPath, [
    axeBin,
    url,
    '--save',
    jsonName,
    '--dir',
    outDir,
    '--chrome-path',
    chromePath,
    '--chrome-options',
    'no-sandbox,disable-dev-shm-usage,disable-gpu',
    '--load-delay',
    '2000',
    '--timeout',
    '90',
  ], {
    timeout: 150_000,
    env: process.env,
  });

  return axeResults(JSON.parse(await readFile(jsonPath, 'utf8')));
}

function targetText(node) {
  const target = node.target ?? [];
  return target
    .flat()
    .map((item) => String(item))
    .join(' ');
}

function axeHtml(url, result) {
  const violations = [...result.violations].sort((a, b) => {
    return impactOrder.indexOf(a.impact) - impactOrder.indexOf(b.impact);
  });

  const rows = violations.length === 0
    ? '<p>Nenhuma violação.</p>'
    : violations.map((violation) => {
      const nodes = (violation.nodes ?? []).map((node) => `
        <li>
          <code>${escapeHtml(targetText(node) || '(sem seletor)')}</code>
          <pre>${escapeHtml(node.html || '')}</pre>
        </li>
      `).join('');

      return `
        <article>
          <h2>${escapeHtml(violation.help || violation.id)}</h2>
          <p><strong>${escapeHtml(violation.impact || 'desconhecido')}</strong> · ${escapeHtml(violation.id)}</p>
          <p>${escapeHtml(violation.description || '')}</p>
          <p><a href="${escapeHtml(violation.helpUrl || '')}">Como corrigir</a></p>
          <ul>${nodes}</ul>
        </article>
      `;
    }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>axe ${escapeHtml(url)}</title>
  <style>
    body { font-family: sans-serif; margin: 2rem; line-height: 1.4; }
    article { border-top: 1px solid #ccc; padding: 1rem 0; }
    code, pre { font-family: ui-monospace, monospace; }
    pre { white-space: pre-wrap; background: #f4f4f4; padding: 0.5rem; }
  </style>
</head>
<body>
  <h1>axe-core</h1>
  <p>${escapeHtml(url)}</p>
  <p><strong>${violations.length}</strong> violações</p>
  ${rows}
</body>
</html>
`;
}

function indexHtml(rows) {
  const items = rows.map((row) => {
    const score = row.accessibility == null ? '—' : String(row.accessibility);
    return `
      <tr>
        <td>${escapeHtml(row.route)}</td>
        <td>${escapeHtml(score)}</td>
        <td>${row.axeViolations}</td>
        <td><a href="${escapeHtml(row.lighthouse)}">Lighthouse</a></td>
        <td><a href="${escapeHtml(row.axe)}">axe</a></td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Usabilidade ${escapeHtml(baseUrl)}</title>
  <style>
    body { font-family: sans-serif; margin: 2rem; }
    table { border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 0.4rem 0.8rem; text-align: left; }
  </style>
</head>
<body>
  <h1>Usabilidade</h1>
  <p>${escapeHtml(baseUrl)}</p>
  <table>
    <thead>
      <tr>
        <th>Rota</th>
        <th>Acessibilidade</th>
        <th>Violações do axe</th>
        <th colspan="2">Relatórios</th>
      </tr>
    </thead>
    <tbody>${items}</tbody>
  </table>
</body>
</html>
`;
}

const chromePath = await resolveChromePath();
await mkdir(outDir, { recursive: true });

const summary = [];

for (const route of routes) {
  const url = pageUrl(route);
  const name = slug(route);
  const lighthouseFile = `lighthouse-${name}.html`;
  const axeFile = `axe-${name}.html`;
  const axeJson = `axe-${name}.json`;

  console.log(`Auditando ${url}`);
  const accessibility = await runLighthouse(url, chromePath, path.join(outDir, lighthouseFile));
  const axe = await runAxe(url, chromePath, axeJson);
  await writeFile(path.join(outDir, axeFile), axeHtml(url, axe));
  await rm(path.join(outDir, axeJson), { force: true });

  summary.push({
    route,
    url,
    accessibility,
    axeViolations: axe.violations.length,
    lighthouse: lighthouseFile,
    axe: axeFile,
  });
}

await writeFile(path.join(outDir, 'summary.json'), JSON.stringify({ baseUrl, routes: summary }, null, 2));
await writeFile(path.join(outDir, 'index.html'), indexHtml(summary));
console.log(`Relatórios em ${outDir}`);
