import { useCallback, useEffect, useRef, useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Fleet from './pages/Fleet.jsx';
import Rentals from './pages/Rentals.jsx';
import Breakdowns from './pages/Breakdowns.jsx';
import { Toast } from './components/ui.jsx';

const TABS = [
  ['dashboard', 'Dashboard', Dashboard, 'Electric fleet operations, at a glance'],
  ['fleet', 'Fleet & drivers', Fleet, 'The people and electric vehicles moving your city'],
  ['rentals', 'Rentals', Rentals, 'Weekly payments and outstanding dues'],
  ['breakdowns', 'Breakdowns', Breakdowns, 'Keep every vehicle road-ready'],
];

const COMMANDS = [
  { id: 'dashboard', label: 'Open dashboard', detail: 'Fleet overview and today’s snapshot', icon: '⌂' },
  { id: 'fleet', label: 'Manage fleet & drivers', detail: 'Vehicles, drivers, and assignments', icon: '↗' },
  { id: 'rentals', label: 'View rentals', detail: 'Payments and outstanding dues', icon: '₹' },
  { id: 'breakdowns', label: 'Open breakdowns', detail: 'Maintenance reports and repairs', icon: '!' },
];

function NavIcon({ name }) {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    fleet: <><path d="M3 13.5 4.5 8h12l4.5 5.5V19h-2v-2H5v2H3z" /><path d="M6 8l1.5-4h6L15 8M6 13h.01M18 13h.01" /></>,
    rentals: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M7 14h3M7 17h7" /></>,
    breakdowns: <><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v4M12 16h.01" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function CommandPalette({ onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const commands = COMMANDS.filter((command) => `${command.label} ${command.detail}`.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const choose = (command) => {
    onNavigate(command.id);
    onClose();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelected((index) => (index + 1) % Math.max(commands.length, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected((index) => (index - 1 + commands.length) % Math.max(commands.length, 1));
    } else if (event.key === 'Enter' && commands[selected]) {
      event.preventDefault();
      choose(commands[selected]);
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="command-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="Quick navigation">
        <div className="command-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Where would you like to go?"
            aria-label="Search pages"
            aria-controls="command-results"
          />
          <kbd>ESC</kbd>
        </div>
        <div className="command-label">QUICK NAVIGATION</div>
        <div className="command-results" id="command-results">
          {commands.length === 0 ? (
            <p className="command-empty">No matching pages. Try “fleet” or “rentals”.</p>
          ) : commands.map((command, index) => (
            <button
              key={command.id}
              className={`command-item ${selected === index ? 'selected' : ''}`}
              onMouseEnter={() => setSelected(index)}
              onClick={() => choose(command)}
            >
              <span className="command-icon">{command.icon}</span>
              <span className="command-copy"><strong>{command.label}</strong><small>{command.detail}</small></span>
              <span className="command-enter">↵</span>
            </button>
          ))}
        </div>
        <div className="command-footer"><span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span><span><kbd>↵</kbd> to open</span></div>
      </section>
    </div>
  );
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M7 20.5c0-6.1 4.2-10.8 12.4-13.8-.5 7.6-3.2 14.2-9.9 16.5" />
        <path d="M10 24c4.4-5.3 8.3-8.4 14.6-10.2M19.2 8.2l.5 5.2 5.2.5" />
      </svg>
    </span>
  );
}

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [fleetStatus, setFleetStatus] = useState('All');
  const [toast, setToast] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const notify = useCallback((type, text) => setToast({ type, text }), []);
  const closeToast = useCallback(() => setToast(null), []);
  const activeTab = TABS.find(([id]) => id === tab) ?? TABS[0];
  const Page = activeTab[2];
  const dateLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const [fleetQuery, setFleetQuery] = useState('');
  const navigate = (id, status = 'All', query = '') => {
    if (id === 'fleet') {
      setFleetStatus(status);
      setFleetQuery(query);
    }
    setTab(id);
    setMenuOpen(false);
  };

  useEffect(() => {
    const handleShortcuts = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      } else if (event.key === 'Escape') {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, []);

  return (
    <div className="app-shell">
      {menuOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); navigate('dashboard'); }}>
          <BrandMark />
          <span className="brand-copy"><strong>zenflo</strong><small>ELECTRIC FLEET OPS</small></span>
        </a>

        <div className="nav-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {TABS.map(([id, label]) => (
            <button key={id} className={`nav-item ${tab === id ? 'active' : ''}`} aria-current={tab === id ? 'page' : undefined} onClick={() => navigate(id)}>
              <NavIcon name={id} />
              <span>{label}</span>
              {tab === id && <span className="nav-active-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-icon energy-icon" aria-hidden="true">↗</span>
            <span className="sidebar-slogan-label">A BETTER WAY TO MOVE</span>
            <strong>Cleaner miles.<br />Brighter cities.</strong>
            <span>Electric deliveries are helping build a quieter, more thoughtful way to move through the city.</span>
          </div>
          <div className="sidebar-foot"><span className="foot-dot" /> Electric mobility, in motion</div>
        </div>
      </aside>

      <div className="workspace">
        <header className="app-header">
          <button className="menu-toggle" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <div className="header-context">
            <span className="eyebrow">ZENFLO / ELECTRIC MOBILITY</span>
            <div className="header-title">{activeTab[1]}</div>
          </div>
          <div className="header-right">
            <button className="search-trigger" onClick={() => setPaletteOpen(true)} aria-label="Search pages">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
              <span>Quick jump</span><kbd>Ctrl K</kbd>
            </button>
            <span className="header-date">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>
              {dateLabel}
            </span>
            <span className="header-avatar" aria-label="Zenflo workspace">Z</span>
          </div>
        </header>
        <main>
          <div className="page-intro">
            <div>
              <h1>{activeTab[1]}</h1>
              <p>{activeTab[3]}</p>
            </div>
            {tab !== 'breakdowns' && (
              <button className="btn header-action" onClick={() => navigate('breakdowns')}>
                <span aria-hidden="true">＋</span> Log a breakdown
              </button>
            )}
          </div>
          <Page notify={notify} goTo={navigate} initialStatus={fleetStatus} initialQuery={fleetQuery} />
        </main>
      </div>
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} onNavigate={navigate} />}
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
