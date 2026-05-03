import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  FiMenu,
  FiBell,
  FiMoon,
  FiSun,
  FiSearch,
  FiUser,
  FiSettings,
  FiLogOut,
  FiX,
  FiCheck,
  FiTrash2,
} from "react-icons/fi";
import CustomConnectButton from "./CustomConnectButton";
import {
  getNotifications,
  addNotification,
  removeNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  clearAllNotifications,
  updateNotificationTimes,
  cleanupOldNotifications,
  NOTIFICATION_TEMPLATES,
} from "../../utils/notificationStorage";

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { address, isConnected } = useAccount();

  // Theme handling
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Load notifications on component mount
  useEffect(() => {
    loadNotifications();
    cleanupOldNotifications(30); // Clean up notifications older than 30 days

    // Update notification times every minute
    const interval = setInterval(() => {
      const updatedNotifications = updateNotificationTimes();
      setNotifications(updatedNotifications);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Load notifications from localStorage
  const loadNotifications = () => {
    const storedNotifications = getNotifications();
    setNotifications(storedNotifications);
    setUnreadCount(getUnreadCount());
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Handle notification actions
  const handleMarkAsRead = (id) => {
    markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    loadNotifications();
  };

  const handleRemoveNotification = (id) => {
    removeNotification(id);
    loadNotifications();
  };

  const handleClearAll = () => {
    clearAllNotifications();
    loadNotifications();
  };

  // Example function to add sample notifications (for testing)
  const addSampleNotification = () => {
    const sampleNotifications = [
      NOTIFICATION_TEMPLATES.SHIPMENT_DELIVERED("1234"),
      NOTIFICATION_TEMPLATES.KYC_APPROVED(),
      NOTIFICATION_TEMPLATES.PAYMENT_RECEIVED("$1,250", "5678"),
      NOTIFICATION_TEMPLATES.SHIPMENT_DELAYED("9999", "Weather conditions"),
    ];

    const randomNotification =
      sampleNotifications[
        Math.floor(Math.random() * sampleNotifications.length)
      ];
    addNotification(randomNotification);
    loadNotifications();
  };

  return (
    <header className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/30 shadow-lg shadow-blue-500/5 dark:shadow-blue-500/10">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-indigo-500/10"></div>

      {/* Subtle floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-2 left-20 w-1 h-1 bg-blue-500/30 dark:bg-blue-400/40 rounded-full animate-ping delay-300"></div>
        <div className="absolute top-4 right-32 w-0.5 h-0.5 bg-purple-500/30 dark:bg-purple-400/40 rounded-full animate-ping delay-700"></div>
        <div className="absolute bottom-2 left-1/3 w-1.5 h-1.5 bg-indigo-500/20 dark:bg-indigo-400/30 rounded-full animate-ping delay-1000"></div>
      </div>

      <div className="relative z-10 flex items-center justify-between px-4 py-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Enhanced Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-700/60 transition-all duration-300 shadow-lg shadow-blue-500/10 group"
          >
            <FiMenu className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
          </button>

          {/* Enhanced Search bar */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-500/30 dark:to-purple-500/30 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-2xl shadow-lg shadow-blue-500/10 dark:shadow-blue-500/15 overflow-hidden">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="Search shipments, tracking ID..."
                  className="pl-12 pr-6 py-3.5 w-80 xl:w-96 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-transparent transition-all duration-300"
                />
                <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </div>
            </div>
          </div>

          {/* Test button for adding sample notifications (remove in production) */}
          <button
            onClick={addSampleNotification}
            className="hidden lg:block px-3 py-2 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors duration-300"
          >
            Add Test Notification
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Enhanced Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-700/60 transition-all duration-300 shadow-lg shadow-blue-500/10 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 dark:from-blue-500/20 dark:to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {darkMode ? (
              <FiSun className="relative z-10 w-5 h-5 text-yellow-500 group-hover:text-yellow-400 transition-colors duration-300" />
            ) : (
              <FiMoon className="relative z-10 w-5 h-5 text-gray-600 group-hover:text-indigo-500 transition-colors duration-300" />
            )}
          </button>

          {/* Enhanced Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-700/60 transition-all duration-300 shadow-lg shadow-blue-500/10 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <FiBell className="relative z-10 w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors duration-300" />

              {/* Enhanced notification badge */}
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 flex items-center justify-center">
                  <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/25 animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </div>
                  <div className="absolute inset-0 w-5 h-5 bg-red-400 rounded-full animate-ping opacity-20"></div>
                </div>
              )}
            </button>

            {/* Enhanced Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 border border-white/30 dark:border-gray-700/30 z-50 transform animate-in slide-in-from-top-2 duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/20 dark:border-gray-700/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                      Notifications
                    </h3>
                    <div className="flex items-center space-x-2">
                      {notifications.length > 0 && (
                        <>
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-300"
                          >
                            Mark all read
                          </button>
                          <button
                            onClick={handleClearAll}
                            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors duration-300"
                          >
                            Clear all
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notifications list */}
                <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  {notifications.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <FiBell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No notifications yet
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification, index) => (
                      <div
                        key={notification.id}
                        className={`px-6 py-4 hover:bg-white/60 dark:hover:bg-gray-700/40 transition-all duration-300 border-b border-white/10 dark:border-gray-700/20 last:border-b-0 group ${
                          !notification.read
                            ? "bg-blue-50/50 dark:bg-blue-900/10"
                            : ""
                        }`}
                        style={{
                          animationDelay: `${index * 100}ms`,
                        }}
                      >
                        <div className="flex items-start space-x-4">
                          {/* Status indicator */}
                          <div className="relative mt-2">
                            <div
                              className={`
                              w-3 h-3 rounded-full shadow-lg
                              ${
                                notification.type === "success"
                                  ? "bg-gradient-to-r from-green-400 to-emerald-500 shadow-green-500/25"
                                  : notification.type === "warning"
                                  ? "bg-gradient-to-r from-yellow-400 to-orange-500 shadow-yellow-500/25"
                                  : notification.type === "error"
                                  ? "bg-gradient-to-r from-red-400 to-pink-500 shadow-red-500/25"
                                  : "bg-gradient-to-r from-blue-400 to-cyan-500 shadow-blue-500/25"
                              }
                            `}
                            />
                            {!notification.read && (
                              <div
                                className={`
                                absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-20
                                ${
                                  notification.type === "success"
                                    ? "bg-green-400"
                                    : notification.type === "warning"
                                    ? "bg-yellow-400"
                                    : notification.type === "error"
                                    ? "bg-red-400"
                                    : "bg-blue-400"
                                }
                              `}
                              />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-semibold mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 ${
                                !notification.read
                                  ? "text-gray-900 dark:text-white"
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-2">
                              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                {notification.time}
                              </p>
                              <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                              <span
                                className={`
                                text-xs px-2 py-1 rounded-full font-medium
                                ${
                                  notification.type === "success"
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                    : notification.type === "warning"
                                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                    : notification.type === "error"
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                }
                              `}
                              >
                                {notification.type}
                              </span>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {!notification.read && (
                              <button
                                onClick={() =>
                                  handleMarkAsRead(notification.id)
                                }
                                className="p-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors duration-300"
                                title="Mark as read"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleRemoveNotification(notification.id)
                              }
                              className="p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-300"
                              title="Remove notification"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-b-2xl border-t border-white/20 dark:border-gray-700/30">
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      {notifications.length} total notification
                      {notifications.length !== 1 ? "s" : ""}
                      {unreadCount > 0 && ` • ${unreadCount} unread`}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enhanced Wallet connection */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-500/30 dark:to-purple-500/30 rounded-2xl blur opacity-50"></div>
              <div className="relative">
                <CustomConnectButton />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
    </header>
  );
};

export default Header;
