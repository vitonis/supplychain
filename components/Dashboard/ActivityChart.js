import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useSupplyChainContract } from "../../hooks/useContract";
import {
  FiActivity,
  FiTrendingUp,
  FiBarChart,
  FiPackage,
  FiCheckCircle,
  FiDollarSign,
} from "react-icons/fi";

const ActivityChart = () => {
  const { address } = useAccount();
  const { useContractRead } = useSupplyChainContract();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");
  const [hoveredBar, setHoveredBar] = useState(null);

  // Mock data for demonstration - in production, you'd aggregate from contract events
  const generateMockData = () => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toISOString().split("T")[0],
        shipments: Math.floor(Math.random() * 10) + 1,
        value: (Math.random() * 5).toFixed(2),
        delivered: Math.floor(Math.random() * 8),
      });
    }

    return data;
  };

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setChartData(generateMockData());
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const maxValue = Math.max(...chartData.map((d) => d.shipments));

  if (loading) {
    return (
      <div className="relative group">
        {/* Loading glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/20 dark:to-blue-500/20 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>

        <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl shadow-cyan-500/5 dark:shadow-cyan-500/10">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-36"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-24"></div>
                </div>
              </div>
              <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl w-32"></div>
            </div>

            {/* Chart skeleton */}
            <div className="h-64 bg-gradient-to-t from-gray-200/50 to-gray-300/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl mb-6 flex items-end justify-around p-4 space-x-2">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-t from-cyan-300 to-blue-400 dark:from-cyan-600 dark:to-blue-500 rounded-t-lg animate-pulse"
                  style={{
                    height: `${Math.random() * 150 + 30}px`,
                    width: "24px",
                    animationDelay: `${i * 200}ms`,
                  }}
                ></div>
              ))}
            </div>

            {/* Summary skeleton */}
            <div className="grid grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center space-y-2">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-20 mx-auto"></div>
                  <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-16 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Enhanced glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 dark:from-cyan-500/20 dark:via-blue-500/20 dark:to-indigo-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

      <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl shadow-cyan-500/5 dark:shadow-cyan-500/10 hover:shadow-2xl hover:shadow-cyan-500/10 dark:hover:shadow-cyan-500/15 transition-all duration-500">
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

        {/* Enhanced Header */}
        <div className="relative z-10 flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FiBarChart className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
            </div>

            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                Activity Overview
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Real-time Analytics
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Time Range Selector */}
          <div className="relative">
            <div className="flex space-x-1 bg-gradient-to-r from-gray-100/70 to-gray-200/70 dark:from-gray-700/70 dark:to-gray-800/70 backdrop-blur-sm rounded-2xl p-2 border border-white/20 dark:border-gray-600/30 shadow-lg">
              {["7d", "30d", "90d"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`
                    relative px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 transform hover:scale-105
                    ${
                      timeRange === range
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-600/50"
                    }
                  `}
                >
                  {timeRange === range && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl"></div>
                  )}
                  <span className="relative z-10">{range}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Chart Container */}
        <div className="relative z-10 mb-8">
          <div className="relative h-64 bg-gradient-to-t from-gray-50/50 to-transparent dark:from-gray-800/50 rounded-2xl p-4 border border-white/10 dark:border-gray-700/20">
            {/* Chart Grid Lines */}
            <div className="absolute inset-4 flex flex-col justify-between pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-px bg-gradient-to-r from-transparent via-gray-300/30 dark:via-gray-600/30 to-transparent"
                ></div>
              ))}
            </div>

            {/* Enhanced Bar Chart */}
            <div className="flex items-end justify-between h-full space-x-1 relative z-10">
              {chartData.map((item, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center group/bar"
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <div className="relative w-full max-w-8">
                    {/* Bar with enhanced styling */}
                    <div
                      className="w-full bg-gradient-to-t from-cyan-500 via-blue-500 to-indigo-500 rounded-t-lg transition-all duration-500 cursor-pointer relative overflow-hidden group-hover/bar:from-cyan-400 group-hover/bar:via-blue-400 group-hover/bar:to-indigo-400 shadow-lg"
                      style={{
                        height: `${(item.shipments / maxValue) * 180}px`,
                        minHeight: "8px",
                        transform:
                          hoveredBar === index ? "scale(1.1)" : "scale(1)",
                      }}
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover/bar:translate-x-[200%] transition-transform duration-1000"></div>

                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent rounded-t-lg"></div>
                    </div>

                    {/* Enhanced Tooltip */}
                    {hoveredBar === index && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 z-20">
                        <div className="bg-gray-900/90 dark:bg-gray-800/90 backdrop-blur-sm text-white rounded-2xl px-4 py-3 shadow-2xl border border-white/10 min-w-max">
                          <div className="text-xs font-bold text-cyan-300 mb-2">
                            {item.date}
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center space-x-2">
                              <FiPackage className="w-3 h-3 text-blue-400" />
                              <span>
                                Shipments:{" "}
                                <span className="font-bold">
                                  {item.shipments}
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FiDollarSign className="w-3 h-3 text-green-400" />
                              <span>
                                Value:{" "}
                                <span className="font-bold">
                                  {item.value} ETH
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FiCheckCircle className="w-3 h-3 text-emerald-400" />
                              <span>
                                Delivered:{" "}
                                <span className="font-bold">
                                  {item.delivered}
                                </span>
                              </span>
                            </div>
                          </div>

                          {/* Tooltip Arrow */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-900/90 dark:bg-gray-800/90 rotate-45 border-r border-b border-white/10"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Date Label */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 font-medium transform -rotate-45 origin-left">
                    {new Date(item.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Legend */}
        <div className="relative z-10 flex items-center justify-center space-x-8 mb-8 p-4 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl border border-white/20 dark:border-gray-700/20">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg shadow-blue-500/25"></div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Shipments Created
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg shadow-green-500/25"></div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Delivered
            </span>
          </div>
        </div>

        {/* Enhanced Summary Stats */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              label: "Total Shipments",
              value: chartData.reduce((sum, item) => sum + item.shipments, 0),
              icon: FiPackage,
              gradient: "from-blue-500 to-cyan-600",
              bgGradient:
                "from-blue-50/70 to-cyan-50/70 dark:from-blue-900/30 dark:to-cyan-900/30",
              textColor: "text-blue-700 dark:text-blue-300",
            },
            {
              label: "Total Value",
              value: `${chartData
                .reduce((sum, item) => sum + parseFloat(item.value), 0)
                .toFixed(2)} ETH`,
              icon: FiDollarSign,
              gradient: "from-green-500 to-emerald-600",
              bgGradient:
                "from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30",
              textColor: "text-green-700 dark:text-green-300",
            },
            {
              label: "Delivered",
              value: chartData.reduce((sum, item) => sum + item.delivered, 0),
              icon: FiCheckCircle,
              gradient: "from-purple-500 to-pink-600",
              bgGradient:
                "from-purple-50/70 to-pink-50/70 dark:from-purple-900/30 dark:to-pink-900/30",
              textColor: "text-purple-700 dark:text-purple-300",
            },
          ].map((stat, index) => {
            const StatIcon = stat.icon;
            return (
              <div
                key={index}
                className={`group/stat relative p-6 bg-gradient-to-r ${stat.bgGradient} rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg transform group-hover/stat:scale-110 group-hover/stat:rotate-3 transition-all duration-300`}
                  >
                    <StatIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {stat.label}
                    </p>
                    <p className={`text-2xl font-bold ${stat.textColor}`}>
                      {stat.value}
                    </p>
                  </div>
                </div>

                {/* Trend indicator */}
                <div className="absolute top-4 right-4">
                  <FiTrendingUp className="w-4 h-4 text-green-500 opacity-60 group-hover/stat:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
    </div>
  );
};

export default ActivityChart;
