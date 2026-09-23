/*
 * Data layer.
 *
 * Everything the UI needs goes through this small API:
 *   subscribe(cb)  -> unsubscribe      (cb receives { issues, members })
 *   saveIssue(issue) / patchIssue(id, patch) / deleteIssue(id)
 *   saveMember(member) / deleteMember(id)
 *
 * This default implementation keeps data in the browser's localStorage and
 * syncs across tabs of the same browser. To share one live board across the
 * whole team, swap these functions for Firebase Firestore / Supabase calls
 * with the same signatures — no component needs to change.
 */
import { DAY } from './constants.js';
import { lsGet, lsSet } from './utils.js';

const KEY = 'bz-qa-data';
let state = load();
const listeners = new Set();

function load() {
  try {
    const saved = JSON.parse(lsGet(KEY) || 'null');
    if (saved && Array.isArray(saved.members)) return { issues: saved.issues || [], members: saved.members };
  } catch { /* fall through to sample */ }
  return sampleData();
}

function commit(next) {
  state = next;
  lsSet(KEY, JSON.stringify(state));
  listeners.forEach((cb) => cb(state));
}

// keep multiple tabs in sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) { state = load(); listeners.forEach((cb) => cb(state)); }
  });
}

export function subscribe(cb) {
  listeners.add(cb);
  cb(state);
  return () => listeners.delete(cb);
}

export async function saveIssue(issue) {
  const exists = state.issues.some((i) => i.id === issue.id);
  commit({ ...state, issues: exists ? state.issues.map((i) => (i.id === issue.id ? issue : i)) : [...state.issues, issue] });
}

export async function patchIssue(id, patch) {
  commit({ ...state, issues: state.issues.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
}

export async function deleteIssue(id) {
  commit({ ...state, issues: state.issues.filter((i) => i.id !== id) });
}

export async function saveMember(member) {
  const exists = state.members.some((m) => m.id === member.id);
  commit({ ...state, members: exists ? state.members.map((m) => (m.id === member.id ? member : m)) : [...state.members, member] });
}

export async function deleteMember(id) {
  commit({ ...state, members: state.members.filter((m) => m.id !== id) });
}

export async function clearSamples() {
  commit({ issues: state.issues.filter((i) => !i.sample), members: state.members.filter((m) => !m.sample) });
}

/* ---------- sample data (tagged `sample: true`, removable from Team roster) ---------- */
function sampleData() {
  const now = Date.now(), H = 36e5;
  const short = { content: 'CT', graphics: 'GR', gmb: 'GB', onpage: 'ON', offpage: 'OF', webdev: 'WD' };
  const members = [
    ['m-jw1', 'Junior Writer 1', 'content'], ['m-jw2', 'Junior Writer 2', 'content'], ['m-ew', 'Executive Writer', 'content'],
    ['m-int', 'Content Intern', 'content'], ['m-gd', 'Graphic Designer', 'graphics'], ['m-gmb', 'GMB Specialist', 'gmb'],
    ['m-on', 'On-page SEO', 'onpage'], ['m-off', 'Off-page SEO', 'offpage'], ['m-wd', 'Web Developer', 'webdev'],
  ].map(([id, name, dept]) => ({ id, name, dept, chat: '', email: '', sample: true, createdAt: now }));

  const rows = [
    ['content', 'Primary keyword missing from H1 on Houston locksmith page', 'Target keyword missing', 'high', 'm-jw1', 2, null, 'open'],
    ['content', 'Blog intro flagged 80% AI by detector', 'Reads AI-written', 'high', 'm-int', 4, null, 'progress'],
    ['content', 'Wrong phone number in service page footer copy', 'Wrong facts / NAP', 'critical', 'm-jw2', 1, null, 'open'],
    ['content', 'FAQ answers not following client brief', 'Brief not followed', 'medium', 'm-ew', 18, 30, 'resolved'],
    ['content', 'Typos across roofing cost blog', 'Grammar / typos', 'low', 'm-int', 25, 6, 'resolved'],
    ['graphics', 'GBP post creative shows old logo', 'Logo misuse', 'medium', 'm-gd', 3, null, 'open'],
    ['graphics', 'Banner exported at wrong size for Facebook cover', 'Wrong size / dimensions', 'low', 'm-gd', 22, 20, 'resolved'],
    ['gmb', 'Weekly GBP post not published for tree service client', 'Post not published', 'high', 'm-gmb', 6, null, 'progress'],
    ['gmb', '3 recent reviews without owner replies', 'Review reply missing', 'medium', 'm-gmb', 30, 48, 'resolved'],
    ['onpage', 'Duplicate meta descriptions on city pages', 'Meta title / description', 'medium', 'm-on', 9, 70, 'resolved'],
    ['onpage', 'LocalBusiness schema failing Rich Results test', 'Schema missing / invalid', 'high', 'm-on', 2, null, 'open'],
    ['onpage', 'Images missing alt text on gallery page', 'Missing alt text', 'low', 'm-on', 35, 26, 'resolved'],
    ['offpage', 'NAP mismatch on Yelp citation', 'Citation NAP mismatch', 'medium', 'm-off', 14, 96, 'resolved'],
    ['offpage', 'Exact-match anchor used on 4 guest posts', 'Wrong anchor text', 'medium', 'm-off', 5, null, 'open'],
    ['webdev', 'Contact form not sending on mobile', 'Form not working', 'critical', 'm-wd', 1, null, 'open'],
    ['webdev', 'Mobile menu overlapping hero on iPhone', 'Mobile layout broken', 'high', 'm-wd', 11, 40, 'resolved'],
    ['webdev', 'PageSpeed mobile score 38 on homepage', 'Slow page speed', 'medium', 'm-wd', 40, 120, 'resolved'],
  ];
  const issues = rows.map(([dept, title, category, severity, assignee, daysAgo, fixH, status], k) => {
    const createdAt = now - daysAgo * DAY - 3 * H;
    const history = [{ t: createdAt, by: null, what: 'Logged' }];
    const i = {
      id: 'sample-' + (k + 1), code: `QA-${short[dept]}-${101 + k}`, dept, title, category, severity, assignee,
      reporter: null, url: `https://example.com/sample-page-${k + 1}/`,
      details: 'Sample issue — delete from Team roster › Remove sample data.',
      status, createdAt, sample: true, history,
    };
    if (status === 'resolved') { i.resolvedAt = createdAt + fixH * H; history.push({ t: i.resolvedAt, by: null, what: 'Marked fixed' }); }
    if (status === 'progress') { i.startedAt = createdAt + 2 * H; history.push({ t: i.startedAt, by: null, what: 'Started fixing' }); }
    return i;
  });
  return { issues, members };
}
