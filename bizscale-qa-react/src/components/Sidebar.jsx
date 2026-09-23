import React from 'react';
import { DEPTS } from '../lib/constants.js';
import { stats } from '../lib/utils.js';
import { useQa } from '../QaContext.jsx';

export function MeSelect({ id = 'me' }) {
  const { members, me, setMe } = useQa();
  return (
    <select id={id} className="input" value={me || ''} onChange={(e) => setMe(e.target.value)}>
      <option value="">Pick your name…</option>
      {DEPTS.map((d) => {
        const ms = members.filter((m) => m.dept === d.id);
        return ms.length ? (
          <optgroup key={d.id} label={d.name}>
            {ms.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </optgroup>
        ) : null;
      })}
    </select>
  );
}

function useNavItems() {
  const { issues, members, me } = useQa();
  const all = stats(issues);
  const depts = DEPTS.map((d) => {
    const l = issues.filter((i) => i.dept === d.id);
    return { id: d.id, name: d.name, ct: stats(l).active, hot: l.some((i) => i.status !== 'resolved' && i.severity === 'critical'), color: `--d-${d.id}` };
  });
  const mine = me ? issues.filter((i) => i.assignee === me && i.status !== 'resolved').length : 0;
  return {
    overview: { id: 'overview', name: 'Overview', ct: all.active, color: '--accent' },
    depts,
    extra: [
      { id: 'mine', name: 'My issues', ct: mine, color: '--prog' },
      { id: 'team', name: 'Team roster', ct: members.length, color: '--ink-3' },
    ],
  };
}

function NavLink({ it, view }) {
  return (
    <a href={'#' + it.id} className={view === it.id ? 'on' : ''}>
      <span className="dot" style={{ background: `var(${it.color})` }} />
      {it.name}
      <span className={`ct num ${it.hot ? 'hot' : ''}`}>{it.ct}</span>
    </a>
  );
}

export default function Sidebar({ view }) {
  const { overview, depts, extra } = useNavItems();
  return (
    <aside className="side" aria-label="Departments">
      <div className="brand">
        <div className="brand-mark">B</div>
        <div><b>BizScale</b><small>QA Desk</small></div>
      </div>
      <nav className="nav">
        <div className="nav-label">Dashboard</div>
        <NavLink it={overview} view={view} />
        <div className="nav-label">Departments</div>
        {depts.map((it) => <NavLink key={it.id} it={it} view={view} />)}
        <div className="nav-label">You &amp; team</div>
        {extra.map((it) => <NavLink key={it.id} it={it} view={view} />)}
      </nav>
      <div className="side-foot">
        <label htmlFor="me">Viewing as</label>
        <MeSelect />
      </div>
    </aside>
  );
}

export function MobileNav({ view }) {
  const { overview, depts, extra } = useNavItems();
  const items = [overview, ...depts, { ...extra[0] }, { ...extra[1], name: 'Team' }];
  return (
    <nav className="mobile-nav" aria-label="Departments">
      {items.map((it) => (
        <a key={it.id} href={'#' + it.id} className={view === it.id ? 'on' : ''}>{it.name} <span className="num">{it.ct}</span></a>
      ))}
    </nav>
  );
}
