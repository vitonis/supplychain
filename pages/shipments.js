import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useContractReads } from "wagmi";
import { useSupplyChainContract } from "../hooks/useContract";
import Layout from "../components/Layout/Layout";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/contractABI";
import {
  FiPackage,
  FiEye,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiFilter,
  FiSearch,
  FiUser,
  FiArrowUpRight,
  FiPlus,
  FiActivity,
  FiMapPin,
  FiShield,
  FiDollarSign,
} from "react-icons/fi";

const MyShipments = () => {
  const { address, isConnected } = useAccount();
  const { useContractRead, formatEther } = useSupplyChainContract();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user shipments
  const { data: senderShipments, isLoading: loadingSender } = useContractRead(
    "getUserShipments",
    [address, "sender"]
  );

  const { data: receiverShipments, isLoading: loadingReceiver } =
    useContractRead("getUserShipments", [address, "receiver"]);

  const { data: carrierShipments, isLoading: loadingCarrier } = useContractRead(
    "getUserShipments",
    [address, "carrier"]
  );

  // Combine and deduplicate IDs
  const allShipmentIds = [
    ...(senderShipments || []),
    ...(receiverShipments || []),
    ...(carrierShipments || []),
  ];
  const uniqueShipmentIds = [...new Set(allShipmentIds.map(String))];
  const limitedIds = uniqueShipmentIds.slice(0, 20);

  // Batch fetch all shipments in ONE hook call — no hooks in loops
  const { data: shipmentsData, isLoading: loadingShipments } = useContractReads({
    contracts: limitedIds.map((id) => ({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getShipment",
      args: [id],
    })),
    enabled: limitedIds.length > 0,
  });

  // Process shipment data
  useEffect(() => {
    if (loadingSender || loadingReceiver || loadingCarrier || loadingShipments) {
      setLoading(true);
      return;
    }

    const processedShipments = (shipmentsData || [])
      .map((result, index) => {
        const shipment = result?.result || result;
        if (!shipment || result?.status === "failure") return null;
        const id = limitedIds[index];

        const role = senderShipments?.map(String).includes(id)
          ? "sender"
          : receiverShipments?.map(String).includes(id)
          ? "receiver"
          : carrierShipments?.map(String).includes(id)
          ? "carrier"
          : "unknown";

        return {
          id,
          sender: shipment.sender,
          receiver: shipment.receiver,
          carrier: shipment.carrier,
          status: parseInt(shipment.status) || 0,
          price: shipment.price,
          details: shipment.details,
          createdAt: shipment.createdAt,
          estimatedDelivery: shipment.estimatedDelivery,
          deliveryTime: shipment.deliveryTime,
          isPaid: shipment.isPaid,
          isInsured: shipment.isInsured,
          role,
          value: formatEther(shipment.price || 0n),
        };
      })
      .filter(Boolean)
      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

    setShipments(processedShipments);
    setLoading(false);
  }, [
    loadingSender,
    loadingReceiver,
    loadingCarrier,
    loadingShipments,
    shipmentsData,
    senderShipments,
    receiverShipments,
    carrierShipments,
  ]);


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

  const getRoleBadge = (role) => {
    const roleConfig = {
      sender: {
        label: "Sent",
        color: "blue",
        icon: FiArrowUpRight,
        gradient: "from-blue-400 to-cyan-500",
        bgGradient:
          "from-blue-50/70 to-cyan-50/70 dark:from-blue-900/30 dark:to-cyan-900/30",
        textColor: "text-blue-700 dark:text-blue-300",
      },
      receiver: {
        label: "Received",
        color: "green",
        icon: FiPackage,
        gradient: "from-green-400 to-emerald-500",
        bgGradient:
          "from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30",
        textColor: "text-green-700 dark:text-green-300",
      },
      carrier: {
        label: "Carrier",
        color: "purple",
        icon: FiTruck,
        gradient: "from-purple-400 to-violet-500",
        bgGradient:
          "from-purple-50/70 to-violet-50/70 dark:from-purple-900/30 dark:to-violet-900/30",
        textColor: "text-purple-700 dark:text-purple-300",
      },
    };

    const config = roleConfig[role] || roleConfig.sender;
    const Icon = config.icon;

    return (
      <div
        className={`
        inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold
        bg-gradient-to-r ${config.bgGradient} ${config.textColor}
        border border-white/20 dark:border-gray-700/30 shadow-sm
        transform hover:scale-105 transition-all duration-300
      `}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{config.label}</span>
      </div>
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === "0") return "N/A";
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const formatAddress = (address) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Filter shipments based on active tab
  const getFilteredShipmentsByTab = () => {
    switch (activeTab) {
      case "sent":
        return shipments.filter((s) => s.role === "sender");
      case "received":
        return shipments.filter((s) => s.role === "receiver");
      case "carrier":
        return shipments.filter((s) => s.role === "carrier");
      default:
        return shipments;
    }
  };

  const tabFilteredShipments = getFilteredShipmentsByTab();

  const filteredShipments = tabFilteredShipments.filter((shipment) => {
    const matchesSearch =
      !searchQuery ||
      shipment.details?.title
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      shipment.id?.toString().includes(searchQuery);

    const matchesStatus =
      filterStatus === "all" || shipment.status.toString() === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const tabs = [
    {
      id: "all",
      label: "All Shipments",
      count: shipments.length,
      icon: FiActivity,
      color: "from-blue-500 to-cyan-600",
    },
    {
      id: "sent",
      label: "Sent",
      count: shipments.filter((s) => s.role === "sender").length,
      icon: FiArrowUpRight,
      color: "from-blue-500 to-indigo-600",
    },
    {
      id: "received",
      label: "Received",
      count: shipments.filter((s) => s.role === "receiver").length,
      icon: FiPackage,
      color: "from-green-500 to-emerald-600",
    },
    {
      id: "carrier",
      label: "As Carrier",
      count: shipments.filter((s) => s.role === "carrier").length,
      icon: FiTruck,
      color: "from-purple-500 to-violet-600",
    },
  ];

  if (!isConnected) {
    return (
      <Layout>
        <div className="relative min-h-[60vh] flex items-center justify-center">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-1/4 w-32 h-32 bg-blue-500/10 dark:bg-blue-400/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-purple-500/10 dark:bg-purple-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative z-10 text-center max-w-md mx-auto px-6">
            <div className="relative mb-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <FiPackage className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-4 border-white dark:border-gray-900 animate-ping"></div>
            </div>

            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-4">
              Connect Your Wallet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              Please connect your wallet to view and manage your shipments
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 right-10 w-80 h-80 bg-blue-500/5 dark:bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 left-10 w-80 h-80 bg-purple-500/5 dark:bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto space-y-8">
          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                My Shipments
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                Manage and track all your blockchain shipments
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <FiActivity className="w-4 h-4" />
                <span>Live Data</span>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Real-time Updates</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            <Link
              href="/create-shipment"
              className="group relative inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
              <FiPlus className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
              <span className="relative z-10">Create New Shipment</span>
            </Link>
          </div>

          {/* Enhanced Tabs */}
          <div className="relative">
            <div className="flex space-x-1 bg-gradient-to-r from-gray-100/70 to-gray-200/70 dark:from-gray-800/70 dark:to-gray-700/70 backdrop-blur-sm rounded-2xl p-2 border border-white/20 dark:border-gray-600/30 shadow-lg overflow-x-auto">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative flex items-center space-x-3 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105 whitespace-nowrap
                      ${
                        activeTab === tab.id
                          ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-600/50"
                      }
                    `}
                  >
                    {activeTab === tab.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl"></div>
                    )}
                    <TabIcon className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={`
                          relative z-10 px-2 py-1 text-xs rounded-full font-bold
                          ${
                            activeTab === tab.id
                              ? "bg-white/20 text-white"
                              : "bg-gray-200/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400"
                          }
                        `}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-lg overflow-hidden">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="Search by title or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-transparent text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
                />
                <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-lg overflow-hidden">
                <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors duration-300" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-12 pr-10 py-4 bg-transparent text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="0">Pending</option>
                  <option value="1">In Transit</option>
                  <option value="2">Delivered</option>
                  <option value="3">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-50"></div>
                  <div
                    className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  >
                    <div className="flex items-center space-x-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl"></div>
                      <div className="flex-1 space-y-4">
                        <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl w-3/4"></div>
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-1/2"></div>
                      </div>
                      <div className="h-10 w-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-blue-500/5 dark:from-gray-500/10 dark:to-blue-500/10 rounded-3xl blur"></div>
              <div className="relative text-center py-16 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 shadow-xl">
                <div className="relative mb-8">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <FiPackage className="w-10 h-10 text-white" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  No shipments found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
                  {searchQuery || filterStatus !== "all"
                    ? "Try adjusting your search or filters"
                    : "Create your first shipment to get started"}
                </p>
                {!searchQuery && filterStatus === "all" && (
                  <Link
                    href="/create-shipment"
                    className="group relative inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-105 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
                    <FiPackage className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    <span className="relative z-10">Create Shipment</span>
                  </Link>
                )}
              </div>
            </div>
          ) : (
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
                    {/* Main content */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start space-x-6">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            <FiPackage className="w-8 h-8 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                        </div>

                        <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {shipment.details?.title ||
                                `Shipment #${shipment.id}`}
                            </h3>
                            {getStatusBadge(shipment.status)}
                            {getRoleBadge(shipment.role)}
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <FiMapPin className="w-4 h-4 text-orange-500" />
                              <span className="text-gray-500 dark:text-gray-400">
                                Est. Delivery:
                              </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {formatDate(shipment.estimatedDelivery)}
                              </span>
                            </div>
                          </div>

                          {shipment.details?.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50/50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                              {shipment.details.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {shipment.isPaid && (
                          <div className="flex items-center space-x-1 px-3 py-1.5 bg-green-100/70 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-xs font-bold">
                            <FiDollarSign className="w-3 h-3" />
                            <span>Paid</span>
                          </div>
                        )}
                        {shipment.isInsured && (
                          <div className="flex items-center space-x-1 px-3 py-1.5 bg-blue-100/70 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold">
                            <FiShield className="w-3 h-3" />
                            <span>Insured</span>
                          </div>
                        )}
                        <Link
                          href={`/tracking/${shipment.id}`}
                          className="group/action relative inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-blue-500 hover:to-purple-600 dark:hover:from-blue-500 dark:hover:to-purple-600 text-gray-700 dark:text-gray-300 hover:text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 font-bold"
                        >
                          <FiEye className="w-4 h-4 transform group-hover/action:scale-110 transition-transform duration-300" />
                          <span>Track</span>
                        </Link>
                      </div>
                    </div>

                    {/* Progress bar for in-transit shipments */}
                    {shipment.status === 1 && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
                        <div className="flex items-center justify-between text-sm font-medium mb-3">
                          <div className="flex items-center space-x-2">
                            <FiTruck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-blue-700 dark:text-blue-300">
                              In Transit
                            </span>
                          </div>
                          <span className="text-blue-600 dark:text-blue-400">
                            Est. {formatDate(shipment.estimatedDelivery)}
                          </span>
                        </div>
                        <div className="relative w-full bg-blue-200/50 dark:bg-blue-800/30 rounded-full h-3 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full w-1/3 shadow-lg">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Participants info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                            <FiUser className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                              Sender
                            </p>
                            <p className="text-sm font-bold text-blue-800 dark:text-blue-200 truncate">
                              {shipment.details?.senderName ||
                                formatAddress(shipment.sender)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200/50 dark:border-green-800/50">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                            <FiMapPin className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                              Receiver
                            </p>
                            <p className="text-sm font-bold text-green-800 dark:text-green-200 truncate">
                              {shipment.details?.receiverName ||
                                formatAddress(shipment.receiver)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-purple-50/50 to-violet-50/50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-2xl border border-purple-200/50 dark:border-purple-800/50">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                            <FiTruck className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                              Carrier
                            </p>
                            <p className="text-sm font-bold text-purple-800 dark:text-purple-200 truncate">
                              {formatAddress(shipment.carrier)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show message if limited shipments are displayed */}
          {uniqueShipmentIds.length > 20 && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-500/10 dark:from-yellow-500/20 dark:to-orange-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

              <div className="relative p-6 bg-gradient-to-r from-yellow-50/70 to-orange-50/70 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-200/50 dark:border-yellow-700/50 rounded-2xl backdrop-blur-sm shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/25">
                      <FiActivity className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-300 mb-1">
                      Performance Optimization
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 leading-relaxed">
                      Showing first 20 shipments for optimal performance. Total
                      shipments:{" "}
                      <span className="font-bold">
                        {uniqueShipmentIds.length}
                      </span>
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
      </div>
    </Layout>
  );
};

export default MyShipments;
