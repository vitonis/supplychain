import { useState, useEffect } from "react";
import { useAccount, useContractRead } from "wagmi";
import { useApproveKYC, useRejectKYC } from "../hooks/useSupplyChainActions";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/contractABI";
import Layout from "../components/Layout/Layout";
import AdminStats from "../components/Admin/AdminStats";
import PendingKYC from "../components/Admin/PendingKYC";
import ActiveShipments from "../components/Admin/ActiveShipments";
import UserManagement from "../components/Admin/UserManagement";
import toast from "react-hot-toast";
import {
  FiUsers,
  FiShield,
  FiAlert,
  FiPackage,
  FiSettings,
  FiBarChart,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiTrendingUp,
  FiActivity,
  FiRefreshCw,
  FiStar,
  FiLock,
  FiGlobe,
  FiDatabase,
  FiZap,
  FiCpu,
  FiHardDrive,
  FiWifi,
} from "react-icons/fi";

const AdminPanel = () => {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Check if user has admin role
  const { data: hasAdminRole, refetch: refetchAdminRole } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "hasRole",
    args: [
      "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775", // ADMIN_ROLE hash
      address,
    ],
    enabled: !!address,
  });

  // Get pending KYC — always fetch when connected (hasAdminRole may be slow to resolve)
  const { data: pendingKYCUsers, refetch: refetchPendingKYC, isLoading: kycLoading } = useContractRead(
    {
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getPendingKYCUsers",
      enabled: !!address,
      watch: true,
    }
  );

  const { data: activeShipments, refetch: refetchActiveShipments } =
    useContractRead({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getActiveShipments",
      enabled: !!address && !!hasAdminRole,
    });

  // KYC approval/rejection — direct writes (no prepare) for Polygon reliability
  const {
    write: approveWrite,
    isLoading: approveLoading,
    isConfirmed: approveConfirmed,
  } = useApproveKYC();

  const {
    write: rejectWrite,
    isLoading: rejectLoading,
    isConfirmed: rejectConfirmed,
  } = useRejectKYC();

  useEffect(() => {
    if (approveConfirmed) {
      setSelectedUser(null);
      toast.success("KYC approved successfully!");
      refetchPendingKYC();
    }
  }, [approveConfirmed, refetchPendingKYC]);

  useEffect(() => {
    if (rejectConfirmed) {
      setSelectedUser(null);
      setRejectionReason("");
      setShowRejectModal(false);
      toast.success("KYC rejected successfully!");
      refetchPendingKYC();
    }
  }, [rejectConfirmed, refetchPendingKYC]);

  const handleApproveKYC = (userAddress) => {
    if (!approveWrite) {
      toast.error("Wallet not ready. Please ensure MetaMask is connected to Polygon.");
      return;
    }
    setSelectedUser(userAddress);
    approveWrite({ args: [userAddress] });
  };

  const handleRejectKYC = (userAddress) => {
    setSelectedUser(userAddress);
    setShowRejectModal(true);
  };

  const confirmRejectKYC = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    if (!rejectWrite) {
      toast.error("Wallet not ready. Please ensure MetaMask is connected to Polygon.");
      return;
    }
    rejectWrite({ args: [selectedUser, rejectionReason] });
  };

  const handleRefreshData = () => {
    refetchAdminRole();
    refetchPendingKYC();
    refetchActiveShipments();
    toast.success("Data refreshed!");
  };

  // Enhanced tabs with icons and colors
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: FiBarChart,
      color: "from-blue-500 to-cyan-600",
      description: "Platform statistics",
    },
    {
      id: "kyc",
      label: "KYC Management",
      icon: FiShield,
      color: "from-green-500 to-emerald-600",
      description: "Identity verification",
    },
    {
      id: "shipments",
      label: "Shipments",
      icon: FiPackage,
      color: "from-purple-500 to-violet-600",
      description: "Active shipments",
    },
    {
      id: "users",
      label: "User Management",
      icon: FiUsers,
      color: "from-orange-500 to-red-600",
      description: "User administration",
    },
  ];

  // if (!isConnected) {
  //   return (
  //     <Layout>
  //       <div className="relative min-h-[60vh] flex items-center justify-center">
  //         {/* Animated background elements */}
  //         <div className="absolute inset-0 overflow-hidden pointer-events-none">
  //           <div className="absolute top-20 left-1/4 w-32 h-32 bg-blue-500/10 dark:bg-blue-400/20 rounded-full blur-2xl animate-pulse"></div>
  //           <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-purple-500/10 dark:bg-purple-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
  //         </div>

  //         <div className="relative z-10 text-center max-w-md mx-auto px-6">
  //           <div className="relative mb-8">
  //             <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 transform rotate-3 hover:rotate-0 transition-transform duration-500">
  //               <FiShield className="w-12 h-12 text-white" />
  //             </div>
  //             <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-4 border-white dark:border-gray-900 animate-ping"></div>
  //           </div>

  //           <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-4">
  //             Connect Your Wallet
  //           </h3>
  //           <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
  //             Please connect your wallet to access the admin panel
  //           </p>
  //         </div>
  //       </div>
  //     </Layout>
  //   );
  // }

  // if (!hasAdminRole) {
  //   return (
  //     <Layout>
  //       <div className="relative min-h-[60vh] flex items-center justify-center">
  //         {/* Animated background elements */}
  //         <div className="absolute inset-0 overflow-hidden pointer-events-none">
  //           <div className="absolute top-20 left-1/4 w-32 h-32 bg-red-500/10 dark:bg-red-400/20 rounded-full blur-2xl animate-pulse"></div>
  //           <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-orange-500/10 dark:bg-orange-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
  //         </div>

  //         <div className="relative z-10 text-center max-w-md mx-auto px-6">
  //           <div className="relative mb-8">
  //             <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500 via-orange-600 to-yellow-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-500/25 transform rotate-3 hover:rotate-0 transition-transform duration-500">
  //               <FiAlert className="w-12 h-12 text-white" />
  //             </div>
  //             <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-4 border-white dark:border-gray-900 animate-ping"></div>
  //           </div>

  //           <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-4">
  //             Access Denied
  //           </h3>
  //           <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
  //             You don't have administrator privileges to access this panel
  //           </p>
  //         </div>
  //       </div>
  //     </Layout>
  //   );
  // }

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
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <FiCpu className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                    Admin Panel
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                    Manage platform operations, users, and configurations -
                    Fee-free platform
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <FiActivity className="w-4 h-4" />
                <span>Live Admin Console</span>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Real-time Management</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            <button
              onClick={handleRefreshData}
              className="group relative inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:via-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
              <FiRefreshCw className="relative z-10 w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              <span className="relative z-10">Refresh Data</span>
            </button>
          </div>

          {/* Enhanced Tabs Navigation */}
          <div className="relative">
            <div className="flex space-x-1 bg-gradient-to-r from-gray-100/70 to-gray-200/70 dark:from-gray-800/70 dark:to-gray-700/70 backdrop-blur-sm rounded-2xl p-2 border border-white/20 dark:border-gray-600/30 shadow-lg overflow-x-auto">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative flex items-center space-x-3 px-6 py-4 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105 whitespace-nowrap min-w-max
                      ${activeTab === tab.id
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-600/50"
                      }
                    `}
                  >
                    {activeTab === tab.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl"></div>
                    )}
                    <TabIcon className="w-5 h-5 relative z-10" />
                    <div className="relative z-10 text-left">
                      <div>{tab.label}</div>
                      <div
                        className={`text-xs ${activeTab === tab.id
                            ? "text-white/80"
                            : "text-gray-500 dark:text-gray-400"
                          }`}
                      >
                        {tab.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      title: "Active Shipments",
                      value: (activeShipments || []).length,
                      icon: FiPackage,
                      color: "from-blue-500 to-cyan-600",
                      change: "+12%",
                      changeType: "increase",
                    },
                    {
                      title: "Pending KYC",
                      value: (pendingKYCUsers || []).length,
                      icon: FiClock,
                      color: "from-yellow-500 to-orange-600",
                      change: "-5%",
                      changeType: "decrease",
                    },
                    {
                      title: "Platform Status",
                      value: "Fee-Free Active",
                      icon: FiCheckCircle,
                      color: "from-green-500 to-emerald-600",
                      change: "100%",
                      changeType: "increase",
                    },
                    {
                      title: "Network",
                      value: process.env.NEXT_PUBLIC_CHAIN_NAME || "Ethereum",
                      icon: FiActivity,
                      color: "from-purple-500 to-violet-600",
                      change: "Online",
                      changeType: "increase",
                    },
                  ].map((stat, index) => {
                    const StatIcon = stat.icon;
                    return (
                      <div
                        key={index}
                        className="relative group"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${stat.color
                            .replace("to-", "to-")
                            .replace(
                              "from-",
                              "from-"
                            )} opacity-10 rounded-3xl blur transition-opacity duration-300 group-hover:opacity-20`}
                        ></div>

                        <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-105">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {stat.title}
                              </p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stat.value}
                              </p>
                              <div
                                className={`flex items-center space-x-1 text-xs font-medium ${stat.changeType === "increase"
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                  }`}
                              >
                                {stat.changeType === "increase" ? (
                                  <FiTrendingUp className="w-3 h-3" />
                                ) : (
                                  <FiActivity className="w-3 h-3" />
                                )}
                                <span>{stat.change}</span>
                              </div>
                            </div>
                            <div
                              className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                            >
                              <StatIcon className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Enhanced Platform Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                    <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl hover:shadow-2xl transition-all duration-500">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <FiBarChart className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Platform Statistics
                        </h3>
                      </div>

                      <div className="space-y-4">
                        {[
                          {
                            label: "Active Shipments",
                            value: (activeShipments || []).length,
                            icon: FiPackage,
                          },
                          {
                            label: "Pending KYC Applications",
                            value: (pendingKYCUsers || []).length,
                            icon: FiClock,
                          },
                          {
                            label: "Platform Model",
                            value: "Commission-Free",
                            icon: FiStar,
                            highlight: true,
                          },
                          {
                            label: "Transaction Fees",
                            value: "None (Gas Only)",
                            icon: FiZap,
                            highlight: true,
                          },
                        ].map((item, index) => {
                          const ItemIcon = item.icon;
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300"
                            >
                              <div className="flex items-center space-x-3">
                                <ItemIcon
                                  className={`w-4 h-4 ${item.highlight
                                      ? "text-green-500"
                                      : "text-blue-500"
                                    }`}
                                />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  {item.label}
                                </span>
                              </div>
                              <span
                                className={`text-sm font-bold ${item.highlight
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

                  {/* Enhanced Platform Health */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                    <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl hover:shadow-2xl transition-all duration-500">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <FiActivity className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Platform Health
                        </h3>
                      </div>

                      <div className="space-y-4">
                        {[
                          {
                            label: "System Status",
                            value: "Operational",
                            icon: FiCpu,
                          },
                          {
                            label: "Smart Contract",
                            value: "Active",
                            icon: FiDatabase,
                          },
                          {
                            label: "IPFS Gateway",
                            value: "Connected",
                            icon: FiHardDrive,
                          },
                          {
                            label: "Fee Structure",
                            value: "Fee-Free",
                            icon: FiStar,
                          },
                        ].map((item, index) => {
                          const ItemIcon = item.icon;
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300"
                            >
                              <div className="flex items-center space-x-3">
                                <ItemIcon className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  {item.label}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                  {item.value}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Contract Information */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                  <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl hover:shadow-2xl transition-all duration-500">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <FiDatabase className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Contract Information
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        {
                          label: "Contract Address",
                          value: CONTRACT_ADDRESS,
                          icon: FiDatabase,
                          mono: true,
                        },
                        {
                          label: "Network",
                          value:
                            process.env.NEXT_PUBLIC_CHAIN_NAME || "Ethereum",
                          icon: FiGlobe,
                        },
                        {
                          label: "Chain ID",
                          value: process.env.NEXT_PUBLIC_CHAIN_ID || "1",
                          icon: FiWifi,
                        },
                        {
                          label: "Platform Type",
                          value: "Fee-Free Supply Chain",
                          icon: FiStar,
                          highlight: true,
                        },
                        {
                          label: "User Cost",
                          value: "Declared Value Only",
                          icon: FiZap,
                          highlight: true,
                        },
                        {
                          label: "Admin Address",
                          value: `${address?.slice(0, 6)}...${address?.slice(
                            -4
                          )}`,
                          icon: FiShield,
                          mono: true,
                        },
                      ].map((item, index) => {
                        const ItemIcon = item.icon;
                        return (
                          <div
                            key={index}
                            className="p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300"
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <ItemIcon
                                className={`w-5 h-5 ${item.highlight
                                    ? "text-green-500"
                                    : "text-indigo-500"
                                  }`}
                              />
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {item.label}
                              </span>
                            </div>
                            <p
                              className={`text-sm font-bold break-all ${item.highlight
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-gray-900 dark:text-white"
                                } ${item.mono ? "font-mono text-xs" : ""}`}
                            >
                              {item.value}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Enhanced Platform Benefits */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                  <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl hover:shadow-2xl transition-all duration-500">
                    <div className="flex items-center space-x-4 mb-8">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <FiStar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Platform Benefits (Fee-Free Model)
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Transparent and cost-effective solution
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                          <FiUsers className="w-5 h-5 text-emerald-500" />
                          <span>For Users:</span>
                        </h4>
                        <div className="space-y-3">
                          {[
                            "No platform fees - pay only declared value",
                            "No completion or cancellation fees",
                            "Direct peer-to-peer payments",
                            "Full refunds on cancellation",
                          ].map((benefit, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-3 p-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 hover:bg-emerald-100/70 dark:hover:bg-emerald-800/30 transition-all duration-300"
                            >
                              <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                                {benefit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                          <FiZap className="w-5 h-5 text-teal-500" />
                          <span>Platform Features:</span>
                        </h4>
                        <div className="space-y-3">
                          {[
                            "Transparent tracking system",
                            "KYC verification for security",
                            "IPFS-based document storage",
                            "Decentralized and trustless",
                          ].map((feature, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-3 p-3 bg-teal-50/50 dark:bg-teal-900/20 rounded-xl border border-teal-200/50 dark:border-teal-800/50 hover:bg-teal-100/70 dark:hover:bg-teal-800/30 transition-all duration-300"
                            >
                              <FiCheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-teal-800 dark:text-teal-300">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* KYC Management Tab */}
            {activeTab === "kyc" && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative">
                  <PendingKYC
                    pendingUsers={pendingKYCUsers || []}
                    onApprove={handleApproveKYC}
                    onReject={handleRejectKYC}
                    approveLoading={approveLoading}
                    rejectLoading={rejectLoading}
                  />
                </div>
              </div>
            )}

            {/* Shipments Tab */}
            {activeTab === "shipments" && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5 dark:from-purple-500/10 dark:to-violet-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative">
                  <ActiveShipments activeShipments={activeShipments || []} />
                </div>
              </div>
            )}

            {/* User Management Tab */}
            {activeTab === "users" && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 dark:from-orange-500/10 dark:to-red-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative">
                  <UserManagement />
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Reject KYC Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="relative max-w-md w-full">
                {/* Modal glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-3xl blur opacity-75"></div>

                <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FiXCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Reject KYC Application
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    Please provide a detailed reason for rejecting this KYC
                    application. This will help the user understand what needs
                    to be corrected.
                  </p>

                  <div className="group/textarea mb-6">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Rejection Reason *
                    </label>
                    <div className="relative">
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter detailed rejection reason..."
                        rows={4}
                        className="w-full px-4 py-4 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-white/20 dark:border-gray-600/30 rounded-2xl focus:ring-2 focus:ring-red-500/50 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-300 resize-none"
                      />
                      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500 transform scale-x-0 group-focus-within/textarea:scale-x-100 transition-transform duration-300 origin-left rounded-full"></div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setShowRejectModal(false);
                        setRejectionReason("");
                        setSelectedUser(null);
                      }}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:from-gray-300 hover:to-gray-400 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 transform hover:scale-105"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmRejectKYC}
                      disabled={rejectLoading || !rejectionReason.trim()}
                      className="group/reject flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-orange-600 text-white font-bold rounded-2xl hover:from-red-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:transform-none overflow-hidden"
                    >
                      {rejectLoading && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
                      )}
                      {rejectLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Rejecting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <FiXCircle className="w-4 h-4 group-hover/reject:scale-110 transition-transform duration-300" />
                          <span>Reject KYC</span>
                        </div>
                      )}
                    </button>
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

export default AdminPanel;
