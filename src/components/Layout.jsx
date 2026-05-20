import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
      <footer className="bg-surface-dark border-t border-gray-800 py-3 text-center text-gray-500 text-xs">
        MCGG Predict v1.0 &mdash; Magic Chess Opponent Predictor
      </footer>
    </div>
  );
}
