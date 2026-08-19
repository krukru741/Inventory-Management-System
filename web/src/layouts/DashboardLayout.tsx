import React from 'react';
import { useUiStore } from '@/store/uiStore';
import { useAuth } from '@/contexts/AuthContext';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Package, LayoutDashboard, ShoppingCart, ShoppingBag, Truck, BarChart3, LogOut, Menu, UserCircle } from 'lucide-react';

export default function DashboardLayout() {
  const { isSidebarOpen, toggleSidebar } = useUiStore();
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Purchasing', path: '/purchasing', icon: ShoppingCart },
    { name: 'Sales Orders', path: '/sales', icon: ShoppingBag },
    { name: 'Suppliers', path: '/suppliers', icon: Truck },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen w-full bg-cream overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-primary text-primary-foreground transition-all duration-300 ease-in-out flex flex-col`}
      >
        <div className="h-16 flex items-center justify-center border-b border-primary-foreground/10 px-4">
          <Package className="w-8 h-8 text-butter-yellow" />
          {isSidebarOpen && <span className="ml-3 font-bold text-xl tracking-tight text-butter-yellow">stockflow</span>}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-3 rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary-foreground/10 text-butter-yellow font-medium'
                    : 'text-primary-foreground/70 hover:bg-primary-foreground/5 hover:text-primary-foreground'
                }`}
                title={!isSidebarOpen ? item.name : undefined}
              >
                <item.icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary-foreground/10">
          <button
            onClick={logout}
            className="flex items-center w-full px-3 py-2 text-primary-foreground/70 hover:text-butter-yellow transition-colors rounded-md hover:bg-primary-foreground/5"
            title={!isSidebarOpen ? 'Logout' : undefined}
          >
            <LogOut className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-cream border-b border-border flex items-center justify-between px-6 shadow-sm z-10">
          <button onClick={toggleSidebar} className="text-muted-foreground hover:text-primary transition-colors">
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserCircle className="w-5 h-5" />
              <span>{user?.name || user?.email}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-cream p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
