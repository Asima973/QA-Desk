import React, { useEffect, useRef, useState } from 'react';
import { DEPTS, DMAP, SEV, SMAP } from '../lib/constants.js';
import { ago, chatText, dur, mkCode, newId, safeHref } from '../lib/utils.js';
import { useQa } from '../QaContext.jsx';
import { StatusPill, Who } from './Bits.jsx';
import { ChatIcon, CheckIcon, PlayIcon, UndoIcon, XIcon } from './Icons.jsx';

function Drawer({ title, badge, onClose, children, footer, labelId }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" role="dialog" aria-modal="true" aria-labelledby={labelId}>
        <header>
          {badge}
          <h2 id={labelId}>{title}</h2>
          <button className="btn ghost sm" onClick={onClose} aria-label="Close"><XIcon /></button>
        </header>
        {children}
        <footer>{footer}</footer>
      </div>
    </div>
  );
}

function AssigneeOptions({ dept }) {
  const { members } = useQa();
  const same = members.filter((m) => m.dept === dept);
  const other = members.filter((m) => m.dept !== dept);
  return (
    <>
      <option value="">Choose who fixes it…</option>
      {same.length > 0 && (
        <optgroup label={`${DMAP[dept].name} team`}>
          {same.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </optgroup>
      )}
      {other.length > 0 && (
        <optgroup label="Other departments">
          {other.map((m) => <option key={m.id} value={m.id}>{m.name} · {DMAP[m.dept]?.name}</option>)}
        </optgroup>
      )}
    </>
  );
}

/* ---------- Log a new issue ---------- */
export function NewIssueDrawer({ initialDept }) {
  const { me, actions, setDrawer, toast } = useQa();
  const [dept, setDept] = useState(initialDept || 'content');
  const [f, setF] = useState({ url: '', title: '', category: DMAP[initialDept || 'content'].cats[0], severity: 'medium', assignee: '', details: '' });
  const urlRef = useRef(null);
  useEffect(() => { urlRef.current?.focus(); }, []);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target ? e.target.value : e }));
  const pickDept = (id) => { setDept(id); setF((p) => ({ ...p, category: DMAP[id].cats[0] })); };
  const close = () => setDrawer(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!f.assignee) { toast('Pick who should fix it'); return; }
    const now = Date.now();
    const issue = {
      id: newId(), code: mkCode(dept), dept, url: f.url.trim(), title: f.title.trim(), category: f.category,
      severity: f.severity, assignee: f.assignee, reporter: me, details: f.details.trim(), status: 'open',
      createdAt: now, history: [{ t: now, by: me, what: 'Logged' }],
    };
    if (await actions.create(issue)) {
      toast(issue.code + ' logged');
      setDrawer({ type: 'notify', id: issue.id, fresh: issue });
    }
  };

  return (
    <Drawer title="Log a QA issue" labelId="nd-t" onClose={close}
      footer={<><button className="btn ghost" onClick={close}>Cancel</button><button className="btn primary" type="submit" form="nform"><CheckIcon />Save &amp; notify</button></>}>
      <form id="nform" className="dbody" onSubmit={submit}>
        <div className="field">
          <label>Department</label>
          <div className="segs">
            {DEPTS.map((d) => (
              <button type="button" key={d.id} className={`seg ${d.id === dept ? 'on' : ''}`} style={{ color: `var(--d-${d.id})` }} onClick={() => pickDept(d.id)}>
                <span style={{ color: 'var(--ink)' }}>{d.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="n-url">Page / asset URL</label>
          <input ref={urlRef} id="n-url" className="input mono" type="url" required placeholder="https://client-site.com/service-page/" value={f.url} onChange={set('url')} />
        </div>
        <div className="field">
          <label htmlFor="n-title">What's wrong</label>
          <input id="n-title" className="input" required maxLength={140} placeholder="e.g. H1 missing primary keyword on Houston page" value={f.title} onChange={set('title')} />
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor="n-cat">Mistake type</label>
            <select id="n-cat" className="input" value={f.category} onChange={set('category')}>
              {DMAP[dept].cats.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="n-as">Assign to</label>
            <select id="n-as" className="input" required value={f.assignee} onChange={set('assignee')}><AssigneeOptions dept={dept} /></select>
          </div>
        </div>
        <div className="field">
          <label>Severity</label>
          <div className="segs">
            {SEV.map((s) => (
              <button type="button" key={s.id} className={`seg ${f.severity === s.id ? 'on' : ''}`} style={{ color: `var(${s.v})` }} onClick={() => setF((p) => ({ ...p, severity: s.id }))}>{s.name}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="n-det">Details &amp; how to fix <span className="hint">(optional)</span></label>
          <textarea id="n-det" className="input" placeholder="What you found, where on the page, what 'fixed' looks like" value={f.details} onChange={set('details')} />
        </div>
        <p className="hint" style={{ margin: 0 }}>After saving you'll get a ready-to-send Google Chat message for the assignee.</p>
      </form>
    </Drawer>
  );
}

/* ---------- Google Chat notify ---------- */
export function NotifyDrawer({ id, fresh }) {
  const { issues, members, member, actions, setDrawer, toast } = useQa();
  const issue = issues.find((i) => i.id === id) || fresh;
  const [msg, setMsg] = useState(() => (issue ? chatText(issue, members) : ''));
  const taRef = useRef(null);
  if (!issue) return null;
  const m = member(issue.assignee);
  const href = (m && safeHref(m.chat)) || 'https://chat.google.com/';
  const close = () => setDrawer(null);

  const copy = async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(msg); ok = true; } catch { taRef.current?.focus(); taRef.current?.select(); }
    toast(ok ? 'Message copied — paste it in Google Chat' : 'Message selected — press Ctrl/Cmd + C');
    actions.notified(issue.id);
  };

  return (
    <Drawer title={`Notify ${m ? m.name : 'assignee'} on Google Chat`} labelId="cn-t" onClose={close}
      footer={<>
        <button className="btn ghost" onClick={close}>Skip</button>
        <button className="btn" onClick={copy}>Copy message</button>
        <a className="btn chat" href={href} target="_blank" rel="noopener noreferrer" onClick={() => { copy(); setTimeout(close, 300); }}><ChatIcon />Copy &amp; open Google Chat</a>
      </>}>
      <div className="dbody">
        <p className="hint" style={{ margin: 0 }}>
          Copy the message, then paste it in {m && m.chat ? `${m.name}'s chat` : 'Google Chat'} (Ctrl/Cmd + V).
          {m && !m.chat && ' Tip: add their Chat link in Team roster so this opens their DM directly.'}
        </p>
        <textarea ref={taRef} className="input chatmsg" aria-label="Message" value={msg} onChange={(e) => setMsg(e.target.value)} />
        {!(m && m.email) && <p className="hint" style={{ margin: 0 }}>Add a work email to this person in Team roster to get a real @mention.</p>}
      </div>
    </Drawer>
  );
}

/* ---------- Issue detail ---------- */
export function DetailDrawer({ id }) {
  const { issues, member, actions, setDrawer } = useQa();
  const i = issues.find((x) => x.id === id);
  if (!i) return null;
  const sev = SMAP[i.severity], d = DMAP[i.dept], href = safeHref(i.url), r = member(i.reporter);
  const close = () => setDrawer(null);
  const done = i.status === 'resolved';

  return (
    <Drawer title={i.code} labelId="dt-t" onClose={close}
      badge={<span className="tag dept" style={{ '--dc': `var(--d-${d.id})` }}>{d.name}</span>}
      footer={<>
        {!done && <button className="btn chat" onClick={() => setDrawer({ type: 'notify', id: i.id })}><ChatIcon />Notify</button>}
        {i.status === 'open' && <button className="btn" onClick={() => actions.start(i.id)}><PlayIcon />Start</button>}
        {!done
          ? <button className="btn primary" onClick={() => actions.resolve(i.id)}><CheckIcon />Mark fixed</button>
          : <button className="btn" onClick={() => actions.reopen(i.id)}><UndoIcon />Reopen</button>}
      </>}>
      <div className="dbody">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusPill status={i.status} />
          <span className="sevt" style={{ color: `var(${sev.v})` }}>{sev.name}</span>
          {i.sample && <span className="tag sample">Sample</span>}
        </div>
        <h3 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 20 }}>{i.title}</h3>
        <dl className="kv">
          <dt>URL</dt><dd>{href ? <a className="mono" href={href} target="_blank" rel="noopener noreferrer">{i.url}</a> : i.url}</dd>
          <dt>Type</dt><dd>{i.category}</dd>
          <dt>Assigned to</dt><dd><Who id={i.assignee} /></dd>
          <dt>Reported by</dt><dd>{r ? r.name : '—'}</dd>
          <dt>Logged</dt><dd>{new Date(i.createdAt).toLocaleString()}</dd>
          {i.resolvedAt && <><dt>Fixed</dt><dd>{new Date(i.resolvedAt).toLocaleString()} · took {dur(i.resolvedAt - i.createdAt)}</dd></>}
        </dl>
        {i.details && <div className="panel" style={{ padding: '12px 14px', whiteSpace: 'pre-wrap' }}>{i.details}</div>}
        <div className="field">
          <label htmlFor="dt-as">Reassign</label>
          <select id="dt-as" className="input" value={i.assignee || ''} onChange={(e) => e.target.value && actions.reassign(i.id, e.target.value)}>
            <AssigneeOptions dept={i.dept} />
          </select>
        </div>
        <div>
          <div className="nav-label" style={{ paddingLeft: 0 }}>Activity</div>
          <div className="timeline">
            {[...(i.history || [])].reverse().map((h, ix) => (
              <div key={ix}>{h.what || 'Updated'}{h.by && member(h.by) ? ' by ' + member(h.by).name : ''} <small>· {ago(h.t)}</small></div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

export default function DrawerHost() {
  const { drawer } = useQa();
  if (!drawer) return null;
  if (drawer.type === 'new') return <NewIssueDrawer key="new" initialDept={drawer.dept} />;
  if (drawer.type === 'notify') return <NotifyDrawer key={'n' + drawer.id} id={drawer.id} fresh={drawer.fresh} />;
  if (drawer.type === 'detail') return <DetailDrawer key={'d' + drawer.id} id={drawer.id} />;
  return null;
}
