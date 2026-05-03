import { useState, useEffect } from "react";
import { useAccount, useContractRead } from "wagmi";
import { prepareWriteContract, writeContract, waitForTransaction } from "wagmi/actions";
import { parseEther, formatEther } from "viem";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/contractABI";
import { addNotification } from "../utils/notificationStorage";
import toast from "react-hot-toast";

export const useSupplyChainContract = () => {
  const { address, isConnected } = useAccount();

  // Transaction states
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState(null);
  const [hash, setHash] = useState(null);

  // Contract read helper
  const useContractReadHook = (functionName, args = []) => {
    return useContractRead({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName,
      args,
      enabled: isConnected && !!address,
    });
  };

  // Generic function to execute contract writes imperatively
  const executeContractWrite = async (functionName, args = [], value = 0) => {
    try {
      setIsPending(true);
      setError(null);
      setIsConfirmed(false);

      const config = await prepareWriteContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName,
        args,
        value: value > 0 ? parseEther(value.toString()) : undefined,
      });

      const { hash: txHash } = await writeContract(config);
      setHash(txHash);
      setIsPending(false);
      
      setIsConfirming(true);
      const receipt = await waitForTransaction({ hash: txHash });
      
      setIsConfirming(false);
      setIsConfirmed(true);
      
      // Auto-reset confirmed state after a few seconds so subsequent transactions work
      setTimeout(() => setIsConfirmed(false), 3000);

      return true;
    } catch (err) {
      console.error(`Error calling ${functionName}:`, err);
      setError(err);
      toast.error(`Transaction failed: ${err.shortMessage || err.message}`);
      addNotification({
        title: `Error calling ${functionName}`,
        message: err.shortMessage || err.message,
        type: "error",
      });
      setIsPending(false);
      setIsConfirming(false);
      return false;
    }
  };


  // Individual contract functions
  const registerUser = async (kycData) => {
    return await executeContractWrite("registerUser", [
      kycData.fullName,
      kycData.email,
      kycData.phoneNumber,
      kycData.nationalId,
      kycData.homeAddress,
      kycData.idDocumentHash,
      kycData.addressProofHash,
      kycData.profileImageHash,
    ]);
  };

  // Updated createShipment - only requires declared value, no additional fees
  const createShipment = async (shipmentData) => {
    const details = [
      shipmentData.title,
      shipmentData.description,
      shipmentData.senderName,
      shipmentData.receiverName,
      shipmentData.category,
      shipmentData.shipmentType,
      parseEther(shipmentData.weight.toString()),
      shipmentData.dimensions,
      shipmentData.imageHashes,
      shipmentData.documentHash,
      shipmentData.requiresSignature,
      parseEther(shipmentData.declaredValue.toString()),
    ];

    // Only pay the declared value, no additional fees
    return await executeContractWrite(
      "createShipment",
      [
        shipmentData.receiver,
        shipmentData.carrier,
        shipmentData.pickupTime,
        shipmentData.estimatedDelivery,
        shipmentData.requireInsurance,
        details,
      ],
      shipmentData.declaredValue // Only the declared value, no fees added
    );
  };

  const startShipment = async (shipmentId, location, notes, imageHash) => {
    return await executeContractWrite("startShipment", [
      shipmentId,
      location,
      notes,
      imageHash,
    ]);
  };

  const updateTracking = async (
    shipmentId,
    location,
    status,
    notes,
    imageHash
  ) => {
    return await executeContractWrite("updateTracking", [
      shipmentId,
      location,
      status,
      notes,
      imageHash,
    ]);
  };

  // Updated completeShipment - no completion fee required
  const completeShipment = async (
    shipmentId,
    deliveryLocation,
    notes,
    proofImageHash
  ) => {
    return await executeContractWrite(
      "completeShipment",
      [shipmentId, deliveryLocation, notes, proofImageHash]
      // No completion fee parameter
    );
  };

  // Updated cancelShipment - no cancellation fee required
  const cancelShipment = async (shipmentId, reason) => {
    return await executeContractWrite(
      "cancelShipment",
      [shipmentId, reason]
      // No cancellation fee parameter
    );
  };

  // Admin functions
  const approveKYC = async (userAddress) => {
    return await executeContractWrite("approveKYC", [userAddress]);
  };

  const rejectKYC = async (userAddress, reason) => {
    return await executeContractWrite("rejectKYC", [userAddress, reason]);
  };

  const suspendUser = async (userAddress, reason) => {
    return await executeContractWrite("suspendUser", [userAddress, reason]);
  };

  // ── Escrow: carrier or receiver records their on-chain confirmation ──
  const confirmEscrow = async (shipmentId) => {
    return await executeContractWrite("confirmEscrow", [shipmentId]);
  };

  // ── Admin releases payment to carrier (requires both parties confirmed) ──
  const adminReleasePayment = async (shipmentId) => {
    return await executeContractWrite("adminReleasePayment", [shipmentId]);
  };

  return {
    // Contract interaction functions
    registerUser,
    createShipment,
    startShipment,
    updateTracking,
    completeShipment,
    cancelShipment,
    approveKYC,
    rejectKYC,
    suspendUser,
    confirmEscrow,
    adminReleasePayment,

    // Read contract helper
    useContractRead: useContractReadHook,

    // Transaction states
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,

    // Utility functions
    formatEther,
    parseEther,
  };
};
