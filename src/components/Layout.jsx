import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarCheck, CreditCard,
  Package, Receipt, BarChart3, Settings, Menu, X,
  Leaf, ChevronRight, Store
} from 'lucide-react';
import Notification from './Notification';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Tableau de Bord', color: 'text-blue-600' },
  { to: '/employes', icon: Users, label: 'Employés', color: 'text-purple-600' },
  { to: '/presence', icon: CalendarCheck, label: 'Présence', color: 'text-green-600' },
  { to: '/paiement', icon: CreditCard, label: 'Paiement', color: 'text-emerald-600' },
  { to: '/collecteurs', icon: Package, label: 'Collecteurs & Stock', color: 'text-orange-600' },
  { to: '/depenses', icon: Receipt, label: 'Dépenses', color: 'text-red-600' },
  { to: '/stocks', icon: Store, label: 'Magasins', color: 'text-cyan-600' },
  { to: '/rapports', icon: BarChart3, label: 'Rapports', color: 'text-indigo-600' },
  { to: '/parametres', icon: Settings, label: 'Paramètres', color: 'text-gray-600' },
];

function NavItem({ item, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      end={item.to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-brand-50 text-brand-700 shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} className={isActive ? 'text-brand-600' : item.color} />
          <span>{item.label}</span>
          {isActive && <ChevronRight size={14} className="ml-auto text-brand-400" />}
        </>
      )}
    </NavLink>
  );
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentPage = NAV_ITEMS.find(n =>
    n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        flex flex-col w-64 bg-white border-r border-gray-200
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
            <Leaf size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-tight">GGA 2026</div>
            <div className="text-xs text-gray-500">Gestion Gomme Arabique</div>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-500 hover:text-gray-900"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavItem key={item.to} item={item} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="text-xs text-gray-400 text-center">
            © 2026 — Camara Mahamadou
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-4 lg:px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
          <button
            className="lg:hidden text-gray-600 hover:text-gray-900 p-1"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              {currentPage?.label || 'Application'}
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              Gestion Gomme Arabique 2026
            </p>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 fade-in">
            {children}
          </div>
        </main>
      </div>

      <Notification />
    </div>
  );
}
