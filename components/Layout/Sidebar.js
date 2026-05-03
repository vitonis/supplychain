import { useState } from "react";
import Link from "next/link";
import { useAccount, useContractRead } from "wagmi";
import { useRouter } from "next/router";
import {
  FiHome,
  FiPackage,
  FiTruck,
  FiUsers,
  FiSettings,
  FiBarChart,
  FiFileText,
  FiUser,
  FiMenu,
  FiX,
  FiShield,
} from "react-icons/fi";

const ADMIN = process.env.NEXT_PUBLIC_ADMIN;

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  // Check if the current connected address is the admin
  const isAdmin =
    isConnected &&
    address &&
    ADMIN &&
    address.toLowerCase() === ADMIN.toLowerCase();

  const menuItems = [
    {
      title: "Dashboard",
      icon: FiHome,
      path: "/",
      description: "Overview & Stats",
      showToEveryone: true,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "My Shipments",
      icon: FiPackage,
      path: "/shipments",
      description: "Track packages",
      showToEveryone: true,
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: "Create Shipment",
      icon: FiTruck,
      path: "/create-shipment",
      description: "New delivery",
      showToEveryone: true,
      color: "from-orange-500 to-red-500",
    },
    {
      title: "Tracking",
      icon: FiBarChart,
      path: "/tracking",
      description: "Live updates",
      showToEveryone: true,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Admin Panel",
      icon: FiUsers,
      path: "/admin",
      description: "Management tools",
      showToEveryone: false,
      adminOnly: true,
      color: "from-red-500 to-rose-500",
    },
  ];

  // Filter menu items based on admin status
  const visibleMenuItems = menuItems.filter((item) => {
    if (item.adminOnly) {
      return isAdmin;
    }
    return true;
  });

  const isActive = (path) => router.pathname === path;

  return (
    <>
      {/* Enhanced Mobile backdrop with blur */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar with glass morphism */}
      <div
        className={`
        fixed top-0 left-0 h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl
        border-r border-white/20 dark:border-gray-700/30 shadow-2xl shadow-blue-500/10
        transform transition-all duration-500 ease-out z-50
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        w-72 lg:w-64 xl:w-72
        before:absolute before:inset-0 before:bg-gradient-to-b before:from-blue-500/5 before:to-indigo-500/5 before:pointer-events-none
      `}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-4 w-20 h-20 bg-blue-500/10 dark:bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 left-4 w-16 h-16 bg-purple-500/10 dark:bg-purple-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-400/15 rounded-full blur-2xl animate-pulse delay-2000"></div>
        </div>

        {/* Enhanced Header */}
        <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/10 dark:border-gray-700/30 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <FiTruck className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                SupplyChain
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Decentralized Logistics
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 rounded-xl hover:bg-white/20 dark:hover:bg-gray-800/50 transition-all duration-200 group"
          >
            <FiX className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-200" />
          </button>
        </div>

        {/* Enhanced Navigation */}
        <nav className="relative z-10 flex-1 overflow-y-auto py-6 px-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          <div className="space-y-3">
            {visibleMenuItems.map((item, index) => {
              const IconComponent = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`
                    group relative flex items-center px-4 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105
                    ${active
                      ? `bg-gradient-to-r ${item.color} text-white shadow-xl shadow-blue-500/25 scale-105`
                      : "text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800/40 hover:shadow-lg hover:shadow-gray-500/10"
                    }
                    ${item.adminOnly ? "relative overflow-hidden" : ""}
                  `}
                  onClick={() => setIsOpen(false)}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  {/* Subtle glow effect for active items */}
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl"></div>
                  )}

                  {/* Icon with enhanced styling */}
                  <div
                    className={`
                    relative w-10 h-10 rounded-xl flex items-center justify-center mr-4 transition-all duration-300
                    ${active
                        ? "bg-white/20 shadow-lg"
                        : "bg-gray-100/50 dark:bg-gray-800/50 group-hover:bg-white/60 dark:group-hover:bg-gray-700/60"
                      }
                  `}
                  >
                    <IconComponent
                      className={`
                      w-5 h-5 transition-all duration-300
                      ${active
                          ? "text-white"
                          : "text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200"
                        }
                    `}
                    />
                  </div>

                  <div className="flex-1 relative z-10">
                    <div
                      className={`
                      font-semibold text-sm transition-colors duration-300 flex items-center mb-1
                      ${active ? "text-white" : "text-gray-900 dark:text-white"}
                    `}
                    >
                      {item.title}
                      {item.adminOnly && (
                        <span className="ml-3 px-2 py-1 text-xs bg-red-500 text-white rounded-full shadow-lg animate-pulse">
                          Admin
                        </span>
                      )}
                    </div>
                    <div
                      className={`
                      text-xs transition-colors duration-300 font-medium
                      ${active
                          ? "text-white/80"
                          : "text-gray-500 dark:text-gray-400"
                        }
                    `}
                    >
                      {item.description}
                    </div>
                  </div>

                  {/* Hover indicator */}
                  <div
                    className={`
                    absolute right-2 w-1 h-8 rounded-full transition-all duration-300
                    ${active
                        ? "bg-white/40"
                        : "bg-transparent group-hover:bg-gray-400/30 dark:group-hover:bg-gray-500/30"
                      }
                  `}
                  ></div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Enhanced Footer */}
        <div className="relative z-10 p-4 border-t border-white/10 dark:border-gray-700/30 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 shadow-lg">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/25">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-800 animate-ping"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Network Status
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                Connected to {process.env.NEXT_PUBLIC_CHAIN_NAME}
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center bg-red-500/10 dark:bg-red-500/20 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs text-red-600 dark:text-red-400 font-bold">
                  Admin
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Side accent line */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-blue-500/30 to-transparent"></div>
      </div>
    </>
  );
};

export default Sidebar;
