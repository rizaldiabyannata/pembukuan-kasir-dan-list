"use client";

import React, { useState, useEffect } from "react";
import { useAlertDialog } from "@/components/ui/alert-dialog-provider";
import { useActionLoading } from "@/hooks/useActionLoading";
import { CardSkeleton } from "@/components/ui/card-skeleton";

import SopirCard from "@/components/sopir/SopirCard";
import SopirTopHeader from "@/components/sopir/SopirTopHeader";
import SopirDialog from "@/components/sopir/SopirDialog";

export default function SopirPage() {
  const { showConfirm } = useAlertDialog();
  const { executeAction, isActionLoading } = useActionLoading();
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    driver_name: "",
    phone_number: "",
    address: "",
    nik: "",
    status: "READY",
  });
  const [searchTerm, setSearchTerm] = useState("");

  async function fetchDrivers() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/drivers", {
        credentials: "include",
      });
      const result = await response.json();
      // API returns { success, data, message }
      const data = result.data || result;
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load drivers", err);
      setDrivers([]); // Fallback to empty array
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingDriver ? "PUT" : "POST";
    const url = editingDriver
      ? `/api/drivers/${editingDriver.id}`
      : "/api/drivers";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setIsDialogOpen(false);
      setEditingDriver(null);
      fetchDrivers(); // Refresh data
    } else {
      console.error("Failed to save driver");
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      driver_name: driver.driver_name,
      phone_number: driver.phone_number,
      nik: driver.nik || "",
      address: driver.address,
      status: driver.status,
    });
    setIsDialogOpen(true);
  };

  const handleSetStatus = async (driver, newStatus) => {
    try {
      const payload = { ...driver, status: newStatus };
      const res = await fetch(`/api/drivers/${driver.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("status update failed");
      await fetchDrivers();
    } catch (err) {
      console.error("Failed to update driver status", err);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      message: "Are you sure you want to delete this driver?",
      title: "Konfirmasi Hapus",
      confirmText: "Hapus",
      cancelText: "Batal",
    });

    if (confirmed) {
      await executeAction(
        `delete-${id}`,
        async () => {
          const response = await fetch(`/api/drivers/${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!response.ok) {
            throw new Error("Failed to delete driver");
          }
          return response.json();
        },
        {
          successMessage: "Sopir berhasil dihapus",
          errorMessage: "Gagal menghapus sopir",
          onSuccess: () => fetchDrivers(),
        }
      );
    }
  };

  const openNewDriverDialog = () => {
    setEditingDriver(null);
    setFormData({
      driver_name: "",
      phone_number: "",
      address: "",
      status: "READY",
    });
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex flex-col gap-4 p-4 pt-0">
        <SopirTopHeader
          onAdd={openNewDriverDialog}
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
        />
        <div>
          {isLoading ? (
            <CardSkeleton count={6} variant="detailed" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {drivers
                .filter((d) => {
                  const q = searchTerm.trim().toLowerCase();
                  return (
                    !q ||
                    (d.driver_name &&
                      d.driver_name.toLowerCase().includes(q)) ||
                    (d.phone_number && d.phone_number.toLowerCase().includes(q))
                  );
                })
                .map((driver) => {
                  const isDriverInUse =
                    driver.status === "BOOKED" || driver.status === "ON_TRIP";
                  return (
                    <SopirCard
                      key={driver.id}
                      driver={driver}
                      onEdit={handleEdit}
                      onSetStatus={handleSetStatus}
                      onDelete={handleDelete}
                      isDisabled={isDriverInUse}
                      isDeleting={isActionLoading(`delete-${driver.id}`)}
                    />
                  );
                })}
            </div>
          )}
        </div>

        <SopirDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          editingDriver={editingDriver}
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
