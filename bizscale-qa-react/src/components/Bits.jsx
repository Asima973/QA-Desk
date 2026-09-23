import React from 'react';
import { DMAP, STATUS } from '../lib/constants.js';
import { byPerson, dur, initials } from '../lib/utils.js';
import { useQa } from '../QaContext.jsx';

export function StatusPill({ status }) {
  return <span className={`pill st-${status}`}>{STATUS[status]}</span>;
}

export function Avatar({ m, small }) {
  const style = { background: `var(--d-${m ? m.dept : 'content'})` };
  if (!m) style.background = 'var(--low)';
  return <span className="av" style={small ? { ...style, width: 20, height: 20, fontSize: 9 } : style}>{initials(m ? m.name : '?')}</span>;
}

export function Who({ id }) {
  const { member } = useQa();
  const m = member(id);
  return <span className="who"><Avatar m={m} small />{m ? m.name : 'Unassigned'}</span>;
}

export function KpiStrip({ st }) {
  return (
    <div className="kpis">
      <div className={`kpi ${st.active ? 'alert' : ''}`}><span className="k">Open issues</span><span className="v">{st.active}</span><span className="h">{st.open} new · {st.prog} in progress</span></div>
      <div className={`kpi ${st.crit ? 'alert' : ''}`}><span className="k">Critical open</span><span className="v">{st.crit}</span><span className="h">Fix these first</span></div>
      <div className="kpi"><span className="k">Mistakes logged</span><span className="v">{st.total}</span><span className="h">{st.newWeek} in the last 7 days</span></div>
      <div className="kpi good"><span className="k">Resolved</span><span className="v">{st.resolved}</span><span className="h">{st.resWeek} this week · {st.rate}% fix rate</span></div>
      <div className="kpi"><span className="k">Avg time to fix</span><span className="v">{dur(st.avg)}</span><span className="h">Logged → marked fixed</span></div>
    </div>
  );
}

export function Leaderboard({ list }) {
  const { member } = useQa();
  const rows = byPerson(list).slice(0, 8);
  if (!rows.length) return <div className="empty">No mistakes logged yet.</div>;
  const max = Math.max(...rows.map((r) => r.total));
  return (
    <div className="lead">
      {rows.map((r) => {
        const m = member(r.id);
        return (
          <div className="lrow" key={r.id}>
            <Avatar m={m} />
            <div style={{ minWidth: 0 }}>
              <div className="nm">{m ? m.name : 'Unassigned'}<small>{m && DMAP[m.dept] ? DMAP[m.dept].name : ''}</small></div>
              <div className="bar" style={{ width: `${Math.max(8, (r.total / max) * 100)}%` }}>
                <i style={{ width: `${(r.active / r.total) * 100}%`, background: 'var(--crit)' }} />
                <i style={{ width: `${(r.resolved / r.total) * 100}%`, background: 'var(--ok)' }} />
              </div>
            </div>
            <div className="c"><b className="num">{r.total}</b> {r.total === 1 ? 'mistake' : 'mistakes'}<br />{r.active} open</div>
          </div>
        );
      })}
    </div>
  );
}

export function Panel({ title, sub, children, style }) {
  return (
    <div className="panel" style={style}>
      <div className="ph"><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
      {children}
    </div>
  );
}
