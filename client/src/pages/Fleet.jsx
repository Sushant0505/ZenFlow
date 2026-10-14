import { useState } from 'react';
import { api } from '../api.js';
import { useLoad } from '../hooks.js';
import { Chip, Empty, ErrorBox, Field, Loading, Modal } from '../components/ui.jsx';

const emptyVehicle = { registrationNumber: '', model: '', batteryCapacityKwh: '' };
const emptyDriver = { name: '', phone: '', licenseNumber: '' };

export default function Fleet({ notify, initialStatus = 'All', initialQuery = '' }) {
  const { data, error, loading, reload } = useLoad(['/vehicles', '/drivers']);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle);
  const [driverForm, setDriverForm] = useState(emptyDriver);
  const [assigning, setAssigning] = useState(null); // vehicle being assigned
  const [pickedDriver, setPickedDriver] = useState('');
  const [busy, setBusy] = useState(false);
  const [vehicleQuery, setVehicleQuery] = useState(initialQuery);
  const [vehicleStatus, setVehicleStatus] = useState(initialStatus);
  const [driverQuery, setDriverQuery] = useState('');

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const [vehicles, drivers] = data;
  const freeDrivers = drivers.filter((d) => d.active && !d.currentVehicle);
  const visibleVehicles = vehicles.filter((vehicle) => {
    const matchesStatus = vehicleStatus === 'All' || vehicle.status === vehicleStatus;
    const search = `${vehicle.registrationNumber} ${vehicle.model} ${vehicle.currentDriver?.name ?? ''}`.toLowerCase();
    return matchesStatus && search.includes(vehicleQuery.trim().toLowerCase());
  });
  const visibleDrivers = drivers.filter((driver) =>
    `${driver.name} ${driver.phone} ${driver.licenseNumber} ${driver.currentVehicle?.registrationNumber ?? ''}`.toLowerCase().includes(driverQuery.trim().toLowerCase())
  );

  // One wrapper for every write: shows the server's message and refreshes the lists.
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

  const addVehicle = (e) => {
    e.preventDefault();
    const { batteryCapacityKwh, ...rest } = vehicleForm;
    run(
      () => api('/vehicles', { method: 'POST', body: { ...rest, batteryCapacityKwh: batteryCapacityKwh ? Number(batteryCapacityKwh) : undefined } }),
      () => setVehicleForm(emptyVehicle)
    );
  };
  const addDriver = (e) => {
    e.preventDefault();
    run(() => api('/drivers', { method: 'POST', body: driverForm }), () => setDriverForm(emptyDriver));
  };
  const assign = (e) => {
    e.preventDefault();
    run(
      () => api('/assignments', { method: 'POST', body: { vehicleId: assigning._id, driverId: pickedDriver } }),
      () => { setAssigning(null); setPickedDriver(''); }
    );
  };
  const unassign = (v) => run(() => api(`/assignments/${v.assignmentId}/end`, { method: 'POST' }));

  return (
    <>
      <div className="two">
        <section className="panel">
          <div className="panel-head">
            <div><h2>Vehicles <span className="count">{visibleVehicles.length} / {vehicles.length}</span></h2><p className="panel-subtitle">Find and manage your vehicles</p></div>
          </div>
          <div className="list-tools">
            <label className="table-search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
              <input type="search" aria-label="Search vehicles" placeholder="Search vehicles or drivers" value={vehicleQuery} onChange={(e) => setVehicleQuery(e.target.value)} />
            </label>
            <div className="seg-control fleet-filter" role="group" aria-label="Filter vehicles by status">
              {['All', 'Available', 'Assigned', 'Under Maintenance'].map((status) => (
                <button key={status} type="button" className={vehicleStatus === status ? 'on' : ''} aria-pressed={vehicleStatus === status} onClick={() => setVehicleStatus(status)}>{status === 'Under Maintenance' ? 'Service' : status}</button>
              ))}
            </div>
          </div>
          <details className="addform">
            <summary>Add vehicle</summary>
            <form onSubmit={addVehicle} className="form">
              <Field label="Registration number">
                <input required value={vehicleForm.registrationNumber} placeholder="KA01AB1011" onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value })} />
              </Field>
              <Field label="Model">
                <input required value={vehicleForm.model} placeholder="Euler HiLoad EV" onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} />
              </Field>
              <Field label="Battery (kWh, optional)">
                <input type="number" step="0.1" min="1" value={vehicleForm.batteryCapacityKwh} onChange={(e) => setVehicleForm({ ...vehicleForm, batteryCapacityKwh: e.target.value })} />
              </Field>
              <button className="btn primary" disabled={busy}>Save vehicle</button>
            </form>
          </details>
          {visibleVehicles.length === 0 ? (
            <Empty>{vehicles.length === 0 ? 'No vehicles yet. Add the first one above.' : 'No vehicles match your search and status filter.'}</Empty>
          ) : (
            <div className="scroll">
              <table>
                <thead><tr><th>Registration</th><th>Model</th><th>Status</th><th>Driver</th><th /></tr></thead>
                <tbody>
                  {visibleVehicles.map((v) => (
                    <tr key={v._id}>
                      <td><strong>{v.registrationNumber}</strong></td>
                      <td>
                        <span className="vehicle-model">{v.model}</span>
                        <span className="vehicle-spec"><span className="electric-dot" /> Electric loader{v.batteryCapacityKwh ? ` · ${v.batteryCapacityKwh} kWh` : ''}</span>
                      </td>
                      <td><Chip value={v.status} /></td>
                      <td>{v.currentDriver?.name ?? '-'}</td>
                      <td className="act">
                        {v.status === 'Available' && <button className="btn sm" onClick={() => setAssigning(v)}>Assign</button>}
                        {v.status === 'Assigned' && <button className="btn sm" disabled={busy} onClick={() => unassign(v)}>Return</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div><h2>Drivers <span className="count">{visibleDrivers.length} / {drivers.length}</span></h2><p className="panel-subtitle">Your people behind the wheel</p></div>
          </div>
          <div className="list-tools">
            <label className="table-search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
              <input type="search" aria-label="Search drivers" placeholder="Search name, phone, or licence" value={driverQuery} onChange={(e) => setDriverQuery(e.target.value)} />
            </label>
          </div>
          <details className="addform">
            <summary>Add driver</summary>
            <form onSubmit={addDriver} className="form">
              <Field label="Full name">
                <input required value={driverForm.name} onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })} />
              </Field>
              <Field label="Mobile number" hint="10 digits">
                <input required inputMode="numeric" maxLength={10} value={driverForm.phone} onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })} />
              </Field>
              <Field label="Licence number">
                <input required value={driverForm.licenseNumber} onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })} />
              </Field>
              <button className="btn primary" disabled={busy}>Save driver</button>
            </form>
          </details>
          {visibleDrivers.length === 0 ? (
            <Empty>{drivers.length === 0 ? 'No drivers yet. Add the first one above.' : 'No drivers match your search.'}</Empty>
          ) : (
            <div className="scroll">
              <table>
                <thead><tr><th>Name</th><th>Phone</th><th>Licence</th><th>Vehicle</th></tr></thead>
                <tbody>
                  {visibleDrivers.map((d) => (
                    <tr key={d._id}>
                      <td><strong>{d.name}</strong></td>
                      <td>{d.phone}</td>
                      <td>{d.licenseNumber}</td>
                      <td>{d.currentVehicle?.registrationNumber ?? <span className="muted">Not assigned</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {assigning && (
        <Modal title={`Assign ${assigning.registrationNumber}`} onClose={() => setAssigning(null)}>
          {freeDrivers.length === 0 ? (
            <Empty>Every active driver already has a vehicle. Add a driver or return a vehicle first.</Empty>
          ) : (
            <form onSubmit={assign} className="form">
              <Field label="Driver">
                <select required value={pickedDriver} onChange={(e) => setPickedDriver(e.target.value)}>
                  <option value="">Choose a driver</option>
                  {freeDrivers.map((d) => <option key={d._id} value={d._id}>{d.name} ({d.phone})</option>)}
                </select>
              </Field>
              <div className="row">
                <button type="button" className="btn" onClick={() => setAssigning(null)}>Cancel</button>
                <button className="btn primary" disabled={busy}>Assign vehicle</button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
