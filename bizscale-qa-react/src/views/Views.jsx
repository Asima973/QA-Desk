import React, { useState } from 'react';
import { DEPTS, DMAP } from '../lib/constants.js';
import { dur, newId, safeHref, stats, topOpenCategory } from '../lib/utils.js';
import { useQa } from '../QaContext.jsx';
import { KpiStrip, Leaderboard, Panel, Who } from '../components/Bits.jsx';
import { CategoryBar, DeptSeverityBar, SeverityDonut, TrendChart } from '../components/Charts.jsx';
import IssueList, { IssueRow } from '../components/IssueList.jsx';
import { MeSelect } from '../components/Sidebar.jsx';
import { PlusIcon } from '../components/Icons.jsx';

function TopBar({ title, sub, dept }) {
  const { setDrawer } = useQa();
  return (
    <div className="topbar">
      <div><h1>{title}</h1><div className="sub">{sub}</div></div>
      <div className="grow" />
      <button className="btn primary" onClick={() => setDrawer({ type: 'new', dept })}><PlusIcon />Log an issue</button>
    </div>
  );
}

/* ---------- Overview ---------- */
function DeptCard({ d }) {
  const { issues } = useQa();
  const l = issues.filter((i) => i.dept === d.id);
  const s = stats(l);
  const worst = topOpenCategory(l);
  const t = Math.max(1, s.total);
  return (
    <a className="dcard" href={'#' + d.id} style={{ '--dc': `var(--d-${d.id})` }}>
      <div className="top"><h3>{d.name}</h3><span className="rate">{s.rate}% fixed</span></div>
      <div className="nums">
        <div><b>{s.active}</b><span>open</span></div>
        <div className={s.crit ? 'crit' : ''}><b>{s.crit}</b><span>critical</span></div>
        <div><b>{s.total}</b><span>mistakes</span></div>
        <div><b>{dur(s.avg)}</b><span>avg fix</span></div>
      </div>
      <div className="bar">
        <i style={{ width: `${(s.open / t) * 100}%`, background: 'var(--crit)' }} />
        <i style={{ width: `${(s.prog / t) * 100}%`, background: 'var(--prog)' }} />
        <i style={{ width: `${(s.resolved / t) * 100}%`, background: 'var(--ok)' }} />
      </div>
      <div className="worst">{worst ? <>Top problem: <b>{worst[0]}</b> ({worst[1]} open)</> : 'No open problems right now'}</div>
    </a>
  );
}

export function Overview() {
  const { issues } = useQa();
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <>
      <TopBar title="Quality overview" sub={`${today} · every department at a glance`} />
      <KpiStrip st={stats(issues)} />
      <div className="depts">{DEPTS.map((d) => <DeptCard key={d.id} d={d} />)}</div>
      <div className="grid2">
        <Panel title="Mistakes vs fixes" sub="Weekly, last 8 weeks"><TrendChart list={issues} /></Panel>
        <Panel title="Open issues by severity" sub="All departments"><SeverityDonut list={issues} /></Panel>
      </div>
      <div className="grid2">
        <Panel title="Where the open issues sit" sub="Per department, stacked by severity"><DeptSeverityBar issues={issues} /></Panel>
        <Panel title="Mistakes by person" sub={<><span style={{ color: 'var(--crit)' }}>■</span> open · <span style={{ color: 'var(--ok)' }}>■</span> fixed</>}>
          <Leaderboard list={issues} />
        </Panel>
      </div>
      <Panel title="All issues" sub="Critical and oldest first"><IssueList list={issues} showDept /></Panel>
    </>
  );
}

/* ---------- Department ---------- */
export function DeptView({ id }) {
  const { issues, members, setDrawer } = useQa();
  const d = DMAP[id];
  const l = issues.filter((i) => i.dept === id);
  const team = members.filter((m) => m.dept === id);
  return (
    <>
      <div className="dhero" style={{ '--dc': `var(--d-${id})` }}>
        <div className="badge">{d.short}</div>
        <div><h1>{d.name}</h1><p>{d.blurb} · {team.length} {team.length === 1 ? 'person' : 'people'} on the roster</p></div>
        <div className="grow" />
        <button className="btn primary" onClick={() => setDrawer({ type: 'new', dept: id })}><PlusIcon />Log {d.name} issue</button>
      </div>
      <KpiStrip st={stats(l)} />
      <div className="grid2">
        <Panel title="What keeps going wrong" sub="Mistakes by type"><CategoryBar list={l} dept={id} /></Panel>
        <Panel title="Who needs support" sub="Mistakes assigned per person"><Leaderboard list={l} /></Panel>
      </div>
      <div className="grid2 even">
        <Panel title="Mistakes vs fixes" sub="Weekly, last 8 weeks"><TrendChart list={l} small /></Panel>
        <Panel title="Open by severity" sub={`${d.name} only`}><SeverityDonut list={l} small /></Panel>
      </div>
      <Panel title={`${d.name} issues`} sub="Paste a URL, assign it, notify, mark fixed"><IssueList key={id} list={l} /></Panel>
    </>
  );
}

/* ---------- My issues ---------- */
export function MineView() {
  const { issues, me, member } = useQa();
  if (!me) {
    return (
      <>
        <TopBar title="My issues" sub="Pick your name under “Viewing as” to see what’s assigned to you" />
        <div className="panel">
          <div className="empty">
            <b>Who are you?</b>Choose your name and this page will list every issue assigned to you.
            <div style={{ marginTop: 12, maxWidth: 280, marginInline: 'auto' }}><MeSelect id="me2" /></div>
          </div>
        </div>
      </>
    );
  }
  const m = member(me);
  const l = issues.filter((i) => i.assignee === me);
  const reported = issues.filter((i) => i.reporter === me && i.assignee !== me).sort((a, b) => b.createdAt - a.createdAt);
  return (
    <>
      <TopBar title={`${m ? m.name : ''}'s issues`} sub="Assigned to you — mark each one fixed when it’s done and it closes for everyone" />
      <KpiStrip st={stats(l)} />
      <Panel title="Assigned to you" style={{ marginBottom: 12 }}><IssueList list={l} showDept /></Panel>
      {reported.length > 0 && (
        <Panel title="You reported" sub="Track what you've flagged for others">
          <div className="issues">{reported.map((i) => <IssueRow key={i.id} issue={i} showDept />)}</div>
        </Panel>
      )}
    </>
  );
}

/* ---------- Team roster ---------- */
const EMPTY_MEMBER = { id: '', name: '', dept: 'content', chat: '', email: '' };

export function TeamView() {
  const { issues, members, member, actions, toast } = useQa();
  const [form, setForm] = useState(EMPTY_MEMBER);
  const [confirmDel, setConfirmDel] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const editing = Boolean(form.id);
  const hasSamples = issues.some((i) => i.sample) || members.some((m) => m.sample);

  const submit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const prev = member(form.id) || {};
    const m = {
      id: form.id || newId('m-'), name, dept: form.dept, chat: form.chat.trim(), email: form.email.trim(),
      createdAt: prev.createdAt || Date.now(),
    };
    if (await actions.saveMember(m)) { toast((editing ? 'Updated ' : 'Added ') + name); setForm(EMPTY_MEMBER); }
  };

  const remove = (id) => {
    if (confirmDel === id) { actions.deleteMember(id); setConfirmDel(null); }
    else { setConfirmDel(id); setTimeout(() => setConfirmDel((c) => (c === id ? null : c)), 3500); }
  };

  return (
    <>
      <div className="topbar"><div><h1>Team roster</h1><div className="sub">People you can assign issues to, and where their Google Chat lives</div></div></div>

      <Panel title={editing ? `Edit ${form.name}` : 'Add a team member'} sub="Paste their Google Chat DM or space link so “Notify” opens the right chat" style={{ marginBottom: 12 }}>
        <form className="form-row" onSubmit={submit}>
          <div className="field"><label htmlFor="m-name">Name</label><input id="m-name" className="input" required placeholder="e.g. Ayesha Khan" value={form.name} onChange={set('name')} /></div>
          <div className="field">
            <label htmlFor="m-dept">Department</label>
            <select id="m-dept" className="input" value={form.dept} onChange={set('dept')}>{DEPTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          </div>
          <div className="field"><label htmlFor="m-chat">Google Chat link <span className="hint">(optional)</span></label><input id="m-chat" className="input" placeholder="https://chat.google.com/dm/…" value={form.chat} onChange={set('chat')} /></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn primary" type="submit">{editing ? 'Save' : 'Add'}</button>
            {editing && <button className="btn ghost" type="button" onClick={() => setForm(EMPTY_MEMBER)}>Cancel</button>}
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="m-email">Work email <span className="hint">(optional — used for @mention in the message)</span></label>
            <input id="m-email" className="input" placeholder="name@bizscale.com" value={form.email} onChange={set('email')} />
          </div>
        </form>
      </Panel>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Person</th><th>Department</th><th>Google Chat</th><th>Mistakes</th><th /></tr></thead>
          <tbody>
            {members.length === 0 && <tr><td colSpan={5} className="empty">No one on the roster yet.</td></tr>}
            {DEPTS.flatMap((d) => members.filter((m) => m.dept === d.id).map((m) => {
              const s = stats(issues.filter((i) => i.assignee === m.id));
              const href = safeHref(m.chat);
              return (
                <tr key={m.id}>
                  <td><Who id={m.id} />{m.sample && <> <span className="tag sample">Sample</span></>}</td>
                  <td><span className="tag dept" style={{ '--dc': `var(--d-${d.id})` }}>{d.name}</span></td>
                  <td>
                    {href ? <a href={href} target="_blank" rel="noopener noreferrer">Chat link</a> : <span className="hint">No chat link</span>}
                    {m.email && <><br /><span className="hint mono">{m.email}</span></>}
                  </td>
                  <td className="num">{s.total} <span className="hint">· {s.active} open</span></td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn sm ghost" onClick={() => setForm({ id: m.id, name: m.name, dept: m.dept, chat: m.chat || '', email: m.email || '' })}>Edit</button>{' '}
                    <button className="btn sm ghost danger" onClick={() => remove(m.id)}>{confirmDel === m.id ? 'Confirm remove' : 'Remove'}</button>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {hasSamples && (
        <div className="panel" style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 16 }}>Sample data</h2>
            <p className="hint" style={{ margin: '2px 0 0' }}>Rows tagged “Sample” were added so the charts have something to show. Clear them once your real team is in.</p>
          </div>
          <button className="btn danger" onClick={() => (confirmClear ? (actions.clearSamples(), setConfirmClear(false)) : setConfirmClear(true))}>
            {confirmClear ? 'Yes, delete all sample rows' : 'Remove sample data'}
          </button>
        </div>
      )}
    </>
  );
}
