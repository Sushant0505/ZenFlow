import { useState } from 'react';
import { api } from '../api.js';
import { useLoad } from '../hooks.js';
import { day, isoDate, money } from '../format.js';
import { Chip, Empty, ErrorBox, Field, Loading } from '../components/ui.jsx';

const DEFAULT_RENT = 4500;

export default function Rentals({ notify }) {
  const { data, error, loading, reload } = useLoad(['/rentals', '/drivers', '/rentals/outstanding']);
  const [form, setForm] = useState({ driverId: '', weekStart: isoDate(), amount: DEFAULT_RENT, status: 'Pending' });
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const [rentals, drivers, outstanding] = data;
  const shown = rentals.filter((r) => {
    const matchesFilter = filter === 'All' || r.status === filter;
    const search = `${r.driver?.name ?? ''} ${r.vehicle?.registrationNumber ?? ''} ${r.status} ${day(r.weekStart)}`.toLowerCase();
    return matchesFilter && search.includes(query.trim().toLowerCase());
  });

  const run = async (fn, onDone) => {
    setBusy(true);
    try {
      const res = await fn();
      notify('success', res.message);
      onDone?.();
      await reload();
    } catch (e) {
      notify('error', e.message);
    } finally {
      setBusy(false);
    }
  };
  const submit = (e) => {
    e.preventDefault();
    run(() => api('/rentals', { method: 'POST', body: { ...form, amount: Number(form.amount) } }), () => setForm({ ...form, driverId: '' }));
  };

  return (
    <>
      <section className="stats two-up">
        <div className="stat bad"><div className="stat-value">{money(outstanding.totalOutstanding)}</div><div className="stat-label">Total outstanding</div></div>
        <div className="stat"><div className="stat-value">{outstanding.drivers.length}</div><div className="stat-label">Drivers with dues</div></div>
      </section>

      <div className="two">
        <section className="panel">
          <div className="panel-head"><h2>Record weekly rent</h2></div>
          <form onSubmit={submit} className="form">
            <Field label="Driver">
              <select required value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
                <option value="">Choose a driver</option>
                {drivers.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Any date in the week" hint="Saved against that week's Monday">
              <input type="date" required value={form.weekStart} onChange={(e) => setForm({ ...form, weekStart: e.target.value })} />
            </Field>
            <Field label="Weekly amount (₹)">
              <input type="number" required min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Field>
            <Field label="Payment status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option>Pending</option>
                <option>Paid</option>
              </select>
            </Field>
            <button className="btn primary" disabled={busy}>Save rental</button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Dues by driver</h2></div>
          {outstanding.drivers.length === 0 ? (
            <Empty>No pending rent.</Empty>
          ) : (
            <div className="scroll">
              <table>
                <thead><tr><th>Driver</th><th>Weeks</th><th className="num">Due</th></tr></thead>
                <tbody>
                  {outstanding.drivers.map((d) => (
                    <tr key={d.driverId}><td>{d.name}</td><td>{d.pendingWeeks}</td><td className="num">{money(d.amount)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div><h2>Rental history <span className="count">{shown.length} / {rentals.length}</span></h2><p className="panel-subtitle">Search payments or filter by status</p></div>
          <div className="seg-control" role="group" aria-label="Filter by payment status">
            {['All', 'Pending', 'Paid'].map((f) => (
              <button key={f} type="button" className={filter === f ? 'on' : ''} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>
        <div className="list-tools">
          <label className="table-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
            <input type="search" aria-label="Search rentals" placeholder="Search by driver or vehicle" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>
        {shown.length === 0 ? (
          <Empty>{rentals.length === 0 ? 'No rentals recorded yet.' : 'No rentals match your search and filter.'}</Empty>
        ) : (
          <div className="scroll">
            <table>
              <thead><tr><th>Week of</th><th>Driver</th><th>Vehicle</th><th className="num">Amount</th><th>Status</th><th>Paid on</th><th /></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r._id}>
                    <td>{day(r.weekStart)}</td>
                    <td>{r.driver?.name}</td>
                    <td>{r.vehicle?.registrationNumber ?? '-'}</td>
                    <td className="num">{money(r.amount)}</td>
                    <td><Chip value={r.status} /></td>
                    <td>{day(r.paidOn)}</td>
                    <td className="act">
                      {r.status === 'Pending' && (
                        <button className="btn sm" disabled={busy} onClick={() => run(() => api(`/rentals/${r._id}/pay`, { method: 'PATCH' }))}>Mark paid</button>
                      )}
                    </td>
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
