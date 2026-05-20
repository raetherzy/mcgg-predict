import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/input', label: 'Input Game', icon: '📝' },
  { to: '/predict', label: 'Predict', icon: '🔮' },
  { to: '/analysis', label: 'Analysis', icon: '📈' },
];

export default function Navbar() {
  return (
    <nav className="bg-surface-dark border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <NavLink to="/" className="flex items-center gap-2 font-bold text-lg text-primary hover:text-primary-dark transition-colors">
            <span className="text-xl">♟</span>
            <span>MCGG Predict</span>
          </NavLink>
          <div className="flex gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-surface'
                  }`
                }
              >
                <span className="mr-1.5">{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
