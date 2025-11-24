"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAlertDialog } from "@/components/ui/alert-dialog-provider";
import { useActionLoading } from "@/hooks/useActionLoading";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import TransaksiFilters from "@/components/transaksi/TransaksiFilters";
import TransaksiTable from "@/components/transaksi/TransaksiTable";
import TransaksiDialog from "@/components/transaksi/TransaksiDialog";
import TransaksiCompleteModal from "@/components/transaksi/TransaksiCompleteModal";
import TransaksiDetailModal from "@/components/transaksi/TransaksiDetailModal";
import ApprovalDialog from "@/components/transaksi/ApprovalDialog";
import TransactionEditApprovalDialog from "@/components/transaksi/TransactionEditApprovalDialog";
import { Pagination } from "@/components/ui/pagination";

import { startOfMonth, startOfYear, endOfToday } from "date-fns";
import {
  calculateTransactionFinancials,
  calculateTourPackagePriceFromParams,
} from "@/lib/accounting";

function getTodayDateString() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  const localDate = new Date(today.getTime() - offset);
  return localDate.toISOString().split("T")[0];
}

function getLocalDateTimeString(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
}

const INITIAL_FORM_STATE = {
  customer_name: "",
  customer_phone: "",
  booking_date: getTodayDateString(),
  checkout_datetime: getLocalDateTimeString(),
  checkin_datetime: getLocalDateTimeString(
    new Date(Date.now() + 12 * 60 * 60 * 1000)
  ),
  packageId: null,
  armadaId: "",
  driverId: "",
  all_in_rate: 0,
  overtime_rate_per_hour: 0,
  dp_amount: 0,
  payment_status: "UNPAID", // Default status
  hotel_name: "",
  pax_count: "",
  hotel_tier_id: "",
  custom_price: 0,
};

// function calculateFinancials(formData) {
//   const {
//     checkout_datetime,
//     checkin_datetime,
//     all_in_rate,
//     overtime_rate_per_hour,
//     fuel_cost,
//     driver_fee,
//     package: pkg,
//   } = formData;

//   if (!checkout_datetime || !checkin_datetime) return {};

//   const start = new Date(checkout_datetime);
//   const end = new Date(checkin_datetime);

//   if (end <= start) return {};

//   const diffMs = end.getTime() - start.getTime();
//   const lamaSewaJam = Math.round(diffMs / (1000 * 60 * 60));

//   const durasiPaketJam = pkg?.durationHours || 12;

//   const lamaOvertimeJam = Math.max(0, lamaSewaJam - durasiPaketJam);

//   const totalOvertimeFee =
//     lamaOvertimeJam * (Number(overtime_rate_per_hour) || 0);
//   const totalPendapatan = (Number(all_in_rate) || 0) + totalOvertimeFee;

//   const totalOperasional = (Number(fuel_cost) || 0) + (Number(driver_fee) || 0);
//   const labaKotor = totalPendapatan - totalOperasional;

//   return { lamaSewaJam, lamaOvertimeJam, totalPendapatan, labaKotor };
// }

export default function TransaksiPage() {
  const { showConfirm } = useAlertDialog();
  const searchParams = useSearchParams();
  const { loadingActions, executeAction } = useActionLoading();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState("OPERATOR");
  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [completingData, setCompletingData] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [viewingData, setViewingData] = useState(null);
  const [approvingTransaction, setApprovingTransaction] = useState(null);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [isCompletingTransaction, setIsCompletingTransaction] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // State untuk Edit Approval Dialog (Admin)
  const [isEditApprovalOpen, setIsEditApprovalOpen] = useState(false);
  const [approvingEditTransaction, setApprovingEditTransaction] =
    useState(null);
  const [isSubmittingEditApproval, setIsSubmittingEditApproval] =
    useState(false);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [calculatedData, setCalculatedData] = useState({});
  const [paketList, setPaketList] = useState([]);
  const [armadaList, setArmadaList] = useState([]);
  const [sopirList, setSopirList] = useState([]);
  const [isLoadingDependencies, setIsLoadingDependencies] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Debug: Log state changes for complete dialog
  useEffect(() => {
    console.log("🔄 [DEBUG] isCompleteOpen changed:", isCompleteOpen);
  }, [isCompleteOpen]);

  useEffect(() => {
    console.log("🔄 [DEBUG] completingData changed:", completingData);
  }, [completingData]);

  // Display error message from query parameters
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      // Decode the error message
      const decodedError = decodeURIComponent(errorParam);

      // Display toast notification
      toast.error("Akses Ditolak", {
        description: decodedError,
        duration: 5000,
      });

      // Remove error parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams]);

  // Fetch user role on mount
  useEffect(() => {
    async function fetchUserRole() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (res.ok) {
          const result = await res.json();
          const userData = result.data?.user || result.data || result.user;
          if (userData?.role) {
            setUserRole(userData.role);
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    }
    fetchUserRole();
  }, []);

  // --- Data Fetching ---
  async function fetchData(page = 1) {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });

      const res = await fetch(`/api/transactions?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("fetch failed");
      const result = await res.json();

      // API returns { success, data: { data, pagination }, message }
      const responseData = result.data || result;
      const transactions = responseData.data || responseData;
      const pagination = responseData.pagination || {};

      setData(Array.isArray(transactions) ? transactions : []);
      setCurrentPage(pagination.currentPage || 1);
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.totalItems || 0);
    } catch (err) {
      console.error("Failed to load data", err);
      setData([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchDependencies() {
    try {
      setIsLoadingDependencies(true);
      // Fetch semua bersamaan dengan credentials
      const [paketRes, armadaRes, sopirRes] = await Promise.all([
        fetch("/api/packages", { credentials: "include" }),
        fetch("/api/vehicles?status=READY", { credentials: "include" }),
        fetch("/api/drivers?status=READY", { credentials: "include" }),
      ]);

      const paketResult = await paketRes.json();
      const armadaResult = await armadaRes.json();
      const sopirResult = await sopirRes.json();

      // API returns { success, data, message }
      const paketData = paketResult.data || paketResult;
      const armadaData = armadaResult.data || armadaResult;
      const sopirData = sopirResult.data || sopirResult;

      setPaketList(Array.isArray(paketData) ? paketData : []);
      setArmadaList(Array.isArray(armadaData) ? armadaData : []);
      setSopirList(Array.isArray(sopirData) ? sopirData : []);
    } catch (err) {
      console.error("Failed to load dependencies", err);
      setPaketList([]);
      setArmadaList([]);
      setSopirList([]);
      // TODO: Tampilkan toast error
    } finally {
      setIsLoadingDependencies(false);
    }
  }

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const selectedPackage = paketList.find((p) => p.id === formData.packageId);
    const dataWithPackage = { ...formData, package: selectedPackage };
    setCalculatedData(calculateTransactionFinancials(dataWithPackage));
  }, [formData, paketList]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (availabilityCheckTimeoutRef.current) {
        clearTimeout(availabilityCheckTimeoutRef.current);
        availabilityCheckTimeoutRef.current = null;
      }
    };
  }, []);

  // --- Pagination Handler ---
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return data.filter((item) => {
      const matchesSearch =
        !q ||
        item.invoice_code.toLowerCase().includes(q) ||
        item.customer_name.toLowerCase().includes(q);

      const itemDate = new Date(item.booking_date);
      const toDate = dateRange.to
        ? new Date(dateRange.to.setHours(23, 59, 59, 999))
        : undefined;
      const fromDate = dateRange.from
        ? new Date(dateRange.from.setHours(0, 0, 0, 0))
        : undefined;
      const matchesDate =
        (!fromDate || itemDate >= fromDate) && (!toDate || itemDate <= toDate);

      return matchesSearch && matchesDate;
    });
  }, [data, searchTerm, dateRange]);

  // --- Event Handlers ---
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  const handleDateChange = (name, value) => {
    setDateRange((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when date filter changes
    setQuickFilter("all");
  };
  const handleQuickFilterChange = (value) => {
    setQuickFilter(value);
    setCurrentPage(1); // Reset to first page when quick filter changes
    const today = new Date();
    if (value === "month")
      setDateRange({ from: startOfMonth(today), to: endOfToday() });
    else if (value === "year")
      setDateRange({ from: startOfYear(today), to: endOfToday() });
    else setDateRange({ from: undefined, to: undefined });
  };

  const handleFormInputChange = (e) => {
    const { id, value } = e.target;

    // Handle numeric fields (including CurrencyInput which sends string numbers)
    const numericFields = [
      "all_in_rate",
      "overtime_rate_per_hour",
      "dp_amount",
      "pax_count",
      "custom_price",
    ];

    let newValue = value;
    if (numericFields.includes(id)) {
      // Convert to number, keep empty string as 0
      newValue = value === "" ? 0 : parseFloat(value) || 0;
    } else if (e.target.type === "number") {
      newValue = parseFloat(value) || 0;
    }

    setFormData((prev) => {
      const updatedData = { ...prev, [id]: newValue };

      // Auto-update payment_status based on dp_amount
      if (id === "dp_amount") {
        const dp = newValue;
        const total = updatedData.all_in_rate;
        if (dp >= total) {
          updatedData.payment_status = "PAID";
        } else if (dp > 0) {
          updatedData.payment_status = "DOWN_PAYMENT";
        } else {
          updatedData.payment_status = "UNPAID";
        }
      }

      // For TOUR_PACKAGE, recalculate pricing when pax_count changes
      if (id === "pax_count") {
        const currentPackage = paketList.find((p) => p.id === prev.packageId);
        if (currentPackage?.type === "TOUR_PACKAGE" && prev.hotel_tier_id) {
          const calculatedPrice = calculateTourPackagePriceFromParams(
            currentPackage,
            prev.hotel_tier_id,
            newValue
          );
          if (calculatedPrice > 0) {
            updatedData.all_in_rate = calculatedPrice;
          }
        }
      }

      return updatedData;
    });
  };

  // Function to fetch available vehicles and drivers based on date range
  const fetchAvailableVehiclesAndDrivers = async (
    checkoutDatetime,
    checkinDatetime,
    excludeTransactionId = null
  ) => {
    try {
      setIsLoadingDependencies(true);

      // Always fetch packages first (not dependent on dates)
      const packagesRes = await fetch("/api/packages", {
        credentials: "include",
      });
      const packagesResult = await packagesRes.json();
      const packagesData = packagesResult.data || packagesResult;
      console.log("📦 Fetched packages:", packagesData?.length || 0, "items");
      setPaketList(Array.isArray(packagesData) ? packagesData : []);

      if (!checkoutDatetime || !checkinDatetime) {
        // If dates are not set, fetch all READY vehicles/drivers
        const [armadaRes, sopirRes] = await Promise.all([
          fetch("/api/vehicles?status=READY", { credentials: "include" }),
          fetch("/api/drivers?status=READY", { credentials: "include" }),
        ]);

        const armadaResult = await armadaRes.json();
        const sopirResult = await sopirRes.json();

        const armadaData = armadaResult.data || armadaResult;
        const sopirData = sopirResult.data || sopirResult;

        setArmadaList(Array.isArray(armadaData) ? armadaData : []);
        setSopirList(Array.isArray(sopirData) ? sopirData : []);
        return;
      }

      const params = new URLSearchParams({
        checkout_datetime: checkoutDatetime,
        checkin_datetime: checkinDatetime,
      });
      if (excludeTransactionId) {
        params.append("excludeTransactionId", excludeTransactionId);
      }

      const [vehiclesRes, driversRes] = await Promise.all([
        fetch(`/api/availability/vehicles?${params}`, {
          credentials: "include",
        }),
        fetch(`/api/availability/drivers?${params}`, {
          credentials: "include",
        }),
      ]);

      const vehiclesResult = await vehiclesRes.json();
      const driversResult = await driversRes.json();

      const vehiclesData = vehiclesResult.data || vehiclesResult;
      const driversData = driversResult.data || driversResult;

      // Set available vehicles and drivers
      setArmadaList(vehiclesData.available || []);
      setSopirList(driversData.available || []);
    } catch (err) {
      console.error("Failed to fetch available vehicles/drivers:", err);
      // Fallback to fetching all items
      await fetchDependencies();
    } finally {
      setIsLoadingDependencies(false);
    }
  };

  // Debounce function for availability check - use ref to avoid stale closure
  const availabilityCheckTimeoutRef = useRef(null);
  const editingDataRef = useRef(editingData);

  // Update ref when editingData changes
  useEffect(() => {
    editingDataRef.current = editingData;
  }, [editingData]);

  const handleFormDateChange = (id, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [id]: value };

      // Auto-update checkin_datetime when checkout_datetime changes and package is selected
      if (id === "checkout_datetime" && prev.packageId) {
        const selectedPackage = paketList.find((p) => p.id === prev.packageId);
        if (selectedPackage) {
          const checkoutDate = new Date(value);
          let checkinDate;

          if (selectedPackage.durationHours) {
            // For packages with hours duration (CAR_RENTAL, FULL_DAY_TRIP)
            checkinDate = new Date(
              checkoutDate.getTime() +
                selectedPackage.durationHours * 60 * 60 * 1000
            );
          } else if (selectedPackage.durationDays) {
            // For packages with days duration (TOUR_PACKAGE)
            checkinDate = new Date(
              checkoutDate.getTime() +
                selectedPackage.durationDays * 24 * 60 * 60 * 1000
            );
          }

          if (checkinDate) {
            updated.checkin_datetime = getLocalDateTimeString(checkinDate);
          }
        }
      }

      // Clear previous timeout
      if (availabilityCheckTimeoutRef.current) {
        clearTimeout(availabilityCheckTimeoutRef.current);
        availabilityCheckTimeoutRef.current = null;
      }

      // If checkout or checkin datetime changed, check availability after 500ms
      if (id === "checkout_datetime" || id === "checkin_datetime") {
        const timeout = setTimeout(() => {
          const checkout = updated.checkout_datetime;
          const checkin = updated.checkin_datetime;
          // Use ref to get latest editingData value
          const excludeId = editingDataRef.current?.id || null;

          fetchAvailableVehiclesAndDrivers(checkout, checkin, excludeId);
          availabilityCheckTimeoutRef.current = null;
        }, 500);

        availabilityCheckTimeoutRef.current = timeout;
      }

      return updated;
    });
  };

  const handleFormSelectChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));

    // Logika Otomatis: Jika pilih paket, isi data keuangan dan set checkin time
    if (id === "packageId" && value) {
      const selectedPackage = paketList.find((p) => p.id === value);
      if (selectedPackage) {
        setFormData((prev) => {
          let updates = {};

          // Calculate checkin_datetime based on package duration
          if (selectedPackage.durationHours) {
            // For packages with hours duration (CAR_RENTAL, FULL_DAY_TRIP)
            const checkoutDate = new Date(prev.checkout_datetime);
            const checkinDate = new Date(
              checkoutDate.getTime() +
                selectedPackage.durationHours * 60 * 60 * 1000
            );
            updates.checkin_datetime = getLocalDateTimeString(checkinDate);
          } else if (selectedPackage.durationDays) {
            // For packages with days duration (TOUR_PACKAGE)
            const checkoutDate = new Date(prev.checkout_datetime);
            const checkinDate = new Date(
              checkoutDate.getTime() +
                selectedPackage.durationDays * 24 * 60 * 60 * 1000
            );
            updates.checkin_datetime = getLocalDateTimeString(checkinDate);
          }

          // Set pricing based on package type
          if (selectedPackage.type === "TOUR_PACKAGE") {
            // For TOUR_PACKAGE, reset pricing fields to be calculated from tier/pax
            updates.all_in_rate = 0;
            updates.overtime_rate_per_hour = 0;
          } else if (selectedPackage.type === "FULL_DAY_TRIP") {
            // For FULL_DAY_TRIP, flat rate with no overtime
            updates.all_in_rate = selectedPackage.price || 0;
            updates.overtime_rate_per_hour = 0; // No overtime for full day trip
          } else {
            // For CAR_RENTAL, include overtime rate
            updates.all_in_rate = selectedPackage.price || 0;
            updates.overtime_rate_per_hour = selectedPackage.overtimeRate || 0;
          }

          return { ...prev, ...updates };
        });
      }
    }

    // For TOUR_PACKAGE, recalculate pricing when hotel tier or pax count changes
    if ((id === "hotel_tier_id" || id === "pax_count") && value) {
      setFormData((prev) => {
        const currentPackage = paketList.find((p) => p.id === prev.packageId);
        if (currentPackage?.type === "TOUR_PACKAGE") {
          const hotelTierId =
            id === "hotel_tier_id" ? value : prev.hotel_tier_id;
          const paxCount = id === "pax_count" ? value : prev.pax_count;
          const calculatedPrice = calculateTourPackagePriceFromParams(
            currentPackage,
            hotelTierId,
            paxCount
          );
          if (calculatedPrice > 0) {
            return {
              ...prev,
              all_in_rate: calculatedPrice,
            };
          }
        }
        return prev;
      });
    }
  };

  const openNewDialog = () => {
    setEditingData(null);
    const initialState = { ...INITIAL_FORM_STATE };
    setFormData(initialState);
    // Check availability based on initial dates
    fetchAvailableVehiclesAndDrivers(
      initialState.checkout_datetime,
      initialState.checkin_datetime,
      null
    );
    setIsDialogOpen(true);
  };

  const openEditDialog = (item) => {
    // Check if transaction is already completed
    if (item.actual_checkin_datetime) {
      toast.warning("Tidak Dapat Mengedit", {
        description: "Transaksi yang sudah diselesaikan tidak dapat diedit",
      });
      return;
    }

    setEditingData(item);
    const checkoutDatetime = getLocalDateTimeString(
      new Date(item.checkout_datetime)
    );
    const checkinDatetime = getLocalDateTimeString(
      new Date(item.checkin_datetime)
    );

    setFormData({
      ...item,
      booking_date: new Date(item.booking_date).toISOString().split("T")[0],
      checkout_datetime: checkoutDatetime,
      checkin_datetime: checkinDatetime,
      packageId: item.packageId || null,
      all_in_rate: item.all_in_rate || 0,
      overtime_rate_per_hour: item.overtime_rate_per_hour || 0,
      dp_amount: item.dp_amount != null ? item.dp_amount : 0,
      payment_status: item.payment_status || "UNPAID", // Ensure payment_status is set
      hotel_name: item.hotel_name || "",
      pax_count: item.pax_count || "",
      hotel_tier_id: item.hotel_tier_id || "",
    });

    // Check availability based on transaction dates, exclude current transaction
    fetchAvailableVehiclesAndDrivers(
      checkoutDatetime,
      checkinDatetime,
      item.id
    );
    setIsDialogOpen(true);
  };

  const openViewDialog = (item) => {
    setViewingData(item);
    setCalculatedData(calculateTransactionFinancials(item));
    setIsDetailOpen(true);
  };

  const openCompleteDialog = (item) => {
    console.log("🔍 [DEBUG] openCompleteDialog called with item:", item);

    // Validation: Check for null/undefined item
    if (!item) {
      console.error(
        "❌ [ERROR] openCompleteDialog called with null/undefined item"
      );
      toast.error("Error", {
        description: "Data transaksi tidak tersedia",
      });
      return;
    }

    // Validation: Check for required fields
    if (!item.id) {
      console.error("❌ [ERROR] Transaction missing required field: id");
      toast.error("Error", {
        description: "Data transaksi tidak valid - ID tidak ditemukan",
      });
      return;
    }

    if (!item.invoice_code) {
      console.error(
        "❌ [ERROR] Transaction missing required field: invoice_code"
      );
      toast.error("Error", {
        description:
          "Data transaksi tidak valid - Kode invoice tidak ditemukan",
      });
      return;
    }

    // Check if transaction is already completed
    if (item.actual_checkin_datetime) {
      console.log("⚠️ [DEBUG] Transaction already completed, showing warning");
      toast.warning("Transaksi Sudah Diselesaikan", {
        description: `Transaksi ini telah diselesaikan pada ${new Date(item.actual_checkin_datetime).toLocaleString("id-ID")}`,
      });
      return;
    }

    console.log("✅ [DEBUG] Setting completingData and opening dialog");
    setCompletingData(item);
    setIsCompleteOpen(true);
    console.log(
      "✅ [DEBUG] State updates called - completingData set, isCompleteOpen set to true"
    );
  };

  const handleDelete = async (id) => {
    // Check if transaction is already completed
    const transaction = data.find((t) => t.id === id);
    if (transaction?.actual_checkin_datetime) {
      toast.warning("Tidak Dapat Menghapus", {
        description: "Transaksi yang sudah diselesaikan tidak dapat dihapus",
      });
      return;
    }

    const confirmed = await showConfirm({
      message: "Yakin ingin menghapus transaksi ini?",
      title: "Konfirmasi Hapus",
      confirmText: "Hapus",
      cancelText: "Batal",
    });

    if (!confirmed) return;

    await executeAction(
      `delete-${id}`,
      async () => {
        const res = await fetch(`/api/transactions/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error("delete failed");
        await fetchData(1); // Reset to first page after successful operation
      },
      {
        successMessage: "Transaksi berhasil dihapus",
        errorMessage: "Gagal menghapus transaksi",
      }
    );
  };

  const handleUpdateStatus = async (id, newStatus) => {
    // Check if transaction is already completed
    const transaction = data.find((t) => t.id === id);
    if (transaction?.actual_checkin_datetime) {
      toast.warning("Tidak Dapat Mengubah Status", {
        description:
          "Status pembayaran transaksi yang sudah diselesaikan tidak dapat diubah",
      });
      return;
    }

    try {
      // Update status transaksi
      const res = await fetch(`/api/transactions/status/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ payment_status: newStatus }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || "status update failed");
      }

      // Update data di state secara manual (Optimistic UI)
      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, payment_status: newStatus } : item
        )
      );

      // Show success toast
      toast.success("Status Berhasil Diupdate", {
        description: `Status pembayaran diubah menjadi ${newStatus}`,
      });
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error("Update Status Gagal", {
        description: err.message || "Gagal mengupdate status transaksi",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation before submission

    // Validate required fields
    if (!formData.customer_name || formData.customer_name.trim() === "") {
      toast.error("Validasi Gagal", {
        description: "Nama pelanggan wajib diisi",
      });
      return;
    }

    if (!formData.customer_phone || formData.customer_phone.trim() === "") {
      toast.error("Validasi Gagal", {
        description: "Nomor telepon pelanggan wajib diisi",
      });
      return;
    }

    if (!formData.armadaId) {
      toast.error("Validasi Gagal", {
        description: "Silakan pilih Armada terlebih dahulu",
      });
      return;
    }

    if (!formData.driverId) {
      toast.error("Validasi Gagal", {
        description: "Silakan pilih Sopir terlebih dahulu",
      });
      return;
    }

    // Validate dates
    if (!formData.booking_date) {
      toast.error("Validasi Gagal", {
        description: "Tanggal booking wajib diisi",
      });
      return;
    }

    if (!formData.checkout_datetime) {
      toast.error("Validasi Gagal", {
        description: "Waktu mobil out (jalan) wajib diisi",
      });
      return;
    }

    if (!formData.checkin_datetime) {
      toast.error("Validasi Gagal", {
        description: "Waktu mobil in (selesai) wajib diisi",
      });
      return;
    }

    // Validate that checkin is after checkout
    const checkoutDate = new Date(formData.checkout_datetime);
    const checkinDate = new Date(formData.checkin_datetime);

    if (checkinDate <= checkoutDate) {
      toast.error("Validasi Gagal", {
        description:
          "Waktu mobil in (selesai) harus setelah waktu mobil out (jalan)",
      });
      return;
    }

    // Validate numeric fields are positive
    if (!formData.all_in_rate || formData.all_in_rate <= 0) {
      toast.error("Validasi Gagal", {
        description: "Tarif sewa harus diisi dengan angka positif",
      });
      return;
    }

    if (
      formData.overtime_rate_per_hour &&
      formData.overtime_rate_per_hour < 0
    ) {
      toast.error("Validasi Gagal", {
        description: "Tarif overtime tidak boleh negatif",
      });
      return;
    }

    if (formData.dp_amount && formData.dp_amount < 0) {
      toast.error("Validasi Gagal", {
        description: "Jumlah DP tidak boleh negatif",
      });
      return;
    }

    // Validate DP doesn't exceed total rate
    const dpAmount = formData.dp_amount || 0;
    const totalRate = formData.all_in_rate || 0;
    if (dpAmount > totalRate) {
      toast.error("Validasi Gagal", {
        description: "Jumlah DP tidak boleh melebihi total tarif sewa",
      });
      return;
    }

    setIsSubmittingForm(true);
    try {
      const method = editingData ? "PUT" : "POST";
      const url = editingData
        ? `/api/transactions/${editingData.id}`
        : "/api/transactions";

      const finalCalculations = calculateTransactionFinancials(formData);
      const payload = {
        // Data Pelanggan
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,

        // Data Waktu (format ke ISO string)
        booking_date: new Date(formData.booking_date).toISOString(),
        checkout_datetime: new Date(formData.checkout_datetime).toISOString(),
        checkin_datetime: new Date(formData.checkin_datetime).toISOString(),

        // Data Keuangan (format ke Angka)
        all_in_rate: Number(formData.all_in_rate),
        overtime_rate_per_hour: Number(formData.overtime_rate_per_hour),
        dp_amount:
          formData.dp_amount && Number(formData.dp_amount) > 0
            ? Number(formData.dp_amount)
            : null,

        // Status Pembayaran (otomatis berdasarkan DP)
        payment_status: (() => {
          const dp = formData.dp_amount ? Number(formData.dp_amount) : 0;
          const total = Number(formData.all_in_rate) || 0;
          if (dp >= total) {
            return "PAID";
          } else if (dp > 0) {
            return "DOWN_PAYMENT";
          } else {
            return "UNPAID";
          }
        })(),

        // Data Tambahan untuk Paket Wisata (opsional)
        hotel_name: formData.hotel_name || null,
        pax_count: formData.pax_count ? Number(formData.pax_count) : null,
        hotel_tier_id: formData.hotel_tier_id || null,

        // Relasi (ID)
        packageId: formData.packageId || null,
        armadaId: formData.armadaId,
        driverId: formData.driverId,
      };

      const body = JSON.stringify(payload);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: body,
      });

      if (!res.ok) {
        const errData = await res.json();

        // Handle validation errors with detailed messages
        if (errData.errors && Array.isArray(errData.errors)) {
          // Display the first validation error
          const firstError = errData.errors[0];
          const errorMessage =
            firstError?.message || errData.error || "Validasi gagal";
          throw new Error(errorMessage);
        }

        throw new Error(
          errData.error || errData.message || "Gagal menyimpan transaksi"
        );
      }

      // Success: close dialog, refresh data, and show success message
      toast.success(
        editingData
          ? "Transaksi berhasil diupdate!"
          : "Transaksi berhasil ditambahkan!",
        {
          description: `${formData.customer_name}`,
        }
      );

      setIsDialogOpen(false);
      await fetchData(1); // Reset to first page after successful operation
    } catch (err) {
      console.error("Failed to save", err);
      // Error: keep dialog open and show error message
      toast.error("Gagal menyimpan transaksi", {
        description: err.message,
      });
      // Dialog stays open so user can fix validation errors or retry
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handlePrintInvoice = (item) => {
    window.open(`/transaksi/cetak/${item.id}`, "_blank");
  };

  const handleSubmitForApproval = async (id) => {
    const confirmed = await showConfirm({
      message: "Ajukan transaksi ini untuk approval admin?",
      title: "Konfirmasi Pengajuan",
      confirmText: "Ajukan",
      cancelText: "Batal",
    });

    if (!confirmed) return;

    await executeAction(
      `submit-approval-${id}`,
      async () => {
        const res = await fetch(`/api/transactions/${id}/submit`, {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Gagal mengajukan approval");
        }

        await fetchData(currentPage);
      },
      {
        successMessage: "Transaksi Berhasil Diajukan",
        errorMessage: "Gagal Mengajukan Approval",
      }
    );
  };

  const handleApprove = async (transactionId) => {
    setIsSubmittingApproval(true);
    try {
      const res = await fetch(`/api/transactions/${transactionId}/approve`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal menyetujui transaksi");
      }

      // Success: close dialog, refresh data, and show success message
      await fetchData(currentPage);
      setIsApprovalOpen(false);
      setApprovingTransaction(null);
      toast.success("Transaksi Disetujui", {
        description: "Transaksi telah disetujui dan armada/driver dikunci",
      });
    } catch (err) {
      console.error("Failed to approve:", err);
      // Error: keep dialog open, show error message, and re-throw for dialog to handle
      toast.error("Gagal Menyetujui", {
        description: err.message,
      });
      throw err; // Re-throw so ApprovalDialog can display error
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleReject = async (transactionId, reason) => {
    setIsSubmittingApproval(true);
    try {
      const res = await fetch(`/api/transactions/${transactionId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rejection_reason: reason }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal menolak transaksi");
      }

      // Success: close dialog, refresh data, and show success message
      await fetchData(currentPage);
      setIsApprovalOpen(false);
      setApprovingTransaction(null);
      toast.success("Transaksi Ditolak", {
        description: "Transaksi dikembalikan ke operator untuk revisi",
      });
    } catch (err) {
      console.error("Failed to reject:", err);
      // Error: keep dialog open, show error message, and re-throw for dialog to handle
      toast.error("Gagal Menolak", {
        description: err.message,
      });
      throw err; // Re-throw so ApprovalDialog can display error
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const openApprovalDialog = (transactionId) => {
    const transaction = data.find((t) => t.id === transactionId);
    if (transaction) {
      setApprovingTransaction(transaction);
      setIsApprovalOpen(true);
    }
  };

  // Handler: Admin review edit approval
  const handleReviewEditApproval = (transaction) => {
    setApprovingEditTransaction(transaction);
    setIsEditApprovalOpen(true);
  };

  // Handler: Admin approve edit
  const handleApproveEdit = async (transactionId) => {
    setIsSubmittingEditApproval(true);
    try {
      const res = await fetch(
        `/api/transactions/${transactionId}/approve-edit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menyetujui edit");
      }

      // Success: close dialog, refresh data, and show success message
      await fetchData(currentPage);
      setIsEditApprovalOpen(false);
      setApprovingEditTransaction(null);
      toast.success("Permintaan Edit Disetujui", {
        description: "Perubahan transaksi telah diterapkan",
      });
    } catch (err) {
      console.error("Failed to approve edit:", err);
      // Error: keep dialog open, show error message, and re-throw for dialog to handle
      toast.error("Gagal Menyetujui Edit", {
        description: err.message,
      });
      throw err; // Re-throw so dialog can display error
    } finally {
      setIsSubmittingEditApproval(false);
    }
  };

  // Handler: Admin reject edit
  const handleRejectEdit = async (transactionId, reason) => {
    setIsSubmittingEditApproval(true);
    try {
      const res = await fetch(
        `/api/transactions/${transactionId}/reject-edit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ rejection_reason: reason }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menolak edit");
      }

      // Success: close dialog, refresh data, and show success message
      await fetchData(currentPage);
      setIsEditApprovalOpen(false);
      setApprovingEditTransaction(null);
      toast.success("Permintaan Edit Ditolak", {
        description: "Transaksi dikembalikan ke data sebelumnya",
      });
    } catch (err) {
      console.error("Failed to reject edit:", err);
      // Error: keep dialog open, show error message, and re-throw for dialog to handle
      toast.error("Gagal Menolak Edit", {
        description: err.message,
      });
      throw err; // Re-throw so dialog can display error
    } finally {
      setIsSubmittingEditApproval(false);
    }
  };

  const handleCompleteTransaction = async (completionData) => {
    console.log("handleCompleteTransaction called with:", {
      completionData,
      completingData,
    });

    // Enhanced validation for completingData
    if (!completingData) {
      console.error("❌ [ERROR] No transaction data available for completion");
      toast.error("Error", {
        description:
          "Data transaksi tidak tersedia. Silakan tutup dialog dan coba lagi.",
      });
      return;
    }

    if (!completingData.id) {
      console.error("❌ [ERROR] Transaction data missing ID field");
      toast.error("Error", {
        description: "Data transaksi tidak valid - ID tidak ditemukan",
      });
      return;
    }

    // Enhanced validation for completionData
    if (!completionData) {
      console.error("❌ [ERROR] No completion data provided");
      toast.error("Validasi Gagal", {
        description: "Data penyelesaian transaksi tidak tersedia",
      });
      return;
    }

    if (!completionData.actual_checkin_datetime) {
      console.error(
        "❌ [ERROR] Missing required field: actual_checkin_datetime"
      );
      toast.error("Validasi Gagal", {
        description: "Waktu check-in aktual harus diisi",
      });
      return;
    }

    // Validate actual_checkin_datetime is a valid date
    const actualCheckinDate = new Date(completionData.actual_checkin_datetime);
    if (isNaN(actualCheckinDate.getTime())) {
      console.error(
        "❌ [ERROR] Invalid date format for actual_checkin_datetime"
      );
      toast.error("Validasi Gagal", {
        description: "Format waktu check-in aktual tidak valid",
      });
      return;
    }

    // Validate actual_overtime_cost is a number if provided
    if (
      completionData.actual_overtime_cost !== undefined &&
      completionData.actual_overtime_cost !== null
    ) {
      const overtimeCost = Number(completionData.actual_overtime_cost);
      if (isNaN(overtimeCost) || overtimeCost < 0) {
        console.error("❌ [ERROR] Invalid actual_overtime_cost value");
        toast.error("Validasi Gagal", {
          description: "Biaya overtime harus berupa angka positif atau nol",
        });
        return;
      }
    }

    // Validate remaining_payment is a number if provided
    if (
      completionData.remaining_payment !== undefined &&
      completionData.remaining_payment !== null
    ) {
      const remainingPayment = Number(completionData.remaining_payment);
      if (isNaN(remainingPayment) || remainingPayment < 0) {
        console.error("❌ [ERROR] Invalid remaining_payment value");
        toast.error("Validasi Gagal", {
          description: "Sisa pembayaran harus berupa angka positif atau nol",
        });
        return;
      }
    }

    setIsCompletingTransaction(true);
    try {
      console.log(
        "Making API call to complete transaction:",
        completingData.id
      );
      console.log("Completion data being sent:", completionData);

      const res = await fetch(
        `/api/transactions/${completingData.id}/complete`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(completionData),
        }
      );

      console.log("API response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json();
        console.error("API error response:", errorData);

        // Enhanced error message handling
        let errorMessage = "Gagal menyelesaikan transaksi";

        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.details) {
          errorMessage = `${errorMessage}: ${JSON.stringify(errorData.details)}`;
        }

        // Handle specific error cases
        if (res.status === 400) {
          errorMessage = `Validasi gagal: ${errorMessage}`;
        } else if (res.status === 404) {
          errorMessage = "Transaksi tidak ditemukan";
        } else if (res.status === 403) {
          errorMessage =
            "Anda tidak memiliki akses untuk menyelesaikan transaksi ini";
        } else if (res.status === 500) {
          errorMessage = "Terjadi kesalahan server. Silakan coba lagi.";
        }

        throw new Error(errorMessage);
      }

      const result = await res.json();
      console.log("API success response:", result);
      const updatedTransaction = result.data;

      // Success: close dialog, refresh data, and show success message
      toast.success("Transaksi Berhasil Diselesaikan", {
        description: `${completingData.customer_name} - ${completingData.invoice_code}`,
      });

      setIsCompleteOpen(false);
      setCompletingData(null);
      await fetchData(1); // Reset to first page after successful operation
    } catch (err) {
      console.error("Failed to complete transaction:", err);

      // Enhanced error handling - dialog stays open
      let userFriendlyMessage = err.message;

      // Handle network errors
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        userFriendlyMessage =
          "Gagal menghubungi server. Periksa koneksi internet Anda.";
      }

      // Error: keep dialog open and show user-friendly error message
      toast.error("Gagal Menyelesaikan Transaksi", {
        description: userFriendlyMessage,
        duration: 5000, // Show error longer for user to read
      });

      // Dialog stays open so user can retry or fix the issue
      // isCompleteOpen remains true, completingData remains set
    } finally {
      setIsCompletingTransaction(false);
    }
  };

  // --- Render ---
  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Manajemen Transaksi"
        description="Kelola transaksi sewa kendaraan — input, edit, dan pantau status pembayaran."
      >
        <Button onClick={openNewDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Input Transaksi Baru
        </Button>
      </PageHeader>

      <TransaksiFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        dateRange={dateRange}
        onDateChange={handleDateChange}
        quickFilter={quickFilter}
        onQuickFilterChange={handleQuickFilterChange}
      />

      <div className="p-4">
        <TransaksiTable
          isLoading={isLoading}
          data={filteredData}
          onEdit={openEditDialog}
          onDelete={handleDelete}
          onViewDetails={openViewDialog}
          onUpdateStatus={handleUpdateStatus}
          onPrint={handlePrintInvoice}
          onCompleteTransaction={openCompleteDialog}
          onSubmitForApproval={handleSubmitForApproval}
          onApprove={openApprovalDialog}
          onReject={openApprovalDialog}
          onReviewEditApproval={handleReviewEditApproval}
          userRole={userRole}
          loadingActions={loadingActions}
        />

        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showInfo={true}
            isLoading={isLoading}
          />
        </div>
      </div>

      <TransaksiDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isEditing={!!editingData}
        formData={formData}
        calculatedData={calculatedData}
        handleSubmit={handleSubmit}
        handleInputChange={handleFormInputChange}
        handleSelectChange={handleFormSelectChange}
        handleDateChange={handleFormDateChange}
        paketList={paketList}
        armadaList={armadaList}
        sopirList={sopirList}
        isLoadingDependencies={isLoadingDependencies}
        userRole={userRole}
        isSubmitting={isSubmittingForm}
      />

      <TransaksiDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        data={viewingData}
        calculatedData={calculatedData}
      />

      {/* Debug: Log props before rendering TransaksiCompleteModal */}
      {console.log("📋 [DEBUG] Rendering TransaksiCompleteModal with props:", {
        open: isCompleteOpen,
        transaction: completingData
          ? { id: completingData.id, invoice_code: completingData.invoice_code }
          : null,
        isLoading: isCompletingTransaction,
      })}

      <TransaksiCompleteModal
        open={isCompleteOpen}
        onOpenChange={setIsCompleteOpen}
        transaction={completingData}
        onComplete={handleCompleteTransaction}
        isLoading={isCompletingTransaction}
      />

      <ApprovalDialog
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        transaction={approvingTransaction}
        onApprove={handleApprove}
        onReject={handleReject}
        isSubmitting={isSubmittingApproval}
      />

      <TransactionEditApprovalDialog
        isOpen={isEditApprovalOpen}
        onClose={() => setIsEditApprovalOpen(false)}
        transaction={approvingEditTransaction}
        onApproveEdit={handleApproveEdit}
        onRejectEdit={handleRejectEdit}
        isSubmitting={isSubmittingEditApproval}
      />
    </div>
  );
}
