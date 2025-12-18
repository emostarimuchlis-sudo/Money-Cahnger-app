import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  FileText,
  BookOpen,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  Coins
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'teller', 'kasir'] },
    { icon: ArrowLeftRight, label: 'Transaksi', path: '/transactions', roles: ['admin', 'teller', 'kasir'] },
    { icon: Users, label: 'Data Nasabah', path: '/customers', roles: ['admin', 'teller', 'kasir'] },
    { icon: BookOpen, label: 'Buku Kas', path: '/cashbook', roles: ['admin', 'teller', 'kasir'] },
    { icon: Coins, label: 'Mutasi Valas', path: '/mutasi-valas', roles: ['admin', 'teller', 'kasir'] },
    { icon: FileText, label: 'Laporan', path: '/reports', roles: ['admin', 'teller', 'kasir'] },
    { icon: Settings, label: 'Pengaturan', path: '/settings', roles: ['admin'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#064E3B] to-[#022C22]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-card px-4 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>MOZTEC</h1>
        <button
          data-testid="mobile-menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-[#FEF3C7] p-2 hover:bg-white/5 rounded-lg transition-colors duration-300"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 glass-card border-r border-white/10 z-40 transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <h1 className="text-3xl font-bold text-[#D4AF37] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>MOZTEC</h1>
          <p className="text-[#6EE7B7] text-sm">Money Changer System</p>
        </div>

        <nav className="px-3 flex-1">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                    : 'text-[#D1FAE5] hover:bg-white/5 hover:-translate-y-0.5'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/10">
          <div className="mb-4">
            <p className="text-[#FEF3C7] font-semibold">{user?.name}</p>
            <p className="text-[#6EE7B7] text-sm capitalize">{user?.role}</p>
          </div>
          <button
            data-testid="logout-button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-[#D1FAE5] hover:text-[#FEF3C7] transition-colors duration-300 w-full"
          >
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="pt-20 lg:pt-0 p-6 lg:p-12">
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;