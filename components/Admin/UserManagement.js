import { useState, useEffect } from "react";
import { useContractRead } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../utils/contractABI";
import { useSupplyChainContract } from "../../hooks/useContract";
import {
  FiUser,
  FiShield,
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertTriangle,
  FiRefreshCw,
  FiEye,
  FiPackage,
  FiMail,
  FiPhone,
  FiDatabase,
  FiUsers,
  FiActivity,
  FiStar,
  FiZap,
  FiMapPin,
  FiHome,
  FiLock,
  FiUnlock,
  FiEdit3,
  FiAward,
  FiTarget,
  FiGlobe,
  FiNavigation,
  FiExternalLink,
  FiCopy,
  FiCalendar,
  FiCreditCard,
  FiSettings,
  FiPlus,
  FiDownload,
  FiUpload,
  FiTrash2,
} from "react-icons/fi";
import toast from "react-hot-toast";

// Import KYC storage utilities
import {
  getKYCUsers,
  addKYCUser,
  updateKYCUser,
  removeKYCUser,
  getKYCUserByAddress,
  searchKYCUsers,
  verifyKYCUser,
  rejectKYCUser,
  suspendKYCUser,
  reactivateKYCUser,
  getKYCStatistics,
  exportKYCData,
  importKYCData,
  clearAllKYCData,
  getKYCStorageInfo,
  addDemoKYCUsers,
  KYC_STATUS,
  KYC_STATUS_LABELS,
} from "../../utils/kycStorage";

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [storageInfo, setStorageInfo] = useState({});

  const { suspendUser } = useSupplyChainContract();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Load users from localStorage
      const storedUsers = getKYCUsers();
      setUsers(storedUsers);

      // Update storage info
      const info = getKYCStorageInfo();
      setStorageInfo(info);

      // If no users exist, offer to load demo data
      if (storedUsers.length === 0) {
        console.log("No users found in localStorage");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  // Search and filter users
  const filteredUsers = searchKYCUsers(searchQuery, filterStatus);

  const getStatusBadge = (status) => {
    const statusConfig = {
      [KYC_STATUS.PENDING]: {
        label: "Pending",
        color: "yellow",
        icon: FiClock,
        gradient: "from-yellow-400 to-amber-500",
        bgGradient:
          "from-yellow-50/70 to-amber-50/70 dark:from-yellow-900/30 dark:to-amber-900/30",
        textColor: "text-yellow-700 dark:text-yellow-300",
        borderColor: "border-yellow-200/50 dark:border-yellow-700/50",
      },
      [KYC_STATUS.VERIFIED]: {
        label: "Verified",
        color: "green",
        icon: FiCheckCircle,
        gradient: "from-green-400 to-emerald-500",
        bgGradient:
          "from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30",
        textColor: "text-green-700 dark:text-green-300",
        borderColor: "border-green-200/50 dark:border-green-700/50",
      },
      [KYC_STATUS.REJECTED]: {
        label: "Rejected",
        color: "red",
        icon: FiXCircle,
        gradient: "from-red-400 to-rose-500",
        bgGradient:
          "from-red-50/70 to-rose-50/70 dark:from-red-900/30 dark:to-rose-900/30",
        textColor: "text-red-700 dark:text-red-300",
        borderColor: "border-red-200/50 dark:border-red-700/50",
      },
      [KYC_STATUS.SUSPENDED]: {
        label: "Suspended",
        color: "red",
        icon: FiAlertTriangle,
        gradient: "from-red-400 to-orange-500",
        bgGradient:
          "from-red-50/70 to-orange-50/70 dark:from-red-900/30 dark:to-orange-900/30",
        textColor: "text-red-700 dark:text-red-300",
        borderColor: "border-red-200/50 dark:border-red-700/50",
      },
    };

    const config = statusConfig[status] || statusConfig[KYC_STATUS.PENDING];
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

  const formatAddress = (address) => {
    if (!address) return "Invalid";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Address copied to clipboard!");
  };

  const handleUserAction = async (action, userAddress) => {
    setShowActionMenu(null);

    try {
      switch (action) {
        case "view":
          const user = getKYCUserByAddress(userAddress);
          setSelectedUser(user);
          setShowUserModal(true);
          break;

        case "verify":
          verifyKYCUser(userAddress);
          toast.success("User verified successfully");
          fetchUsers();
          break;

        case "reject":
          const rejectionReason = prompt("Enter rejection reason:");
          if (rejectionReason && rejectionReason.trim()) {
            rejectKYCUser(userAddress, rejectionReason.trim());
            toast.success("User rejected successfully");
            fetchUsers();
          }
          break;

        case "suspend":
          const suspensionReason = prompt("Enter suspension reason:");
          if (suspensionReason && suspensionReason.trim()) {
            suspendKYCUser(userAddress, suspensionReason.trim());
            toast.success("User suspended successfully");
            fetchUsers();
          }
          break;

        case "reactivate":
          reactivateKYCUser(userAddress);
          toast.success("User reactivated successfully");
          fetchUsers();
          break;

        case "delete":
          if (
            window.confirm(
              "Are you sure you want to delete this user? This action cannot be undone."
            )
          ) {
            removeKYCUser(userAddress);
            toast.success("User deleted successfully");
            fetchUsers();
          }
          break;

        case "viewShipments":
          window.open(`/admin/user-shipments/${userAddress}`, "_blank");
          break;

        default:
          toast.info(`${action} action not implemented yet`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} user: ${error.message}`);
    }
  };

  const handleExportData = () => {
    try {
      const exportData = exportKYCData();
      if (exportData) {
        const blob = new Blob([exportData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `kyc-users-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("KYC data exported successfully");
      }
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const success = importKYCData(e.target.result, true); // Merge with existing data
          if (success) {
            toast.success("KYC data imported successfully");
            fetchUsers();
          } else {
            toast.error("Failed to import data - invalid format");
          }
        } catch (error) {
          toast.error("Failed to import data");
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    event.target.value = "";
  };

  const handleClearAllData = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all KYC data? This action cannot be undone."
      )
    ) {
      clearAllKYCData();
      toast.success("All KYC data cleared");
      fetchUsers();
    }
  };

  const handleAddDemoUsers = () => {
    try {
      addDemoKYCUsers();
      toast.success("Demo users added successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to add demo users");
    }
  };

  const stats = getKYCStatistics();

  // Enhanced Loading State
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-50"></div>

          <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl animate-pulse"></div>
                <div>
                  <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl w-48 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-32 animate-pulse"></div>
                </div>
              </div>
              <div className="h-10 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl animate-pulse"></div>
            </div>

            {/* Users List Skeleton */}
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="p-6 bg-gradient-to-r from-gray-100/50 to-gray-200/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                >
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-2xl"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-xl w-3/4"></div>
                      <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-lg w-1/2"></div>
                      <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-lg w-2/3"></div>
                    </div>
                    <div className="h-8 w-24 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-indigo-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FiUsers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  User Management
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage user verification and access
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={fetchUsers}
                className="group relative inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                <FiRefreshCw className="relative z-10 w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                <span className="relative z-10">Refresh</span>
              </button>

              <button
                onClick={handleAddDemoUsers}
                className="group relative inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                <FiPlus className="relative z-10 w-4 h-4" />
                <span className="relative z-10">Add Demo Users</span>
              </button>

              <button
                onClick={handleExportData}
                className="group relative inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                <FiDownload className="relative z-10 w-4 h-4" />
                <span className="relative z-10">Export</span>
              </button>

              <label className="group relative inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                <FiUpload className="relative z-10 w-4 h-4" />
                <span className="relative z-10">Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>

              {users.length > 0 && (
                <button
                  onClick={handleClearAllData}
                  className="group relative inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                  <FiTrash2 className="relative z-10 w-4 h-4" />
                  <span className="relative z-10">Clear All</span>
                </button>
              )}

              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-100/70 to-cyan-100/70 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 shadow-lg">
                <FiUser className="w-4 h-4" />
                <span>{users.length} Total Users</span>
              </div>

              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* Storage Info */}
          {storageInfo.userCount > 0 && (
            <div className="mt-4 p-3 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Storage: {storageInfo.totalSizeKB} KB used</span>
                <span>{storageInfo.storageUsagePercent}% of capacity</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(storageInfo.storageUsagePercent, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
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
              placeholder="Search by name, email, or address..."
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
              <option value={KYC_STATUS.PENDING.toString()}>Pending</option>
              <option value={KYC_STATUS.VERIFIED.toString()}>Verified</option>
              <option value={KYC_STATUS.REJECTED.toString()}>Rejected</option>
              <option value={KYC_STATUS.SUSPENDED.toString()}>Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Verified",
            value: stats.verified,
            icon: FiCheckCircle,
            color: "from-green-500 to-emerald-600",
            bgColor:
              "from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30",
            textColor: "text-green-700 dark:text-green-300",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: FiClock,
            color: "from-yellow-500 to-amber-600",
            bgColor:
              "from-yellow-50/70 to-amber-50/70 dark:from-yellow-900/30 dark:to-amber-900/30",
            textColor: "text-yellow-700 dark:text-yellow-300",
          },
          {
            label: "Rejected",
            value: stats.rejected,
            icon: FiXCircle,
            color: "from-red-500 to-rose-600",
            bgColor:
              "from-red-50/70 to-rose-50/70 dark:from-red-900/30 dark:to-rose-900/30",
            textColor: "text-red-700 dark:text-red-300",
          },
          {
            label: "Suspended",
            value: stats.suspended,
            icon: FiAlertTriangle,
            color: "from-orange-500 to-red-600",
            bgColor:
              "from-orange-50/70 to-red-50/70 dark:from-orange-900/30 dark:to-red-900/30",
            textColor: "text-orange-700 dark:text-orange-300",
          },
        ].map((stat, index) => {
          const StatIcon = stat.icon;
          return (
            <div
              key={index}
              className="relative group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div
                className={`
                relative p-6 rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105
                bg-gradient-to-r ${stat.bgColor}
              `}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
                <div className="relative z-10 flex items-center space-x-4">
                  <div
                    className={`
                    w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300
                    bg-gradient-to-r ${stat.color}
                  `}
                  >
                    <StatIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {stat.label}
                    </p>
                    <p className={`text-2xl font-bold ${stat.textColor}`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Users List */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-6 p-8">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <div
                  key={user.address}
                  className="group/user relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-indigo-500/10 rounded-2xl blur opacity-0 group-hover/user:opacity-100 transition-opacity duration-500"></div>

                  <div
                    className={`
                    relative p-6 rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-500 group-hover/user:scale-[1.02]
                    ${
                      user.error
                        ? "bg-gradient-to-r from-red-50/70 to-orange-50/70 dark:from-red-900/30 dark:to-orange-900/30 border-red-200/50 dark:border-red-800/50"
                        : "bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-700/70"
                    }
                  `}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl pointer-events-none"></div>

                    <div className="relative z-10 flex items-start justify-between">
                      <div className="flex items-start space-x-6 flex-1">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 transform group-hover/user:scale-110 group-hover/user:rotate-3 transition-all duration-300">
                            <FiUser className="w-8 h-8 text-white" />
                          </div>
                          {user.status === KYC_STATUS.VERIFIED && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                              <FiCheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                              {user.fullName}
                            </h4>
                            {getStatusBadge(user.status)}
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/20 dark:border-gray-700/30">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-sm">
                                <FiMail className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">
                                  Email:
                                </span>
                                <p className="font-bold text-gray-900 dark:text-white truncate">
                                  {user.email}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/20 dark:border-gray-700/30">
                              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                                <FiPackage className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">
                                  Shipments:
                                </span>
                                <p className="font-bold text-gray-900 dark:text-white">
                                  {user.totalShipments || 0}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/20 dark:border-gray-700/30">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
                                <FiCalendar className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">
                                  {user.verifiedAt ? "Verified:" : "Submitted:"}
                                </span>
                                <p className="font-bold text-gray-900 dark:text-white">
                                  {user.verifiedAt
                                    ? new Date(
                                        user.verifiedAt
                                      ).toLocaleDateString()
                                    : user.submittedAt
                                    ? new Date(
                                        user.submittedAt
                                      ).toLocaleDateString()
                                    : "Not submitted"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                              <FiDatabase className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">
                                Wallet Address:
                              </span>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                                  {formatAddress(user.address)}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(user.address)}
                                  className="text-gray-400 hover:text-blue-500 transition-colors duration-300"
                                  title="Copy full address"
                                >
                                  <FiCopy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {(user.rejectionReason || user.suspensionReason) && (
                            <div className="p-4 bg-gradient-to-r from-red-50/50 to-rose-50/50 dark:from-red-900/30 dark:to-rose-900/30 rounded-xl border border-red-200/50 dark:border-red-700/50">
                              <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg flex items-center justify-center shadow-sm">
                                  <FiAlertTriangle className="w-3 h-3 text-white" />
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-red-700 dark:text-red-400 block mb-1">
                                    {user.rejectionReason
                                      ? "Rejection Reason:"
                                      : "Suspension Reason:"}
                                  </span>
                                  <p className="text-sm text-red-600 dark:text-red-400">
                                    {user.rejectionReason ||
                                      user.suspensionReason}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowActionMenu(
                                showActionMenu === user.address
                                  ? null
                                  : user.address
                              )
                            }
                            disabled={user.error}
                            className="group/btn relative inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-blue-500 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                            <FiMoreVertical className="relative z-10 w-5 h-5 group-hover/btn:scale-110 transition-transform duration-300" />
                          </button>

                          {showActionMenu === user.address && !user.error && (
                            <div className="absolute right-0 mt-2 w-48 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 z-20 overflow-hidden">
                              <div className="py-2">
                                <button
                                  onClick={() =>
                                    handleUserAction("view", user.address)
                                  }
                                  className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 transition-all duration-300 group/action"
                                >
                                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-sm mr-3 transform group-hover/action:scale-110 transition-transform duration-300">
                                    <FiEye className="w-3 h-3 text-white" />
                                  </div>
                                  <span className="font-medium">
                                    View Details
                                  </span>
                                </button>

                                {user.status === KYC_STATUS.PENDING && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleUserAction("verify", user.address)
                                      }
                                      className="flex items-center w-full text-left px-4 py-3 text-sm text-green-600 dark:text-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/30 transition-all duration-300 group/action"
                                    >
                                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm mr-3 transform group-hover/action:scale-110 transition-transform duration-300">
                                        <FiCheckCircle className="w-3 h-3 text-white" />
                                      </div>
                                      <span className="font-medium">
                                        Verify User
                                      </span>
                                    </button>

                                    <button
                                      onClick={() =>
                                        handleUserAction("reject", user.address)
                                      }
                                      className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/30 transition-all duration-300 group/action"
                                    >
                                      <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg flex items-center justify-center shadow-sm mr-3 transform group-hover/action:scale-110 transition-transform duration-300">
                                        <FiXCircle className="w-3 h-3 text-white" />
                                      </div>
                                      <span className="font-medium">
                                        Reject User
                                      </span>
                                    </button>
                                  </>
                                )}

                                {user.status === KYC_STATUS.VERIFIED && (
                                  <button
                                    onClick={() =>
                                      handleUserAction("suspend", user.address)
                                    }
                                    className="flex items-center w-full text-left px-4 py-3 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-900/30 transition-all duration-300 group/action"
                                  >
                                    <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm mr-3 transform group-hover/action:scale-110 transition-transform duration-300">
                                      <FiAlertTriangle className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="font-medium">
                                      Suspend User
                                    </span>
                                  </button>
                                )}

                                {user.status === KYC_STATUS.SUSPENDED && (
                                  <button
                                    onClick={() =>
                                      handleUserAction(
                                        "reactivate",
                                        user.address
                                      )
                                    }
                                    className="flex items-center w-full text-left px-4 py-3 text-sm text-green-600 dark:text-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/30 transition-all duration-300 group/action"
                                  >
                                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm mr-3 transform group-hover/action:scale-110 transition-transform duration-300">
                                      <FiUnlock className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="font-medium">
                                      Reactivate User
                                    </span>
                                  </button>
                                )}

                                <div className="my-1 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent"></div>

                                <button
                                  onClick={() =>
                                    handleUserAction(
                                      "viewShipments",
                                      user.address
                                    )
                                  }
                                  className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/30 transition-all duration-300 group/action"
                                >
                                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm mr-3 transform group-hover/action:scale-110 transition-transform duration-300">
                                    <FiPackage className="w-3 h-3 text-white" />
                                  </div>
                                  <span className="font-medium">
                                    View Shipments
                                  </span>
                                  <FiExternalLink className="w-3 h-3 ml-auto" />
                                </button>

                                <button
                                  onClick={() =>
                                    handleUserAction("delete", user.address)
                                  }
                                  className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/30 transition-all duration-300 group/action"
                                >
                                  <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg flex items-center justify-center shadow-sm mr-3 transform group-hover/action:scale-110 transition-transform duration-300">
                                    <FiTrash2 className="w-3 h-3 text-white" />
                                  </div>
                                  <span className="font-medium">
                                    Delete User
                                  </span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-b-2xl opacity-0 group-hover/user:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="relative group/empty">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-blue-500/5 dark:from-gray-500/10 dark:to-blue-500/10 rounded-2xl blur opacity-50"></div>

                <div className="relative text-center py-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <FiUser className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    No Users Found
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto mb-6">
                    {searchQuery || filterStatus !== "all"
                      ? "Try adjusting your search or filter criteria to find users"
                      : "No users have registered yet. Users will appear here once they complete registration."}
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {(searchQuery || filterStatus !== "all") && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setFilterStatus("all");
                        }}
                        className="group/clear relative inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
                        <FiRefreshCw className="relative z-10 w-4 h-4 group-hover/clear:rotate-180 transition-transform duration-500" />
                        <span className="relative z-10">Clear Filters</span>
                      </button>
                    )}
                    {users.length === 0 && (
                      <button
                        onClick={handleAddDemoUsers}
                        className="group/demo relative inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
                        <FiPlus className="relative z-10 w-4 h-4" />
                        <span className="relative z-10">Add Demo Users</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative group max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-3xl blur opacity-75"></div>

            <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 shadow-2xl">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FiUser className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        User Details
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Complete user information and verification status
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                  >
                    <FiXCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* User Header */}
                  <div className="relative group/header">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-2xl blur opacity-0 group-hover/header:opacity-100 transition-opacity duration-300"></div>

                    <div className="relative p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30">
                      <div className="flex items-start space-x-6">
                        <div className="relative">
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <FiUser className="w-10 h-10 text-white" />
                          </div>
                          {selectedUser.status === KYC_STATUS.VERIFIED && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                              <FiCheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {selectedUser.fullName}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">
                            {selectedUser.email}
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            {getStatusBadge(selectedUser.status)}
                            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-100/70 to-cyan-100/70 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                              <FiPackage className="w-3 h-3" />
                              <span>
                                {selectedUser.totalShipments || 0} Shipments
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        label: "Wallet Address",
                        value: selectedUser.address,
                        icon: FiDatabase,
                        color: "from-indigo-500 to-purple-600",
                        isMono: true,
                        copyable: true,
                      },
                      {
                        label: "Phone Number",
                        value: selectedUser.phoneNumber || "Not provided",
                        icon: FiPhone,
                        color: "from-green-500 to-emerald-600",
                      },
                      {
                        label: "National ID",
                        value: selectedUser.nationalId || "Not provided",
                        icon: FiCreditCard,
                        color: "from-blue-500 to-cyan-600",
                      },
                      {
                        label: "Total Shipments",
                        value: selectedUser.totalShipments || 0,
                        icon: FiPackage,
                        color: "from-purple-500 to-violet-600",
                      },
                    ].map((field, index) => {
                      const FieldIcon = field.icon;
                      return (
                        <div key={index} className="relative group/field">
                          <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-blue-500/5 dark:from-gray-500/10 dark:to-blue-500/10 rounded-xl blur opacity-0 group-hover/field:opacity-100 transition-opacity duration-300"></div>

                          <div className="relative p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300">
                            <div className="flex items-start space-x-3">
                              <div
                                className={`
                                w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transform group-hover/field:scale-110 group-hover/field:rotate-3 transition-all duration-300
                                bg-gradient-to-r ${field.color}
                              `}
                              >
                                <FieldIcon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                  {field.label}
                                </label>
                                <div className="flex items-center space-x-2">
                                  <p
                                    className={`
                                    text-sm font-bold text-gray-900 dark:text-white
                                    ${field.isMono ? "font-mono break-all" : ""}
                                    ${field.copyable ? "pr-8" : ""}
                                  `}
                                  >
                                    {field.value}
                                  </p>
                                  {field.copyable && (
                                    <button
                                      onClick={() =>
                                        copyToClipboard(field.value)
                                      }
                                      className="text-gray-400 hover:text-blue-500 transition-colors duration-300"
                                      title="Copy to clipboard"
                                    >
                                      <FiCopy className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Home Address - Full Width */}
                    <div className="md:col-span-2 relative group/address">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-xl blur opacity-0 group-hover/address:opacity-100 transition-opacity duration-300"></div>

                      <div className="relative p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover/address:scale-110 group-hover/address:rotate-3 transition-all duration-300">
                            <FiHome className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                              Home Address
                            </label>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {selectedUser.homeAddress || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Verification Dates */}
                    {(selectedUser.verifiedAt ||
                      selectedUser.submittedAt ||
                      selectedUser.rejectedAt ||
                      selectedUser.suspendedAt) && (
                      <div className="md:col-span-2 relative group/dates">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-500/5 dark:from-violet-500/10 dark:to-purple-500/10 rounded-xl blur opacity-0 group-hover/dates:opacity-100 transition-opacity duration-300"></div>

                        <div className="relative p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedUser.submittedAt && (
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-sm">
                                  <FiCalendar className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Submitted
                                  </label>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {new Date(
                                      selectedUser.submittedAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            )}
                            {selectedUser.verifiedAt && (
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                                  <FiCheckCircle className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Verified
                                  </label>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {new Date(
                                      selectedUser.verifiedAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            )}
                            {selectedUser.rejectedAt && (
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg flex items-center justify-center shadow-sm">
                                  <FiXCircle className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Rejected
                                  </label>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {new Date(
                                      selectedUser.rejectedAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            )}
                            {selectedUser.suspendedAt && (
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm">
                                  <FiAlertTriangle className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Suspended
                                  </label>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {new Date(
                                      selectedUser.suspendedAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rejection/Suspension Reason */}
                    {(selectedUser.rejectionReason ||
                      selectedUser.suspensionReason) && (
                      <div className="md:col-span-2 relative group/rejection">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-rose-500/5 dark:from-red-500/10 dark:to-rose-500/10 rounded-xl blur opacity-0 group-hover/rejection:opacity-100 transition-opacity duration-300"></div>

                        <div className="relative p-4 bg-gradient-to-r from-red-50/70 to-rose-50/70 dark:from-red-900/30 dark:to-rose-900/30 rounded-xl border border-red-200/50 dark:border-red-700/50">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                              <FiAlertTriangle className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <label className="text-sm font-medium text-red-700 dark:text-red-400 block mb-1">
                                {selectedUser.rejectionReason
                                  ? "Rejection Reason"
                                  : "Suspension Reason"}
                              </label>
                              <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">
                                {selectedUser.rejectionReason ||
                                  selectedUser.suspensionReason}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-white/20 dark:border-gray-700/30">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="flex-1 min-w-32 px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 font-medium"
                  >
                    Close
                  </button>

                  {selectedUser.status === KYC_STATUS.PENDING && (
                    <>
                      <button
                        onClick={() => {
                          handleUserAction("verify", selectedUser.address);
                          setShowUserModal(false);
                        }}
                        className="flex-1 min-w-32 group relative inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                        <FiCheckCircle className="relative z-10 w-4 h-4" />
                        <span className="relative z-10">Verify</span>
                      </button>

                      <button
                        onClick={() => {
                          handleUserAction("reject", selectedUser.address);
                          setShowUserModal(false);
                        }}
                        className="flex-1 min-w-32 group relative inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl hover:shadow-xl hover:from-red-600 hover:to-rose-700 transform hover:scale-105 transition-all duration-300 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                        <FiXCircle className="relative z-10 w-4 h-4" />
                        <span className="relative z-10">Reject</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() =>
                      handleUserAction("viewShipments", selectedUser.address)
                    }
                    className="flex-1 min-w-32 group relative inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                    <FiPackage className="relative z-10 w-4 h-4" />
                    <span className="relative z-10">View Shipments</span>
                    <FiExternalLink className="relative z-10 w-4 h-4" />
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

export default UserManagement;
