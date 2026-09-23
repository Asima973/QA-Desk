import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { DEPTS, DMAP, SEV } from '../lib/constants.js';
import { css, weekly } from '../lib/utils.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);

const FONT = '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif';
ChartJS.defaults.font.family = FONT;

/** Re-render charts when the OS theme or a data-theme attribute changes. */
export function useThemeKey() {
  const [key, setKey] = useState(0);
  useEffect(() => {
    const bump = () => setKey((k) => k + 1);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', bump);
    const mo = new MutationObserver(bump);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { mq.removeEventListener('change', bump); mo.disconnect(); };
  }, []);
  return key;
}

function baseOpts(extra = {}) {
  const ink2 = css('--ink-2'), line = css('--line');
  const font = { family: FONT, size: 11 };
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: { labels: { color: ink2, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'rectRounded', font: { ...font, size: 12 } } },
      tooltip: { backgroundColor: css('--ink'), titleColor: css('--bg'), bodyColor: css('--bg'), padding: 10, cornerRadius: 8 },
    },
    scales: {
      x: { grid: { display: false }, border: { color: line }, ticks: { color: ink2, font } },
      y: { beginAtZero: true, grid: { color: line }, border: { display: false }, ticks: { color: ink2, precision: 0, font } },
    },
    ...extra,
  };
}

export function TrendChart({ list, small }) {
  const tk = useThemeKey();
  const w = weekly(list);
  const bad = css('--crit'), ok = css('--ok');
  const last = (c) => (c.dataIndex === w.length - 1 ? 5 : 2);
  const data = {
    labels: w.map((x) => 'Wk ' + x.label),
    datasets: [
      { label: 'Mistakes logged', data: w.map((x) => x.opened), borderColor: bad, backgroundColor: bad + '22', fill: true, cubicInterpolationMode: 'monotone', pointRadius: last, pointBackgroundColor: bad, borderWidth: 2.2 },
      { label: 'Resolved', data: w.map((x) => x.resolved), borderColor: ok, backgroundColor: ok + '1c', fill: true, cubicInterpolationMode: 'monotone', pointRadius: last, pointBackgroundColor: ok, borderWidth: 2.2 },
    ],
  };
  return <div className={`chart ${small ? 'sm' : ''}`}><Line key={tk} data={data} options={baseOpts({ interaction: { mode: 'index', intersect: false } })} /></div>;
}

export function SeverityDonut({ list, small }) {
  const tk = useThemeKey();
  const act = list.filter((i) => i.status !== 'resolved');
  const opts = baseOpts({ cutout: '66%', scales: {} });
  opts.plugins.legend.position = 'right';
  const data = {
    labels: SEV.map((s) => s.name),
    datasets: [{ data: SEV.map((s) => act.filter((i) => i.severity === s.id).length), backgroundColor: SEV.map((s) => css(s.v)), borderColor: css('--surface'), borderWidth: 3 }],
  };
  return <div className={`chart ${small ? 'sm' : ''}`}><Doughnut key={tk} data={data} options={opts} /></div>;
}

export function DeptSeverityBar({ issues }) {
  const tk = useThemeKey();
  const opts = baseOpts();
  opts.scales.x.stacked = true;
  opts.scales.y.stacked = true;
  const data = {
    labels: DEPTS.map((d) => d.name),
    datasets: SEV.map((s) => ({
      label: s.name,
      data: DEPTS.map((d) => issues.filter((i) => i.dept === d.id && i.status !== 'resolved' && i.severity === s.id).length),
      backgroundColor: css(s.v), borderRadius: 4, maxBarThickness: 34,
    })),
  };
  return <div className="chart"><Bar key={tk} data={data} options={opts} /></div>;
}

export function CategoryBar({ list, dept }) {
  const tk = useThemeKey();
  const col = css('--d-' + dept);
  const rows = DMAP[dept].cats
    .map((c) => ({ c, n: list.filter((i) => i.category === c).length, a: list.filter((i) => i.category === c && i.status !== 'resolved').length }))
    .sort((a, b) => b.n - a.n);
  const opts = baseOpts({ indexAxis: 'y' });
  opts.scales.x = { ...opts.scales.x, stacked: true, beginAtZero: true, grid: { color: css('--line') }, ticks: { ...opts.scales.x.ticks, precision: 0 } };
  opts.scales.y = { ...opts.scales.y, stacked: true, grid: { display: false } };
  const data = {
    labels: rows.map((r) => r.c),
    datasets: [
      { label: 'Still open', data: rows.map((r) => r.a), backgroundColor: col, borderRadius: 4, maxBarThickness: 18 },
      { label: 'Resolved', data: rows.map((r) => r.n - r.a), backgroundColor: col + '55', borderRadius: 4, maxBarThickness: 18 },
    ],
  };
  return <div className="chart"><Bar key={tk} data={data} options={opts} /></div>;
}
