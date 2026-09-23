import { DAY, DMAP, SMAP } from './constants.js';

export const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

export const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
export const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };

export const initials = (n) =>
  (n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export function ago(t) {
  if (!t) return '';
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  const d = Math.floor(s / 86400);
  return d < 30 ? d + 'd ago' : new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function dur(ms) {
  if (ms == null) return '—';
  const h = ms / 36e5;
  if (h < 1) return Math.max(1, Math.round(ms / 6e4)) + 'm';
  if (h < 48) return (h < 10 ? h.toFixed(1) : Math.round(h)) + 'h';
  return (h / 24).toFixed(1) + 'd';
}

export function shortUrl(u) {
  try { const x = new URL(u); return x.hostname.replace(/^www\./, '') + (x.pathname === '/' ? '' : x.pathname); }
  catch { return u; }
}

export function safeHref(u) {
  try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : null; }
  catch { return null; }
}

export const newId = (prefix = '') =>
  prefix + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

export const mkCode = (dept) => 'QA-' + DMAP[dept].short + '-' + Date.now().toString(36).slice(-4).toUpperCase();

/* ---------- metrics ---------- */
export function stats(list) {
  const open = list.filter((i) => i.status === 'open').length;
  const prog = list.filter((i) => i.status === 'progress').length;
  const res = list.filter((i) => i.status === 'resolved');
  const crit = list.filter((i) => i.status !== 'resolved' && i.severity === 'critical').length;
  const weekAgo = Date.now() - 7 * DAY;
  const fix = res.filter((i) => i.resolvedAt && i.createdAt).map((i) => i.resolvedAt - i.createdAt);
  return {
    total: list.length,
    open,
    prog,
    active: open + prog,
    resolved: res.length,
    crit,
    resWeek: res.filter((i) => i.resolvedAt >= weekAgo).length,
    newWeek: list.filter((i) => i.createdAt >= weekAgo).length,
    avg: fix.length ? fix.reduce((a, b) => a + b, 0) / fix.length : null,
    rate: list.length ? Math.round((res.length / list.length) * 100) : 0,
  };
}

export function weekly(list, n = 8) {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  const end = now.getTime();
  const out = [];
  for (let w = n - 1; w >= 0; w--) {
    const hi = end - w * 7 * DAY, lo = hi - 7 * DAY;
    out.push({
      label: new Date(lo + DAY).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      opened: list.filter((i) => i.createdAt > lo && i.createdAt <= hi).length,
      resolved: list.filter((i) => i.resolvedAt && i.resolvedAt > lo && i.resolvedAt <= hi).length,
    });
  }
  return out;
}

export function byPerson(list) {
  const m = {};
  list.forEach((i) => {
    const k = i.assignee || '_none';
    m[k] = m[k] || { id: k, total: 0, active: 0, resolved: 0 };
    m[k].total++;
    if (i.status === 'resolved') m[k].resolved++; else m[k].active++;
  });
  return Object.values(m).sort((a, b) => b.total - a.total || b.active - a.active);
}

export function topOpenCategory(list) {
  const counts = list.filter((i) => i.status !== 'resolved')
    .reduce((m, i) => ((m[i.category] = (m[i.category] || 0) + 1), m), {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || null;
}

/* ---------- Google Chat message ---------- */
export function chatText(issue, members) {
  const find = (id) => members.find((m) => m.id === id);
  const m = find(issue.assignee), r = find(issue.reporter);
  const tag = m ? (m.email ? `<users/${m.email}>` : '@' + m.name) : '';
  return `🔎 *QA issue ${issue.code}* · ${DMAP[issue.dept].name}${issue.notifiedAt ? ' (reminder)' : ''}
${tag} please fix this:

*${issue.title}*
• Type: ${issue.category}
• Severity: ${SMAP[issue.severity].name}
• URL: ${issue.url}${issue.details ? `\n• Notes: ${issue.details}` : ''}
${r ? `\nReported by ${r.name}. ` : '\n'}Open the BizScale QA Desk and hit “Mark fixed” once done — it closes automatically for the team.`;
}
