import {
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { parseEther } from "viem";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/contractABI";
import {
  addNotification,
  NOTIFICATION_TEMPLATES,
} from "../utils/notificationStorage";
import {
  addKYCUser,
  verifyKYCUser,
  getKYCUsers,
  KYC_STATUS,
} from "../utils/kycStorage";
import { useEffect } from "react";
import toast from "react-hot-toast";

// Hook for user registration — uses direct write (no prepare) for Polygon reliability
export const useRegisterUser = () => {
  const { data, write, isLoading, error } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "registerUser",
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransaction({
      hash: data?.hash,
    });

  useEffect(() => {
    if (isConfirmed) {
      toast.success("KYC registration successful!");
      addNotification({
        title: "KYC Registration",
        message: "KYC registration successful!",
        type: "success",
      });
    }
    if (error) {
      toast.error(`Registration failed: ${error.shortMessage || error.message}`);
      addNotification({
        title: "Registration failed",
        message: `Registration failed: ${error.shortMessage || error.message}`,
        type: "error",
      });
    }
  }, [isConfirmed, error]);

  return {
    write,
    data,
    isLoading,
    isConfirming,
    isConfirmed,
    error,
  };
};

// Updated hook for creating shipment - removed fee parameter
export const useCreateShipment = (shipmentData, enabled = false) => {
  const details = shipmentData
    ? [
        shipmentData.title,
        shipmentData.description,
        shipmentData.senderName,
        shipmentData.receiverName,
        shipmentData.category,
        shipmentData.shipmentType,
        parseEther(shipmentData.weight?.toString() || "0"),
        shipmentData.dimensions,
        shipmentData.imageHashes || [],
        shipmentData.documentHash || "",
        shipmentData.requiresSignature || false,
        parseEther(shipmentData.declaredValue?.toString() || "0"),
      ]
    : [];

  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "createShipment",
    args: shipmentData
      ? [
          shipmentData.receiver,
          shipmentData.carrier,
          shipmentData.pickupTime,
          shipmentData.estimatedDelivery,
          shipmentData.requireInsurance,
          details,
        ]
      : [],
    // Only send the declared value, no additional fees
    value:
      shipmentData?.declaredValue > 0
        ? parseEther(shipmentData.declaredValue.toString())
        : undefined,
    enabled: enabled && !!shipmentData,
  });

  const { data, write, isLoading, error } = useContractWrite(config);
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransaction({
      hash: data?.hash,
    });

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Shipment created successfully!");
      addNotification({
        title: "Shipment created",
        message: "Shipment created successfully!",
        type: "success",
      });
    }
    if (error) {
      toast.error(`Shipment creation failed: ${error.message}`);
      addNotification({
        title: "Shipment creation",
        message: `Shipment creation failed: ${error.message}`,
        type: "error",
      });
    }
  }, [isConfirmed, error]);

  return {
    write,
    data,
    isLoading,
    isConfirming,
    isConfirmed,
    error,
  };
};

// Hook for starting shipment - no changes needed
export const useStartShipment = (
  shipmentId,
  location,
  notes,
  imageHash,
  enabled = false
) => {
  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "startShipment",
    args: [shipmentId, location, notes, imageHash],
    enabled: enabled && shipmentId !== undefined,
  });

  const { data, write, isLoading, error } = useContractWrite(config);
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransaction({
      hash: data?.hash,
    });

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Shipment started successfully!");
      addNotification({
        title: "Shipment started",
        message: "Shipment started successfully!",
        type: "success",
      });
    }
    if (error) {
      toast.error(`Failed to start shipment: ${error.message}`);
      addNotification({
        title: "Failed to start",
        message: `Failed to start shipment: ${error.message}`,
        type: "error",
      });
    }
  }, [isConfirmed, error]);

  return {
    write,
    data,
    isLoading,
    isConfirming,
    isConfirmed,
    error,
  };
};

// Hook for updating tracking - no changes needed
export const useUpdateTracking = (
  shipmentId,
  location,
  status,
  notes,
  imageHash,
  enabled = false
) => {
  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "updateTracking",
    args: [shipmentId, location, status, notes, imageHash],
    enabled: enabled && shipmentId !== undefined,
  });

  const { data, write, isLoading, error } = useContractWrite(config);
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransaction({
      hash: data?.hash,
    });

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Tracking updated successfully!");
      addNotification({
        title: "Tracking updated",
        message: "Tracking updated successfully!",
        type: "success",
      });
    }
    if (error) {
      toast.error(`Failed to update tracking: ${error.message}`);
      addNotification({
        title: "Failed to start",
        message: `Failed to update tracking: ${error.message}`,
        type: "error",
      });
    }
  }, [isConfirmed, error]);

  return {
    write,
    data,
    isLoading,
    isConfirming,
    isConfirmed,
    error,
  };
};

// Updated hook for completing shipment - removed completion fee
export const useCompleteShipment = (
  shipmentId,
  deliveryLocation,
  notes,
  proofImageHash,
  enabled = false
) => {
  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "completeShipment",
    args: [shipmentId, deliveryLocation, notes, proofImageHash],
    // No completion fee required
    enabled: enabled && shipmentId !== undefined,
  });

  const { data, write, isLoading, error } = useContractWrite(config);
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransaction({
      hash: data?.hash,
    });

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Shipment completed successfully!");
      addNotification({
        title: "Shipment completed",
        message: "Shipment completed successfully!",
        type: "success",
      });
    }
    if (error) {
      toast.error(`Failed to complete shipment: ${error.message}`);
      addNotification({
        title: "Failed to complete",
        message: `Failed to complete shipment: ${error.message}`,
        type: "error",
      });
    }
  }, [isConfirmed, error]);

  return {
    write,
    data,
    isLoading,
    isConfirming,
    isConfirmed,
    error,
  };
};

// Updated hook for cancelling shipment - removed cancellation fee
export const useCancelShipment = (shipmentId, reason, enabled = false) => {
  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "cancelShipment",
    args: [shipmentId, reason],
    // No cancellation fee required
    enabled: enabled && shipmentId !== undefined,
  });

  const { data, write, isLoading, error } = useContractWrite(config);
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransaction({
      hash: data?.hash,
    });

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Shipment cancelled successfully!");
      addNotification({
        title: "Shipment cancelled",
        message: `Shipment cancelled successfully!`,
        type: "success",
      });
    }
    if (error) {
      toast.error(`Failed to cancel shipment: ${error.message}`);
      addNotification({
        title: "Failed to cancel",
        message: `Failed to cancel shipment: ${error.message}`,
        type: "error",
      });
    }
  }, [isConfirmed, error]);

  return {
    write,
    data,
    isLoading,
    isConfirming,
    isConfirmed,
    error,
  };
};

// Hook for approving KYC — direct write for Polygon reliability
export const useApproveKYC = () => {
  const { data, write, isLoading, error } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "approveKYC",
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransaction({
      hash: data?.hash,
    });

  useEffect(() => {
    if (isConfirmed) {
      toast.success("KYC approved successfully!");
      addNotification({
        title: "KYC approved",
        message: `KYC approved successfully!`,
        type: "success",
      });
    }
    if (error) {
      toast.error(`Failed to approve KYC: ${error.shortMessage || error.message}`);
      addNotification({
        title: "Failed to approve KYC",
        message: `Failed to approve KYC: ${error.shortMessage || error.message}`,
        type: "error",
      });
    }
  }, [isConfirmed, error]);

  return {
    write,
    data,
    isLoading,
    isConfirming,
    isConfirmed,
    error,
  };
};

// Hook for rejecting KYC — direct write for Polygon reliability
export const useRejectKYC = () => {
  const { data, write, isLoading, error } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "rejectKYC",
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransaction({
      hash: data?.hash,
    });

  useEffect(() => {
    if (isConfirmed) {
      toast.success("KYC rejected successfully!");
      addNotification({
        title: "KYC rejected",
        message: `KYC rejected successfully!`,
        type: "success",
      });
    }
    if (error) {
      toast.error(`Failed to reject KYC: ${error.shortMessage || error.message}`);
      addNotification({
        title: "Failed to reject KYC",
        message: `Failed to reject KYC: ${error.shortMessage || error.message}`,
        type: "error",
      });
    }
  }, [isConfirmed, error]);

  return {
    write,
    data,
    isLoading,
    isConfirming,
    isConfirmed,
    error,
  };
};
