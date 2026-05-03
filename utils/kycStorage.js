// utils/kycStorage.js

/**
 * Local Storage Utility for KYC (Know Your Customer) Management
 * Provides functions to store, retrieve, and manage KYC user data in localStorage
 */

const KYC_STORAGE_KEY = "kyc_users_data";
const KYC_STATS_KEY = "kyc_statistics";
const MAX_USERS = 1000; // Limit to prevent storage bloat

/**
 * KYC Status Constants
 */
export const KYC_STATUS = {
  PENDING: 0,
  VERIFIED: 1,
  REJECTED: 2,
  SUSPENDED: 3,
};

/**
 * KYC Status Labels
 */
export const KYC_STATUS_LABELS = {
  [KYC_STATUS.PENDING]: "Pending",
  [KYC_STATUS.VERIFIED]: "Verified",
  [KYC_STATUS.REJECTED]: "Rejected",
  [KYC_STATUS.SUSPENDED]: "Suspended",
};

/**
 * Get all KYC users from localStorage
 * @returns {Array} Array of user objects
 */
export const getKYCUsers = () => {
  try {
    const stored = localStorage.getItem(KYC_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading KYC users from localStorage:", error);
    return [];
  }
};

/**
 * Save KYC users to localStorage
 * @param {Array} users - Array of user objects
 */
export const saveKYCUsers = (users) => {
  try {
    // Limit the number of users to prevent storage issues
    const limitedUsers = users.slice(0, MAX_USERS);
    localStorage.setItem(KYC_STORAGE_KEY, JSON.stringify(limitedUsers));

    // Update statistics
    updateKYCStatistics(limitedUsers);
  } catch (error) {
    console.error("Error saving KYC users to localStorage:", error);
  }
};

/**
 * Add a new KYC user
 * @param {Object} userData - User data object
 * @returns {Object} The created user object
 */
export const addKYCUser = (userData) => {
  try {
    const users = getKYCUsers();

    // Check if user already exists
    const existingUserIndex = users.findIndex(
      (user) => user.address?.toLowerCase() === userData.address?.toLowerCase()
    );

    if (existingUserIndex !== -1) {
      throw new Error("User with this address already exists");
    }

    const newUser = {
      id: generateUserId(),
      address: userData.address,
      fullName: userData.fullName || "",
      email: userData.email || "",
      phoneNumber: userData.phoneNumber || "",
      nationalId: userData.nationalId || "",
      homeAddress: userData.homeAddress || "",
      status: userData.status || KYC_STATUS.PENDING,
      totalShipments: userData.totalShipments || 0,
      submittedAt: userData.submittedAt || new Date().toISOString(),
      verifiedAt: userData.verifiedAt || null,
      rejectedAt: userData.rejectedAt || null,
      suspendedAt: userData.suspendedAt || null,
      rejectionReason: userData.rejectionReason || "",
      suspensionReason: userData.suspensionReason || "",
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ...userData, // Allow custom properties
    };

    const updatedUsers = [newUser, ...users];
    saveKYCUsers(updatedUsers);

    return newUser;
  } catch (error) {
    console.error("Error adding KYC user:", error);
    throw error;
  }
};

/**
 * Update an existing KYC user
 * @param {string} address - User wallet address
 * @param {Object} updateData - Data to update
 * @returns {Object|null} Updated user object or null if not found
 */
export const updateKYCUser = (address, updateData) => {
  try {
    const users = getKYCUsers();
    const userIndex = users.findIndex(
      (user) => user.address?.toLowerCase() === address?.toLowerCase()
    );

    if (userIndex === -1) {
      throw new Error("User not found");
    }

    const updatedUser = {
      ...users[userIndex],
      ...updateData,
      lastUpdated: new Date().toISOString(),
    };

    // Update status-specific timestamps
    if (
      updateData.status !== undefined &&
      updateData.status !== users[userIndex].status
    ) {
      switch (updateData.status) {
        case KYC_STATUS.VERIFIED:
          updatedUser.verifiedAt = new Date().toISOString();
          break;
        case KYC_STATUS.REJECTED:
          updatedUser.rejectedAt = new Date().toISOString();
          break;
        case KYC_STATUS.SUSPENDED:
          updatedUser.suspendedAt = new Date().toISOString();
          break;
      }
    }

    users[userIndex] = updatedUser;
    saveKYCUsers(users);

    return updatedUser;
  } catch (error) {
    console.error("Error updating KYC user:", error);
    throw error;
  }
};

/**
 * Remove a KYC user
 * @param {string} address - User wallet address
 */
export const removeKYCUser = (address) => {
  try {
    const users = getKYCUsers();
    const filteredUsers = users.filter(
      (user) => user.address?.toLowerCase() !== address?.toLowerCase()
    );
    saveKYCUsers(filteredUsers);
  } catch (error) {
    console.error("Error removing KYC user:", error);
    throw error;
  }
};

/**
 * Get a specific KYC user by address
 * @param {string} address - User wallet address
 * @returns {Object|null} User object or null if not found
 */
export const getKYCUserByAddress = (address) => {
  try {
    const users = getKYCUsers();
    return (
      users.find(
        (user) => user.address?.toLowerCase() === address?.toLowerCase()
      ) || null
    );
  } catch (error) {
    console.error("Error getting KYC user by address:", error);
    return null;
  }
};

/**
 * Get KYC users by status
 * @param {number} status - KYC status
 * @returns {Array} Filtered users array
 */
export const getKYCUsersByStatus = (status) => {
  try {
    const users = getKYCUsers();
    return users.filter((user) => user.status === status);
  } catch (error) {
    console.error("Error getting KYC users by status:", error);
    return [];
  }
};

/**
 * Search KYC users
 * @param {string} query - Search query
 * @param {string} statusFilter - Status filter ('all' or specific status)
 * @returns {Array} Filtered users array
 */
export const searchKYCUsers = (query = "", statusFilter = "all") => {
  try {
    const users = getKYCUsers();

    return users.filter((user) => {
      // Search filter
      const matchesSearch =
        !query ||
        user.fullName?.toLowerCase().includes(query.toLowerCase()) ||
        user.email?.toLowerCase().includes(query.toLowerCase()) ||
        user.address?.toLowerCase().includes(query.toLowerCase()) ||
        user.phoneNumber?.includes(query) ||
        user.nationalId?.toLowerCase().includes(query.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" || user.status?.toString() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  } catch (error) {
    console.error("Error searching KYC users:", error);
    return [];
  }
};

/**
 * Verify a KYC user
 * @param {string} address - User wallet address
 * @returns {Object|null} Updated user object
 */
export const verifyKYCUser = (address) => {
  return updateKYCUser(address, {
    status: KYC_STATUS.VERIFIED,
    rejectionReason: "", // Clear any previous rejection reason
    suspensionReason: "", // Clear any previous suspension reason
  });
};

/**
 * Reject a KYC user
 * @param {string} address - User wallet address
 * @param {string} reason - Rejection reason
 * @returns {Object|null} Updated user object
 */
export const rejectKYCUser = (address, reason) => {
  return updateKYCUser(address, {
    status: KYC_STATUS.REJECTED,
    rejectionReason: reason || "No reason provided",
  });
};

/**
 * Suspend a KYC user
 * @param {string} address - User wallet address
 * @param {string} reason - Suspension reason
 * @returns {Object|null} Updated user object
 */
export const suspendKYCUser = (address, reason) => {
  return updateKYCUser(address, {
    status: KYC_STATUS.SUSPENDED,
    suspensionReason: reason || "No reason provided",
  });
};

/**
 * Reactivate a suspended user (set to pending for re-verification)
 * @param {string} address - User wallet address
 * @returns {Object|null} Updated user object
 */
export const reactivateKYCUser = (address) => {
  return updateKYCUser(address, {
    status: KYC_STATUS.PENDING,
    suspensionReason: "",
    suspendedAt: null,
  });
};

/**
 * Update KYC statistics and save to localStorage
 * @param {Array} users - Users array (optional, will fetch if not provided)
 */
export const updateKYCStatistics = (users = null) => {
  try {
    if (!users) {
      users = getKYCUsers();
    }

    const stats = {
      total: users.length,
      verified: users.filter((u) => u.status === KYC_STATUS.VERIFIED).length,
      pending: users.filter((u) => u.status === KYC_STATUS.PENDING).length,
      rejected: users.filter((u) => u.status === KYC_STATUS.REJECTED).length,
      suspended: users.filter((u) => u.status === KYC_STATUS.SUSPENDED).length,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(KYC_STATS_KEY, JSON.stringify(stats));
    return stats;
  } catch (error) {
    console.error("Error updating KYC statistics:", error);
    return {
      total: 0,
      verified: 0,
      pending: 0,
      rejected: 0,
      suspended: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
};

/**
 * Get KYC statistics
 * @returns {Object} Statistics object
 */
export const getKYCStatistics = () => {
  try {
    const stored = localStorage.getItem(KYC_STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    } else {
      // Generate fresh statistics if none exist
      return updateKYCStatistics();
    }
  } catch (error) {
    console.error("Error getting KYC statistics:", error);
    return updateKYCStatistics();
  }
};

/**
 * Clear all KYC data
 */
export const clearAllKYCData = () => {
  try {
    localStorage.removeItem(KYC_STORAGE_KEY);
    localStorage.removeItem(KYC_STATS_KEY);
  } catch (error) {
    console.error("Error clearing KYC data:", error);
  }
};

/**
 * Export KYC data as JSON
 * @returns {string} JSON string of all KYC data
 */
export const exportKYCData = () => {
  try {
    const users = getKYCUsers();
    const stats = getKYCStatistics();

    const exportData = {
      users,
      statistics: stats,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error("Error exporting KYC data:", error);
    return null;
  }
};

/**
 * Import KYC data from JSON
 * @param {string} jsonData - JSON string containing KYC data
 * @param {boolean} merge - Whether to merge with existing data or replace
 * @returns {boolean} Success status
 */
export const importKYCData = (jsonData, merge = false) => {
  try {
    const importData = JSON.parse(jsonData);

    if (!importData.users || !Array.isArray(importData.users)) {
      throw new Error("Invalid import data format");
    }

    let users = importData.users;

    if (merge) {
      const existingUsers = getKYCUsers();
      // Merge users, avoiding duplicates based on address
      const addressSet = new Set(
        existingUsers.map((u) => u.address?.toLowerCase())
      );
      const newUsers = users.filter(
        (u) => !addressSet.has(u.address?.toLowerCase())
      );
      users = [...existingUsers, ...newUsers];
    }

    saveKYCUsers(users);
    return true;
  } catch (error) {
    console.error("Error importing KYC data:", error);
    return false;
  }
};

/**
 * Get storage usage information
 * @returns {Object} Storage info
 */
export const getKYCStorageInfo = () => {
  try {
    const users = getKYCUsers();
    const usersData = localStorage.getItem(KYC_STORAGE_KEY);
    const statsData = localStorage.getItem(KYC_STATS_KEY);

    const usersSize = usersData ? new Blob([usersData]).size : 0;
    const statsSize = statsData ? new Blob([statsData]).size : 0;
    const totalSize = usersSize + statsSize;

    return {
      userCount: users.length,
      usersSize: usersSize,
      statsSize: statsSize,
      totalSize: totalSize,
      totalSizeKB: Math.round((totalSize / 1024) * 100) / 100,
      maxUsers: MAX_USERS,
      storageUsagePercent: Math.round((users.length / MAX_USERS) * 100),
    };
  } catch (error) {
    console.error("Error getting KYC storage info:", error);
    return {
      userCount: 0,
      usersSize: 0,
      statsSize: 0,
      totalSize: 0,
      totalSizeKB: 0,
      maxUsers: MAX_USERS,
      storageUsagePercent: 0,
    };
  }
};

/**
 * Validate user data before saving
 * @param {Object} userData - User data to validate
 * @returns {Object} Validation result
 */
export const validateKYCUserData = (userData) => {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!userData.address || userData.address.trim() === "") {
    errors.push("Wallet address is required");
  }

  if (!userData.fullName || userData.fullName.trim() === "") {
    errors.push("Full name is required");
  }

  if (!userData.email || userData.email.trim() === "") {
    errors.push("Email is required");
  }

  // Format validations
  if (userData.email && !isValidEmail(userData.email)) {
    errors.push("Invalid email format");
  }

  if (userData.address && !isValidWalletAddress(userData.address)) {
    warnings.push("Wallet address format may be invalid");
  }

  // Optional field validations
  if (userData.phoneNumber && userData.phoneNumber.length < 10) {
    warnings.push("Phone number may be too short");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// Helper Functions

/**
 * Generate a unique user ID
 * @returns {string} Unique ID
 */
const generateUserId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Basic wallet address validation (Ethereum format)
 * @param {string} address - Wallet address to validate
 * @returns {boolean} Is valid address format
 */
const isValidWalletAddress = (address) => {
  // Basic Ethereum address validation (0x followed by 40 hex characters)
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressRegex.test(address);
};

/**
 * Predefined KYC templates for testing/demo purposes
 */
export const KYC_DEMO_USERS = [
  {
    fullName: "John Smith",
    email: "john.smith@example.com",
    phoneNumber: "+1234567890",
    nationalId: "ID123456789",
    homeAddress: "123 Main St, New York, NY 10001",
    address: "0x1234567890123456789012345678901234567890",
    status: KYC_STATUS.VERIFIED,
    totalShipments: 15,
  },
  {
    fullName: "Alice Johnson",
    email: "alice.johnson@example.com",
    phoneNumber: "+1987654321",
    nationalId: "ID987654321",
    homeAddress: "456 Oak Ave, Los Angeles, CA 90210",
    address: "0x0987654321098765432109876543210987654321",
    status: KYC_STATUS.PENDING,
    totalShipments: 3,
  },
  {
    fullName: "Bob Wilson",
    email: "bob.wilson@example.com",
    phoneNumber: "+1555666777",
    nationalId: "ID555666777",
    homeAddress: "789 Pine Rd, Chicago, IL 60601",
    address: "0x5555666777555566677755556667775555666777",
    status: KYC_STATUS.REJECTED,
    rejectionReason: "Incomplete documentation provided",
    totalShipments: 0,
  },
];

/**
 * Add demo users for testing
 */
export const addDemoKYCUsers = () => {
  KYC_DEMO_USERS.forEach((user) => {
    try {
      addKYCUser(user);
    } catch (error) {
      // User might already exist, ignore error
      console.log("Demo user already exists:", user.fullName);
    }
  });
};

// Export all functions as default object
export default {
  // Core functions
  getKYCUsers,
  saveKYCUsers,
  addKYCUser,
  updateKYCUser,
  removeKYCUser,
  getKYCUserByAddress,
  getKYCUsersByStatus,
  searchKYCUsers,

  // Status management
  verifyKYCUser,
  rejectKYCUser,
  suspendKYCUser,
  reactivateKYCUser,

  // Statistics
  updateKYCStatistics,
  getKYCStatistics,

  // Data management
  clearAllKYCData,
  exportKYCData,
  importKYCData,
  getKYCStorageInfo,
  validateKYCUserData,

  // Demo/Testing
  addDemoKYCUsers,

  // Constants
  KYC_STATUS,
  KYC_STATUS_LABELS,
  KYC_DEMO_USERS,
};
