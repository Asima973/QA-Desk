import React, { useEffect, useState } from 'react';
import { DMAP } from './lib/constants.js';
import { QaProvider, useQa } from './QaContext.jsx';
import Sidebar, { MobileNav } from './components/Sidebar.jsx';
import DrawerHost from './components/Drawers.jsx';
import { DeptView, MineView, Overview, TeamView } from './views/Views.jsx';

const VIEWS = new Set(['overview', 'mine', 'team']);
const readHash = () => {
  const h = (window.location.hash || '#overview').slice(1);
  return VIEWS.has(h) || DMAP[h] ? h : 'overview';
};

function useHashView() {
  const [view, setView] = useState(readHash);
  useEffect(() => {
    const on = () => { setView(readHash()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return view;
}

function Shell() {
  const view = useHashView();
  const { toastMsg } = useQa();
  return (
    <>
      <div className="app">
        <Sidebar view={view} />
        <main className="main">
          <MobileNav view={view} />
          {view === 'overview' && <Overview />}
          {DMAP[view] && <DeptView key={view} id={view} />}
          {view === 'mine' && <MineView />}
          {view === 'team' && <TeamView />}
        </main>
      </div>
      <DrawerHost />
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </>
  );
}

export default function App() {
  return (
    <QaProvider>
      <Shell />
    </QaProvider>
  );
}
