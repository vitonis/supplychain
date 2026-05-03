import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/router";
import { useSupplyChainContract } from "../hooks/useContract";
import {
  uploadFileToIPFS,
  uploadJSONToIPFS,
  uploadMultipleFiles,
} from "../utils/pinata";
import Layout from "../components/Layout/Layout";
import toast from "react-hot-toast";
import {
  FiPackage,
  FiUser,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiUpload,
  FiX,
  FiImage,
  FiFileText,
  FiShield,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiActivity,
  FiStar,
  FiZap,
  FiHeart,
  FiTarget,
  FiDatabase,
  FiAward,
} from "react-icons/fi";

const CreateShipment = () => {
  const { address, isConnected } = useAccount();
  const {
    createShipment,
    useContractRead,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    parseEther,
    formatEther,
  } = useSupplyChainContract();

  const router = useRouter();
  const [txStatus, setTxStatus] = useState(null); // null | 'pending' | 'confirming' | 'confirmed' | 'error'
  const isInProgress = txStatus === 'pending' || txStatus === 'confirming';

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    // Shipment details
    title: "",
    description: "",
    senderName: "",
    receiverName: "",
    category: 0, // ELECTRONICS
    shipmentType: 0, // STANDARD
    weight: "",
    dimensions: "",
    requiresSignature: false,
    declaredValue: "",

    // Addresses and timing
    receiver: "",
    carrier: "",
    pickupTime: "",
    estimatedDelivery: "",

    // Insurance and special handling
    requireInsurance: false,

    // Files
    images: [],
    documents: [],
    imageHashes: [],
    documentHash: "",
  });

  // Check if user is verified
  const { data: isUserVerified } = useContractRead("isUserVerified", [address]);

  // Track transaction lifecycle
  useEffect(() => {
    if (isPending) setTxStatus('pending');
  }, [isPending]);

  useEffect(() => {
    if (isConfirming) setTxStatus('confirming');
  }, [isConfirming]);

  useEffect(() => {
    if (isConfirmed) {
      setTxStatus('confirmed');
      toast.success("Shipment created successfully!");
    }
  }, [isConfirmed]);

  // Warn user before closing tab while tx is in progress
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isInProgress) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isInProgress]);

  // Block Next.js client-side navigation while tx is in progress
  useEffect(() => {
    const handleRouteChange = (url) => {
      if (isInProgress) {
        router.events.emit('routeChangeError');
        throw 'Transaction in progress — navigation blocked. Please wait.';
      }
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [isInProgress, router]);

  const handleDismissSuccess = () => {
    setTxStatus(null);
    setFormData({
      title: "", description: "", senderName: "", receiverName: "",
      category: 0, shipmentType: 0, weight: "", dimensions: "",
      requiresSignature: false, declaredValue: "", receiver: "",
      carrier: "", pickupTime: "", estimatedDelivery: "",
      requireInsurance: false, images: [], documents: [],
      imageHashes: [], documentHash: "",
    });
    setCurrentStep(1);
  };

  const categories = [
    "Electronics",
    "Clothing",
    "Books",
    "Food",
    "Medical",
    "Other",
  ];

  const shipmentTypes = ["Standard", "Express", "Overnight", "Fragile"];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (formData.images.length + files.length > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }

    setUploadingImages(true);
    try {
      const results = await uploadMultipleFiles(files);
      const successfulUploads = results.filter((result) => result.success);

      if (successfulUploads.length > 0) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...files],
          imageHashes: [
            ...prev.imageHashes,
            ...successfulUploads.map((result) => result.hash),
          ],
        }));
        toast.success(
          `${successfulUploads.length} images uploaded successfully`
        );
      }

      const failedUploads = results.filter((result) => !result.success);
      if (failedUploads.length > 0) {
        toast.error(`${failedUploads.length} images failed to upload`);
      }
    } catch (error) {
      toast.error("Error uploading images");
      console.error("Upload error:", error);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await uploadFileToIPFS(file);
      if (result.success) {
        setFormData((prev) => ({
          ...prev,
          documents: [file],
          documentHash: result.hash,
        }));
        toast.success("Document uploaded successfully");
      } else {
        toast.error("Error uploading document");
      }
    } catch (error) {
      toast.error("Error uploading document");
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imageHashes: prev.imageHashes.filter((_, i) => i !== index),
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return (
          formData.title &&
          formData.description &&
          formData.senderName &&
          formData.receiverName
        );
      case 2:
        return (
          formData.receiver &&
          formData.carrier &&
          formData.pickupTime &&
          formData.estimatedDelivery
        );
      case 3:
        return formData.declaredValue && formData.weight && formData.dimensions;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isUserVerified) {
      toast.error("Please complete KYC verification first");
      return;
    }

    if (!validateStep(3)) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate declared value
    const declaredValueNum = parseFloat(formData.declaredValue);
    if (isNaN(declaredValueNum) || declaredValueNum <= 0) {
      toast.error("Please enter a valid declared value");
      return;
    }

    setLoading(true);
    try {
      const pickupTimestamp = Math.floor(
        new Date(formData.pickupTime).getTime() / 1000
      );
      const deliveryTimestamp = Math.floor(
        new Date(formData.estimatedDelivery).getTime() / 1000
      );

      const shipmentData = {
        title: formData.title,
        description: formData.description,
        senderName: formData.senderName,
        receiverName: formData.receiverName,
        category: parseInt(formData.category),
        shipmentType: parseInt(formData.shipmentType),
        weight: formData.weight, // Keep as string, will be converted in the hook
        dimensions: formData.dimensions,
        imageHashes: formData.imageHashes,
        documentHash: formData.documentHash,
        requiresSignature: formData.requiresSignature,
        declaredValue: formData.declaredValue, // This will be used as both value and payment
        receiver: formData.receiver,
        carrier: formData.carrier,
        pickupTime: pickupTimestamp,
        estimatedDelivery: deliveryTimestamp,
        requireInsurance: formData.requireInsurance,
      };

      console.log(
        "Submitting shipment with declared value:",
        formData.declaredValue,
        "ETH"
      );
      console.log("Shipment data:", shipmentData);

      // No fee calculation needed - just pass the shipment data
      await createShipment(shipmentData);
    } catch (error) {
      toast.error("Error creating shipment");
      console.error("Shipment creation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = ["Basic Info", "Addresses", "Details", "Review"];
  const stepIcons = [FiUser, FiMapPin, FiPackage, FiCheckCircle];

  if (!isConnected) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-3xl blur opacity-50"></div>

            <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-12 shadow-xl text-center">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 mb-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <FiPackage className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Connect Your Wallet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
                Please connect your wallet to start creating shipments on our
                decentralized platform
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }


  const EXPLORER = process.env.NEXT_PUBLIC_BLOCK_EXPLORER;

  return (
    <Layout>
      {/* ── Transaction Status Overlay ── */}
      {txStatus && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-md mx-4">
            {/* Glow */}
            <div className={`absolute inset-0 rounded-3xl blur-xl opacity-40 ${
              txStatus === 'confirmed'
                ? 'bg-gradient-to-br from-green-400 to-emerald-600'
                : 'bg-gradient-to-br from-blue-500 to-purple-600'
            }`}></div>

            <div className="relative bg-gray-900/95 border border-white/10 rounded-3xl p-10 shadow-2xl text-center">

              {/* Pending / Confirming */}
              {(txStatus === 'pending' || txStatus === 'confirming') && (
                <>
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-purple-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FiTruck className="w-10 h-10 text-blue-400" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">
                    {txStatus === 'pending' ? 'Waiting for MetaMask…' : 'Confirming on blockchain…'}
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {txStatus === 'pending'
                      ? 'Please approve the transaction in your MetaMask popup.'
                      : 'Transaction submitted! Waiting for block confirmation — please don\'t close or navigate away.'}
                  </p>
                  {hash && (
                    <a
                      href={`${EXPLORER}/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 text-xs font-mono text-blue-400 hover:text-blue-300 underline break-all"
                    >
                      {hash.slice(0, 24)}…{hash.slice(-8)}
                    </a>
                  )}
                  <div className="mt-6 flex justify-center gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }}></div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-yellow-400 font-medium">
                    ⚠️ Navigation is locked while the transaction is processing.
                  </p>
                </>
              )}

              {/* Success */}
              {txStatus === 'confirmed' && (
                <>
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                    <FiCheckCircle className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">Shipment Created! 🎉</h2>
                  <p className="text-gray-400 text-sm mb-4">Your shipment has been recorded on the blockchain.</p>

                  {hash && (
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-6 text-left">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Transaction Hash</p>
                      <a
                        href={`${EXPLORER}/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-green-400 hover:text-green-300 underline break-all"
                      >
                        {hash}
                      </a>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleDismissSuccess}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      Create Another
                    </button>
                    <button
                      onClick={() => { handleDismissSuccess(); router.push('/shipments'); }}
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      My Shipments
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

          <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

            <div className="relative z-10 flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FiTruck className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                  Create New Shipment
                </h1>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Fill in the details to create a new shipment - Pay only the
                  declared value, no additional fees!
                </p>
              </div>
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-green-100/70 to-emerald-100/70 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-800/50 shadow-lg">
                <FiHeart className="w-4 h-4" />
                <span>Fee-Free</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Progress Steps */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

          <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                {[1, 2, 3, 4].map((step, index) => {
                  const StepIcon = stepIcons[index];
                  const isActive = currentStep >= step;
                  const isCurrent = currentStep === step;

                  return (
                    <div key={step} className="flex items-center">
                      <div className="relative">
                        <div
                          className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-300
                            ${
                              isActive
                                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white transform scale-110"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                            }
                            ${isCurrent ? "animate-pulse" : ""}
                          `}
                        >
                          <StepIcon className="w-5 h-5" />
                        </div>
                        {isActive && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                        )}
                      </div>
                      {step < 4 && (
                        <div className="relative mx-4 w-24 h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                          <div
                            className={`
                              h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out
                              ${currentStep > step ? "w-full" : "w-0"}
                            `}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between">
                {stepTitles.map((title, index) => (
                  <div key={index} className="text-center">
                    <span
                      className={`text-sm font-medium transition-colors duration-300 ${
                        currentStep >= index + 1
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Form */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-indigo-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

          <form
            onSubmit={handleSubmit}
            className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

            <div className="relative z-10">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FiUser className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Basic Information
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Tell us about your shipment
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Shipment Title *
                      </label>
                      <div className="relative group/input">
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="e.g., Electronics Package"
                          className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70"
                          required
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Category *
                      </label>
                      <div className="relative group/input">
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70 appearance-none"
                          required
                        >
                          {categories.map((category, index) => (
                            <option key={index} value={index}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Sender Name *
                      </label>
                      <div className="relative group/input">
                        <input
                          type="text"
                          name="senderName"
                          value={formData.senderName}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70"
                          required
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Receiver Name *
                      </label>
                      <div className="relative group/input">
                        <input
                          type="text"
                          name="receiverName"
                          value={formData.receiverName}
                          onChange={handleInputChange}
                          placeholder="Recipient's full name"
                          className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70"
                          required
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Shipment Type *
                      </label>
                      <div className="relative group/input">
                        <select
                          name="shipmentType"
                          value={formData.shipmentType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70 appearance-none"
                          required
                        >
                          {shipmentTypes.map((type, index) => (
                            <option key={index} value={index}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Description *
                    </label>
                    <div className="relative group/input">
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Detailed description of the package contents..."
                        className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70 resize-none"
                        required
                      />
                      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Addresses and Timing */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FiMapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Addresses and Timing
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Set delivery details and schedule
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Receiver Address *
                      </label>
                      <div className="relative group/input">
                        <input
                          type="text"
                          name="receiver"
                          value={formData.receiver}
                          onChange={handleInputChange}
                          placeholder="0x..."
                          className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white font-mono text-sm transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70"
                          required
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Carrier Address *
                      </label>
                      <div className="relative group/input">
                        <input
                          type="text"
                          name="carrier"
                          value={formData.carrier}
                          onChange={handleInputChange}
                          placeholder="0x..."
                          className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white font-mono text-sm transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70"
                          required
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Pickup Time *
                      </label>
                      <div className="relative group/input">
                        <input
                          type="datetime-local"
                          name="pickupTime"
                          value={formData.pickupTime}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70"
                          required
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Estimated Delivery *
                      </label>
                      <div className="relative group/input">
                        <input
                          type="datetime-local"
                          name="estimatedDelivery"
                          value={formData.estimatedDelivery}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70"
                          required
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Package Details */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FiPackage className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Package Details
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Specify package information and upload media
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Declared Value (ETH) *
                      </label>
                      <div className="relative group/input">
                        <input
                          type="number"
                          step="0.0001"
                          name="declaredValue"
                          value={formData.declaredValue}
                          onChange={handleInputChange}
                          placeholder="0.1"
                          className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70"
                          required
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200/50 dark:border-green-800/50">
                        <p className="text-xs font-medium text-green-700 dark:text-green-300 flex items-center space-x-2">
                          <FiHeart className="w-3 h-3" />
                          <span>
                            This is the amount you'll pay - no additional fees!
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Weight (kg) *
                      </label>
                      <div className="relative group/input">
                        <input
                          type="number"
                          step="0.1"
                          name="weight"
                          value={formData.weight}
                          onChange={handleInputChange}
                          placeholder="1.5"
                          className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70"
                          required
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Dimensions *
                      </label>
                      <div className="relative group/input">
                        <input
                          type="text"
                          name="dimensions"
                          value={formData.dimensions}
                          onChange={handleInputChange}
                          placeholder="30x20x10 cm"
                          className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70"
                          required
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Package Images Upload */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Package Images (Max 10)
                    </label>
                    <div className="relative group/upload">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-2xl blur opacity-0 group-hover/upload:opacity-100 transition-opacity duration-300"></div>

                      <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-6 transform group-hover/upload:scale-110 group-hover/upload:rotate-3 transition-all duration-300">
                          <FiImage className="w-8 h-8 text-white" />
                        </div>
                        <div className="space-y-2">
                          <label className="relative cursor-pointer inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                            <FiUpload className="relative z-10 w-4 h-4" />
                            <span className="relative z-10">Upload Images</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="sr-only"
                              disabled={uploadingImages}
                            />
                          </label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            or drag and drop your files here
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PNG, JPG, GIF up to 10MB each
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Image Preview */}
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="group relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            <div className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 p-2 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Package image ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full flex items-center justify-center hover:from-red-600 hover:to-red-700 transform hover:scale-110 transition-all duration-300 shadow-lg"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Enhanced Document Upload */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Supporting Documents (Optional)
                    </label>
                    <div className="relative group/doc">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 dark:from-green-500/10 dark:to-blue-500/10 rounded-2xl blur opacity-0 group-hover/doc:opacity-100 transition-opacity duration-300"></div>

                      <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 hover:border-green-500 dark:hover:border-green-400 transition-all duration-300">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover/doc:scale-110 transition-transform duration-300">
                            <FiFileText className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300">
                              <FiFileText className="w-4 h-4" />
                              <span>Choose Document</span>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={handleDocumentUpload}
                                className="sr-only"
                              />
                            </label>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              PDF, DOC, DOCX, TXT up to 5MB
                            </p>
                          </div>
                        </div>
                        {formData.documents.length > 0 && (
                          <div className="mt-4 p-3 bg-gradient-to-r from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200/50 dark:border-green-800/50">
                            <div className="flex items-center space-x-2">
                              <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                {formData.documents[0].name}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Special Options */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                        <FiStar className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                        Special Options
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative group/option">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-xl blur opacity-0 group-hover/option:opacity-100 transition-opacity duration-300"></div>

                        <div className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 p-4 shadow-lg group-hover/option:shadow-xl transition-all duration-300">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <div className="relative">
                              <input
                                type="checkbox"
                                id="requiresSignature"
                                name="requiresSignature"
                                checked={formData.requiresSignature}
                                onChange={handleInputChange}
                                className="sr-only"
                              />
                              <div
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                                  formData.requiresSignature
                                    ? "bg-gradient-to-r from-blue-500 to-purple-600 border-blue-500"
                                    : "border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50"
                                }`}
                              >
                                {formData.requiresSignature && (
                                  <FiCheckCircle className="w-4 h-4 text-white" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                Requires signature on delivery
                              </span>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Enhanced security for important packages
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="relative group/option">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10 rounded-xl blur opacity-0 group-hover/option:opacity-100 transition-opacity duration-300"></div>

                        <div className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 p-4 shadow-lg group-hover/option:shadow-xl transition-all duration-300">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <div className="relative">
                              <input
                                type="checkbox"
                                id="requireInsurance"
                                name="requireInsurance"
                                checked={formData.requireInsurance}
                                onChange={handleInputChange}
                                className="sr-only"
                              />
                              <div
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                                  formData.requireInsurance
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600 border-green-500"
                                    : "border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50"
                                }`}
                              >
                                {formData.requireInsurance && (
                                  <FiShield className="w-4 h-4 text-white" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                Purchase insurance
                              </span>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                No additional cost - included free!
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review and Submit */}
              {currentStep === 4 && (
                <div className="space-y-8">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FiCheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Review and Submit
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Confirm your shipment details before creation
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Payment Information */}
                  <div className="relative group/payment">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 rounded-2xl blur opacity-50 group-hover/payment:opacity-75 transition-opacity duration-300"></div>

                    <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 shadow-xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-2xl pointer-events-none"></div>

                      <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                            <FiDollarSign className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="text-lg font-bold text-green-800 dark:text-green-300">
                            Payment Information
                          </h4>
                          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100/70 to-emerald-100/70 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-800/50">
                            <FiZap className="w-3 h-3" />
                            <span>Fee-Free</span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-white/20 dark:border-gray-700/30">
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">
                              Package Value:
                            </span>
                            <span className="text-lg font-bold text-green-800 dark:text-green-300">
                              {formData.declaredValue} ETH
                            </span>
                          </div>

                          <div className="border-t border-green-200/50 dark:border-green-700/50 pt-4">
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200/50 dark:border-green-800/50">
                              <span className="text-base font-bold text-green-800 dark:text-green-300">
                                Total Payment Required:
                              </span>
                              <span className="text-xl font-black text-green-900 dark:text-green-300">
                                {formData.declaredValue} ETH
                              </span>
                            </div>
                            <div className="flex items-center justify-center space-x-2 mt-3">
                              <FiHeart className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                No platform fees or additional charges!
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Shipment Summary */}
                  <div className="relative group/summary">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-2xl blur opacity-50 group-hover/summary:opacity-75 transition-opacity duration-300"></div>

                    <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 shadow-xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-2xl pointer-events-none"></div>

                      <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <FiDatabase className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                            Shipment Summary
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            {
                              label: "Title",
                              value: formData.title,
                              icon: FiPackage,
                            },
                            {
                              label: "Category",
                              value: categories[formData.category],
                              icon: FiTarget,
                            },
                            {
                              label: "Type",
                              value: shipmentTypes[formData.shipmentType],
                              icon: FiTruck,
                            },
                            {
                              label: "Weight",
                              value: `${formData.weight} kg`,
                              icon: FiActivity,
                            },
                            {
                              label: "From",
                              value: formData.senderName,
                              icon: FiUser,
                            },
                            {
                              label: "To",
                              value: formData.receiverName,
                              icon: FiMapPin,
                            },
                            {
                              label: "Pickup",
                              value: new Date(
                                formData.pickupTime
                              ).toLocaleString(),
                              icon: FiClock,
                            },
                            {
                              label: "Delivery",
                              value: new Date(
                                formData.estimatedDelivery
                              ).toLocaleString(),
                              icon: FiCalendar,
                            },
                          ].map((item, idx) => {
                            const ItemIcon = item.icon;
                            return (
                              <div
                                key={idx}
                                className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-white/20 dark:border-gray-700/30"
                              >
                                <ItemIcon className="w-4 h-4 text-blue-500" />
                                <div className="flex-1">
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {item.label}:
                                  </span>
                                  <span className="ml-2 text-sm font-bold text-gray-900 dark:text-white">
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

                  {/* Enhanced Special Features */}
                  {(formData.requiresSignature ||
                    formData.requireInsurance) && (
                    <div className="relative group/features">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-amber-500/5 dark:from-yellow-500/10 dark:to-amber-500/10 rounded-2xl blur opacity-50 group-hover/features:opacity-75 transition-opacity duration-300"></div>

                      <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-2xl pointer-events-none"></div>

                        <div className="relative z-10">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                              <FiStar className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="text-lg font-bold text-yellow-800 dark:text-yellow-300">
                              Special Features
                            </h4>
                          </div>

                          <div className="space-y-3">
                            {formData.requiresSignature && (
                              <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-white/20 dark:border-gray-700/30">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                                  <FiShield className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                  Signature required on delivery
                                </span>
                              </div>
                            )}
                            {formData.requireInsurance && (
                              <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-white/20 dark:border-gray-700/30">
                                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                                  <FiShield className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                    Insurance coverage included
                                  </span>
                                  <span className="ml-2 text-xs text-green-600 dark:text-green-500">
                                    (No additional cost)
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Navigation Buttons */}
              <div className="flex justify-between items-center pt-8 border-t border-white/20 dark:border-gray-700/30">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`
                    group relative px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform
                    ${
                      currentStep === 1
                        ? "bg-gray-200/50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        : "bg-white/70 dark:bg-gray-700/70 text-gray-700 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-gray-600/90 hover:scale-105 shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20 dark:border-gray-600/30"
                    }
                  `}
                >
                  {currentStep !== 1 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
                  )}
                  <span className="relative z-10">Previous</span>
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
                    <span className="relative z-10">Next Step</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || isPending || isConfirming}
                    className={`
                      group relative px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform flex items-center space-x-3 overflow-hidden
                      ${
                        loading || isPending || isConfirming
                          ? "bg-gray-400/70 cursor-not-allowed shadow-lg"
                          : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:scale-105"
                      } text-white
                    `}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
                    {loading || isPending || isConfirming ? (
                      <>
                        <div className="relative z-10 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="relative z-10">
                          {loading
                            ? "Preparing..."
                            : isPending
                            ? "Confirming..."
                            : "Creating..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <FiTruck className="relative z-10 w-5 h-5" />
                        <span className="relative z-10">Create Shipment</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Enhanced Success Message */}
        {isConfirmed && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative group max-w-md w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur opacity-75"></div>

              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-2xl text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/25 mb-6 animate-bounce">
                  <FiCheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Shipment Created Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Your shipment has been created and is now being processed.
                  You'll receive updates as it moves through the supply chain.
                </p>
                <div className="flex space-x-1 justify-center mt-6">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping delay-100"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping delay-200"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-ping delay-300"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
export default CreateShipment;
