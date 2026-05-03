import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useSupplyChainContract } from "../hooks/useContract";
import Layout from "../components/Layout/Layout";
import {
  FiPackage,
  FiTruck,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiInfo,
  FiArrowLeft,
  FiExternalLink,
  FiImage,
  FiFileText,
  FiPhone,
  FiMail,
  FiNavigation,
  FiAlertCircle,
  FiRefreshCw,
  FiSearch,
  FiStar,
  FiShield,
  FiHeart,
  FiZap,
  FiDatabase,
  FiActivity,
  FiTarget,
  FiAward,
} from "react-icons/fi";

const TrackingPage = () => {
  const router = useRouter();
  const { id: shipmentId } = router.query;
  const { address, isConnected } = useAccount();
  const { useContractRead, formatEther } = useSupplyChainContract();

  const [shipment, setShipment] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Search functionality for when accessed without ID
  const [searchId, setSearchId] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Fetch shipment data
  const fetchShipmentData = async (id) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Import contract utilities directly
      const { readContract } = await import("wagmi/actions");
      const { CONTRACT_ABI, CONTRACT_ADDRESS } = await import(
        "../utils/contractABI"
      );

      // Fetch shipment details
      const shipmentData = await readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getShipment",
        args: [id],
      });

      if (!shipmentData) {
        setError("Shipment not found");
        return;
      }

      // Fetch tracking history
      const trackingData = await readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getTrackingHistory",
        args: [id],
      });

      setShipment({
        id,
        ...shipmentData,
        value: formatEther(shipmentData.price || 0),
      });

      setTrackingHistory(trackingData || []);
    } catch (err) {
      console.error("Error fetching shipment:", err);
      setError("Failed to load shipment data");
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchShipmentData(shipmentId);
    setRefreshing(false);
  };

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setIsSearching(true);
    router.push(`/tracking/${searchId.trim()}`);
  };

  useEffect(() => {
    if (shipmentId) {
      fetchShipmentData(shipmentId);
    }
  }, [shipmentId]);

  const getStatusConfig = (status) => {
    const configs = {
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
    return configs[status] || configs[0];
  };

  const getStatusBadge = (status) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
      <div
        className={`
        inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold
        bg-gradient-to-r ${config.bgGradient} ${config.textColor}
        border ${config.borderColor} shadow-lg
        transform hover:scale-105 transition-all duration-300
      `}
      >
        <div
          className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.gradient} animate-pulse`}
        ></div>
        <Icon className="w-4 h-4" />
        <span>{config.label}</span>
      </div>
    );
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const formatDateShort = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const getUserRole = () => {
    if (!shipment || !address) return null;

    if (shipment.sender?.toLowerCase() === address.toLowerCase())
      return "sender";
    if (shipment.receiver?.toLowerCase() === address.toLowerCase())
      return "receiver";
    if (shipment.carrier?.toLowerCase() === address.toLowerCase())
      return "carrier";
    return "public";
  };

  // Enhanced search interface if no shipment ID
  if (!shipmentId) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

            <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-12 shadow-xl text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

              <div className="relative z-10">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 mb-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <FiPackage className="w-12 h-12 text-white" />
                </div>

                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                  Track Your Shipment
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-md mx-auto">
                  Enter your shipment ID to get real-time tracking information
                  and delivery updates
                </p>

                <form onSubmit={handleSearch} className="max-w-md mx-auto mb-8">
                  <div className="relative group/search">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-2xl blur opacity-0 group-hover/search:opacity-100 transition-opacity duration-300"></div>

                    <div className="relative flex space-x-3">
                      <div className="flex-1">
                        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover/search:text-blue-500 transition-colors duration-300" />
                        <input
                          type="text"
                          placeholder="Enter Shipment ID..."
                          value={searchId}
                          onChange={(e) => setSearchId(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                          required
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within/search:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSearching}
                        className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-50"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
                        <span className="relative z-10">
                          {isSearching ? "Searching..." : "Track"}
                        </span>
                      </button>
                    </div>
                  </div>
                </form>

                <Link
                  href="/shipments"
                  className="group inline-flex items-center space-x-2 px-6 py-3 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-all duration-300 transform hover:scale-105"
                >
                  <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                  <span>View My Shipments</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Enhanced loading state
  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

            <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
              <div className="animate-pulse space-y-8">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-2xl animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-xl w-1/3 animate-pulse"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="h-32 bg-gradient-to-r from-gray-200/50 to-gray-300/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl animate-pulse"
                        style={{ animationDelay: `${i * 200}ms` }}
                      ></div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div
                        key={i}
                        className="h-48 bg-gradient-to-r from-gray-200/50 to-gray-300/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl animate-pulse"
                        style={{ animationDelay: `${i * 300}ms` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Enhanced error state
  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

            <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-12 shadow-xl text-center">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500 via-orange-600 to-yellow-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-500/25 mb-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <FiAlertCircle className="w-12 h-12 text-white" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {error}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Please check the shipment ID and try again, or contact support
                if the issue persists
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => fetchShipmentData(shipmentId)}
                  className="group relative inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
                  <FiRefreshCw className="relative z-10 w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="relative z-10">Try Again</span>
                </button>

                <Link
                  href="/tracking"
                  className="group relative inline-flex items-center space-x-3 px-8 py-4 bg-white/70 dark:bg-gray-700/70 text-gray-700 dark:text-gray-300 font-bold rounded-2xl shadow-lg hover:shadow-xl hover:bg-white/90 dark:hover:bg-gray-600/90 transform hover:scale-105 transition-all duration-300"
                >
                  <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                  <span>Search Another</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const statusConfig = getStatusConfig(shipment.status);
  const userRole = getUserRole();

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

          <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Link
                  href="/shipments"
                  className="group p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300 transform hover:scale-110"
                >
                  <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                </Link>

                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <FiPackage className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                      Shipment #{shipmentId}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Real-time tracking and shipment details
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="group relative inline-flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                  <FiRefreshCw
                    className={`relative z-10 w-4 h-4 ${
                      refreshing ? "animate-spin" : "group-hover:rotate-180"
                    } transition-transform duration-300`}
                  />
                  <span className="relative z-10">Refresh</span>
                </button>

                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Live
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Status Overview */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-indigo-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

          <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/25 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <FiPackage className="w-10 h-10 text-white" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                      {shipment.details?.title || `Shipment #${shipmentId}`}
                    </h2>
                    {getStatusBadge(shipment.status)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">
                    {parseFloat(shipment.value).toFixed(4)} ETH
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Shipment Value
                  </div>
                  <div className="inline-flex items-center space-x-1 mt-2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100/70 to-emerald-100/70 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-800/50">
                    <FiHeart className="w-3 h-3" />
                    <span>Fee-Free</span>
                  </div>
                </div>
              </div>

              {shipment.details?.description && (
                <div className="relative group/desc">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-blue-500/5 dark:from-gray-500/10 dark:to-blue-500/10 rounded-xl blur opacity-0 group-hover/desc:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 p-4 shadow-lg">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {shipment.details.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Tracking Timeline */}
          <div className="lg:col-span-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

              <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FiMapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Tracking Timeline
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Real-time shipment journey
                      </p>
                    </div>
                  </div>

                  {trackingHistory.length > 0 ? (
                    <div className="space-y-6">
                      {trackingHistory.map((event, index) => (
                        <div key={index} className="relative group/event">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-xl blur opacity-0 group-hover/event:opacity-100 transition-opacity duration-300"></div>

                          <div className="relative flex items-start space-x-4 p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 shadow-lg group-hover/event:shadow-xl transition-all duration-300">
                            <div
                              className={`
                                w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transform group-hover/event:scale-110 transition-all duration-300
                                ${
                                  index === 0
                                    ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                                    : "bg-gradient-to-br from-gray-400 to-gray-500 text-white"
                                }
                              `}
                            >
                              <FiNavigation className="w-5 h-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                  {event.location}
                                </h4>
                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded-full">
                                  {formatDate(event.timestamp)}
                                </span>
                              </div>

                              {event.notes && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                                  {event.notes}
                                </p>
                              )}

                              {event.status && (
                                <div className="mb-3">
                                  {getStatusBadge(event.status)}
                                </div>
                              )}

                              {event.imageHash && (
                                <div>
                                  <a
                                    href={`https://ipfs.io/ipfs/${event.imageHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-2 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50/70 dark:bg-blue-900/30 rounded-lg border border-blue-200/50 dark:border-blue-800/50 hover:bg-blue-100/70 dark:hover:bg-blue-800/30 transition-all duration-300"
                                  >
                                    <FiImage className="w-3 h-3" />
                                    <span>View Photo</span>
                                    <FiExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {index < trackingHistory.length - 1 && (
                            <div className="flex justify-start ml-6 mt-2">
                              <div className="w-px h-6 bg-gradient-to-b from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-500/25 mb-6">
                        <FiMapPin className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        No Tracking Updates Yet
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Your shipment is being prepared. Tracking updates will
                        appear here once it's in transit.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Enhanced Quick Info */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

              <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-6 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FiInfo className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Quick Info
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        label: "Created",
                        value: formatDateShort(shipment.createdAt),
                        icon: FiCalendar,
                      },
                      {
                        label: "Pickup",
                        value: formatDateShort(shipment.pickupTime),
                        icon: FiClock,
                      },
                      {
                        label: "Est. Delivery",
                        value: formatDateShort(shipment.estimatedDelivery),
                        icon: FiTarget,
                      },
                      ...(shipment.details?.weight
                        ? [
                            {
                              label: "Weight",
                              value: `${formatEther(
                                shipment.details.weight
                              )} kg`,
                              icon: FiActivity,
                            },
                          ]
                        : []),
                      ...(shipment.details?.category
                        ? [
                            {
                              label: "Category",
                              value: shipment.details.category,
                              icon: FiPackage,
                            },
                          ]
                        : []),
                      {
                        label: "Insurance",
                        value: shipment.requireInsurance
                          ? "Covered"
                          : "Not Covered",
                        icon: FiShield,
                        highlight: shipment.requireInsurance,
                      },
                    ].map((item, idx) => {
                      const ItemIcon = item.icon;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-white/20 dark:border-gray-700/30"
                        >
                          <div className="flex items-center space-x-3">
                            <ItemIcon
                              className={`w-4 h-4 ${
                                item.highlight
                                  ? "text-green-500"
                                  : "text-blue-500"
                              }`}
                            />
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              {item.label}
                            </span>
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              item.highlight
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {item.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Participants */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

              <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-6 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FiUser className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Participants
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {[
                      {
                        role: "Sender",
                        name: shipment.details?.senderName,
                        address: shipment.sender,
                        icon: FiUser,
                        color: "from-blue-500 to-cyan-600",
                        userType: "sender",
                      },
                      {
                        role: "Receiver",
                        name: shipment.details?.receiverName,
                        address: shipment.receiver,
                        icon: FiMapPin,
                        color: "from-green-500 to-emerald-600",
                        userType: "receiver",
                      },
                      {
                        role: "Carrier",
                        name: null,
                        address: shipment.carrier,
                        icon: FiTruck,
                        color: "from-purple-500 to-violet-600",
                        userType: "carrier",
                      },
                    ].map((participant, idx) => {
                      const ParticipantIcon = participant.icon;
                      const isCurrentUser = userRole === participant.userType;

                      return (
                        <div key={idx} className="relative group/participant">
                          <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-blue-500/5 dark:from-gray-500/10 dark:to-blue-500/10 rounded-xl blur opacity-0 group-hover/participant:opacity-100 transition-opacity duration-300"></div>

                          <div className="relative bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 p-4 shadow-lg group-hover/participant:shadow-xl transition-all duration-300">
                            <div className="flex items-start space-x-3">
                              <div
                                className={`w-10 h-10 bg-gradient-to-r ${participant.color} rounded-xl flex items-center justify-center shadow-lg group-hover/participant:scale-110 transition-transform duration-300`}
                              >
                                <ParticipantIcon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {participant.role}
                                  </span>
                                  {isCurrentUser && (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-100/70 to-purple-100/70 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                                      <FiStar className="w-3 h-3" />
                                      <span>You</span>
                                    </span>
                                  )}
                                </div>
                                {participant.name && (
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {participant.name}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-500 font-mono bg-gray-100/50 dark:bg-gray-800/50 px-2 py-1 rounded break-all">
                                  {participant.address}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Documents */}
            {shipment.details?.documentHash && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5 dark:from-purple-500/10 dark:to-violet-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

                <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-6 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                        <FiFileText className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Documents
                      </h3>
                    </div>

                    <a
                      href={`https://ipfs.io/ipfs/${shipment.details.documentHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/doc relative w-full inline-flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-violet-700 transform hover:scale-105 transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
                      <FiFileText className="relative z-10 w-5 h-5 group-hover/doc:scale-110 transition-transform duration-300" />
                      <span className="relative z-10">
                        View Shipping Documents
                      </span>
                      <FiExternalLink className="relative z-10 w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Features Panel */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-amber-500/5 dark:from-yellow-500/10 dark:to-amber-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

              <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-6 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FiAward className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Features
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-white/20 dark:border-gray-700/30">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <FiZap className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Real-time Blockchain Tracking
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-white/20 dark:border-gray-700/30">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                        <FiDatabase className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Immutable Records
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-white/20 dark:border-gray-700/30">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                        <FiHeart className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fee-Free Platform
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TrackingPage;
