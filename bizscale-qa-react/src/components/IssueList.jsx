import React, { useMemo, useState } from 'react';
import { DMAP, SMAP } from '../lib/constants.js';
import { ago, safeHref, shortUrl } from '../lib/utils.js';
import { useQa } from '../QaContext.jsx';
import { StatusPill, Who } from './Bits.jsx';
import { ChatIcon, CheckIcon, PlayIcon, UndoIcon } from './Icons.jsx';

export function IssueRow({ issue: i, showDept }) {
  const { actions, setDrawer } = useQa();
  const sev = SMAP[i.severity] || SMAP.medium;
  const d = DMAP[i.dept];
  const href = safeHref(i.url);
  const done = i.status === 'resolved';
  const open = () => setDrawer({ type: 'detail', id: i.id });

  return (
    <div className={`issue ${done ? 'done' : ''}`}>
      <span className="sev" style={{ background: `var(${sev.v})` }} title={sev.name} />
      <div className="body">
        <div className="l1">
          <span className="id">{i.code}</span>
          {showDept && <span className="tag dept" style={{ '--dc': `var(--d-${d.id})` }}>{d.name}</span>}
          <span className="title" role="button" tabIndex={0} onClick={open} onKeyDown={(e) => e.key === 'Enter' && open()}>{i.title}</span>
          {i.sample && <span className="tag sample">Sample</span>}
        </div>
        <div className="l2">
          <StatusPill status={i.status} />
          <span className="sevt" style={{ color: `var(${sev.v})` }}>{sev.name}</span>
          <span className="tag">{i.category}</span>
          <Who id={i.assignee} />
          {href && <a className="url" href={href} target="_blank" rel="noopener noreferrer">{shortUrl(i.url)}</a>}
          <span>{done ? 'fixed ' + ago(i.resolvedAt) : 'logged ' + ago(i.createdAt)}</span>
          {i.notifiedAt && !done && <span className="bell">Chat sent {ago(i.notifiedAt)}</span>}
        </div>
      </div>
      <div className="acts">
        {!done && (
          <button className="btn sm chat" title="Send on Google Chat" onClick={() => setDrawer({ type: 'notify', id: i.id })}>
            <ChatIcon />{i.notifiedAt ? 'Nudge' : 'Notify'}
          </button>
        )}
        {i.status === 'open' && <button className="btn sm" onClick={() => actions.start(i.id)}><PlayIcon />Start</button>}
        {!done
          ? <button className="btn sm ok" onClick={() => actions.resolve(i.id)}><CheckIcon />Mark fixed</button>
          : <button className="btn sm ghost" onClick={() => actions.reopen(i.id)}><UndoIcon />Reopen</button>}
      </div>
    </div>
  );
}

const FILTERS = [['active', 'Needs fixing'], ['open', 'Open'], ['progress', 'In progress'], ['resolved', 'Resolved'], ['all', 'All']];
const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3 };
const STATUS_RANK = { open: 0, progress: 1, resolved: 2 };

export default function IssueList({ list, showDept }) {
  const { member } = useQa();
  const [filter, setFilter] = useState('active');
  const [q, setQ] = useState('');

  const count = (k) => (k === 'active' ? list.filter((i) => i.status !== 'resolved').length
    : k === 'all' ? list.length : list.filter((i) => i.status === k).length);

  const shown = useMemo(() => {
    let l = list.slice();
    if (filter === 'active') l = l.filter((i) => i.status !== 'resolved');
    else if (filter !== 'all') l = l.filter((i) => i.status === filter);
    const s = q.trim().toLowerCase();
    if (s) l = l.filter((i) => [i.title, i.url, i.category, i.code, i.details, (member(i.assignee) || {}).name].join(' ').toLowerCase().includes(s));
    return l.sort((a, b) => (STATUS_RANK[a.status] - STATUS_RANK[b.status])
      || (a.status === 'resolved' ? b.resolvedAt - a.resolvedAt : (SEV_RANK[a.severity] - SEV_RANK[b.severity]) || (b.createdAt - a.createdAt)));
  }, [list, filter, q, member]);

  return (
    <>
      <div className="toolbar">
        <div className="chips">
          {FILTERS.map(([k, n]) => (
            <button key={k} className={`chip ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>{n} <span className="num">{count(k)}</span></button>
          ))}
        </div>
        <input className="input search" placeholder="Search title, URL, person…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search issues" />
      </div>
      <div className="issues">
        {shown.length
          ? shown.map((i) => <IssueRow key={i.id} issue={i} showDept={showDept} />)
          : (
            <div className="empty">
              <b>{filter === 'active' ? 'Nothing waiting on a fix' : 'No issues here'}</b>
              {filter === 'active' ? 'Every logged mistake in this view is resolved.' : 'Try another filter.'}
            </div>
          )}
      </div>
    </>
  );
}
