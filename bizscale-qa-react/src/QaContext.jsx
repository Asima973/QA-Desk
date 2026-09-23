import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as store from './lib/store.js';
import { lsGet, lsSet } from './lib/utils.js';

const QaContext = createContext(null);
export const useQa = () => useContext(QaContext);

export function QaProvider({ children }) {
  const [data, setData] = useState({ issues: [], members: [] });
  const [me, setMeState] = useState(() => lsGet('bz-qa-me') || null);
  const [toastMsg, setToastMsg] = useState(null);
  // drawer: null | { type: 'new', dept } | { type: 'notify', id } | { type: 'detail', id }
  const [drawer, setDrawer] = useState(null);

  useEffect(() => store.subscribe((s) => setData({ issues: s.issues, members: s.members })), []);

  useEffect(() => {
    if (!toastMsg) return undefined;
    const t = setTimeout(() => setToastMsg(null), 2600);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const toast = useCallback((m) => setToastMsg(m), []);
  const setMe = useCallback((id) => { setMeState(id || null); lsSet('bz-qa-me', id || ''); }, []);

  const members = useMemo(
    () => [...data.members].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [data.members]
  );
  const member = useCallback((id) => members.find((m) => m.id === id), [members]);

  const fail = useCallback(() => toast('Couldn’t save — check your connection and try again.'), [toast]);

  /** Update an issue and append an activity entry. */
  const updateIssue = useCallback(async (id, patch, what) => {
    const cur = data.issues.find((i) => i.id === id);
    if (!cur) return;
    const history = [...(cur.history || []), { t: Date.now(), by: me, what }].slice(-30);
    try { await store.patchIssue(id, { ...patch, history }); } catch { fail(); }
  }, [data.issues, me, fail]);

  const actions = useMemo(() => ({
    start: (id) => updateIssue(id, { status: 'progress', startedAt: Date.now() }, 'Started fixing').then(() => toast('Marked in progress')),
    resolve: (id) => updateIssue(id, { status: 'resolved', resolvedAt: Date.now(), resolvedBy: me }, 'Marked fixed')
      .then(() => { toast('Resolved — counts and charts updated'); setDrawer(null); }),
    reopen: (id) => updateIssue(id, { status: 'open', resolvedAt: null, notifiedAt: null }, 'Reopened').then(() => toast('Reopened')),
    notified: (id) => updateIssue(id, { notifiedAt: Date.now() }, 'Chat notification sent'),
    reassign: (id, to) => {
      const m = members.find((x) => x.id === to);
      return updateIssue(id, { assignee: to, notifiedAt: null }, 'Reassigned to ' + (m ? m.name : '')).then(() => toast('Reassigned to ' + (m ? m.name : '')));
    },
    create: async (issue) => { try { await store.saveIssue(issue); return true; } catch { fail(); return false; } },
    saveMember: async (m) => { try { await store.saveMember(m); return true; } catch { fail(); return false; } },
    deleteMember: async (id) => { try { await store.deleteMember(id); toast('Removed'); } catch { fail(); } },
    clearSamples: async () => { try { await store.clearSamples(); toast('Sample data removed'); } catch { fail(); } },
  }), [updateIssue, toast, me, members, fail]);

  const value = {
    issues: data.issues, members, member, me, setMe,
    actions, toast, toastMsg, drawer, setDrawer,
  };
  return <QaContext.Provider value={value}>{children}</QaContext.Provider>;
}
