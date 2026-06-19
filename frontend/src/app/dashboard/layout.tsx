'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Zap, LayoutDashboard, CreditCard, BarChart3, Settings,
  Users, FileText, LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import useAuthStore from '@/lib/store';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/subscription', icon: CreditCard, label: 'Subscription' },
  { href: '/dashboard/billing', icon: FileText, label: 'Billing' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

const adminNavItems = [
  { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Admin Overview' },
  { href: '/dashboard/admin/users', icon: Users, label: 'Users' },
  { href: '/dashboard/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { href: '/dashboard/admin/invoices', icon: FileText, label: 'Invoices' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, fetchMe, isAuthenticated, isAdmin } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    if (!user) fetchMe();
  }, []);

  const NavLink = ({ href, icon: Icon, label }: any) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-primary-50 text-primary-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span>{label}</span>
        {active && <ChevronRight className="w-4 h-4 ml-auto" />}
      </Link>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-2 p-6 border-b border-gray-200">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-gray-900">SubsManager</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
          Account
        </p>
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        {isAdmin() && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mt-6 mb-2">
              Administration
            </p>
            {adminNavItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full mt-1 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-shrink-0 flex-col">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4"
            >
              <X className="w-6 h-6" />
            </button>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 md:hidden flex items-center">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <span className="ml-3 font-semibold text-gray-900">SubsManager</span>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
