import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1, maxWidth: 1024, margin: '0 auto', width: '100%', padding: '32px 16px' }}>
        <Outlet />
      </main>
      <footer style={{
        borderTop: '2px solid #333',
        padding: '14px 0',
        textAlign: 'center',
        color: '#555',
        fontSize: '0.65rem',
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}>
        MCGG PREDICT v1.0 &mdash; MAGIC CHESS OPPONENT PREDICTOR
      </footer>
    </div>
  );
}
