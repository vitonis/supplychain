import { formatEther } from "viem";
import {
  FiDollarSign,
  FiShield,
  FiUsers,
  FiPackage,
  FiTrendingUp,
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiZap,
  FiGlobe,
  FiDatabase,
  FiStar,
  FiHeart,
  FiAward,
  FiTarget,
  FiRefreshCw,
} from "react-icons/fi";

const AdminStats = ({
  pendingKYCCount,
  activeShipmentsCount,
  totalUsers,
  totalShipments,
}) => {
  const stats = [
    {
      title: "Active Shipments",
      value: activeShipmentsCount || 0,
      icon: FiPackage,
      color: "blue",
      description: "Currently in progress",
      changeType: "neutral",
      gradient: "from-blue-400 to-cyan-500",
      bgGradient:
        "from-blue-50/70 to-cyan-50/70 dark:from-blue-900/30 dark:to-cyan-900/30",
      textColor: "text-blue-700 dark:text-blue-300",
      borderColor: "border-blue-200/50 dark:border-blue-700/50",
    },
    {
      title: "Pending KYC",
      value: pendingKYCCount || 0,
      icon: FiClock,
      color: "yellow",
      description: "Awaiting verification",
      changeType: "neutral",
      gradient: "from-yellow-400 to-amber-500",
      bgGradient:
        "from-yellow-50/70 to-amber-50/70 dark:from-yellow-900/30 dark:to-amber-900/30",
      textColor: "text-yellow-700 dark:text-yellow-300",
      borderColor: "border-yellow-200/50 dark:border-yellow-700/50",
    },
    {
      title: "Platform Status",
      value: "Fee-Free",
      icon: FiCheckCircle,
      color: "green",
      description: "No commission model",
      changeType: "positive",
      gradient: "from-green-400 to-emerald-500",
      bgGradient:
        "from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30",
      textColor: "text-green-700 dark:text-green-300",
      borderColor: "border-green-200/50 dark:border-green-700/50",
    },
    {
      title: "Total Users",
      value: totalUsers || "N/A",
      icon: FiUsers,
      color: "purple",
      description: "Registered users",
      changeType: "neutral",
      gradient: "from-purple-400 to-violet-500",
      bgGradient:
        "from-purple-50/70 to-violet-50/70 dark:from-purple-900/30 dark:to-violet-900/30",
      textColor: "text-purple-700 dark:text-purple-300",
      borderColor: "border-purple-200/50 dark:border-purple-700/50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FiActivity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Platform overview & analytics
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-green-100/70 to-emerald-100/70 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-800/50 shadow-lg">
            <FiCheckCircle className="w-4 h-4" />
            <span>System Healthy</span>
          </div>

          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div
              key={index}
              className="group relative"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-indigo-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-6 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-[1.02]">
                {/* Subtle inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                      <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {stat.title}
                      </h3>
                    </div>
                    <div
                      className={`
                        w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient}
                        flex items-center justify-center shadow-lg transform 
                        group-hover:scale-110 group-hover:rotate-3 transition-all duration-300
                      `}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <p className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                        {stat.value}
                      </p>
                      <div className="absolute -bottom-1 left-0 h-1 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {stat.description}
                    </p>

                    {stat.changeType === "positive" && (
                      <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-green-100/70 to-emerald-100/70 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-800/50 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse"></div>
                        <FiCheckCircle className="w-3.5 h-3.5" />
                        <span>Operational</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Fee-Free Benefits Panel */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 dark:from-green-500/20 dark:to-blue-500/20 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

        <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

          <div className="relative z-10 flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 via-emerald-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-green-500/25 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FiDollarSign className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Fee-Free Platform Model
                </h3>
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-green-100/70 to-emerald-100/70 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-800/50 shadow-sm">
                  <FiStar className="w-3.5 h-3.5" />
                  <span>Premium Feature</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg">
                      <FiHeart className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300">
                      User Benefits
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      "No platform fees or commissions",
                      "Pay only declared shipment value",
                      "No completion or cancellation fees",
                      "Full refunds on cancellation",
                    ].map((benefit, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-white/20 dark:border-gray-700/30"
                      >
                        <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg">
                      <FiZap className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300">
                      Platform Features
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      "Direct peer-to-peer payments",
                      "Transparent tracking system",
                      "Decentralized and trustless",
                      "Gas fees only (network cost)",
                    ].map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-white/20 dark:border-gray-700/30"
                      >
                        <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-600 to-blue-600 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </div>

      {/* Enhanced Platform Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Smart Contract",
            status: "Active & Operational",
            icon: FiDatabase,
            color: "from-green-500 to-emerald-600",
          },
          {
            title: "IPFS Gateway",
            status: "Connected & Synced",
            icon: FiGlobe,
            color: "from-blue-500 to-cyan-600",
          },
          {
            title: "Network Status",
            status: `${
              process.env.NEXT_PUBLIC_CHAIN_NAME || "Ethereum"
            } Active`,
            icon: FiActivity,
            color: "from-purple-500 to-violet-600",
          },
        ].map((indicator, idx) => {
          const IndicatorIcon = indicator.icon;
          return (
            <div
              key={idx}
              className="group relative"
              style={{
                animationDelay: `${idx * 150}ms`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 dark:from-green-500/10 dark:to-blue-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-2xl pointer-events-none"></div>

                <div className="relative z-10 flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${indicator.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <IndicatorIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {indicator.title}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {indicator.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Quick Actions */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

        <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FiTarget className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Quick Actions
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Streamlined admin controls
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Manage KYC",
                  icon: FiUsers,
                  color: "from-blue-500 to-cyan-600",
                  bgColor:
                    "from-blue-50/70 to-cyan-50/70 dark:from-blue-900/30 dark:to-cyan-900/30",
                  textColor: "text-blue-700 dark:text-blue-300",
                  borderColor: "border-blue-200/50 dark:border-blue-800/50",
                },
                {
                  title: "View Shipments",
                  icon: FiPackage,
                  color: "from-purple-500 to-violet-600",
                  bgColor:
                    "from-purple-50/70 to-violet-50/70 dark:from-purple-900/30 dark:to-violet-900/30",
                  textColor: "text-purple-700 dark:text-purple-300",
                  borderColor: "border-purple-200/50 dark:border-purple-800/50",
                },
                {
                  title: "Platform Stats",
                  icon: FiTrendingUp,
                  color: "from-yellow-500 to-amber-600",
                  bgColor:
                    "from-yellow-50/70 to-amber-50/70 dark:from-yellow-900/30 dark:to-amber-900/30",
                  textColor: "text-yellow-700 dark:text-yellow-300",
                  borderColor: "border-yellow-200/50 dark:border-yellow-800/50",
                },
                {
                  title: "Settings",
                  icon: FiShield,
                  color: "from-green-500 to-emerald-600",
                  bgColor:
                    "from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30",
                  textColor: "text-green-700 dark:text-green-300",
                  borderColor: "border-green-200/50 dark:border-green-800/50",
                },
              ].map((action, idx) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={idx}
                    className="group/btn relative overflow-hidden rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    style={{
                      animationDelay: `${idx * 100}ms`,
                    }}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${action.bgColor} group-hover/btn:opacity-90 transition-opacity duration-300`}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5"></div>

                    <div className="relative z-10 flex items-center space-x-3 px-6 py-4">
                      <div
                        className={`w-10 h-10 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center shadow-lg group-hover/btn:scale-110 group-hover/btn:rotate-3 transition-all duration-300`}
                      >
                        <ActionIcon className="w-5 h-5 text-white" />
                      </div>
                      <span
                        className={`text-sm font-bold ${action.textColor} group-hover/btn:scale-105 transition-transform duration-300`}
                      >
                        {action.title}
                      </span>
                    </div>

                    {/* Button glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-indigo-500/10 rounded-2xl blur opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced System Status Banner */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

        <div className="relative text-center py-6 bg-gradient-to-r from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200/50 dark:border-green-700/50 rounded-2xl backdrop-blur-sm shadow-lg">
          <div className="flex items-center justify-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <FiAward className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h4 className="text-lg font-bold text-green-800 dark:text-green-300">
                System Performance Excellent
              </h4>
              <p className="text-sm text-green-700 dark:text-green-400">
                All systems operational • Zero downtime •
                <span className="font-bold ml-1">
                  {activeShipmentsCount + pendingKYCCount}
                </span>{" "}
                active operations
              </p>
            </div>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping delay-100"></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping delay-200"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-ping delay-300"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
