import { useState } from 'react';
import { useLoad } from '../hooks.js';
import { money, day } from '../format.js';
import { Empty, ErrorBox, Loading } from '../components/ui.jsx';

export default function Dashboard({ goTo }) {
  const { data, error, loading, reload } = useLoad(['/dashboard', '/rentals/outstanding', '/vehicles', '/breakdowns']);
  const [hoveredStatus, setHoveredStatus] = useState(null);
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const [s, out, vehicles, breakdowns] = data;
  const statuses = [
    { id: 'Available', label: 'Ready to roll', count: s.available, tone: 'ready' },
    { id: 'Assigned', label: 'Out delivering', count: s.assigned, tone: 'active' },
    { id: 'Under Maintenance', label: 'In the workshop', count: s.underMaintenance, tone: 'service' },
  ];
  const circumference = 2 * Math.PI * 43;
  let chartOffset = 0;
  const slices = statuses.map((status) => {
    const length = s.totalVehicles ? (status.count / s.totalVehicles) * circumference : 0;
    const slice = { ...status, length, offset: chartOffset };
    chartOffset += length;
    return slice;
  });
  const modelCounts = Object.entries(vehicles.reduce((counts, vehicle) => {
    counts[vehicle.model] = (counts[vehicle.model] ?? 0) + 1;
    return counts;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxModelCount = Math.max(1, ...modelCounts.map(([, count]) => count));
  const openBreakdowns = breakdowns.filter((item) => item.status === 'Open').slice(0, 4);

  return (
    <>
      <section className="welcome-card">
        <div className="welcome-copy">
          <span className="welcome-kicker"><i /> ELECTRIC MOBILITY · MADE PRACTICAL</span>
          <h2>Cleaner miles.<br />Smarter moves.</h2>
          <p>Every electric delivery is a step toward a quieter, more considered city. Keep your fleet ready for the road ahead.</p>
          <div className="welcome-actions">
            <button className="btn welcome-primary" onClick={() => goTo('fleet')}>Meet your fleet <span aria-hidden="true">↗</span></button>
            <span className="welcome-caption">Good journeys start with a better choice.</span>
          </div>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-sun" />
          <div className="art-road" />
          <svg className="art-vehicle" viewBox="0 0 180 100" fill="none">
            <path d="M25 61h114l18 17v12H18V72l7-11Z" fill="currentColor" />
            <path d="m43 61 12-24h49l19 24" fill="currentColor" />
            <path d="m59 42-8 17h36V42H59ZM94 42v17h24L104 42H94Z" fill="#EAF5EF" />
            <path d="M19 76h139" stroke="#D0E9DA" strokeWidth="3" />
            <circle cx="48" cy="88" r="11" fill="#173D33" stroke="#EAF5EF" strokeWidth="5" />
            <circle cx="133" cy="88" r="11" fill="#173D33" stroke="#EAF5EF" strokeWidth="5" />
            <path d="M157 70h10l7 10h-17V70Z" fill="#C6F06B" />
          </svg>
          <span className="art-label"><span className="art-bolt">ϟ</span> ELECTRIC, EVERY DAY <i /></span>
        </div>
      </section>

      <section className="stats">
        <Stat label="Total vehicles" value={s.totalVehicles} onClick={() => goTo('fleet')} />
        <Stat label="Available" value={s.available} tone="ok" onClick={() => goTo('fleet', 'Available')} />
        <Stat label="Assigned" value={s.assigned} tone="info" onClick={() => goTo('fleet', 'Assigned')} />
        <Stat label="Under maintenance" value={s.underMaintenance} tone="warn" onClick={() => goTo('fleet', 'Under Maintenance')} />
      </section>

      <section className="insights-grid">
        <article className="panel insight-panel">
          <div className="panel-head">
            <div><span className="section-kicker">AT A GLANCE</span><h2>Fleet in motion</h2><p className="panel-subtitle">Every vehicle has a next move.</p></div>
            <button className="icon-action" aria-label="View all fleet vehicles" onClick={() => goTo('fleet')}>↗</button>
          </div>
          <div className="fleet-insight">
            <div className="donut-wrap">
              <svg className="fleet-donut" viewBox="0 0 112 112" role="img" aria-label={`${s.totalVehicles} vehicles: ${s.available} ready to roll, ${s.assigned} out delivering, ${s.underMaintenance} in the workshop`}>
                <circle className="donut-track" cx="56" cy="56" r="43" />
                {slices.map((slice) => (
                  <circle
                    key={slice.id}
                    className={`donut-slice ${slice.tone} ${hoveredStatus === slice.id ? 'highlight' : ''}`}
                    cx="56"
                    cy="56"
                    r="43"
                    strokeDasharray={`${slice.length} ${circumference - slice.length}`}
                    strokeDashoffset={-slice.offset}
                    onMouseEnter={() => setHoveredStatus(slice.id)}
                    onMouseLeave={() => setHoveredStatus(null)}
                    onClick={() => goTo('fleet', slice.id)}
                  />
                ))}
              </svg>
              <div className="donut-center">
                <strong>{hoveredStatus ? statuses.find((item) => item.id === hoveredStatus)?.count : s.totalVehicles}</strong>
                <span>{hoveredStatus ? statuses.find((item) => item.id === hoveredStatus)?.label : 'vehicles'}</span>
              </div>
            </div>
            <div className="insight-legend" role="group" aria-label="Filter fleet by status">
              {statuses.map((status) => (
                <button
                  key={status.id}
                  className={`legend-button ${status.tone} ${hoveredStatus === status.id ? 'selected' : ''}`}
                  onMouseEnter={() => setHoveredStatus(status.id)}
                  onMouseLeave={() => setHoveredStatus(null)}
                  onFocus={() => setHoveredStatus(status.id)}
                  onBlur={() => setHoveredStatus(null)}
                  onClick={() => goTo('fleet', status.id)}
                >
                  <span className="legend-dot" />
                  <span className="legend-copy"><span>{status.label}</span><strong>{status.count}</strong></span>
                  <span className="legend-arrow">↗</span>
                </button>
              ))}
            </div>
          </div>
          <div className="insight-footnote"><span className="pulse-dot" /> Live fleet status <span>·</span> Select a category to explore</div>
        </article>

        <article className="panel insight-panel model-panel">
          <div className="panel-head">
            <div><span className="section-kicker">YOUR ELECTRIC LINEUP</span><h2>Vehicles by model</h2><p className="panel-subtitle">Explore the vehicles powering your fleet.</p></div>
          </div>
          {modelCounts.length === 0 ? (
            <Empty>No vehicles in the fleet yet.</Empty>
          ) : (
            <div className="model-list">
              {modelCounts.map(([model, count], index) => (
                <button className="model-row" key={model} onClick={() => goTo('fleet', 'All', model)} aria-label={`View ${count} ${model} vehicles`}>
                  <span className={`model-icon model-icon-${index % 4}`}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 14.5 4.5 9h12l4.5 5.5V19h-2v-2H5v2H3zM6 9l1.5-4h6L15 9M6 14h.01M18 14h.01" /></svg>
                  </span>
                  <span className="model-details"><strong>{model}</strong><span className="model-meter"><i style={{ width: `${(count / maxModelCount) * 100}%` }} /></span></span>
                  <span className="model-count">{count}<small>{count === 1 ? 'vehicle' : 'vehicles'}</small></span>
                  <span className="model-arrow">↗</span>
                </button>
              ))}
            </div>
          )}
          <button className="text-action" onClick={() => goTo('fleet')}>Explore the full fleet <span>→</span></button>
        </article>
      </section>

      <section className="panel workshop-panel">
        <div className="panel-head">
          <div><span className="section-kicker">KEEPING THINGS MOVING</span><h2>Workshop watch <span className="count">{s.openBreakdowns} open</span></h2><p className="panel-subtitle">A little attention now keeps every vehicle ready for the road.</p></div>
          <button className="btn" onClick={() => goTo('breakdowns')}>Open maintenance <span aria-hidden="true">↗</span></button>
        </div>
        {openBreakdowns.length === 0 ? (
          <div className="workshop-clear"><span className="workshop-check">✓</span><span><strong>All clear.</strong> No vehicles are waiting for repair.</span></div>
        ) : (
          <div className="workshop-list">
            {openBreakdowns.map((item) => (
              <button className="workshop-item" key={item._id} onClick={() => goTo('breakdowns')}>
                <span className="workshop-icon"><span /></span>
                <span className="workshop-copy"><strong>{item.vehicle?.registrationNumber ?? 'Vehicle'}</strong><span>{item.issue}</span></span>
                <span className="workshop-date">{day(item.date)}</span>
                <span className="model-arrow">↗</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div><h2>Outstanding rent</h2><p className="panel-subtitle">Drivers with payments to follow up</p></div>
          <div className="panel-actions"><strong className="due">{money(out.totalOutstanding)}</strong><button className="btn" onClick={() => goTo('rentals')}>Open rentals <span aria-hidden="true">↗</span></button></div>
        </div>
        {out.drivers.length === 0 ? (
          <Empty>No pending rent. Every driver is paid up.</Empty>
        ) : (
          <div className="scroll">
            <table>
              <thead><tr><th>Driver</th><th>Phone</th><th>Weeks pending</th><th>Oldest week</th><th className="num">Amount due</th></tr></thead>
              <tbody>
                {out.drivers.map((d) => (
                  <tr key={d.driverId}>
                    <td>{d.name}</td><td>{d.phone}</td><td>{d.pendingWeeks}</td><td>{day(d.oldest)}</td>
                    <td className="num">{money(d.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </>
  );
}

const Stat = ({ label, value, tone = '', onClick }) => (
  <button className={`stat stat-action ${tone}`} onClick={onClick} aria-label={`View ${label.toLowerCase()}: ${value} vehicles`}>
    <span className="stat-topline"><span className="stat-label">{label}</span><span className="stat-mark" /></span>
    <span className="stat-value">{value}</span>
    <span className="stat-foot">View vehicles <span aria-hidden="true">↗</span></span>
  </button>
);
