"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAlertDialog } from "@/components/ui/alert-dialog-provider";

import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

import StaffCard from "@/components/staff/StaffCard";
import StaffDialog from "@/components/staff/StaffDialog";

export default function StaffPage() {
  const { showConfirm } = useAlertDialog();
  const [staff, setStaff] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    staff_name: "",
    nik: "",
    position: "",
    phone_number: "",
    email: "",
    address: "",
    salary_amount: "",
    allowances: "0",
    bank_name: "",
    bank_account: "",
    account_holder: "",
    join_date: new Date().toISOString().split("T")[0],
    status: "ACTIVE",
    notes: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/staff?${params.toString()}`, {
        credentials: "include",
      });
      const result = await response.json();

      if (response.ok) {
        setStaff(result.staff || []);
      } else {
        toast.error(result.error || "Gagal memuat data staff");
        setStaff([]);
      }
    } catch (err) {
      console.error("Failed to load staff", err);
      toast.error("Gagal memuat data staff");
      setStaff([]);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStaff();
  }, [statusFilter, fetchStaff]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi
    if (!formData.staff_name.trim()) {
      toast.error("Nama staff harus diisi");
      return;
    }
    if (!formData.position) {
      toast.error("Posisi harus dipilih");
      return;
    }
    if (!formData.phone_number.trim()) {
      toast.error("Nomor HP harus diisi");
      return;
    }
    if (!formData.salary_amount || parseInt(formData.salary_amount) <= 0) {
      toast.error("Gaji harus lebih dari 0");
      return;
    }
    if (!formData.join_date) {
      toast.error("Tanggal bergabung harus diisi");
      return;
    }

    const method = editingStaff ? "PUT" : "POST";
    const url = editingStaff ? `/api/staff/${editingStaff.id}` : "/api/staff";

    setIsSubmitting(true);
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          salary_amount: parseInt(formData.salary_amount),
          allowances: parseInt(formData.allowances || 0),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          editingStaff
            ? "Staff berhasil diupdate"
            : "Staff berhasil ditambahkan"
        );
        setIsDialogOpen(false);
        setEditingStaff(null);
        fetchStaff();
      } else {
        toast.error(result.error || "Gagal menyimpan data staff");
      }
    } catch (error) {
      console.error("Failed to save staff", error);
      toast.error("Gagal menyimpan data staff");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      staff_name: staffMember.staff_name,
      nik: staffMember.nik || "",
      position: staffMember.position,
      phone_number: staffMember.phone_number,
      email: staffMember.email || "",
      address: staffMember.address || "",
      salary_amount: staffMember.salary_amount.toString(),
      allowances: (staffMember.allowances || 0).toString(),
      bank_name: staffMember.bank_name || "",
      bank_account: staffMember.bank_account || "",
      account_holder: staffMember.account_holder || "",
      join_date: new Date(staffMember.join_date).toISOString().split("T")[0],
      status: staffMember.status,
      notes: staffMember.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      message:
        "Apakah Anda yakin ingin menghapus staff ini? Status akan diubah menjadi TERMINATED.",
      title: "Konfirmasi Hapus Staff",
      confirmText: "Hapus",
      cancelText: "Batal",
    });

    if (confirmed) {
      try {
        const response = await fetch(`/api/staff/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (parseErr) {
            errorData = {
              error: `Server Error: ${response.status} ${response.statusText}`,
            };
          }
          toast.error(errorData.error || "Gagal menghapus staff");
          return;
        }

        const result = await response.json();
        toast.success("Staff berhasil dihapus");
        fetchStaff();
      } catch (error) {
        console.error("Failed to delete staff", error);
        toast.error("Gagal menghapus staff");
      }
    }
  };

  const openNewStaffDialog = () => {
    setEditingStaff(null);
    setFormData({
      staff_name: "",
      nik: "",
      position: "",
      phone_number: "",
      email: "",
      address: "",
      salary_amount: "",
      allowances: "0",
      bank_name: "",
      bank_account: "",
      account_holder: "",
      join_date: new Date().toISOString().split("T")[0],
      status: "ACTIVE",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const filteredStaff = staff.filter((s) => {
    const q = searchTerm.trim().toLowerCase();
    return (
      !q ||
      (s.staff_name && s.staff_name.toLowerCase().includes(q)) ||
      (s.nik && s.nik.toLowerCase().includes(q)) ||
      (s.position && s.position.toLowerCase().includes(q)) ||
      (s.phone_number && s.phone_number.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <PageHeader
        title="Manajemen Staff"
        description="Kelola data staff dan informasi penggajian bulanan."
      >
        <Button onClick={openNewStaffDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Staff
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-4 p-4 pt-0">
        <div className="flex flex-col sm:flex-row items-end gap-4 mb-4">
          <Input
            placeholder="Cari nama, NIK, posisi, atau no. HP..."
            className="max-w-sm"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white"
          >
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Tidak Aktif</option>
            <option value="ON_LEAVE">Cuti</option>
          </select>
        </div>
        <div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStaff.map((staffMember) => (
              <StaffCard
                key={staffMember.id}
                staff={staffMember}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
            {filteredStaff.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                Tidak ada data staff
              </div>
            )}
          </div>
        </div>
      </div>

      <StaffDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingStaff={editingStaff}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
