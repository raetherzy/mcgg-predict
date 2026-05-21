import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'DASHBOARD' },
  { to: '/input', label: 'INPUT' },
  { to: '/predict', label: 'PREDICT' },
  { to: '/analysis', label: 'ANALYSIS' },
];

export default function Navbar() {
  return (
    <nav style={{
      borderBottom: '3px solid #ffffff',
      background: '#0d0d0d',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ maxWidth: 1024, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
          <NavLink to="/" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase',
            letterSpacing: 1, textDecoration: 'none', color: '#ffffff',
          }}>
            <span style={{ fontSize: '1.1rem' }}>♟</span>
            <span style={{ color: 'var(--color-neon-green)' }}>MCGG</span>
            <span>PREDICT</span>
          </NavLink>
          <div style={{ display: 'flex', gap: 0 }}>
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                style={({ isActive }) => ({
                  padding: '6px 12px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  textDecoration: 'none',
                  borderLeft: '2px solid transparent',
                  borderRight: '2px solid transparent',
                  color: isActive ? 'var(--color-neon-green)' : '#888',
                  background: isActive ? 'rgba(0,255,65,0.07)' : 'transparent',
                  transition: 'color 0.1s',
                })}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
