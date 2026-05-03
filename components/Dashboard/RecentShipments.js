import { useState, useEffect } from "react";
import Link from "next/link";
import { useSupplyChainContract } from "../../hooks/useContract";
import {
  FiPackage,
  FiEye,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiArrowRight,
  FiActivity,
} from "react-icons/fi";

const RecentShipments = ({
  senderShipments,
  receiverShipments,
  carrierShipments,
}) => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { useContractRead, formatEther } = useSupplyChainContract();

  useEffect(() => {
    fetchRecentShipments();
  }, [senderShipments, receiverShipments, carrierShipments]);

  const fetchRecentShipments = async () => {
    try {
      setLoading(true);
      const allShipmentIds = [
        ...(senderShipments || []),
        ...(receiverShipments || []),
        ...(carrierShipments || []),
      ];

      const uniqueIds = [...new Set(allShipmentIds)];
      const recentIds = uniqueIds.slice(-5).reverse(); // Get latest 5

      const shipmentsData = [];

      for (const id of recentIds) {
        try {
          const { data: shipment } = await useContractRead("getShipment", [id]);
          if (shipment) {
            shipmentsData.push({
              id,
              ...shipment,
              value: formatEther(shipment.price || 0),
            });
          }
        } catch (error) {
          console.error(`Error fetching shipment ${id}:`, error);
        }
      }

      setShipments(shipmentsData);
    } catch (error) {
      console.error("Error fetching recent shipments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      0: {
        label: "Pending",
        color: "yellow",
        icon: FiClock,
        gradient: "from-yellow-400 to-amber-500",
        bgGradient:
          "from-yellow-50/70 to-amber-50/70 dark:from-yellow-900/30 dark:to-amber-900/30",
        textColor: "text-yellow-700 dark:text-yellow-300",
        borderColor: "border-yellow-200/50 dark:border-yellow-700/50",
      },
      1: {
        label: "In Transit",
        color: "blue",
        icon: FiTruck,
        gradient: "from-blue-400 to-cyan-500",
        bgGradient:
          "from-blue-50/70 to-cyan-50/70 dark:from-blue-900/30 dark:to-cyan-900/30",
        textColor: "text-blue-700 dark:text-blue-300",
        borderColor: "border-blue-200/50 dark:border-blue-700/50",
      },
      2: {
        label: "Delivered",
        color: "green",
        icon: FiCheckCircle,
        gradient: "from-green-400 to-emerald-500",
        bgGradient:
          "from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30",
        textColor: "text-green-700 dark:text-green-300",
        borderColor: "border-green-200/50 dark:border-green-700/50",
      },
      3: {
        label: "Cancelled",
        color: "red",
        icon: FiXCircle,
        gradient: "from-red-400 to-rose-500",
        bgGradient:
          "from-red-50/70 to-rose-50/70 dark:from-red-900/30 dark:to-rose-900/30",
        textColor: "text-red-700 dark:text-red-300",
        borderColor: "border-red-200/50 dark:border-red-700/50",
      },
    };

    const config = statusConfig[status] || statusConfig[0];
    const Icon = config.icon;

    return (
      <div
        className={`
        inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold
        bg-gradient-to-r ${config.bgGradient} ${config.textColor}
        border ${config.borderColor} shadow-sm
        transform hover:scale-105 transition-all duration-300
      `}
      >
        <div
          className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.gradient} animate-pulse`}
        ></div>
        <Icon className="w-3.5 h-3.5" />
        <span>{config.label}</span>
      </div>
    );
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="relative group">
        {/* Loading glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>

        <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl shadow-blue-500/5 dark:shadow-blue-500/10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl animate-pulse"></div>
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-32"></div>
            </div>
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-16"></div>
          </div>

          {/* Loading items */}
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-100/50 to-gray-200/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-2xl"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-3/4"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 w-20 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Enhanced glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-indigo-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

      <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl shadow-blue-500/5 dark:shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/15 transition-all duration-500">
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

        {/* Enhanced Header */}
        <div className="relative z-10 flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FiActivity className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
            </div>

            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                Recent Shipments
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Live Updates
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/shipments"
            className="group/link flex items-center space-x-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300"
          >
            <span>View All</span>
            <FiArrowRight className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        {shipments.length === 0 ? (
          <div className="relative z-10 text-center py-12">
            {/* Enhanced empty state */}
            <div className="relative mb-8">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 transform rotate-3 hover:rotate-0 transition-transform duration-500 mb-6">
                <FiPackage className="w-10 h-10 text-white" />
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-blue-500/10 dark:bg-blue-400/20 rounded-full blur-2xl animate-pulse"></div>
            </div>

            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              No shipments yet
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
              Create your first shipment to start tracking packages on the
              blockchain
            </p>

            <Link
              href="/create-shipment"
              className="group/cta relative inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
              <FiPackage className="w-5 h-5 relative z-10 group-hover/cta:scale-110 transition-transform duration-300" />
              <span className="relative z-10">Create Shipment</span>
              <FiArrowRight className="w-4 h-4 relative z-10 transform group-hover/cta:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        ) : (
          <div className="relative z-10 space-y-4">
            {shipments.map((shipment, index) => (
              <div
                key={shipment.id}
                className="group/item relative overflow-hidden"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Item glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-2xl blur opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>

                <div className="relative flex items-center space-x-4 p-6 bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-700/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300 group-hover/item:scale-105 group-hover/item:shadow-lg">
                  {/* Enhanced shipment icon */}
                  <div className="flex-shrink-0 relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 transform group-hover/item:scale-110 group-hover/item:rotate-3 transition-all duration-300">
                      <FiPackage className="w-7 h-7 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                  </div>

                  {/* Enhanced content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                        {shipment.details?.title || `Shipment #${shipment.id}`}
                      </p>
                      {getStatusBadge(shipment.status)}
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">ID:</span>
                        <span className="font-mono bg-gray-100/50 dark:bg-gray-800/50 px-2 py-1 rounded-lg">
                          {shipment.id?.toString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Value:</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {parseFloat(shipment.value).toFixed(4)} ETH
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Created:</span>
                        <span>{formatDate(shipment.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced action button */}
                  <div className="flex-shrink-0">
                    <Link
                      href={`/tracking/${shipment.id}`}
                      className="group/action relative inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-blue-500 hover:to-purple-600 dark:hover:from-blue-500 dark:hover:to-purple-600 text-gray-600 dark:text-gray-300 hover:text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
                    >
                      <FiEye className="w-5 h-5 transform group-hover/action:scale-110 transition-transform duration-300" />

                      {/* Tooltip */}
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium rounded-lg opacity-0 group-hover/action:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                        Track Shipment
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
    </div>
  );
};

export default RecentShipments;
