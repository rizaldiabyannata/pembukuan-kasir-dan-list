"use client";

import React, { useState, useEffect, useMemo } from "react";
import PengeluaranHeader from "@/components/pengeluaran/PengeluaranHeader";
import PengeluaranFilters from "@/components/pengeluaran/PengeluaranFilters";
import PengeluaranTable from "@/components/pengeluaran/PengeluaranTable";
import PengeluaranDialog from "@/components/pengeluaran/PengeluaranDialog";
import PengeluaranDetailModal from "@/components/pengeluaran/PengeluaranDetailModal";
import ExpenseApprovalDialog from "@/components/pengeluaran/ExpenseApprovalDialog";
import ExpenseRequestDialog from "@/components/pengeluaran/ExpenseRequestDialog";
import { useAlertDialog } from "@/components/ui/alert-dialog-provider";
import { toast } from "sonner";
import { startOfMonth, startOfYear, endOfToday } from "date-fns";
import { Pagination } from "@/components/ui/pagination";
import { useActionLoading } from "@/hooks/useActionLoading";

// Helper untuk format tanggal YYYY-MM-DD
function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

const INITIAL_FORM_STATE = {
  date: getTodayDateString(),
  paymentMonth: undefined, // No default month, show placeholder
  category: "",
  kategoriLainnya: "",
  description: "",
  amount: 0,
  armadaId: null,
  driverId: null,
  staffId: null,
  namaPenerima: "",
  file: null,
};

const kategoriOptions = [
  "LISTRIK",
  "INTERNET",
  "PAKET_DATA",
  "KONSUMSI",
  "GAJI_STAF_OPERASIONAL",
  "GAJI_STAF_ADMIN",
  "INSENTIF_BONUS",
  "PAJAK",
  "ALAT_TULIS_KANTOR",
  "KOMPUTER_SUPPLIES",
  "OPERASIONAL_LAINNYA",
  "BBM",
  "PERAWATAN_ARMADA",
  "GAJI_SOPIR",
];

export default function PengeluaranPage() {
  const { showAlert, showConfirm } = useAlertDialog();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); // null until loaded
  const [userRoleLoading, setUserRoleLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);

  // State untuk Dialog/Form
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // State untuk Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailData, setSelectedDetailData] = useState(null);

  // State untuk Approval Dialog (Admin)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvingExpense, setApprovingExpense] = useState(null);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // State untuk Request Dialog (Operator)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestingExpense, setRequestingExpense] = useState(null);
  const [requestType, setRequestType] = useState("edit"); // "edit" or "delete"
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [proposedChanges, setProposedChanges] = useState(null);
  const [updatedData, setUpdatedData] = useState(null);

  // Use the useActionLoading hook for item-specific loading states
  const { loadingActions, executeAction } = useActionLoading();

  const [armadaList, setArmadaList] = useState([]);
  const [driverList, setDriverList] = useState([]);
  const [stafList, setStafList] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [isLoadingDependencies, setIsLoadingDependencies] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Fetch user role on mount
  useEffect(() => {
    async function fetchUserRole() {
      try {
        setUserRoleLoading(true);
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (res.ok) {
          const result = await res.json();
          const userData = result.data?.user || result.data || result.user;
          if (userData?.role) {
            setUserRole(userData.role);
          }
        } else {
          // If auth fails, keep userRole as null (will show loading or redirect)
          console.warn("Failed to fetch user role:", res.status);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        // Keep userRole as null on error
      } finally {
        setUserRoleLoading(false);
      }
    }
    fetchUserRole();
  }, []);

  // --- Data Fetching ---
  async function fetchData(page = 1) {
    try {
      setIsLoading(true);

      // Jika ada filter aktif, ambil semua data untuk filtering akurat
      const hasActiveFilters =
        searchTerm.trim() || dateRange.from || dateRange.to;
      const params = new URLSearchParams();

      if (hasActiveFilters) {
        // Ambil semua data untuk filtering client-side yang akurat
        params.set("page", "1");
        params.set("limit", "1000"); // Ambil banyak data untuk filtering
      } else {
        // Pagination normal
        params.set("page", page.toString());
        params.set("limit", itemsPerPage.toString());
      }

      const res = await fetch(`/api/expenses?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("fetch failed");
      const result = await res.json();

      // API returns { success, data: { data, pagination } }
      const responseData = result.data || result;
      const expensesData = responseData.data || responseData;
      const paginationData = responseData.pagination;

      const dataArray = Array.isArray(expensesData) ? expensesData : [];

      console.log("📦 Fetched expenses data:", {
        count: dataArray.length,
        page,
        hasFilters: hasActiveFilters,
        pagination: paginationData,
        sample: dataArray[0],
        dates: dataArray.slice(0, 3).map((item) => ({
          id: item.id,
          date: item.date,
          description: item.description?.substring(0, 20),
        })),
      });

      setData(dataArray);

      if (!hasActiveFilters) {
        // Hanya update pagination info jika tidak ada filter
        setCurrentPage(paginationData?.currentPage || page);
        setTotalPages(paginationData?.totalPages || 1);
        setTotalItems(paginationData?.totalItems || dataArray.length);
      } else {
        // Dengan filter, reset pagination info
        setCurrentPage(1);
        setTotalPages(1);
        setTotalItems(dataArray.length);
      }
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
      const [armadaRes, driverRes, stafRes] = await Promise.all([
        fetch("/api/vehicles"),
        fetch("/api/drivers"),
        fetch("/api/staff?status=ACTIVE"),
      ]);

      const armadaData = await armadaRes.json();
      const driverData = await driverRes.json();
      const stafData = await stafRes.json();

      setArmadaList(
        Array.isArray(armadaData) ? armadaData : armadaData.data || []
      );
      setDriverList(
        Array.isArray(driverData) ? driverData : driverData.data || []
      );
      setStafList(stafData.staff || []);
    } catch (err) {
      console.error("Failed to load dependencies", err);
      setArmadaList([]);
      setDriverList([]);
      setStafList([]);
    } finally {
      setIsLoadingDependencies(false);
    }
  }

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, searchTerm, dateRange.from, dateRange.to]);

  // Handler untuk pagination
  const handlePageChange = (page) => {
    const hasActiveFilters =
      searchTerm.trim() || dateRange.from || dateRange.to;
    if (!hasActiveFilters) {
      setCurrentPage(page);
    }
  };

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    console.log("🔍 Filtering with:", {
      searchTerm: q,
      dateRange,
      totalData: data.length,
    });

    const filtered = data.filter((item) => {
      // Convert item date to start of day for comparison
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);

      const matchesSearch =
        !q ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().replace("_", " ").includes(q);

      // Create comparison dates
      let matchesDate = true;

      if (dateRange.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && itemDate >= fromDate;
      }

      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && itemDate <= toDate;
      }

      if (dateRange.from || dateRange.to) {
        console.log("📅 Date check:", {
          item: item.description?.substring(0, 30),
          itemDate: itemDate.toISOString().split("T")[0],
          fromDate: dateRange.from
            ? new Date(dateRange.from).toISOString().split("T")[0]
            : "none",
          toDate: dateRange.to
            ? new Date(dateRange.to).toISOString().split("T")[0]
            : "none",
          matchesDate,
        });
      }

      return matchesSearch && matchesDate;
    });

    console.log(
      "✅ Filtered result:",
      filtered.length,
      "items out of",
      data.length
    );
    return filtered;
  }, [data, searchTerm, dateRange]);

  // --- Event Handlers ---
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleDateChange = (name, value) => {
    setDateRange((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when date filter changes
  };

  const handleDateReset = () => {
    setDateRange({ from: undefined, to: undefined });
    setQuickFilter("all");
    setCurrentPage(1); // Reset to first page when date is reset
  };

  const handleQuickFilterChange = (value) => {
    setQuickFilter(value);
    const today = new Date();

    if (value === "month") {
      const from = startOfMonth(today);
      const to = endOfToday();
      console.log("🗓️ Filter Bulan Ini:", { from, to });
      setDateRange({ from, to });
    } else if (value === "year") {
      const from = startOfYear(today);
      const to = endOfToday();
      console.log("🗓️ Filter Tahun Ini:", { from, to });
      setDateRange({ from, to });
    } else {
      console.log("🗓️ Filter All - Reset date range");
      setDateRange({ from: undefined, to: undefined });
    }
    setCurrentPage(1); // Reset to first page when quick filter changes
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;

    // Handle numeric fields (including CurrencyInput which sends string numbers)
    const numericFields = ["amount"];

    let newValue = value;
    if (numericFields.includes(id)) {
      // Convert to number for amount, keep empty string as 0
      newValue = value === "" ? 0 : parseFloat(value) || 0;
    } else if (e.target.type === "number") {
      newValue = parseFloat(value) || 0;
    }

    setFormData((prev) => ({ ...prev, [id]: newValue }));
  };

  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleAmountChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      amount: String(value || ""),
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        await showAlert({
          message: "File harus berupa gambar (JPG/PNG) atau PDF",
          type: "warning",
        });
        e.target.value = null;
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        await showAlert({
          message: "Ukuran file maksimal 5MB",
          type: "warning",
        });
        e.target.value = null;
        return;
      }

      // If editing and there's an existing attachment, warn user
      if (editingData && existingAttachments.length > 0) {
        const confirmReplace = await showConfirm({
          message: "File lama akan diganti dengan file baru. Lanjutkan?",
          title: "Konfirmasi Ganti File",
        });
        if (!confirmReplace) {
          e.target.value = null;
          return;
        }
      }

      setFormData((prev) => ({ ...prev, file }));
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, file: null }));
  };

  const openNewDialog = () => {
    setEditingData(null);
    setFormData(INITIAL_FORM_STATE);
    fetchDependencies();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingData(item);
    setExistingAttachments(item.attachments || []);
    const isLainnya = !kategoriOptions.includes(item.category);

    setFormData({
      ...item,
      date: new Date(item.date).toISOString().split("T")[0],
      paymentMonth: item.paymentMonth
        ? String(new Date(item.paymentMonth).getMonth() + 1).padStart(2, "0")
        : undefined,
      amount: item.amount || 0,
      armadaId: item.armadaId,
      driverId: item.driverId,
      staffId: item.staffId,
      namaPenerima: item.namaPenerima || "",
      category: isLainnya ? "LAINNYA" : item.category,
      kategoriLainnya: isLainnya ? item.category : "",
      file: null, // Reset file on edit (existing files handled separately)
    });
    fetchDependencies();
    setIsDialogOpen(true);
  };

  const openDetailModal = (item) => {
    setSelectedDetailData(item);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id) => {
    // Additional safeguard: prevent delete if user role is not loaded or not admin
    if (userRoleLoading || userRole !== "ADMIN") {
      toast.error("Tidak memiliki izin untuk menghapus data");
      return;
    }

    const confirmed = await showConfirm({
      message: "Yakin ingin menghapus data ini?",
      title: "Konfirmasi Hapus",
      confirmText: "Hapus",
      cancelText: "Batal",
    });

    if (!confirmed) return;

    await executeAction(
      `delete-${id}`,
      async () => {
        console.log("Menghapus data ID:", id);
        const res = await fetch(`/api/expenses/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error("delete failed");

        // Optimistic UI: Hapus dari state
        setData((prev) => prev.filter((item) => item.id !== id));
      },
      {
        successMessage: "Pengeluaran berhasil dihapus",
        errorMessage: "Gagal menghapus pengeluaran",
      }
    );
  };

  // === APPROVAL WORKFLOW HANDLERS ===

  // Handler: Operator request edit
  const handleRequestEdit = (expense) => {
    setRequestingExpense(expense);
    setRequestType("edit");
    setIsRequestDialogOpen(true);
  };

  // Handler: Operator request delete
  const handleRequestDelete = (expense) => {
    setRequestingExpense(expense);
    setRequestType("delete");
    setIsRequestDialogOpen(true);
  };

  // Handler: Operator edit request from form
  const handleOperatorEditRequest = () => {
    if (!editingData) return;

    // Calculate proposed changes (only changed fields for display)
    const proposedChanges = {};
    if (formData.date !== editingData.date)
      proposedChanges.date = formData.date;
    if (formData.paymentMonth !== editingData.paymentMonth)
      proposedChanges.paymentMonth = formData.paymentMonth;
    if (formData.category !== editingData.category)
      proposedChanges.category = formData.category;
    if (formData.kategoriLainnya !== editingData.kategoriLainnya)
      proposedChanges.kategoriLainnya = formData.kategoriLainnya;
    if (formData.description !== editingData.description)
      proposedChanges.description = formData.description;
    if (formData.amount !== editingData.amount)
      proposedChanges.amount = formData.amount;
    if (formData.armadaId !== editingData.armadaId)
      proposedChanges.armadaId = formData.armadaId;
    if (formData.driverId !== editingData.driverId)
      proposedChanges.driverId = formData.driverId;
    if (formData.staffId !== editingData.staffId)
      proposedChanges.staffId = formData.staffId;
    if (formData.namaPenerima !== editingData.namaPenerima)
      proposedChanges.namaPenerima = formData.namaPenerima;

    // Check if there are any changes
    if (Object.keys(proposedChanges).length === 0) {
      toast.error("Tidak ada perubahan yang terdeteksi", {
        description: "Silakan ubah data sebelum mengajukan permintaan",
      });
      return;
    }

    // Prepare full updated data for API (all fields)
    const updatedData = {
      date: formData.date,
      paymentMonth: formData.paymentMonth,
      category: formData.category,
      kategoriLainnya: formData.kategoriLainnya,
      description: formData.description,
      amount: formData.amount,
      armadaId: formData.armadaId,
      driverId: formData.driverId,
      staffId: formData.staffId,
      namaPenerima: formData.namaPenerima,
    };

    setRequestingExpense(editingData);
    setRequestType("edit");
    setProposedChanges(proposedChanges);
    setUpdatedData(updatedData); // Store full data for API
    setIsRequestDialogOpen(true);
  };

  // Handler: Submit request (edit atau delete)
  const handleSubmitRequest = async (expenseId, reason) => {
    await executeAction(
      `submit-request-${expenseId}`,
      async () => {
        const endpoint =
          requestType === "edit"
            ? `/api/expenses/${expenseId}/request-edit`
            : `/api/expenses/${expenseId}/request-delete`;

        const body =
          requestType === "edit"
            ? { reason, updatedData: updatedData || {} }
            : { reason };

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Gagal mengajukan request");
        }

        await fetchData(currentPage); // Refresh data
        setIsRequestDialogOpen(false);
        setIsDialogOpen(false); // Close the edit dialog too
        setProposedChanges(null);
        setUpdatedData(null);
      },
      {
        successMessage: `Permintaan ${requestType === "edit" ? "perubahan" : "penghapusan"} berhasil diajukan`,
        errorMessage: "Gagal mengirim permintaan",
      }
    );
  };

  // Handler: Admin review approval
  const handleReviewApproval = (expense) => {
    setApprovingExpense(expense);
    setIsApprovalDialogOpen(true);
  };

  // Handler: Admin approve edit
  const handleApproveEdit = async (expenseId) => {
    setIsSubmittingApproval(true);
    try {
      const res = await fetch(`/api/expenses/${expenseId}/approve-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ updatedData: {} }), // TODO: Get updated data
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menyetujui edit");
      }

      await fetchData(currentPage);
      setIsApprovalDialogOpen(false);
      toast.success("Permintaan Perubahan Disetujui", {
        description: "Perubahan data telah diterapkan dengan sukses",
      });
    } catch (err) {
      console.error("Failed to approve edit:", err);
      toast.error("Gagal Menyetujui Perubahan", {
        description: err.message,
      });
      throw err;
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Handler: Admin approve delete
  const handleApproveDelete = async (expenseId) => {
    setIsSubmittingApproval(true);
    try {
      const res = await fetch(`/api/expenses/${expenseId}/approve-delete`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menyetujui delete");
      }

      await fetchData(1); // Reset to first page
      setIsApprovalDialogOpen(false);
      toast.success("Permintaan Penghapusan Disetujui", {
        description: "Data pengeluaran telah dihapus secara permanen",
      });
    } catch (err) {
      console.error("Failed to approve delete:", err);
      toast.error("Gagal Menyetujui Penghapusan", {
        description: err.message,
      });
      throw err;
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Handler: Admin reject request
  const handleReject = async (expenseId, reason) => {
    setIsSubmittingApproval(true);
    try {
      const res = await fetch(`/api/expenses/${expenseId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menolak request");
      }

      await fetchData(currentPage);
      setIsApprovalDialogOpen(false);
      toast.success("Permintaan Ditolak", {
        description: "Data pengeluaran dikembalikan ke status disetujui",
      });
    } catch (err) {
      console.error("Failed to reject:", err);
      toast.error("Gagal Memproses Penolakan", {
        description: err.message,
      });
      throw err;
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingForm(true);
    try {
      const method = editingData ? "PUT" : "POST";
      const url = editingData
        ? `/api/expenses/${editingData.id}`
        : "/api/expenses";

      // Ensure amount is a valid number
      const cleanAmount =
        typeof formData.amount === "number"
          ? formData.amount
          : parseInt(String(formData.amount).replace(/[^0-9]/g, ""), 10);

      if (isNaN(cleanAmount) || cleanAmount <= 0) {
        await showAlert({
          message: "Jumlah (amount) harus diisi dan lebih dari 0.",
          type: "warning",
        });
        return;
      }

      // Use FormData for file uploads
      const formDataToSend = new FormData();
      formDataToSend.append("date", new Date(formData.date).toISOString());
      if (formData.paymentMonth) {
        const year = new Date().getFullYear();
        const monthIndex = parseInt(formData.paymentMonth, 10) - 1;
        formDataToSend.append(
          "paymentMonth",
          new Date(Date.UTC(year, monthIndex, 1)).toISOString()
        );
      }
      formDataToSend.append("category", formData.category);
      if (formData.kategoriLainnya) {
        formDataToSend.append("kategoriLainnya", formData.kategoriLainnya);
      }
      formDataToSend.append("description", formData.description);
      formDataToSend.append("amount", cleanAmount.toString());
      if (formData.armadaId) {
        formDataToSend.append("armadaId", formData.armadaId);
      }
      if (formData.driverId) {
        formDataToSend.append("driverId", formData.driverId);
      }
      if (formData.staffId) {
        formDataToSend.append("staffId", formData.staffId);
      }
      if (formData.namaPenerima) {
        formDataToSend.append("namaPenerima", formData.namaPenerima);
      }
      if (formData.file) {
        formDataToSend.append("file", formData.file);
        // If editing and replacing existing file, send flag to delete old file
        if (editingData && existingAttachments.length > 0) {
          formDataToSend.append("replaceExisting", "true");
          formDataToSend.append("oldFileId", existingAttachments[0].id);
        }
      }

      const res = await fetch(url, {
        method,
        credentials: "include",
        body: formDataToSend,
      });

      let responseData;
      if (!res.ok) {
        let errorData = null;
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            errorData = await res.json();
          } else {
            const text = await res.text();
            console.error(
              "Server response (non-JSON):",
              text.substring(0, 200)
            );
            errorData = {
              message: `Server Error: ${res.status} ${res.statusText}`,
            };
          }
        } catch (parseErr) {
          console.error("Error parsing error response:", parseErr);
          errorData = {
            message: `Server Error: ${res.status} ${res.statusText}`,
          };
        }

        console.error("Server menolak data:", errorData);
        throw new Error(
          errorData.message ||
            `Terjadi kesalahan saat menyimpan (${res.status})`
        );
      }

      // Only read the response body once when successful
      try {
        responseData = await res.json();
      } catch (parseErr) {
        console.error("Error parsing success response:", parseErr);
        throw new Error("Gagal memproses respons server");
      }

      setIsDialogOpen(false);
      setEditingData(null);
      setExistingAttachments([]);
      await fetchData(currentPage);
    } catch (err) {
      console.error("Failed to save", err.message);
      await showAlert({
        message: "Gagal menyimpan: " + err.message,
        type: "error",
      });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // --- Render ---
  return (
    <div className="flex w-full flex-col">
      <PengeluaranHeader onAdd={openNewDialog} />

      <PengeluaranFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        dateRange={dateRange}
        onDateChange={handleDateChange}
        onDateReset={handleDateReset}
        quickFilter={quickFilter}
        onQuickFilterChange={handleQuickFilterChange}
      />

      {/* Konten Utama (Tabel) */}
      <div className="p-4">
        <PengeluaranTable
          isLoading={isLoading || userRoleLoading}
          data={filteredData}
          onEdit={openEditDialog}
          onDelete={handleDelete}
          onView={openDetailModal}
          onRequestEdit={handleRequestEdit}
          onRequestDelete={handleRequestDelete}
          onReviewApproval={handleReviewApproval}
          userRole={userRole}
          loadingActions={loadingActions}
        />

        {/* Pagination - hanya tampil jika tidak ada filter aktif */}
        {!isLoading &&
          totalPages > 1 &&
          !searchTerm.trim() &&
          !dateRange.from &&
          !dateRange.to && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                showInfo={true}
              />
            </div>
          )}
      </div>

      {/* Dialog Form (tersembunyi by default) */}
      <PengeluaranDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isEditing={!!editingData}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSelectChange={handleSelectChange}
        handleAmountChange={handleAmountChange}
        handleFileChange={handleFileChange}
        handleRemoveFile={handleRemoveFile}
        handleSubmit={handleSubmit}
        armadaList={armadaList}
        driverList={driverList}
        stafList={stafList}
        isLoadingDependencies={isLoadingDependencies}
        existingAttachments={existingAttachments}
        expenseId={editingData?.id}
        isLoading={isSubmittingForm}
        userRole={userRole}
        originalData={editingData}
        onRequestApproval={handleOperatorEditRequest}
      />

      {/* Detail Modal */}
      <PengeluaranDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        data={selectedDetailData}
      />

      {/* Approval Dialog (Admin) */}
      <ExpenseApprovalDialog
        isOpen={isApprovalDialogOpen}
        onClose={() => setIsApprovalDialogOpen(false)}
        expense={approvingExpense}
        onApproveEdit={handleApproveEdit}
        onApproveDelete={handleApproveDelete}
        onReject={handleReject}
        isSubmitting={isSubmittingApproval}
      />

      {/* Request Dialog (Operator) */}
      <ExpenseRequestDialog
        isOpen={isRequestDialogOpen}
        onClose={() => setIsRequestDialogOpen(false)}
        expense={requestingExpense}
        requestType={requestType}
        onSubmit={handleSubmitRequest}
        isSubmitting={isSubmittingRequest}
        proposedChanges={proposedChanges}
      />
    </div>
  );
}
