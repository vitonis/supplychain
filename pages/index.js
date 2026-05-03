import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useSupplyChainContract } from "../hooks/useContract";
import Layout from "../components/Layout/Layout";
import StatsCard from "../components/Dashboard/StatsCard";
import RecentShipments from "../components/Dashboard/RecentShipments";
import ActivityChart from "../components/Dashboard/ActivityChart";
import QuickActions from "../components/Dashboard/QuickActions";
import {
  FiPackage,
  FiTruck,
  FiDollarSign,
  FiUsers,
  FiArrowUp,
  FiArrowDown,
  FiActivity,
  FiShield,
  FiGlobe,
} from "react-icons/fi";

const Dashboard = () => {
  const { address, isConnected } = useAccount();
  const { useContractRead, formatEther } = useSupplyChainContract();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalShipments: 0,
    activeShipments: 0,
    completedShipments: 0,
    totalValue: 0,
    platformBalance: 0,
    insurancePool: 0,
  });

  // Read contract data
  const { data: senderShipments } = useContractRead("getUserShipments", [
    address,
    "sender",
  ]);
  const { data: receiverShipments } = useContractRead("getUserShipments", [
    address,
    "receiver",
  ]);
  const { data: carrierShipments } = useContractRead("getUserShipments", [
    address,
    "carrier",
  ]);
  const { data: activeShipments } = useContractRead("getActiveShipments");
  const { data: platformBalance } = useContractRead("platformBalance");
  const { data: insurancePool } = useContractRead("insurancePool");
  const { data: userKYC } = useContractRead("getUserKYC", [address]);
  const { data: isUserVerified } = useContractRead("isUserVerified", [address]);

  useEffect(() => {
    if (isConnected && address) {
      calculateStats();
    }
  }, [
    senderShipments,
    receiverShipments,
    carrierShipments,
    activeShipments,
    platformBalance,
    insurancePool,
  ]);

  const calculateStats = async () => {
    try {
      setLoading(true);

      const allUserShipments = [
        ...(senderShipments || []),
        ...(receiverShipments || []),
        ...(carrierShipments || []),
      ];

      const uniqueShipments = [...new Set(allUserShipments)];

      let totalValue = 0;
      let completedCount = 0;

      // Get detailed shipment data
      for (const shipmentId of uniqueShipments.slice(0, 10)) {
        // Limit for performance
        try {
          const shipment = await useContractRead("getShipment", [shipmentId]);
          if (shipment?.data) {
            totalValue += parseFloat(formatEther(shipment.data.price || 0));
            if (shipment.data.status === 2) {
              // DELIVERED
              completedCount++;
            }
          }
        } catch (error) {
          console.error(`Error fetching shipment ${shipmentId}:`, error);
        }
      }

      setStats({
        totalShipments: uniqueShipments.length,
        activeShipments: (activeShipments || []).length,
        completedShipments: completedCount,
        totalValue,
        platformBalance: parseFloat(formatEther(platformBalance || 0)),
        insurancePool: parseFloat(formatEther(insurancePool || 0)),
      });
    } catch (error) {
      console.error("Error calculating stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      title: "Total Shipments",
      value: stats.totalShipments,
      icon: FiPackage,
      color: "blue",
      change: "+12%",
      changeType: "increase",
    },
    {
      title: "Active Shipments",
      value: stats.activeShipments,
      icon: FiTruck,
      color: "green",
      change: "+5%",
      changeType: "increase",
    },
    {
      title: "Total Value",
      value: `${stats.totalValue.toFixed(4)} ETH`,
      icon: FiDollarSign,
      color: "purple",
      change: "+18%",
      changeType: "increase",
    },
    {
      title: "Completed",
      value: stats.completedShipments,
      icon: FiActivity,
      color: "orange",
      change: "+8%",
      changeType: "increase",
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
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/5 dark:bg-indigo-400/15 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>

          <div className="relative z-10 text-center max-w-md mx-auto px-6">
            {/* Enhanced empty state */}
            <div className="relative mb-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <FiUsers className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-4 border-white dark:border-gray-900 animate-ping"></div>
            </div>

            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-4">
              Connect Your Wallet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8">
              Please connect your wallet to access your personalized blockchain
              supply chain dashboard
            </p>

            {/* Call to action area */}
            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-indigo-500/20 rounded-2xl p-6 border border-white/20 dark:border-gray-700/30">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                🔗 Secure • 🛡️ Decentralized • ⚡ Fast
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative">
        {/* Subtle background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 right-10 w-80 h-80 bg-blue-500/5 dark:bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 left-10 w-80 h-80 bg-purple-500/5 dark:bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 space-y-8">
          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                Supply Chain DApp
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                Welcome back! Here's what's happening with your shipments.
              </p>
              {/* Breadcrumb-style indicator */}
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <FiGlobe className="w-4 h-4" />
                <span>Live Data</span>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Real-time Updates</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Enhanced KYC Status */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {isUserVerified ? (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-300 rounded-2xl border border-green-200/50 dark:border-green-700/50 shadow-lg shadow-green-500/10">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <FiShield className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold">KYC Verified</span>
                      <div className="text-xs opacity-80">
                        Identity Confirmed
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-800 dark:text-yellow-300 rounded-2xl border border-yellow-200/50 dark:border-yellow-700/50 shadow-lg shadow-yellow-500/10">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping"></div>
                      <FiShield className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold">KYC Pending</span>
                      <div className="text-xs opacity-80">
                        Verification Required
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsData.map((stat, index) => (
              <div
                key={index}
                className="transform hover:scale-105 transition-all duration-300"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <StatsCard {...stat} loading={loading} />
              </div>
            ))}
          </div>

          {/* Enhanced Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Shipments */}
            <div className="lg:col-span-2">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <RecentShipments
                    senderShipments={senderShipments || []}
                    receiverShipments={receiverShipments || []}
                    carrierShipments={carrierShipments || []}
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <QuickActions isVerified={isUserVerified} />
              </div>
            </div>
          </div>

          {/* Enhanced Activity Chart & Platform Stats */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/20 dark:to-blue-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <ActivityChart />
                </div>
              </div>
            </div>

            {/* Enhanced Platform Stats */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl shadow-blue-500/5 dark:shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/15 transition-all duration-500">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                    Platform Stats
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Live
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-800/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <FiDollarSign className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Platform Balance
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {stats.platformBalance.toFixed(4)} ETH
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                        <FiShield className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Insurance Pool
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {stats.insurancePool.toFixed(4)} ETH
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-100/50 dark:border-purple-800/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <FiActivity className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Total Active
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {stats.activeShipments}
                    </span>
                  </div>

                  {/* Network Status */}
                  <div className="pt-6 border-t border-white/20 dark:border-gray-700/30">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-100/50 dark:border-green-800/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                          <FiGlobe className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Network
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {process.env.NEXT_PUBLIC_CHAIN_NAME}
                        </span>
                      </div>
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

export default Dashboard;
