import React from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { Bell, LogOut, Menu } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar (Stubbed for now) */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-lg font-bold tracking-wider">LORD'S BESPOKE</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {/* Menu items would be dynamically mapped here based on user.role */}
          <div className="px-4 py-2 bg-slate-800 rounded-md text-sm font-medium">
            Dashboard
          </div>
          <div className="px-4 py-2 hover:bg-slate-800/50 rounded-md text-sm font-medium text-slate-400 cursor-pointer transition-colors">
            Orders
          </div>
          <div className="px-4 py-2 hover:bg-slate-800/50 rounded-md text-sm font-medium text-slate-400 cursor-pointer transition-colors">
            Wallet
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-500 hover:text-slate-700">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-slate-800 hidden sm:block">
              {user?.role} Portal
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-slate-600 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-700">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role.replace('_', ' ').toLowerCase()}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                {user?.name?.charAt(0)}
              </div>
              <button onClick={logout} className="ml-2 text-slate-400 hover:text-red-600 transition-colors">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
