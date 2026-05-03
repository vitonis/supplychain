import { useState, useEffect } from "react";
import { useContractReads } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../utils/contractABI";
import {
  addKYCUser,
  updateKYCUser,
  verifyKYCUser,
  rejectKYCUser,
  KYC_STATUS,
  NOTIFICATION_TEMPLATES as KYC_TEMPLATES,
  getKYCUserByAddress,
} from "../../utils/kycStorage";

import {
  addNotification,
  NOTIFICATION_TEMPLATES,
} from "../../utils/notificationStorage";

import {
  FiUser,
  FiMail,
  FiPhone,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiClock,
  FiHome,
  FiImage,
  FiExternalLink,
  FiRefreshCw,
  FiUsers,
  FiShield,
  FiAlertCircle,
  FiSearch,
  FiFilter,
  FiDatabase,
  FiStar,
  FiActivity,
  FiZap,
} from "react-icons/fi";

const PendingKYC = ({
  pendingUsers = [],
  onApprove,
  onReject,
  approveLoading = false,
  rejectLoading = false,
  onRefresh,
}) => {
  const [userDetails, setUserDetails] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [error, setError] = useState(null);

  const contractsToRead = (pendingUsers && Array.isArray(pendingUsers) ? pendingUsers : [])
    .map((userAddress) => ({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getUserKYC",
      args: [userAddress],
    }));

  const { data: kycDataResults, isLoading: anyLoading, error: anyError, refetch: refetchAll } = useContractReads({
    contracts: contractsToRead,
    enabled: contractsToRead.length > 0,
  });

  const userDataHooks = contractsToRead.map((contract, index) => {
    return {
      address: contract.args[0],
      kycData: kycDataResults?.[index]?.result || kycDataResults?.[index],
      isLoading: anyLoading,
      error: kycDataResults?.[index]?.error || anyError,
      refetch: refetchAll,
    };
  });

  useEffect(() => {
    if (
      pendingUsers &&
      Array.isArray(pendingUsers) &&
      pendingUsers.length > 0 &&
      kycDataResults
    ) {
      processUserData();
    } else if (!pendingUsers || pendingUsers.length === 0) {
      setLoadingDetails(false);
      setUserDetails({});
    }
  }, [pendingUsers, kycDataResults]);

  useEffect(() => {
    if (anyError) {
      setError("Failed to fetch KYC data from blockchain");
    } else {
      setError(null);
    }
  }, [anyError]);

  useEffect(() => {
    const handleStorageChange = () => {
      refreshUserData();
    };

    // Listen for custom storage events
    window.addEventListener("kycDataChanged", handleStorageChange);

    return () => {
      window.removeEventListener("kycDataChanged", handleStorageChange);
    };
  }, []);

  const processUserData = () => {
    if (!userDataHooks || userDataHooks.length === 0) {
      setUserDetails({});
      setLoadingDetails(false);
      return;
    }

    const details = {};
    let allLoaded = true;

    userDataHooks.forEach(({ address, kycData, isLoading, error }) => {
      if (!address) return; // Skip if no address

      if (isLoading) {
        allLoaded = false;
        details[address] = {
          fullName: "Loading...",
          email: "Loading...",
          phoneNumber: "Loading...",
          nationalId: "Loading...",
          homeAddress: "Loading...",
          submittedAt: Date.now() / 1000,
          status: 0,
          loading: true,
        };
      } else if (error) {
        details[address] = {
          fullName: "Error loading data",
          email: "Error loading data",
          phoneNumber: "Error loading data",
          nationalId: "Error loading data",
          homeAddress: "Error loading data",
          submittedAt: Date.now() / 1000,
          status: 0,
          error: true,
          loading: false,
        };
      } else if (kycData) {
        // Check localStorage first for updated status
        const existingUser = getKYCUserByAddress(address);

        const userData = {
          address: address,
          fullName: kycData.fullName || "Unknown",
          email: kycData.email || "No email",
          phoneNumber: kycData.phoneNumber || "No phone",
          nationalId: kycData.nationalId || "No ID",
          homeAddress: kycData.homeAddress || "No address",
          submittedAt: kycData.submittedAt || Date.now() / 1000,
          verifiedAt: existingUser?.verifiedAt || kycData.verifiedAt || 0,
          // IMPORTANT: Prioritize localStorage status over blockchain status
          status: existingUser
            ? existingUser.status
            : parseInt(kycData.status) || 0,
          rejectionReason: existingUser
            ? existingUser.rejectionReason
            : kycData.rejectionReason || "",
          suspensionReason: existingUser ? existingUser.suspensionReason : "",
          idDocumentHash: kycData.idDocumentHash || "",
          addressProofHash: kycData.addressProofHash || "",
          profileImageHash: kycData.profileImageHash || "",
          loading: false,
        };

        // Save/update user in localStorage
        try {
          if (existingUser) {
            // Update existing user with merged data
            updateKYCUser(address, userData);
          } else {
            // Add new user
            addKYCUser(userData);
          }
        } catch (error) {
          console.log(
            "User might already exist in localStorage:",
            error.message
          );
        }

        details[address] = userData;
      }
    });

    setUserDetails(details);
    setLoadingDetails(!allLoaded);
  };

  const refreshUserData = () => {
    // Trigger a re-process of user data to reflect localStorage changes
    processUserData();
  };

  const filteredUsers = (
    pendingUsers && Array.isArray(pendingUsers) ? pendingUsers : []
  ).filter((userAddress) => {
    const user = userDetails[userAddress];
    if (!user) return true;

    const matchesSearch =
      !searchQuery ||
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.nationalId?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || user.status?.toString() === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleRefresh = async () => {
    setError(null);
    setLoadingDetails(true);

    try {
      // Refetch all user data
      if (userDataHooks && userDataHooks.length > 0) {
        await Promise.all(userDataHooks.map((hook) => hook.refetch()));
      }

      // Also trigger parent refresh if available
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setError("Failed to refresh KYC data");
      console.error("Refresh error:", err);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === "0") return "Unknown";
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp || timestamp === "0") return "Unknown";
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const formatAddress = (address) => {
    if (!address) return "Invalid address";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const viewUserDetails = (userAddress) => {
    setSelectedUser(userAddress);
    setShowDetailsModal(true);
  };

  const viewDocument = (documentHash, documentType) => {
    if (!documentHash) {
      alert(`No ${documentType} document available`);
      return;
    }

    // Assuming IPFS hash format
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${documentHash}`;
    window.open(ipfsUrl, "_blank");
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
        label: "Approved",
        color: "green",
        icon: FiCheckCircle,
        gradient: "from-green-400 to-emerald-500",
        bgGradient:
          "from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30",
        textColor: "text-green-700 dark:text-green-300",
        borderColor: "border-green-200/50 dark:border-green-700/50",
      },
      2: {
        label: "Rejected",
        color: "red",
        icon: FiXCircle,
        gradient: "from-red-400 to-rose-500",
        bgGradient:
          "from-red-50/70 to-rose-50/70 dark:from-red-900/30 dark:to-rose-900/30",
        textColor: "text-red-700 dark:text-red-300",
        borderColor: "border-red-200/50 dark:border-red-700/50",
      },
      3: {
        label: "Suspended",
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

  const getDocumentCompletionStatus = (user) => {
    if (!user) return { complete: false, count: 0 };

    const hasId = !!user.idDocumentHash;
    const hasAddress = !!user.addressProofHash;
    const hasProfile = !!user.profileImageHash;

    const count = [hasId, hasAddress, hasProfile].filter(Boolean).length;
    const complete = hasId && hasAddress; // Profile is optional

    return { complete, count, total: 3 };
  };

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
              Error Loading KYC Data
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-8 leading-relaxed">
              {error}
            </p>
            <button
              onClick={handleRefresh}
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

  if (loadingDetails) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

        <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl w-40 animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-56 animate-pulse"></div>
            </div>
          </div>

          <div className="space-y-6">
            {[
              ...Array(
                Math.min(
                  3,
                  pendingUsers && pendingUsers.length ? pendingUsers.length : 0
                )
              ),
            ].map((_, i) => (
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
                  <div className="flex space-x-2">
                    <div className="h-10 w-28 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-xl"></div>
                    <div className="h-10 w-24 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-xl"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (
    !pendingUsers ||
    !Array.isArray(pendingUsers) ||
    pendingUsers.length === 0
  ) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 dark:from-green-500/10 dark:to-blue-500/10 rounded-3xl blur opacity-50"></div>

        <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-12 shadow-xl text-center">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/25 mb-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <FiCheckCircle className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            All Caught Up!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
            No pending KYC applications to review at the moment. All
            applications have been processed.
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
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FiUsers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Pending KYC Applications
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Identity verification queue
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="group relative inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
            <FiRefreshCw className="relative z-10 w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span className="relative z-10">Refresh</span>
          </button>

          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-yellow-100/70 to-amber-100/70 dark:from-yellow-900/30 dark:to-amber-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200/50 dark:border-yellow-800/50 shadow-lg">
            <FiClock className="w-4 h-4" />
            <span>{filteredUsers.length} Pending</span>
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
              placeholder="Search by name, email, address, or ID..."
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
              <option value="0">Pending Review</option>
              <option value="1">Approved</option>
              <option value="2">Rejected</option>
              <option value="3">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced KYC Applications List */}
      <div className="space-y-6">
        {filteredUsers.map((userAddress, index) => {
          const user = userDetails[userAddress];
          const hasError = user?.error;
          const isLoading = user?.loading;
          const docStatus = getDocumentCompletionStatus(user);

          return (
            <div
              key={userAddress}
              className="group relative"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-blue-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-blue-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-[1.02]">
                {/* Subtle inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex items-start space-x-6 flex-1">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <FiUser className="w-8 h-8 text-white" />
                      </div>
                      <div
                        className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                          hasError
                            ? "bg-red-500"
                            : isLoading
                            ? "bg-yellow-500 animate-pulse"
                            : "bg-green-500 animate-pulse"
                        }`}
                      ></div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                          {isLoading ? (
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl w-48 animate-pulse"></div>
                          ) : (
                            user?.fullName || "Unknown User"
                          )}
                        </h4>
                        {!isLoading && getStatusBadge(user?.status || 0)}
                      </div>

                      {user?.homeAddress && !isLoading && (
                        <div className="p-4 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Address:{" "}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {user.homeAddress}
                          </span>
                        </div>
                      )}

                      {hasError && (
                        <div className="p-4 bg-gradient-to-r from-red-50/50 to-orange-50/50 dark:from-red-900/30 dark:to-orange-900/30 rounded-xl border border-red-200/50 dark:border-red-800/50">
                          <div className="flex items-center space-x-2">
                            <FiAlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                              Error loading user data. Please refresh or check
                              the contract connection.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => viewUserDetails(userAddress)}
                      disabled={isLoading}
                      className="group/btn relative inline-flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-medium rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 overflow-hidden disabled:opacity-50"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                      <FiEye className="relative z-10 w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300" />
                      <span className="relative z-10">View</span>
                    </button>

                    <button
                      onClick={() => {
                        // Prompt for rejection reason
                        const reason = prompt("Enter rejection reason:");
                        if (reason && reason.trim()) {
                          try {
                            rejectKYCUser(userAddress, reason.trim());
                            // Add notification
                            addNotification({
                              title: "KYC Application Rejected",
                              message: `User ${
                                userDetails[userAddress]?.fullName || "Unknown"
                              } application has been rejected`,
                              type: "warning",
                            });
                          } catch (error) {
                            console.error(
                              "Error updating localStorage:",
                              error
                            );
                          }
                        }

                        onReject(userAddress);
                      }}
                      disabled={rejectLoading || hasError || isLoading}
                      className="group/btn relative inline-flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                      <FiXCircle className="relative z-10 w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300" />
                      <span className="relative z-10">
                        {rejectLoading ? "Rejecting..." : "Reject"}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        try {
                          // Update user status to VERIFIED in localStorage
                          verifyKYCUser(userAddress);

                          // Add notification
                          addNotification({
                            title: "KYC Approved",
                            message: `User ${
                              user?.fullName || "Unknown"
                            } has been verified successfully`,
                            type: "success",
                          });

                          // Force refresh the user data to show changes immediately
                          setTimeout(() => {
                            processUserData();
                          }, 100);
                        } catch (error) {
                          console.error("Error updating localStorage:", error);
                        }

                        // Call the original approve function
                        onApprove(userAddress);
                      }}
                      disabled={approveLoading || hasError || isLoading}
                      className="group/btn relative inline-flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                      <FiCheckCircle className="relative z-10 w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300" />
                      <span className="relative z-10">
                        {approveLoading ? "Approving..." : "Approve"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Document Status Overview */}
                {user && !isLoading && (
                  <div className="relative z-10 mt-6 pt-6 border-t border-white/20 dark:border-gray-700/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        {
                          name: "ID Document",
                          hash: user.idDocumentHash,
                          icon: FiFileText,
                          color: "from-blue-500 to-cyan-600",
                          required: true,
                        },
                        {
                          name: "Address Proof",
                          hash: user.addressProofHash,
                          icon: FiHome,
                          color: "from-green-500 to-emerald-600",
                          required: true,
                        },
                        {
                          name: "Profile Image",
                          hash: user.profileImageHash,
                          icon: FiImage,
                          color: "from-purple-500 to-violet-600",
                          required: false,
                        },
                      ].map((doc, idx) => {
                        const DocIcon = doc.icon;
                        const hasDoc = !!doc.hash;
                        return (
                          <div
                            key={idx}
                            className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300"
                          >
                            <div className="flex items-center space-x-3 mb-2">
                              <div
                                className={`w-8 h-8 bg-gradient-to-r ${doc.color} rounded-lg flex items-center justify-center shadow-lg`}
                              >
                                <DocIcon className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  {doc.name}
                                </span>
                                {!doc.required && (
                                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                    (Optional)
                                  </span>
                                )}
                              </div>
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  hasDoc
                                    ? "bg-green-500"
                                    : doc.required
                                    ? "bg-red-500"
                                    : "bg-gray-400"
                                }`}
                              ></div>
                            </div>
                            <div className="ml-11">
                              {hasDoc ? (
                                <button
                                  onClick={() =>
                                    viewDocument(doc.hash, doc.name)
                                  }
                                  className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors duration-300"
                                >
                                  <FiExternalLink className="w-3 h-3" />
                                  <span>View Document</span>
                                </button>
                              ) : (
                                <span
                                  className={`text-xs font-medium ${
                                    doc.required
                                      ? "text-red-600 dark:text-red-400"
                                      : "text-gray-500 dark:text-gray-400"
                                  }`}
                                >
                                  {doc.required
                                    ? "Required - Not uploaded"
                                    : "Not provided"}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Timestamps and additional info */}
                    <div className="flex flex-wrap items-center justify-between mt-4 text-xs font-medium text-gray-600 dark:text-gray-400 space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <FiClock className="w-3 h-3" />
                          <span>
                            Submitted: {formatDateTime(user.submittedAt)}
                          </span>
                        </div>
                        {user.verifiedAt && user.verifiedAt !== "0" && (
                          <div className="flex items-center space-x-1">
                            <FiCheckCircle className="w-3 h-3" />
                            <span>
                              Verified: {formatDateTime(user.verifiedAt)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiActivity className="w-3 h-3" />
                        <span>
                          Completion: {docStatus.count}/{docStatus.total} docs
                        </span>
                      </div>
                    </div>

                    {/* Special notices */}
                    {user.rejectionReason && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-red-50/70 to-orange-50/70 dark:from-red-900/30 dark:to-orange-900/30 rounded-xl border border-red-200/50 dark:border-red-800/50">
                        <div className="flex items-start space-x-2">
                          <FiAlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                          <div>
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                              Rejection Reason:
                            </span>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                              {user.rejectionReason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-600 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced No results message */}
      {filteredUsers.length === 0 &&
        pendingUsers.length > 0 &&
        (searchQuery || filterStatus !== "all") && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-blue-500/5 dark:from-gray-500/10 dark:to-blue-500/10 rounded-3xl blur opacity-50"></div>

            <div className="relative text-center py-12 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 shadow-xl">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-6">
                <FiFilter className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                No matching applications
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
      {pendingUsers && pendingUsers.length > 10 && (
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
                  Showing first 10 of{" "}
                  <span className="font-bold">{pendingUsers.length}</span>{" "}
                  pending applications for optimal performance.
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

      {/* Enhanced User Details Modal */}
      {showDetailsModal &&
        selectedUser &&
        userDetails[selectedUser] &&
        !userDetails[selectedUser].loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative group max-w-6xl w-full max-h-[95vh] overflow-hidden">
              {/* Modal glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur opacity-75"></div>

              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 shadow-2xl overflow-y-auto max-h-[95vh]">
                {/* Modal Header */}
                <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/30 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <FiUser className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          KYC Application Details
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {userDetails[selectedUser]?.fullName ||
                            "Unknown User"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="group p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300"
                    >
                      <FiXCircle className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-8 space-y-8">
                  {/* Personal Information Section */}
                  <div className="relative group/section">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-2xl blur opacity-0 group-hover/section:opacity-100 transition-opacity duration-300"></div>

                    <div className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 shadow-lg">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                          <FiUser className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                          Personal Information
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          {
                            label: "Full Name",
                            value: userDetails[selectedUser]?.fullName,
                            icon: FiUser,
                          },
                          {
                            label: "Email Address",
                            value: userDetails[selectedUser]?.email,
                            icon: FiMail,
                          },
                          {
                            label: "Phone Number",
                            value: userDetails[selectedUser]?.phoneNumber,
                            icon: FiPhone,
                          },
                          {
                            label: "National ID",
                            value: userDetails[selectedUser]?.nationalId,
                            icon: FiShield,
                          },
                        ].map((field, idx) => {
                          const FieldIcon = field.icon;
                          return (
                            <div key={idx} className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <FieldIcon className="w-4 h-4 text-blue-500" />
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  {field.label}
                                </label>
                              </div>
                              <p className="text-gray-900 dark:text-white font-medium bg-white/50 dark:bg-gray-900/50 rounded-lg px-3 py-2 border border-gray-200/50 dark:border-gray-700/50">
                                {field.value || "Not provided"}
                              </p>
                            </div>
                          );
                        })}

                        <div className="md:col-span-2 space-y-2">
                          <div className="flex items-center space-x-2">
                            <FiHome className="w-4 h-4 text-blue-500" />
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Home Address
                            </label>
                          </div>
                          <p className="text-gray-900 dark:text-white font-medium bg-white/50 dark:bg-gray-900/50 rounded-lg px-3 py-2 border border-gray-200/50 dark:border-gray-700/50">
                            {userDetails[selectedUser]?.homeAddress ||
                              "Not provided"}
                          </p>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <div className="flex items-center space-x-2">
                            <FiDatabase className="w-4 h-4 text-blue-500" />
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Wallet Address
                            </label>
                          </div>
                          <p className="text-gray-900 dark:text-white font-mono text-sm bg-white/50 dark:bg-gray-900/50 rounded-lg px-3 py-2 border border-gray-200/50 dark:border-gray-700/50 break-all">
                            {selectedUser}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Application Status Section */}
                  <div className="relative group/section">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10 rounded-2xl blur opacity-0 group-hover/section:opacity-100 transition-opacity duration-300"></div>

                    <div className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 shadow-lg">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                          <FiActivity className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                          Application Status
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Current Status
                          </label>
                          <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg px-3 py-2 border border-gray-200/50 dark:border-gray-700/50">
                            {getStatusBadge(userDetails[selectedUser]?.status)}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Submitted At
                          </label>
                          <p className="text-gray-900 dark:text-white font-medium bg-white/50 dark:bg-gray-900/50 rounded-lg px-3 py-2 border border-gray-200/50 dark:border-gray-700/50">
                            {formatDateTime(
                              userDetails[selectedUser]?.submittedAt
                            )}
                          </p>
                        </div>

                        {userDetails[selectedUser]?.verifiedAt &&
                          userDetails[selectedUser]?.verifiedAt !== "0" && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Verified At
                              </label>
                              <p className="text-gray-900 dark:text-white font-medium bg-white/50 dark:bg-gray-900/50 rounded-lg px-3 py-2 border border-gray-200/50 dark:border-gray-700/50">
                                {formatDateTime(
                                  userDetails[selectedUser]?.verifiedAt
                                )}
                              </p>
                            </div>
                          )}

                        {userDetails[selectedUser]?.rejectionReason && (
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Rejection Reason
                            </label>
                            <div className="bg-red-50/70 dark:bg-red-900/30 rounded-lg px-3 py-2 border border-red-200/50 dark:border-red-800/50">
                              <p className="text-red-600 dark:text-red-400 font-medium">
                                {userDetails[selectedUser]?.rejectionReason}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div className="relative group/section">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 dark:from-purple-500/10 dark:to-indigo-500/10 rounded-2xl blur opacity-0 group-hover/section:opacity-100 transition-opacity duration-300"></div>

                    <div className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 shadow-lg">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                          <FiFileText className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                          Submitted Documents
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          {
                            name: "ID Document",
                            hash: userDetails[selectedUser]?.idDocumentHash,
                            icon: FiFileText,
                            color: "from-blue-500 to-cyan-600",
                            description: "Government issued identification",
                            required: true,
                          },
                          {
                            name: "Address Proof",
                            hash: userDetails[selectedUser]?.addressProofHash,
                            icon: FiHome,
                            color: "from-green-500 to-emerald-600",
                            description: "Address verification document",
                            required: true,
                          },
                          {
                            name: "Profile Image",
                            hash: userDetails[selectedUser]?.profileImageHash,
                            icon: FiImage,
                            color: "from-purple-500 to-violet-600",
                            description: "Profile photograph",
                            required: false,
                          },
                        ].map((doc, idx) => {
                          const DocIcon = doc.icon;
                          const hasDoc = !!doc.hash;
                          return (
                            <div
                              key={idx}
                              className="relative group/doc bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 p-6 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-blue-500/5 dark:from-gray-500/10 dark:to-blue-500/10 rounded-xl blur opacity-0 group-hover/doc:opacity-100 transition-opacity duration-300"></div>

                              <div className="relative z-10">
                                <div className="flex items-center space-x-3 mb-4">
                                  <div
                                    className={`w-12 h-12 bg-gradient-to-r ${doc.color} rounded-xl flex items-center justify-center shadow-lg group-hover/doc:scale-110 transition-transform duration-300`}
                                  >
                                    <DocIcon className="w-6 h-6 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="text-sm font-bold text-gray-900 dark:text-white">
                                      {doc.name}
                                    </h5>
                                    {!doc.required && (
                                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100/70 dark:bg-gray-800/70 text-gray-600 dark:text-gray-400 mt-1">
                                        <FiStar className="w-3 h-3" />
                                        <span>Optional</span>
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    className={`w-4 h-4 rounded-full ${
                                      hasDoc
                                        ? "bg-green-500 shadow-lg shadow-green-500/50"
                                        : doc.required
                                        ? "bg-red-500 shadow-lg shadow-red-500/50"
                                        : "bg-gray-400"
                                    } ${hasDoc ? "animate-pulse" : ""}`}
                                  ></div>
                                </div>

                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                                  {doc.description}
                                </p>

                                {hasDoc ? (
                                  <button
                                    onClick={() =>
                                      viewDocument(doc.hash, doc.name)
                                    }
                                    className="group/view w-full inline-flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                  >
                                    <FiExternalLink className="w-4 h-4 group-hover/view:scale-110 transition-transform duration-300" />
                                    <span>View Document</span>
                                  </button>
                                ) : (
                                  <div
                                    className={`w-full text-center py-2 px-4 rounded-lg border-2 border-dashed ${
                                      doc.required
                                        ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20"
                                        : "border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/20"
                                    }`}
                                  >
                                    <span
                                      className={`text-xs font-medium ${
                                        doc.required
                                          ? "text-red-600 dark:text-red-400"
                                          : "text-gray-500 dark:text-gray-400"
                                      }`}
                                    >
                                      {doc.required
                                        ? "Required - Not uploaded"
                                        : "Not provided"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-white/20 dark:border-gray-700/30 p-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="flex-1 relative group px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-medium rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                      <span className="relative z-10">Close</span>
                    </button>

                    <button
                      onClick={() => {
                        const reason = prompt("Enter rejection reason:");
                        if (reason && reason.trim()) {
                          try {
                            rejectKYCUser(selectedUser, reason.trim());
                            addNotification({
                              title: "KYC Application Rejected",
                              message: `User ${
                                userDetails[selectedUser]?.fullName || "Unknown"
                              } application has been rejected`,
                              type: "warning",
                            });
                          } catch (error) {
                            console.error(
                              "Error updating localStorage:",
                              error
                            );
                          }
                          onReject(selectedUser);
                          setShowDetailsModal(false);
                        }
                      }}
                      disabled={rejectLoading}
                      className="flex-1 relative group px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                      <div className="relative z-10 flex items-center justify-center space-x-2">
                        <FiXCircle className="w-4 h-4" />
                        <span>{rejectLoading ? "Rejecting..." : "Reject"}</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        try {
                          // Update user status to VERIFIED in localStorage
                          verifyKYCUser(selectedUser);

                          // Add notification
                          addNotification({
                            title: "KYC Approved",
                            message: `User ${
                              userDetails[selectedUser]?.fullName || "Unknown"
                            } has been verified successfully`,
                            type: "success",
                          });

                          // Update the userDetails state immediately to reflect changes
                          setUserDetails((prev) => ({
                            ...prev,
                            [selectedUser]: {
                              ...prev[selectedUser],
                              status: 1, // KYC_STATUS.VERIFIED
                              verifiedAt: new Date().toISOString(),
                            },
                          }));
                        } catch (error) {
                          console.error("Error updating localStorage:", error);
                        }

                        // Call the original approve function
                        onApprove(selectedUser);
                        setShowDetailsModal(false);
                      }}
                      disabled={approveLoading}
                      className="flex-1 relative group px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                      <div className="relative z-10 flex items-center justify-center space-x-2">
                        <FiCheckCircle className="w-4 h-4" />
                        <span>
                          {approveLoading ? "Approving..." : "Approve"}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default PendingKYC;
