import { useState, useEffect, useMemo } from "react";
import { useContractReads } from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../utils/contractABI";
import {
  FiPackage,
  FiTruck,
  FiUser,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiFilter,
  FiExternalLink,
  FiAlertCircle,
  FiRefreshCw,
  FiSearch,
  FiActivity,
  FiShield,
  FiStar,
  FiZap,
  FiDatabase,
} from "react-icons/fi";

const ActiveShipments = ({ activeShipments = [] }) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  // Limit shipments for performance (first 20)
  const shipmentsToFetch = useMemo(
    () => activeShipments.slice(0, 20),
    [activeShipments]
  );

  // Create contract read configurations for batch fetching
  const contractReads = useMemo(
    () =>
      shipmentsToFetch.map((shipmentId) => ({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getShipment",
        args: [shipmentId],
      })),
    [shipmentsToFetch]
  );

  // Batch fetch all shipment data using wagmi
  const {
    data: shipmentsData,
    isLoading,
    error: contractError,
    refetch,
  } = useContractReads({
    contracts: contractReads,
    enabled: contractReads.length > 0,
    watch: true, // Auto-refresh when blockchain state changes
  });

  // Process shipment data
  const processedShipments = useMemo(() => {
    if (!shipmentsData) return [];

    return shipmentsData
      .map((result, index) => {
        if (result.status !== "success" || !result.result) {
          console.warn(
            `Failed to fetch shipment ${shipmentsToFetch[index]}:`,
            result.error
          );
          return null;
        }

        const shipmentData = result.result;
        return {
          id: shipmentsToFetch[index],
          sender: shipmentData.sender,
          receiver: shipmentData.receiver,
          carrier: shipmentData.carrier,
          status: parseInt(shipmentData.status?.toString() || "0"),
          price: shipmentData.price,
          details: shipmentData.details,
          createdAt: shipmentData.createdAt,
          estimatedDelivery: shipmentData.estimatedDelivery,
          deliveryTime: shipmentData.deliveryTime,
          pickupTime: shipmentData.pickupTime,
          isPaid: shipmentData.isPaid,
          isInsured: shipmentData.isInsured,
          value: shipmentData.price ? formatEther(shipmentData.price) : "0",
        };
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)); // Sort by creation date
  }, [shipmentsData, shipmentsToFetch]);

  // Filter shipments based on search and status
  const filteredShipments = useMemo(() => {
    return processedShipments.filter((shipment) => {
      const matchesSearch =
        !searchQuery ||
        shipment.details?.title
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        shipment.id?.toString().includes(searchQuery) ||
        shipment.details?.senderName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        shipment.details?.receiverName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || shipment.status?.toString() === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [processedShipments, searchQuery, filterStatus]);

  // Handle contract errors
  useEffect(() => {
    if (contractError) {
      setError("Failed to fetch shipment data from blockchain");
      console.error("Contract read error:", contractError);
    } else {
      setError(null);
    }
  }, [contractError]);

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

  const getCategoryName = (category) => {
    const categories = [
      "Electronics",
      "Clothing",
      "Books",
      "Food",
      "Medical",
      "Other",
    ];
    return categories[category] || "Unknown";
  };

  const getShipmentTypeName = (type) => {
    const types = ["Standard", "Express", "Overnight", "Fragile"];
    return types[type] || "Standard";
  };

  const formatAddress = (address) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === "0") return "N/A";
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp || timestamp === "0") return "N/A";
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const handleViewShipment = (shipmentId) => {
    window.open(`/tracking/${shipmentId}`, "_blank");
  };

  const handleRetry = () => {
    setError(null);
    refetch();
  };

  // Enhanced Error state
  if (error) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

        <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-red-200/50 dark:border-red-800/50 p-12 shadow-xl">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 via-orange-600 to-yellow-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-500/25 mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <FiAlertCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-3">
              Error Loading Shipments
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-8 leading-relaxed">
              {error}
            </p>
            <button
              onClick={handleRetry}
              className="group relative inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:from-red-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
              <FiRefreshCw className="relative z-10 w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              <span className="relative z-10">Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Loading state
  if (isLoading) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

        <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl w-32"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-48"></div>
            </div>
          </div>

          <div className="space-y-6">
            {[...Array(Math.min(5, activeShipments.length))].map((_, i) => (
              <div
                key={i}
                className="animate-pulse p-6 bg-gradient-to-r from-gray-100/50 to-gray-200/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-2xl"></div>
                  <div className="flex-1 space-y-4">
                    <div className="h-5 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-xl w-3/4"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-lg w-1/2"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-lg w-2/3"></div>
                  </div>
                  <div className="h-10 w-28 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Empty state
  if (!activeShipments || activeShipments.length === 0) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-blue-500/5 dark:from-gray-500/10 dark:to-blue-500/10 rounded-3xl blur opacity-50"></div>

        <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-12 shadow-xl text-center">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 mb-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <FiPackage className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            No Active Shipments
          </h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
            All shipments have been completed or there are no active shipments
            at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FiDatabase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Active Shipments
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Live blockchain data
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-100/70 to-cyan-100/70 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 shadow-lg">
            <FiTruck className="w-4 h-4" />
            <span>
              {processedShipments.length} Loaded / {activeShipments.length}{" "}
              Total
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-lg overflow-hidden">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
            <input
              type="text"
              placeholder="Search by title, ID, sender, or receiver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
            />
            <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-lg overflow-hidden">
            <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors duration-300" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-12 pr-10 py-4 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 appearance-none min-w-max"
            >
              <option value="all">All Status</option>
              <option value="0">Pending</option>
              <option value="1">In Transit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Shipments List */}
      <div className="space-y-6">
        {filteredShipments.map((shipment, index) => (
          <div
            key={shipment.id}
            className="group relative"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-indigo-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-[1.02]">
              {/* Subtle inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-start space-x-6 flex-1">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <FiPackage className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                        {shipment.details?.title || `Shipment #${shipment.id}`}
                      </h4>
                      {getStatusBadge(shipment.status)}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      {[
                        {
                          label: "ID",
                          value: `#${shipment.id?.toString()}`,
                          icon: FiDatabase,
                        },
                        {
                          label: "Value",
                          value: `${parseFloat(shipment.value || 0).toFixed(
                            4
                          )} ETH`,
                          icon: FiZap,
                        },
                        {
                          label: "Category",
                          value: getCategoryName(shipment.details?.category),
                          icon: FiPackage,
                        },
                        {
                          label: "Type",
                          value: getShipmentTypeName(
                            shipment.details?.shipmentType
                          ),
                          icon: FiTruck,
                        },
                        {
                          label: "Weight",
                          value: `${
                            shipment.details?.weight
                              ? formatEther(shipment.details.weight)
                              : "0"
                          } kg`,
                          icon: FiActivity,
                        },
                        {
                          label: "Dimensions",
                          value: shipment.details?.dimensions || "N/A",
                          icon: FiMapPin,
                        },
                        {
                          label: "Insurance",
                          value: shipment.isInsured ? "Yes" : "No",
                          icon: FiShield,
                          highlight: shipment.isInsured,
                        },
                      ].map((item, idx) => {
                        const ItemIcon = item.icon;
                        return (
                          <div
                            key={idx}
                            className="flex items-center space-x-2 p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/20 dark:border-gray-700/30"
                          >
                            <ItemIcon
                              className={`w-4 h-4 ${
                                item.highlight
                                  ? "text-green-500"
                                  : "text-blue-500"
                              }`}
                            />
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">
                                {item.label}:
                              </span>
                              <span
                                className={`ml-1 font-bold text-sm ${
                                  item.highlight
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-gray-900 dark:text-white"
                                }`}
                              >
                                {item.value}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {shipment.details?.description && (
                      <div className="p-4 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Description:{" "}
                        </span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {shipment.details.description}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleViewShipment(shipment.id)}
                    className="group/btn relative inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                    <FiExternalLink className="relative z-10 w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300" />
                    <span className="relative z-10">View Details</span>
                  </button>
                </div>
              </div>

              {/* Enhanced Participants */}
              <div className="relative z-10 mt-6 pt-6 border-t border-white/20 dark:border-gray-700/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      role: "From",
                      name: shipment.details?.senderName,
                      address: shipment.sender,
                      icon: FiUser,
                      color: "from-blue-500 to-cyan-600",
                    },
                    {
                      role: "To",
                      name: shipment.details?.receiverName,
                      address: shipment.receiver,
                      icon: FiMapPin,
                      color: "from-green-500 to-emerald-600",
                    },
                    {
                      role: "Carrier",
                      name: null,
                      address: shipment.carrier,
                      icon: FiTruck,
                      color: "from-purple-500 to-violet-600",
                    },
                  ].map((participant, idx) => {
                    const ParticipantIcon = participant.icon;
                    return (
                      <div
                        key={idx}
                        className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <div
                            className={`w-8 h-8 bg-gradient-to-r ${participant.color} rounded-lg flex items-center justify-center shadow-lg`}
                          >
                            <ParticipantIcon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {participant.role}
                          </span>
                        </div>
                        <div className="ml-11 space-y-1">
                          {participant.name && (
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {participant.name}
                            </p>
                          )}
                          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100/50 dark:bg-gray-800/50 px-2 py-1 rounded">
                            {formatAddress(participant.address)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between mt-4 text-xs font-medium text-gray-600 dark:text-gray-400 space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <FiClock className="w-3 h-3" />
                      <span>Created: {formatDate(shipment.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FiTruck className="w-3 h-3" />
                      <span>Pickup: {formatDateTime(shipment.pickupTime)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FiMapPin className="w-3 h-3" />
                    <span>
                      Est. Delivery:{" "}
                      {formatDateTime(shipment.estimatedDelivery)}
                    </span>
                  </div>
                </div>

                {/* Enhanced Special Features */}
                {(shipment.isInsured ||
                  shipment.details?.requiresSignature) && (
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    {shipment.isInsured && (
                      <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-green-100/70 to-emerald-100/70 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 rounded-xl text-xs font-bold border border-green-200/50 dark:border-green-800/50 shadow-sm">
                        <FiShield className="w-3 h-3" />
                        <span>Insured</span>
                      </div>
                    )}
                    {shipment.details?.requiresSignature && (
                      <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-100/70 to-cyan-100/70 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
                        <FiCheckCircle className="w-3 h-3" />
                        <span>Signature Required</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced No results message */}
      {filteredShipments.length === 0 &&
        processedShipments.length > 0 &&
        (searchQuery || filterStatus !== "all") && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-blue-500/5 dark:from-gray-500/10 dark:to-blue-500/10 rounded-3xl blur opacity-50"></div>

            <div className="relative text-center py-12 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 shadow-xl">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-6">
                <FiFilter className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                No matching shipments
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Try adjusting your search or filter criteria
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                }}
                className="group/clear relative inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
                <FiRefreshCw className="relative z-10 w-4 h-4 group-hover/clear:rotate-180 transition-transform duration-500" />
                <span className="relative z-10">Clear filters</span>
              </button>
            </div>
          </div>
        )}

      {/* Enhanced Performance notice */}
      {activeShipments.length > 20 && (
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-500/10 dark:from-yellow-500/20 dark:to-orange-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

          <div className="relative text-center py-6 bg-gradient-to-r from-yellow-50/70 to-orange-50/70 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-200/50 dark:border-yellow-700/50 rounded-2xl backdrop-blur-sm shadow-lg">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiAlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-300">
                  Performance Optimization
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Showing first 20 of{" "}
                  <span className="font-bold">{activeShipments.length}</span>{" "}
                  active shipments for optimal performance.
                </p>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping delay-100"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping delay-200"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveShipments;
