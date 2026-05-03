import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { useSupplyChainContract } from "../../hooks/useContract";
import {
  getFromIPFS,
  uploadFileToIPFS,
  uploadJSONToIPFS,
  uploadMultipleFiles,
} from "../../utils/pinata";
import Layout from "../../components/Layout/Layout";
import toast from "react-hot-toast";
import {
  FiPackage,
  FiMapPin,
  FiClock,
  FiUser,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiImage,
  FiFileText,
  FiArrowRight,
  FiCalendar,
  FiDollarSign,
  FiEdit3,
  FiSave,
  FiX,
  FiUpload,
  FiCamera,
  FiRefreshCw,
  FiAlertCircle,
  FiPlay,
  FiCheck,
  FiDatabase,
  FiShield,
  FiStar,
  FiZap,
  FiActivity,
  FiEye,
  FiExternalLink,
  FiNavigation,
  FiGlobe,
  FiAward,
  FiLock,
  FiUnlock,
  FiHome,
  FiTarget,
} from "react-icons/fi";

const TrackingDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const { address, isConnected } = useAccount();
  const {
    useContractRead,
    formatEther,
    startShipment,
    updateTracking,
    completeShipment,
    cancelShipment,
    confirmEscrow,
    adminReleasePayment,
    isPending,
    isConfirming,
    isConfirmed,
  } = useSupplyChainContract();

  const [shipment, setShipment] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState({});

  // ── Escrow confirmation state ──
  // carrierConfirmed: carrier has pressed "Confirm Delivery"
  // receiverConfirmed: receiver has pressed "Confirm Receipt"
  // Both must be true before the on-chain completeShipment is called
  const [escrow, setEscrow] = useState({ carrierConfirmed: false, receiverConfirmed: false });
  const [escrowTxFired, setEscrowTxFired] = useState(false); // guard to prevent double-fire

  // Persist escrow confirmations in localStorage (keyed by shipment id)
  const escrowKey = id ? `escrow_shipment_${id}` : null;

  const loadEscrow = () => {
    if (!escrowKey) return;
    try {
      const stored = localStorage.getItem(escrowKey);
      if (stored) setEscrow(JSON.parse(stored));
    } catch (_) {}
  };

  const saveEscrow = (next) => {
    if (!escrowKey) return;
    setEscrow(next);
    localStorage.setItem(escrowKey, JSON.stringify(next));
  };

  // Update modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateType, setUpdateType] = useState(null); // 'start', 'update', 'complete', 'cancel', 'escrow_carrier', 'escrow_receiver'
  const [updateForm, setUpdateForm] = useState({
    location: "",
    notes: "",
    status: "",
    imageFile: null,
    imageHash: "",
    reason: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch shipment data
  const {
    data: shipmentData,
    isLoading: shipmentLoading,
    refetch: refetchShipment,
  } = useContractRead("getShipment", [id]);
  const {
    data: trackingData,
    isLoading: trackingLoading,
    refetch: refetchTracking,
  } = useContractRead("getTrackingHistory", [id]);

  // On-chain escrow confirmation states
  const { data: onChainCarrierConfirmed, refetch: refetchCarrierConfirm } =
    useContractRead("escrowCarrierConfirmed", [id]);
  const { data: onChainReceiverConfirmed, refetch: refetchReceiverConfirm } =
    useContractRead("escrowReceiverConfirmed", [id]);

  // Check if connected wallet has ADMIN_ROLE
  const ADMIN_ROLE = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a622781cf0f0a8cc4fc61e4f3"; // keccak256("ADMIN_ROLE")
  const { data: isAdminRole } = useContractRead("hasRole", [ADMIN_ROLE, address]);
  const isAdmin = !!isAdminRole;

  // Sync on-chain confirmation state into localStorage cache
  useEffect(() => {
    if (onChainCarrierConfirmed !== undefined || onChainReceiverConfirmed !== undefined) {
      const next = {
        carrierConfirmed: !!onChainCarrierConfirmed,
        receiverConfirmed: !!onChainReceiverConfirmed,
      };
      setEscrow(next);
      if (escrowKey) localStorage.setItem(escrowKey, JSON.stringify(next));
    }
  }, [onChainCarrierConfirmed, onChainReceiverConfirmed]);



  useEffect(() => {
    if (shipmentData && trackingData) {
      setShipment(shipmentData);
      setTrackingHistory(trackingData);
      loadImages(shipmentData);
      setLoading(false);
    }
  }, [shipmentData, trackingData]);

  // Load escrow state when id is ready
  useEffect(() => { loadEscrow(); }, [id]);

  // NOTE: We do NOT auto-call completeShipment here.
  // The contract enforces: require(msg.sender == shipment.carrier, "Only carrier")
  // So the carrier's wallet MUST be the one to submit the on-chain tx.
  // Once both parties confirm off-chain (localStorage), the carrier sees a
  // "Release Funds" button that calls completeShipment from their wallet.


  // Refresh data after successful transaction
  useEffect(() => {
    if (isConfirmed) {
      refetchShipment();
      refetchTracking();
      setShowUpdateModal(false);
      resetUpdateForm();
      // Clear escrow storage once delivered
      if (escrowKey) localStorage.removeItem(escrowKey);
    }
  }, [isConfirmed]);

  const loadImages = async (shipmentData) => {
    console.log(shipmentData);
    if (shipmentData?.details?.imageHashes?.length > 0) {
      const urls = {};
      for (const hash of shipmentData.details.imageHashes.slice(0, 3)) {
        try {
          const response = await fetch(
            `https://gateway.pinata.cloud/ipfs/${hash}`
          );
          if (response.ok) {
            urls[hash] = `https://gateway.pinata.cloud/ipfs/${hash}`;
          }
        } catch (error) {
          console.error(`Error loading image ${hash}:`, error);
        }
      }
      setImageUrls(urls);
    }
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

  const canUpdateShipment = () => {
    const role = getUserRole();
    if (!role || role === "public") return false;

    // Sender (creator) can manage all shipment functions
    if (role === "sender") return true;

    // Carrier can also manage shipment functions
    if (role === "carrier") return true;

    return false;
  };

  const getAvailableActions = () => {
    const role = getUserRole();
    const actions = [];

    // Pending shipments
    if (shipment.status === 0) {
      if (role === "carrier") {
        actions.push({
          type: "start",
          label: "Start Shipment",
          icon: FiPlay,
          color: "green",
          gradient: "from-green-500 to-emerald-600",
          description: "Mark shipment as picked up and in transit",
        });
      }
      if (role === "sender") {
        actions.push({
          type: "cancel",
          label: "Cancel Shipment",
          icon: FiX,
          color: "red",
          gradient: "from-red-500 to-rose-600",
          description: "Cancel this shipment",
        });
      }
    }

    // In Transit — ESCROW two-party confirmation
    if (shipment.status === 1) {
      // Carrier: update tracking + confirm their side
      if (role === "carrier") {
        actions.push({
          type: "update",
          label: "Update Status",
          icon: FiEdit3,
          color: "blue",
          gradient: "from-blue-500 to-cyan-600",
          description: "Add tracking update",
        });
        if (!escrow.carrierConfirmed) {
          actions.push({
            type: "escrow_carrier",
            label: "Confirm Delivery",
            icon: FiCheck,
            color: "emerald",
            gradient: "from-emerald-500 to-teal-600",
            description: "Confirm on-chain that you have delivered the package",
          });
        }
      }

      // Receiver: confirm their side
      if (role === "receiver" && !escrow.receiverConfirmed) {
        actions.push({
          type: "escrow_receiver",
          label: "Confirm Receipt",
          icon: FiCheck,
          color: "purple",
          gradient: "from-purple-500 to-violet-600",
          description: "Confirm on-chain that you have received the package",
        });
      }

      // ADMIN: release funds only after BOTH parties confirmed
      if (isAdmin && escrow.carrierConfirmed && escrow.receiverConfirmed) {
        actions.push({
          type: "release_funds",
          label: "🎉 Release Funds to Carrier",
          icon: FiCheck,
          color: "emerald",
          gradient: "from-emerald-500 to-green-600",
          description: "Both parties confirmed. Release escrow payment to carrier.",
        });
      }
    }

    return actions;
  };


  const handleImageUpload = async (file) => {
    setUploadingImage(true);
    try {
      /// Mock upload to IPFS - replace with actual Pinata upload
      const uploadHash = await uploadFileToIPFS(file);
      console.log(uploadHash);

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setUpdateForm((prev) => ({ ...prev, imageHash: uploadHash.hash }));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const openUpdateModal = (type) => {
    setUpdateType(type);
    setShowUpdateModal(true);

    // Pre-fill form based on update type
    if (type === "update") {
      setUpdateForm((prev) => ({ ...prev, status: "In Transit" }));
    }
  };

  const resetUpdateForm = () => {
    setUpdateForm({
      location: "",
      notes: "",
      status: "",
      imageFile: null,
      imageHash: "",
      reason: "",
    });
    setUpdateType(null);
  };

  const handleSubmitUpdate = async () => {
    try {
      const { location, notes, imageHash, reason } = updateForm;

      switch (updateType) {
        case "start":
          if (!location) {
            toast.error("Location is required");
            return;
          }
          await startShipment(id, location, notes, imageHash);
          break;

        case "update":
          if (!location) {
            toast.error("Location is required");
            return;
          }
          await updateTracking(
            id,
            location,
            updateForm.status || "In Transit",
            notes,
            imageHash
          );
          break;

        // ── Escrow: carrier confirms delivery ON-CHAIN (step 1) ──
        case "escrow_carrier": {
          toast.loading("Recording your confirmation on-chain…", { duration: 5000 });
          const ok = await confirmEscrow(id);
          if (ok) {
            const next = { ...escrow, carrierConfirmed: true };
            saveEscrow(next); // local cache for fast UI
            toast.success("✅ Delivery confirmed on-chain. Waiting for receiver to confirm receipt.");
          }
          setShowUpdateModal(false);
          resetUpdateForm();
          break;
        }

        // ── Escrow: receiver confirms receipt ON-CHAIN (step 2) ──
        case "escrow_receiver": {
          toast.loading("Recording your confirmation on-chain…", { duration: 5000 });
          const ok = await confirmEscrow(id);
          if (ok) {
            const next = { ...escrow, receiverConfirmed: true };
            saveEscrow(next); // local cache for fast UI
            if (next.carrierConfirmed) {
              toast.success("🎉 Both confirmed on-chain! Awaiting admin to release funds.");
            } else {
              toast.success("✅ Receipt confirmed on-chain. Waiting for carrier to confirm delivery.");
            }
          }
          setShowUpdateModal(false);
          resetUpdateForm();
          break;
        }

        // ── Release Funds: ONLY callable by ADMIN wallet (on-chain) ──
        case "release_funds": {
          toast.loading("Admin releasing escrow funds on-chain… MetaMask will open.", { duration: 6000 });
          const ok = await adminReleasePayment(id);
          if (ok) {
            if (escrowKey) localStorage.removeItem(escrowKey); // clear escrow storage
            toast.success("🎉 Funds released to carrier successfully!");
          }
          setShowUpdateModal(false);
          resetUpdateForm();
          break;
        }


        case "cancel":
          if (!reason) {
            toast.error("Cancellation reason is required");
            return;
          }
          await cancelShipment(id, reason);
          break;

        default:
          toast.error("Invalid update type");

      }
    } catch (error) {
      console.error("Error updating shipment:", error);
      toast.error("Failed to update shipment");
    }
  };

  const getStatusConfig = (status) => {
    const statusConfigs = {
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
    return statusConfigs[status] || statusConfigs[0];
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

  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === "0") return "N/A";
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp || timestamp === "0") return "N/A";
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const formatAddress = (address) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Enhanced Not Connected State
  if (!isConnected) {
    return (
      <Layout>
        <div className="relative group min-h-[70vh] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-50"></div>

          <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-12 shadow-xl text-center max-w-md w-full mx-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <FiLock className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Wallet Connection Required
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Please connect your wallet to view shipment tracking details and
              manage your logistics.
            </p>
            <div className="mt-6 w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto"></div>
          </div>
        </div>
      </Layout>
    );
  }

  // Enhanced Loading State
  if (loading || shipmentLoading || trackingLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-50"></div>

            <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
              {/* Header Skeleton */}
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-16 animate-pulse"></div>
                  <div className="w-4 h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-24 animate-pulse"></div>
                </div>
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl w-80 mb-3 animate-pulse"></div>
                <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl w-48 animate-pulse"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Skeleton */}
                <div className="lg:col-span-2 space-y-8">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-64 bg-gradient-to-r from-gray-100/50 to-gray-200/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 animate-pulse"
                      style={{ animationDelay: `${i * 200}ms` }}
                    ></div>
                  ))}
                </div>

                {/* Sidebar Skeleton */}
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-48 bg-gradient-to-r from-gray-100/50 to-gray-200/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 animate-pulse"
                      style={{ animationDelay: `${i * 300}ms` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Enhanced Shipment Not Found State
  if (!shipment) {
    return (
      <Layout>
        <div className="relative group min-h-[70vh] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 dark:from-red-500/10 dark:to-orange-500/10 rounded-3xl blur opacity-50"></div>

          <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-red-200/50 dark:border-red-800/50 p-12 shadow-xl text-center max-w-md w-full mx-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 via-orange-600 to-yellow-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-500/25 mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <FiAlertCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-3">
              Shipment Not Found
            </h3>
            <p className="text-red-600 dark:text-red-400 leading-relaxed mb-6">
              The shipment ID you're looking for doesn't exist or you don't have
              access to it.
            </p>
            <button
              onClick={() => router.back()}
              className="group relative inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:from-red-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
              <FiArrowRight className="relative z-10 w-5 h-5 rotate-180 group-hover:rotate-180 group-hover:scale-110 transition-transform duration-300" />
              <span className="relative z-10">Go Back</span>
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const statusConfig = getStatusConfig(shipment.status);
  const StatusIcon = statusConfig.icon;
  const userRole = getUserRole();
  const availableActions = getAvailableActions();

  console.log(trackingHistory);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="relative group mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-indigo-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400 mb-6">
              <div className="flex items-center space-x-2">
                <FiHome className="w-4 h-4" />
                <span>Logistics</span>
              </div>
              <FiArrowRight className="w-4 h-4" />
              <div className="flex items-center space-x-2">
                <FiPackage className="w-4 h-4" />
                <span>Tracking</span>
              </div>
              <FiArrowRight className="w-4 h-4" />
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                #{id}
              </span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-6 lg:space-y-0">
              <div className="flex items-start space-x-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <FiPackage className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                </div>

                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {shipment.details?.title || `Shipment #${id}`}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div
                      className={`
                      inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold
                      bg-gradient-to-r ${statusConfig.bgGradient} ${statusConfig.textColor}
                      border ${statusConfig.borderColor} shadow-sm
                      transform hover:scale-105 transition-all duration-300
                    `}
                    >
                      <div
                        className={`w-2 h-2 rounded-full bg-gradient-to-r ${statusConfig.gradient} animate-pulse`}
                      ></div>
                      <StatusIcon className="w-4 h-4" />
                      <span>{statusConfig.label}</span>
                    </div>

                    {userRole && userRole !== "public" && (
                      <div
                        className={`
                        inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold
                        ${
                          userRole === "sender"
                            ? "bg-gradient-to-r from-blue-100/70 to-cyan-100/70 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50"
                            : userRole === "receiver"
                            ? "bg-gradient-to-r from-green-100/70 to-emerald-100/70 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 border border-green-200/50 dark:border-green-800/50"
                            : "bg-gradient-to-r from-purple-100/70 to-violet-100/70 dark:from-purple-900/30 dark:to-violet-900/30 text-purple-700 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50"
                        }
                      `}
                      >
                        {userRole === "sender" && (
                          <FiUser className="w-3 h-3" />
                        )}
                        {userRole === "receiver" && (
                          <FiTarget className="w-3 h-3" />
                        )}
                        {userRole === "carrier" && (
                          <FiTruck className="w-3 h-3" />
                        )}
                        <span>
                          You are the {userRole}
                          {userRole === "sender" && " (Creator)"}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Live
                      </span>
                    </div>
                  </div>

                  {(userRole === "sender" || userRole === "carrier") && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                      <FiUnlock className="w-4 h-4" />
                      <span>You have management access to this shipment</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Enhanced Action Buttons — includes receiver escrow button */}
              {shipment && (userRole === "sender" || userRole === "carrier" || userRole === "receiver") && availableActions.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {availableActions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <button
                        key={action.type}
                        onClick={() => openUpdateModal(action.type)}
                        disabled={isPending || isConfirming}
                        title={action.description}
                        className={`
                          group/btn relative inline-flex items-center space-x-2 px-6 py-3 
                          bg-gradient-to-r ${action.gradient} text-white font-bold rounded-xl 
                          hover:shadow-xl transition-all duration-300 shadow-lg transform hover:scale-110 
                          overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                        <ActionIcon className="relative z-10 w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300" />
                        <span className="relative z-10">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Escrow Status Panel (visible to all parties when IN_TRANSIT) ── */}
              {shipment?.status === 1 && (userRole === "carrier" || userRole === "receiver" || userRole === "sender") && (
                <div className="mt-6 p-5 rounded-2xl border" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(59,130,246,0.04))", borderColor: "rgba(139,92,246,0.2)" }}>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>
                      <FiShield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Escrow Confirmation Status</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Both parties must confirm before funds are released</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Carrier confirmation */}
                    <div className={`flex items-center space-x-3 p-3 rounded-xl border transition-all ${
                      escrow.carrierConfirmed
                        ? "bg-emerald-50/70 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-700/50"
                        : "bg-gray-50/70 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50"
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        escrow.carrierConfirmed ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                      }`}>
                        {escrow.carrierConfirmed ? <FiCheck className="w-4 h-4 text-white" /> : <FiTruck className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">Carrier</p>
                        <p className={`text-xs font-medium ${ escrow.carrierConfirmed ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400" }`}>
                          {escrow.carrierConfirmed ? "✓ Confirmed delivery" : "Pending…"}
                        </p>
                      </div>
                    </div>
                    {/* Receiver confirmation */}
                    <div className={`flex items-center space-x-3 p-3 rounded-xl border transition-all ${
                      escrow.receiverConfirmed
                        ? "bg-purple-50/70 dark:bg-purple-900/20 border-purple-200/50 dark:border-purple-700/50"
                        : "bg-gray-50/70 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50"
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        escrow.receiverConfirmed ? "bg-purple-500" : "bg-gray-300 dark:bg-gray-600"
                      }`}>
                        {escrow.receiverConfirmed ? <FiCheck className="w-4 h-4 text-white" /> : <FiTarget className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">Receiver</p>
                        <p className={`text-xs font-medium ${ escrow.receiverConfirmed ? "text-purple-600 dark:text-purple-400" : "text-gray-400" }`}>
                          {escrow.receiverConfirmed ? "✓ Confirmed receipt" : "Pending…"}
                        </p>
                      </div>
                    </div>
                  </div>
                  {escrow.carrierConfirmed && escrow.receiverConfirmed && (
                    <div className="mt-3 flex items-center space-x-2 px-4 py-2.5 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))", border: "1px solid rgba(16,185,129,0.3)" }}>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">🎉 Both confirmed — releasing escrow funds on-chain…</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Enhanced Status Overview */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FiActivity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Shipment Status
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Real-time tracking data
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      label: "Created",
                      value: formatDate(shipment.createdAt),
                      icon: FiCalendar,
                      color: "from-blue-500 to-cyan-600",
                      bgColor:
                        "from-blue-50/70 to-cyan-50/70 dark:from-blue-900/30 dark:to-cyan-900/30",
                    },
                    {
                      label: "Est. Delivery",
                      value: formatDate(shipment.estimatedDelivery),
                      icon: FiClock,
                      color: "from-purple-500 to-violet-600",
                      bgColor:
                        "from-purple-50/70 to-violet-50/70 dark:from-purple-900/30 dark:to-violet-900/30",
                    },
                    {
                      label: "Shipment Value",
                      value: `${parseFloat(
                        formatEther(shipment.price || 0)
                      ).toFixed(4)} ETH`,
                      icon: FiZap,
                      color: "from-green-500 to-emerald-600",
                      bgColor:
                        "from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30",
                    },
                  ].map((item, index) => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={index}
                        className={`
                          relative group/card text-center p-6 rounded-2xl border border-white/20 dark:border-gray-700/30
                          bg-gradient-to-r ${item.bgColor} hover:shadow-lg transition-all duration-300
                          transform hover:scale-105
                        `}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
                        <div
                          className={`
                          relative z-10 w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center shadow-lg
                          bg-gradient-to-r ${item.color} transform group-hover/card:scale-110 group-hover/card:rotate-3 transition-all duration-300
                        `}
                        >
                          <ItemIcon className="w-6 h-6 text-white" />
                        </div>
                        <p className="relative z-10 text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
                          {item.label}
                        </p>
                        <p className="relative z-10 text-lg font-bold text-gray-900 dark:text-white">
                          {item.value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Enhanced Tracking Timeline */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FiNavigation className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Tracking Timeline
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Complete shipment journey
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {trackingHistory.length > 0 ? (
                    trackingHistory.map((event, index) => (
                      <div key={index} className="relative group/timeline">
                        <div className="flex items-start space-x-6">
                          <div className="flex-shrink-0 relative">
                            <div
                              className={`
                              w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform transition-all duration-300
                              ${
                                index === 0
                                  ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white scale-110"
                                  : "bg-white/80 dark:bg-gray-700/80 text-gray-500 dark:text-gray-400 group-hover/timeline:scale-105"
                              }
                            `}
                            >
                              <FiMapPin className="w-5 h-5" />
                            </div>
                            {index < trackingHistory.length - 1 && (
                              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-0.5 h-16 bg-gradient-to-b from-blue-500/50 to-gray-200 dark:to-gray-700"></div>
                            )}
                            {index === 0 && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 pb-6">
                            <div className="p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300 group-hover/timeline:shadow-lg">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                  {event.status}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <FiClock className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    {formatDateTime(event.timestamp)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start space-x-3 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                                  <FiGlobe className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    📍 {event.location}
                                  </p>
                                  {event.notes && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                      {event.notes}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-4 border-t border-white/20 dark:border-gray-700/30">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <FiUser className="w-3 h-3 text-white" />
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    Updated by: {formatAddress(event.updatedBy)}
                                  </span>
                                </div>

                                {event.imageHash && (
                                  <a
                                    href={`https://gateway.pinata.cloud/ipfs/${event.imageHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group/img inline-flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-100/70 to-cyan-100/70 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                                  >
                                    <FiImage className="w-3 h-3 group-hover/img:scale-110 transition-transform duration-300" />
                                    <span>View Photo</span>
                                    <FiExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="relative group/empty">
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-blue-500/5 dark:from-gray-500/10 dark:to-blue-500/10 rounded-2xl blur opacity-50"></div>

                      <div className="relative text-center py-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                          <FiClock className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                          No Tracking Updates Yet
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          Tracking updates will appear here once the shipment
                          starts moving
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Package Images */}
            {shipment.details?.imageHashes?.length > 0 && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-rose-500/5 dark:from-pink-500/10 dark:to-rose-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FiCamera className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Package Images
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Visual documentation
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {shipment.details.imageHashes
                      .slice(0, 6)
                      .map((hash, index) => (
                        <div key={index} className="relative group/img">
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-rose-500/10 dark:from-pink-500/20 dark:to-rose-500/20 rounded-2xl blur opacity-0 group-hover/img:opacity-100 transition-opacity duration-300"></div>

                          <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-lg group-hover/img:shadow-xl transition-all duration-300 transform group-hover/img:scale-105">
                            {imageUrls[hash] ? (
                              <img
                                src={imageUrls[hash]}
                                alt={`Package image ${index + 1}`}
                                className="w-full h-40 object-cover cursor-pointer transition-all duration-300 group-hover/img:scale-110"
                                onClick={() =>
                                  window.open(imageUrls[hash], "_blank")
                                }
                              />
                            ) : (
                              <div className="w-full h-40 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                                <FiImage className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300">
                              <div className="w-8 h-8 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg">
                                <FiExternalLink className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-8">
            {/* Enhanced Shipment Details */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-500/5 dark:from-violet-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-6 shadow-xl">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FiDatabase className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Shipment Details
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      Blockchain verified
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      label: "Shipment ID",
                      value: `#${id}`,
                      icon: FiDatabase,
                      color: "from-blue-500 to-cyan-600",
                    },
                    {
                      label: "Category",
                      value: getCategoryName(shipment.details?.category),
                      icon: FiPackage,
                      color: "from-green-500 to-emerald-600",
                    },
                    {
                      label: "Type",
                      value: getShipmentTypeName(
                        shipment.details?.shipmentType
                      ),
                      icon: FiTruck,
                      color: "from-purple-500 to-violet-600",
                    },
                    {
                      label: "Weight",
                      value: `${formatEther(shipment.details?.weight || 0)} kg`,
                      icon: FiActivity,
                      color: "from-orange-500 to-red-600",
                    },
                    {
                      label: "Dimensions",
                      value: shipment.details?.dimensions || "N/A",
                      icon: FiMapPin,
                      color: "from-indigo-500 to-purple-600",
                    },
                  ].map((item, index) => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300 group/detail"
                      >
                        <div
                          className={`
                          w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transform transition-all duration-300
                          bg-gradient-to-r ${item.color} group-hover/detail:scale-110 group-hover/detail:rotate-3
                        `}
                        >
                          <ItemIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block">
                            {item.label}
                          </label>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {shipment.details?.description && (
                    <div className="p-4 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                      <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-2">
                        Description
                      </label>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {shipment.details.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Participants */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-6 shadow-xl">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FiUser className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Participants
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      Verified addresses
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      role: "Sender",
                      name: shipment.details?.senderName || "Sender",
                      address: shipment.sender,
                      icon: FiUser,
                      color: "from-blue-500 to-cyan-600",
                      bgColor:
                        "from-blue-50/70 to-cyan-50/70 dark:from-blue-900/30 dark:to-cyan-900/30",
                      isCurrentUser: userRole === "sender",
                      badge: userRole === "sender" ? "(You - Creator)" : null,
                    },
                    {
                      role: "Receiver",
                      name: shipment.details?.receiverName || "Receiver",
                      address: shipment.receiver,
                      icon: FiTarget,
                      color: "from-green-500 to-emerald-600",
                      bgColor:
                        "from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30",
                      isCurrentUser: userRole === "receiver",
                      badge: userRole === "receiver" ? "(You)" : null,
                    },
                    {
                      role: "Carrier",
                      name: "Carrier",
                      address: shipment.carrier,
                      icon: FiTruck,
                      color: "from-purple-500 to-violet-600",
                      bgColor:
                        "from-purple-50/70 to-violet-50/70 dark:from-purple-900/30 dark:to-violet-900/30",
                      isCurrentUser: userRole === "carrier",
                      badge: userRole === "carrier" ? "(You)" : null,
                    },
                  ].map((participant, index) => {
                    const ParticipantIcon = participant.icon;
                    return (
                      <div
                        key={index}
                        className={`
                          p-4 rounded-xl border border-white/20 dark:border-gray-700/30 backdrop-blur-sm transition-all duration-300 group/participant
                          bg-gradient-to-r ${
                            participant.bgColor
                          } hover:shadow-lg transform hover:scale-105
                          ${
                            participant.isCurrentUser
                              ? "ring-2 ring-blue-500/50 dark:ring-blue-400/50"
                              : ""
                          }
                        `}
                      >
                        <div className="flex items-start space-x-4">
                          <div
                            className={`
                            w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transform transition-all duration-300
                            bg-gradient-to-r ${participant.color} group-hover/participant:scale-110 group-hover/participant:rotate-3
                          `}
                          >
                            <ParticipantIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {participant.name}
                              </p>
                              {participant.badge && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                                  {participant.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                              {participant.role}
                            </p>
                            <div className="flex items-center space-x-2">
                              <p className="text-xs font-mono bg-gray-100/80 dark:bg-gray-800/80 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                                {formatAddress(participant.address)}
                              </p>
                              <button
                                onClick={() =>
                                  navigator.clipboard.writeText(
                                    participant.address
                                  )
                                }
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                title="Copy address"
                              >
                                <FiDatabase className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Enhanced Special Features */}
            {(shipment.isInsured || shipment.details?.requiresSignature) && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-6 shadow-xl">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FiAward className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Special Features
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        Premium services
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {shipment.isInsured && (
                      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-100/70 to-emerald-100/70 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200/50 dark:border-green-800/50 hover:shadow-lg transition-all duration-300 group/feature">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm transform group-hover/feature:scale-110 group-hover/feature:rotate-3 transition-all duration-300">
                          <FiShield className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-green-700 dark:text-green-400">
                            Insurance Coverage
                          </span>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Protected against loss or damage
                          </p>
                        </div>
                      </div>
                    )}

                    {shipment.details?.requiresSignature && (
                      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-100/70 to-cyan-100/70 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50 hover:shadow-lg transition-all duration-300 group/feature">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-sm transform group-hover/feature:scale-110 group-hover/feature:rotate-3 transition-all duration-300">
                          <FiCheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                            Signature Required
                          </span>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Delivery confirmation needed
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Support Documents */}
            {shipment.details?.documentHash && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-pink-500/5 dark:from-rose-500/10 dark:to-pink-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-6 shadow-xl">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FiFileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Documents
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        Supporting files
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${shipment.details.documentHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/doc flex items-center space-x-4 p-4 bg-gradient-to-r from-rose-50/70 to-pink-50/70 dark:from-rose-900/30 dark:to-pink-900/30 rounded-xl border border-rose-200/50 dark:border-rose-800/50 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover/doc:scale-110 group-hover/doc:rotate-3 transition-all duration-300">
                      <FiFileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                        Supporting Document
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                        <span>Click to view</span>
                        <FiExternalLink className="w-3 h-3" />
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-white/80 dark:bg-gray-800/80 rounded-lg flex items-center justify-center shadow-sm opacity-0 group-hover/doc:opacity-100 transition-opacity duration-300">
                      <FiEye className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Update Modal */}
        {showUpdateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="relative group max-w-md w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-3xl blur opacity-75"></div>

              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`
                        w-10 h-10 rounded-xl flex items-center justify-center shadow-lg
                        ${
                          updateType === "start"
                            ? "bg-gradient-to-r from-green-500 to-emerald-600"
                            : updateType === "update"
                            ? "bg-gradient-to-r from-blue-500 to-cyan-600"
                            : updateType === "complete"
                            ? "bg-gradient-to-r from-green-500 to-emerald-600"
                            : "bg-gradient-to-r from-red-500 to-rose-600"
                        }
                      `}
                      >
                        {updateType === "start" && (
                          <FiPlay className="w-5 h-5 text-white" />
                        )}
                        {updateType === "update" && (
                          <FiEdit3 className="w-5 h-5 text-white" />
                        )}
                        {updateType === "complete" && (
                          <FiCheck className="w-5 h-5 text-white" />
                        )}
                        {updateType === "cancel" && (
                          <FiX className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {updateType === "start" && "Start Shipment"}
                          {updateType === "update" && "Update Tracking"}
                          {updateType === "complete" && "Complete Delivery"}
                          {updateType === "cancel" && "Cancel Shipment"}
                          {updateType === "escrow_carrier" && "Confirm Delivery"}
                          {updateType === "escrow_receiver" && "Confirm Receipt"}
                          {updateType === "release_funds" && "Release Escrow Funds"}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {updateType === "start" && "Mark as picked up and in transit"}
                          {updateType === "update" && "Add new tracking information"}
                          {updateType === "complete" && "Confirm successful delivery"}
                          {updateType === "cancel" && "Cancel this shipment permanently"}
                          {updateType === "escrow_carrier" && "Escrow: confirm your side"}
                          {updateType === "escrow_receiver" && "Escrow: confirm your side"}
                          {updateType === "release_funds" && "Both parties agreed — release payment on-chain"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowUpdateModal(false)}
                      className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {updateType === "escrow_carrier" || updateType === "escrow_receiver" ? (
                      /* Escrow confirmation card — no form fields needed */
                      <div className="rounded-2xl p-6 text-center" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.05))", border: "1px solid rgba(139,92,246,0.2)" }}>
                        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                          style={{ background: updateType === "escrow_carrier" ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#8b5cf6,#6366f1)" }}>
                          <FiCheck className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                          {updateType === "escrow_carrier" ? "Confirm you have delivered this package" : "Confirm you have received this package"}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                          {updateType === "escrow_carrier"
                            ? "By confirming, you agree that the shipment has been handed over to the receiver. Funds will be released only after the receiver also confirms."
                            : "By confirming, you agree that the package has been received in good condition. If the carrier has also confirmed, funds will be released immediately."}
                        </p>
                      </div>
                    ) : updateType !== "cancel" ? (
                      <>
                        <div>
                          <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                            <FiMapPin className="w-4 h-4" />
                            <span>
                              Location *
                              {updateType === "complete" &&
                                " (Delivery Address)"}
                            </span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={updateForm.location}
                              onChange={(e) =>
                                setUpdateForm((prev) => ({
                                  ...prev,
                                  location: e.target.value,
                                }))
                              }
                              placeholder={
                                updateType === "complete"
                                  ? "Final delivery address"
                                  : "Current location or checkpoint"
                              }
                              className="w-full pl-4 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <FiGlobe className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                        </div>

                        {updateType === "update" && (
                          <div>
                            <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                              <FiActivity className="w-4 h-4" />
                              <span>Status</span>
                            </label>
                            <select
                              value={updateForm.status}
                              onChange={(e) =>
                                setUpdateForm((prev) => ({
                                  ...prev,
                                  status: e.target.value,
                                }))
                              }
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
                            >
                              <option value="In Transit">In Transit</option>
                              <option value="At Sorting Facility">
                                At Sorting Facility
                              </option>
                              <option value="Out for Delivery">
                                Out for Delivery
                              </option>
                              <option value="Attempted Delivery">
                                Attempted Delivery
                              </option>
                              <option value="On Hold">On Hold</option>
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                            <FiEdit3 className="w-4 h-4" />
                            <span>Notes (Optional)</span>
                          </label>
                          <textarea
                            value={updateForm.notes}
                            onChange={(e) =>
                              setUpdateForm((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                            rows={3}
                            placeholder="Additional information, special instructions, or observations..."
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none transition-all duration-300"
                          />
                        </div>

                        <div>
                          <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                            <FiCamera className="w-4 h-4" />
                            <span>Photo (Optional)</span>
                          </label>
                          <div className="relative group/upload">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-xl blur opacity-0 group-hover/upload:opacity-100 transition-opacity duration-300"></div>

                            <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300">
                              <div className="text-center">
                                <div className="w-12 h-12 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mb-3 transform group-hover/upload:scale-110 transition-transform duration-300">
                                  <FiCamera className="w-6 h-6 text-white" />
                                </div>
                                <label className="cursor-pointer text-blue-600 hover:text-blue-500 font-bold text-sm">
                                  {uploadingImage ? (
                                    <span className="flex items-center justify-center space-x-2">
                                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                      <span>Uploading...</span>
                                    </span>
                                  ) : (
                                    "Upload photo"
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        setUpdateForm((prev) => ({
                                          ...prev,
                                          imageFile: file,
                                        }));
                                        handleImageUpload(file);
                                      }
                                    }}
                                    className="sr-only"
                                    disabled={uploadingImage}
                                  />
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  PNG, JPG, GIF up to 10MB
                                </p>
                              </div>
                              {updateForm.imageHash && (
                                <div className="mt-4 p-3 bg-gradient-to-r from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200/50 dark:border-green-800/50">
                                  <div className="flex items-center space-x-2">
                                    <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <span className="text-sm font-medium text-green-800 dark:text-green-300">
                                      Photo uploaded successfully!
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                          <FiAlertCircle className="w-4 h-4" />
                          <span>Cancellation Reason *</span>
                        </label>
                        <textarea
                          value={updateForm.reason}
                          onChange={(e) =>
                            setUpdateForm((prev) => ({
                              ...prev,
                              reason: e.target.value,
                            }))
                          }
                          rows={4}
                          placeholder="Please provide a detailed reason for cancelling this shipment. This information will be recorded on the blockchain..."
                          className="w-full px-4 py-3 border border-red-300 dark:border-red-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none transition-all duration-300"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-4 mt-8">
                    <button
                      onClick={() => setShowUpdateModal(false)}
                      className="flex-1 px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitUpdate}
                      disabled={isPending || isConfirming || uploadingImage}
                      className={`
                        flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105
                        ${
                          updateType === "cancel"
                            ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
                            : updateType === "complete"
                            ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                            : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        }
                        ${
                          isPending || isConfirming || uploadingImage
                            ? "opacity-50 cursor-not-allowed transform-none"
                            : ""
                        }
                      `}
                    >
                      {isPending || isConfirming ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          {updateType === "start" && (
                            <FiPlay className="w-4 h-4" />
                          )}
                          {updateType === "update" && (
                            <FiEdit3 className="w-4 h-4" />
                          )}
                          {(updateType === "complete" || updateType === "escrow_carrier" || updateType === "escrow_receiver") && (
                            <FiCheck className="w-4 h-4" />
                          )}
                          {updateType === "cancel" && (
                            <FiX className="w-4 h-4" />
                          )}
                          <span>
                            {updateType === "start" && "Start Shipment"}
                            {updateType === "update" && "Update Status"}
                            {updateType === "complete" && "Mark as Delivered"}
                            {updateType === "escrow_carrier" && "Confirm Delivery"}
                            {updateType === "escrow_receiver" && "Confirm Receipt"}
                            {updateType === "cancel" && "Cancel Shipment"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TrackingDetails;
