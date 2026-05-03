import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAccount, useContractRead } from "wagmi";
import { useRegisterUser } from "../hooks/useSupplyChainActions";
import { uploadFileToIPFS } from "../utils/pinata";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/contractABI";
import Layout from "../components/Layout/Layout";
import toast from "react-hot-toast";
import {
  FiShield,
  FiUser,
  FiMail,
  FiPhone,
  FiHome,
  FiUpload,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiFileText,
  FiCamera,
  FiStar,
  FiHeart,
  FiZap,
  FiDatabase,
  FiAward,
  FiActivity,
  FiRefreshCw,
} from "react-icons/fi";

const KYCVerification = () => {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    nationalId: "",
    homeAddress: "",
    idDocument: null,
    addressProof: null,
    profileImage: null,
    idDocumentHash: "",
    addressProofHash: "",
    profileImageHash: "",
  });

  const [uploading, setUploading] = useState({
    idDocument: false,
    addressProof: false,
    profileImage: false,
  });

  const [currentStep, setCurrentStep] = useState(1);

  // Check user registration and KYC status
  const { data: isRegistered } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isRegistered",
    args: [address],
    enabled: !!address,
  });

  const { data: userKYC } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getUserKYC",
    args: [address],
    enabled: !!address,
  });

  const { data: isUserVerified } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isUserVerified",
    args: [address],
    enabled: !!address,
  });

  // Initialize the register user hook
  const {
    write: registerWrite,
    isLoading: registerLoading,
    isConfirming: registerConfirming,
    isConfirmed: registerConfirmed,
    error: registerError,
  } = useRegisterUser();

  useEffect(() => {
    if (registerConfirmed) {
      setShowSuccessModal(true);
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        nationalId: "",
        homeAddress: "",
        idDocument: null,
        addressProof: null,
        profileImage: null,
        idDocumentHash: "",
        addressProofHash: "",
        profileImageHash: "",
      });
      setCurrentStep(1);
      // Auto-redirect to dashboard after 4 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        router.push("/");
      }, 4000);
    }
  }, [registerConfirmed]);

  useEffect(() => {
    if (registerError) {
      toast.error(registerError.shortMessage || registerError.message || "Submission failed");
    }
  }, [registerError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = async (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    const allowedTypes = {
      idDocument: ["image/jpeg", "image/jpg", "image/png", "application/pdf"],
      addressProof: ["image/jpeg", "image/jpg", "image/png", "application/pdf"],
      profileImage: ["image/jpeg", "image/jpg", "image/png"],
    };

    if (!allowedTypes[fileType].includes(file.type)) {
      toast.error("Invalid file type. Please upload JPG, PNG or PDF files.");
      return;
    }

    setUploading((prev) => ({ ...prev, [fileType]: true }));

    try {
      const result = await uploadFileToIPFS(file);
      if (result.success) {
        setFormData((prev) => ({
          ...prev,
          [fileType]: file,
          [`${fileType}Hash`]: result.hash,
        }));
        toast.success(
          `${fileType
            .replace(/([A-Z])/g, " $1")
            .toLowerCase()} uploaded successfully`
        );
      } else {
        toast.error(
          `Failed to upload ${fileType
            .replace(/([A-Z])/g, " $1")
            .toLowerCase()}`
        );
      }
    } catch (error) {
      toast.error("Upload failed. Please try again.");
      console.error("Upload error:", error);
    } finally {
      setUploading((prev) => ({ ...prev, [fileType]: false }));
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.fullName && formData.email && formData.phoneNumber;
      case 2:
        return formData.nationalId && formData.homeAddress;
      case 3:
        return formData.idDocumentHash && formData.addressProofHash;
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

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phoneNumber ||
      !formData.nationalId ||
      !formData.homeAddress ||
      !formData.idDocumentHash ||
      !formData.addressProofHash
    ) {
      toast.error("Please complete all required fields and upload documents");
      return;
    }

    if (!registerWrite) {
      toast.error("Wallet not connected or contract not ready");
      return;
    }

    try {
      registerWrite({
        args: [
          formData.fullName,
          formData.email,
          formData.phoneNumber,
          formData.nationalId,
          formData.homeAddress,
          formData.idDocumentHash,
          formData.addressProofHash,
          formData.profileImageHash || "",
        ],
      });
    } catch (err) {
      toast.error(err.shortMessage || err.message || "Failed to submit");
    }
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

  const stepTitles = ["Personal Info", "Identity", "Documents", "Review"];
  const stepIcons = [FiUser, FiShield, FiFileText, FiCheckCircle];

  if (!isConnected) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-3xl blur opacity-50"></div>

            <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-12 shadow-xl text-center">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 mb-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <FiShield className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Connect Your Wallet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
                Please connect your wallet to access KYC verification and unlock
                platform features
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show current KYC status if already registered
  if (isRegistered && userKYC) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Enhanced Header */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

            <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

              <div className="relative z-10 flex items-center space-x-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 via-emerald-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <FiAward className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                    KYC Verification Status
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Your identity verification details and current status
                  </p>
                </div>
                {getStatusBadge(userKYC.status)}
              </div>
            </div>
          </div>

          {/* Enhanced Status Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

            <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FiDatabase className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Verification Details
                    </h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Live Data
                    </span>
                  </div>
                </div>

                {/* Rejection Reason */}
                {userKYC.status === 2 && userKYC.rejectionReason && (
                  <div className="relative group/rejection mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20 rounded-2xl blur opacity-50 group-hover/rejection:opacity-75 transition-opacity duration-300"></div>

                    <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 shadow-lg">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                          <FiXCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-red-800 dark:text-red-300 mb-2">
                            Application Rejected
                          </h4>
                          <p className="text-red-700 dark:text-red-400 leading-relaxed">
                            {userKYC.rejectionReason}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Personal Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      label: "Full Name",
                      value: userKYC.fullName,
                      icon: FiUser,
                    },
                    {
                      label: "Email Address",
                      value: userKYC.email,
                      icon: FiMail,
                    },
                    {
                      label: "Phone Number",
                      value: userKYC.phoneNumber,
                      icon: FiPhone,
                    },
                    {
                      label: "National ID",
                      value: userKYC.nationalId,
                      icon: FiShield,
                    },
                    {
                      label: "Submitted At",
                      value: new Date(
                        Number(userKYC.submittedAt) * 1000
                      ).toLocaleDateString(),
                      icon: FiClock,
                    },
                    ...(userKYC.verifiedAt && Number(userKYC.verifiedAt) > 0
                      ? [
                          {
                            label: "Verified At",
                            value: new Date(
                              Number(userKYC.verifiedAt) * 1000
                            ).toLocaleDateString(),
                            icon: FiCheckCircle,
                          },
                        ]
                      : []),
                  ].map((item, idx) => {
                    const ItemIcon = item.icon;
                    return (
                      <div key={idx} className="relative group/item">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-blue-500/5 dark:from-gray-500/10 dark:to-blue-500/10 rounded-xl blur opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>

                        <div className="relative bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 p-4 shadow-lg group-hover/item:shadow-xl transition-all duration-300">
                          <div className="flex items-center space-x-3">
                            <ItemIcon className="w-5 h-5 text-blue-500" />
                            <div className="flex-1">
                              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {item.label}
                              </h4>
                              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                {item.value || "Not provided"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Home Address */}
                <div className="mt-6 relative group/address">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-blue-500/5 dark:from-gray-500/10 dark:to-blue-500/10 rounded-xl blur opacity-0 group-hover/address:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 p-4 shadow-lg group-hover/address:shadow-xl transition-all duration-300">
                    <div className="flex items-start space-x-3">
                      <FiHome className="w-5 h-5 text-blue-500 mt-1" />
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Home Address
                        </h4>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1 leading-relaxed">
                          {userKYC.homeAddress || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                {userKYC.status === 1 && (
                  <div className="relative group/success mt-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 rounded-2xl blur opacity-50 group-hover/success:opacity-75 transition-opacity duration-300"></div>

                    <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 shadow-xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25 animate-pulse">
                          <FiCheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-green-800 dark:text-green-300 mb-2">
                            🎉 Verification Complete!
                          </h4>
                          <p className="text-green-700 dark:text-green-400 leading-relaxed">
                            Your identity has been successfully verified! You
                            now have full access to create and manage shipments
                            on our platform.
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping delay-100"></div>
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping delay-200"></div>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-ping delay-300"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

          <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

            <div className="relative z-10 flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FiShield className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                  KYC Verification
                </h1>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Complete your identity verification to access all platform
                  features and ensure secure transactions
                </p>
              </div>
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-100/70 to-purple-100/70 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 shadow-lg">
                <FiZap className="w-4 h-4" />
                <span>Secure Process</span>
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
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FiUser className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Personal Information
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Tell us about yourself
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        <FiUser className="inline w-4 h-4 mr-2" />
                        Full Name *
                      </label>
                      <div className="relative group/input">
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Enter your full legal name"
                          className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70"
                          required
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        <FiMail className="inline w-4 h-4 mr-2" />
                        Email Address *
                      </label>
                      <div className="relative group/input">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your.email@example.com"
                          className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70"
                          required
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        <FiPhone className="inline w-4 h-4 mr-2" />
                        Phone Number *
                      </label>
                      <div className="relative group/input">
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 123-4567"
                          className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70"
                          required
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Notice */}
                  <div className="relative group/notice">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 rounded-2xl blur opacity-50 group-hover/notice:opacity-75 transition-opacity duration-300"></div>

                    <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 shadow-lg">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover/notice:scale-110 transition-transform duration-300">
                          <FiShield className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-2">
                            Privacy & Security
                          </h4>
                          <p className="text-blue-700 dark:text-blue-400 leading-relaxed">
                            Your personal information is encrypted and stored
                            securely on IPFS. We comply with privacy regulations
                            and only use this data for identity verification
                            purposes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Identity Details */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FiShield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Identity Details
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Verify your identity information
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        <FiFileText className="inline w-4 h-4 mr-2" />
                        National ID / Passport Number *
                      </label>
                      <div className="relative group/input">
                        <input
                          type="text"
                          name="nationalId"
                          value={formData.nationalId}
                          onChange={handleInputChange}
                          placeholder="Enter your ID or passport number"
                          className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70"
                          required
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        <FiHome className="inline w-4 h-4 mr-2" />
                        Home Address *
                      </label>
                      <div className="relative group/input">
                        <textarea
                          name="homeAddress"
                          value={formData.homeAddress}
                          onChange={handleInputChange}
                          rows={4}
                          placeholder="Enter your complete residential address"
                          className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300 group-hover/input:bg-white/70 dark:group-hover/input:bg-gray-800/70 resize-none"
                          required
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Important Notice */}
                  <div className="relative group/notice">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 dark:from-yellow-500/20 dark:to-amber-500/20 rounded-2xl blur opacity-50 group-hover/notice:opacity-75 transition-opacity duration-300"></div>

                    <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 shadow-lg">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg group-hover/notice:scale-110 transition-transform duration-300">
                          <FiFileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-yellow-800 dark:text-yellow-300 mb-2">
                            Important Notice
                          </h4>
                          <p className="text-yellow-700 dark:text-yellow-400 leading-relaxed">
                            Please ensure all information matches exactly with
                            your government-issued ID documents. Any
                            discrepancies may result in verification delays or
                            rejection.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Document Upload */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FiFileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Document Upload
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Upload your verification documents
                      </p>
                    </div>
                  </div>

                  {/* ID Document Upload */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Government ID Document *
                    </label>
                    <div className="relative group/upload">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-2xl blur opacity-0 group-hover/upload:opacity-100 transition-opacity duration-300"></div>

                      <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-6 transform group-hover/upload:scale-110 group-hover/upload:rotate-3 transition-all duration-300">
                          <FiFileText className="w-8 h-8 text-white" />
                        </div>
                        <div className="space-y-2">
                          <label className="relative cursor-pointer inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                            <FiUpload className="relative z-10 w-4 h-4" />
                            <span className="relative z-10">
                              Upload ID Document
                            </span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) =>
                                handleFileUpload(e, "idDocument")
                              }
                              className="sr-only"
                              disabled={uploading.idDocument}
                            />
                          </label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            or drag and drop your file here
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PNG, JPG, PDF up to 5MB
                          </p>
                        </div>

                        {uploading.idDocument && (
                          <div className="flex items-center justify-center mt-6">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                              Uploading...
                            </span>
                          </div>
                        )}

                        {formData.idDocument && (
                          <div className="mt-6 p-4 bg-gradient-to-r from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200/50 dark:border-green-800/50">
                            <div className="flex items-center space-x-3">
                              <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                {formData.idDocument.name}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address Proof Upload */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Address Proof Document *
                    </label>
                    <div className="relative group/upload">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10 rounded-2xl blur opacity-0 group-hover/upload:opacity-100 transition-opacity duration-300"></div>

                      <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 text-center hover:border-green-500 dark:hover:border-green-400 transition-all duration-300">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25 mb-6 transform group-hover/upload:scale-110 group-hover/upload:rotate-3 transition-all duration-300">
                          <FiHome className="w-8 h-8 text-white" />
                        </div>
                        <div className="space-y-2">
                          <label className="relative cursor-pointer inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                            <FiUpload className="relative z-10 w-4 h-4" />
                            <span className="relative z-10">
                              Upload Address Proof
                            </span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) =>
                                handleFileUpload(e, "addressProof")
                              }
                              className="sr-only"
                              disabled={uploading.addressProof}
                            />
                          </label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            or drag and drop your file here
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Utility bill, bank statement, or lease agreement
                          </p>
                        </div>

                        {uploading.addressProof && (
                          <div className="flex items-center justify-center mt-6">
                            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                              Uploading...
                            </span>
                          </div>
                        )}

                        {formData.addressProof && (
                          <div className="mt-6 p-4 bg-gradient-to-r from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200/50 dark:border-green-800/50">
                            <div className="flex items-center space-x-3">
                              <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                {formData.addressProof.name}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profile Image Upload (Optional) */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Profile Image (Optional)
                    </label>
                    <div className="relative group/upload">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5 dark:from-purple-500/10 dark:to-violet-500/10 rounded-2xl blur opacity-0 group-hover/upload:opacity-100 transition-opacity duration-300"></div>

                      <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 text-center hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-300">
                        <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 mb-4 transform group-hover/upload:scale-110 group-hover/upload:rotate-3 transition-all duration-300">
                          <FiCamera className="w-6 h-6 text-white" />
                        </div>
                        <div className="space-y-2">
                          <label className="relative cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-violet-700 transform hover:scale-105 transition-all duration-300 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-lg"></div>
                            <FiCamera className="relative z-10 w-4 h-4" />
                            <span className="relative z-10">Upload Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleFileUpload(e, "profileImage")
                              }
                              className="sr-only"
                              disabled={uploading.profileImage}
                            />
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Clear headshot photo
                          </p>
                        </div>

                        {uploading.profileImage && (
                          <div className="flex items-center justify-center mt-4">
                            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                              Uploading...
                            </span>
                          </div>
                        )}

                        {formData.profileImage && (
                          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50/70 to-violet-50/70 dark:from-purple-900/30 dark:to-violet-900/30 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
                            <div className="flex items-center space-x-2">
                              <FiCheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                {formData.profileImage.name}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review and Submit */}
              {currentStep === 4 && (
                <div className="space-y-8">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FiCheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Review and Submit
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Confirm your application details
                      </p>
                    </div>
                  </div>

                  {/* Application Summary */}
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
                            Application Summary
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            {
                              label: "Full Name",
                              value: formData.fullName,
                              icon: FiUser,
                            },
                            {
                              label: "Email",
                              value: formData.email,
                              icon: FiMail,
                            },
                            {
                              label: "Phone",
                              value: formData.phoneNumber,
                              icon: FiPhone,
                            },
                            {
                              label: "National ID",
                              value: formData.nationalId,
                              icon: FiShield,
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

                        <div className="mt-4 p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-white/20 dark:border-gray-700/30">
                          <div className="flex items-start space-x-3">
                            <FiHome className="w-4 h-4 text-blue-500 mt-1" />
                            <div className="flex-1">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Address:
                              </span>
                              <p className="text-sm font-bold text-gray-900 dark:text-white mt-1 leading-relaxed">
                                {formData.homeAddress}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Documents Uploaded */}
                  <div className="relative group/docs">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10 rounded-2xl blur opacity-50 group-hover/docs:opacity-75 transition-opacity duration-300"></div>

                    <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 shadow-xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-2xl pointer-events-none"></div>

                      <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                            <FiFileText className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="text-lg font-bold text-green-800 dark:text-green-300">
                            Documents Uploaded
                          </h4>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-white/20 dark:border-gray-700/30">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg">
                              <FiCheckCircle className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">
                              Government ID Document
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-white/20 dark:border-gray-700/30">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                              <FiCheckCircle className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">
                              Address Proof Document
                            </span>
                          </div>

                          {formData.profileImageHash && (
                            <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-white/20 dark:border-gray-700/30">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg">
                                <FiCheckCircle className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                Profile Image
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="relative group/steps">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-amber-500/5 dark:from-yellow-500/10 dark:to-amber-500/10 rounded-2xl blur opacity-50 group-hover/steps:opacity-75 transition-opacity duration-300"></div>

                    <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 shadow-xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-2xl pointer-events-none"></div>

                      <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                            <FiStar className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="text-lg font-bold text-yellow-800 dark:text-yellow-300">
                            What Happens Next?
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            {
                              text: "Your application will be reviewed by our team",
                              icon: FiUser,
                            },
                            {
                              text: "Verification typically takes 1-3 business days",
                              icon: FiClock,
                            },
                            {
                              text: "You'll be notified via email once approved",
                              icon: FiMail,
                            },
                            {
                              text: "Contact support if you have any questions",
                              icon: FiHeart,
                            },
                          ].map((step, idx) => {
                            const StepIcon = step.icon;
                            return (
                              <div
                                key={idx}
                                className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-white/20 dark:border-gray-700/30"
                              >
                                <StepIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                                  {step.text}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
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
                    disabled={
                      registerLoading ||
                      registerConfirming ||
                      !formData.idDocumentHash ||
                      !formData.addressProofHash
                    }
                    className={`
                      group relative px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform flex items-center space-x-3 overflow-hidden
                      ${
                        registerLoading ||
                        registerConfirming ||
                        !formData.idDocumentHash ||
                        !formData.addressProofHash
                          ? "bg-gray-400/70 cursor-not-allowed shadow-lg"
                          : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:scale-105"
                      } text-white
                    `}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
                    {registerLoading || registerConfirming ? (
                      <>
                        <div className="relative z-10 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="relative z-10">
                          {registerLoading ? "Preparing..." : "Submitting..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <FiShield className="relative z-10 w-5 h-5" />
                        <span className="relative z-10">
                          Submit for Verification
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Enhanced Success Message */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative group max-w-md w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur opacity-75"></div>

              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-2xl text-center">
                {/* Close button */}
                <button
                  onClick={() => { setShowSuccessModal(false); router.push("/"); }}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200/70 dark:bg-gray-700/70 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition-all duration-200 text-xl font-bold"
                  aria-label="Close"
                >
                  ×
                </button>

                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/25 mb-6 animate-bounce">
                  <FiCheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Application Submitted Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Your KYC application has been submitted for review. Redirecting to dashboard in a moment...
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                  <button
                    onClick={() => { setShowSuccessModal(false); router.push("/"); }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="flex-1 px-6 py-3 bg-white/70 dark:bg-gray-700/70 text-gray-700 dark:text-gray-300 font-bold rounded-2xl border border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-600 transition-all duration-300 shadow-lg"
                  >
                    Stay on Page
                  </button>
                </div>

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

export default KYCVerification;
