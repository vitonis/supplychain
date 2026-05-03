import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/5 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/5 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/3 dark:bg-purple-500/8 rounded-full blur-3xl animate-pulse delay-2000"></div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:20px_20px] dark:bg-[linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)]"></div>
      </div>

      {/* Blockchain-themed floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-blue-500/20 dark:bg-blue-400/30 rounded-full animate-ping delay-500"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-indigo-500/20 dark:bg-indigo-400/30 rounded-full animate-ping delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-purple-500/20 dark:bg-purple-400/30 rounded-full animate-ping delay-1500"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-cyan-500/20 dark:bg-cyan-400/30 rounded-full animate-ping delay-2000"></div>
      </div>

      {/* Sidebar with enhanced backdrop */}
      <div className="relative z-30">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      </div>

      {/* Main content area with enhanced styling */}
      <div className="lg:ml-64 xl:ml-72 relative z-10 transition-all duration-500 ease-in-out">
        {/* Header with glass morphism effect */}
        <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/20 dark:border-gray-700/30 shadow-lg shadow-blue-500/5 dark:shadow-blue-500/10">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </div>

        {/* Page content with enhanced container */}
        <main className="relative z-10 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Content wrapper with subtle glass effect */}
            <div className="bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-blue-500/5 dark:shadow-blue-500/10 border border-white/20 dark:border-gray-700/30 overflow-hidden min-h-[calc(100vh-8rem)] transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/15">
              {/* Inner glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10 pointer-events-none"></div>

              {/* Content area */}
              <div className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-10">
                {children}
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile overlay for sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/70 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
