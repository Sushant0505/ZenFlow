import { useState } from 'react';
import { api } from '../api.js';
import { useLoad } from '../hooks.js';
import { day, isoDate } from '../format.js';
import { Chip, Empty, ErrorBox, Field, Loading } from '../components/ui.jsx';

export default function Breakdowns({ notify }) {
  const { data, error, loading, reload } = useLoad(['/breakdowns', '/vehicles']);
  const [form, setForm] = useState({ vehicleId: '', date: isoDate(), issue: '', vehicleStatus: 'Under Maintenance' });
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const [items, vehicles] = data;
  const openIds = new Set(items.filter((b) => b.status === 'Open').map((b) => b.vehicle?._id));
  const selectable = vehicles.filter((v) => !openIds.has(v._id));
  const shown = items.filter((item) => {
    const matchesFilter = filter === 'All' || item.status === filter;
    const search = `${item.vehicle?.registrationNumber ?? ''} ${item.driver?.name ?? ''} ${item.issue} ${item.status}`.toLowerCase();
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
    run(() => api('/breakdowns', { method: 'POST', body: form }), () => setForm({ ...form, vehicleId: '', issue: '' }));
  };

  return (
    <>
      <div className="two">
        <section className="panel">
          <div className="panel-head"><h2>Log a breakdown</h2></div>
          <form onSubmit={submit} className="form">
            <Field label="Vehicle">
              <select required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">Choose a vehicle</option>
                {selectable.map((v) => <option key={v._id} value={v._id}>{v.registrationNumber} · {v.status}</option>)}
              </select>
            </Field>
            <Field label="Date">
              <input type="date" required max={isoDate()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="What went wrong?">
              <textarea required rows={3} minLength={5} maxLength={500} value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} />
            </Field>
            <fieldset className="choice">
              <legend>Vehicle status after this</legend>
              {['Under Maintenance', 'Available'].map((s) => (
                <label key={s}>
                  <input type="radio" name="vs" checked={form.vehicleStatus === s} onChange={() => setForm({ ...form, vehicleStatus: s })} />
                  {s}
                </label>
              ))}
              <small>Under Maintenance also returns the vehicle from its driver.</small>
            </fieldset>
            <button className="btn primary" disabled={busy}>Save breakdown</button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div><h2>Breakdown log <span className="count">{shown.length} / {items.length}</span></h2><p className="panel-subtitle">Track reported issues and repairs</p></div>
            <div className="seg-control" role="group" aria-label="Filter breakdowns by status">
              {['All', 'Open', 'Resolved'].map((status) => (
                <button key={status} type="button" className={filter === status ? 'on' : ''} aria-pressed={filter === status} onClick={() => setFilter(status)}>{status}</button>
              ))}
            </div>
          </div>
          <div className="list-tools">
            <label className="table-search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
              <input type="search" aria-label="Search breakdowns" placeholder="Search vehicle, driver, or issue" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
          </div>
          {shown.length === 0 ? (
            <Empty>{items.length === 0 ? 'No breakdowns recorded.' : 'No breakdowns match your search and filter.'}</Empty>
          ) : (
            <div className="scroll">
              <table>
                <thead><tr><th>Date</th><th>Vehicle</th><th>Issue</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {shown.map((b) => (
                    <tr key={b._id}>
                      <td>{day(b.date)}</td>
                      <td><strong>{b.vehicle?.registrationNumber}</strong>{b.driver && <div className="muted">{b.driver.name}</div>}</td>
                      <td className="wrap">{b.issue}</td>
                      <td><Chip value={b.status} /></td>
                      <td className="act">
                        {b.status === 'Open' && (
                          <button className="btn sm" disabled={busy} onClick={() => run(() => api(`/breakdowns/${b._id}/resolve`, { method: 'PATCH' }))}>Mark available</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
