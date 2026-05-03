// utils/userStorage.js
export const USER_STORAGE_KEY = "supply_chain_users";

export const userStorage = {
  // Get all users from localStorage
  getAllUsers: () => {
    try {
      const users = localStorage.getItem(USER_STORAGE_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error("Error reading users from localStorage:", error);
      return [];
    }
  },

  // Add or update a user
  addOrUpdateUser: (userAddress, userData) => {
    try {
      const users = userStorage.getAllUsers();
      const existingIndex = users.findIndex(
        (user) => user.address === userAddress
      );

      const newUser = {
        address: userAddress,
        ...userData,
        lastUpdated: Date.now(),
      };

      if (existingIndex >= 0) {
        users[existingIndex] = newUser;
      } else {
        users.push(newUser);
      }

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));

      // Dispatch custom event to notify other components
      window.dispatchEvent(
        new CustomEvent("usersUpdated", {
          detail: { users, updatedUser: newUser },
        })
      );

      return true;
    } catch (error) {
      console.error("Error saving user to localStorage:", error);
      return false;
    }
  },

  // Remove a user
  removeUser: (userAddress) => {
    try {
      const users = userStorage.getAllUsers();
      const filteredUsers = users.filter(
        (user) => user.address !== userAddress
      );
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(filteredUsers));

      window.dispatchEvent(
        new CustomEvent("usersUpdated", {
          detail: { users: filteredUsers },
        })
      );

      return true;
    } catch (error) {
      console.error("Error removing user from localStorage:", error);
      return false;
    }
  },

  // Get a specific user
  getUser: (userAddress) => {
    const users = userStorage.getAllUsers();
    return users.find((user) => user.address === userAddress);
  },

  // Update user status
  updateUserStatus: (userAddress, status, additionalData = {}) => {
    const users = userStorage.getAllUsers();
    const userIndex = users.findIndex((user) => user.address === userAddress);

    if (userIndex >= 0) {
      users[userIndex] = {
        ...users[userIndex],
        status,
        ...additionalData,
        lastUpdated: Date.now(),
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));

      window.dispatchEvent(
        new CustomEvent("usersUpdated", {
          detail: { users, updatedUser: users[userIndex] },
        })
      );

      return true;
    }
    return false;
  },

  // Clear all users (for development/testing)
  clearAllUsers: () => {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      window.dispatchEvent(
        new CustomEvent("usersUpdated", {
          detail: { users: [] },
        })
      );
      return true;
    } catch (error) {
      console.error("Error clearing users from localStorage:", error);
      return false;
    }
  },
};
