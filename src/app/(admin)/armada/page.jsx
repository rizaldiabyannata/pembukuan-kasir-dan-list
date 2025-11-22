"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/card-skeleton";
import { useActionLoading } from "@/hooks/useActionLoading";
import ArmadaHeader from "@/components/armada/ArmadaHeader";
import ArmadaFilters from "@/components/armada/ArmadaFilters";
import ArmadaCard from "@/components/armada/ArmadaCard";
import ArmadaDialog from "@/components/armada/ArmadaDialog";

export default function ArmadaPage() {
  const [armadas, setArmadas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArmada, setEditingArmada] = useState(null);
  const [formData, setFormData] = useState({
    license_plate: "",
    brand: "",
    model: "",
    status: "READY",
    description: "",
  });
  const [isCustomModel, setIsCustomModel] = useState(false);

  // Use action loading hook for item-specific loading states
  const { executeAction, isActionLoading } = useActionLoading();

  async function fetchArmadas() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/vehicles", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("fetch failed");
      const result = await res.json();
      const data = result.data || result;
      console.log("Fetched armadas:", data);
      setArmadas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load armadas", err);
      setArmadas([]); // Fallback to empty array
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchArmadas();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((p) => ({ ...p, [id]: value }));
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const filteredArmadas = armadas.filter((a) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesQ =
      !q ||
      (a.license_plate && a.license_plate.toLowerCase().includes(q)) ||
      (a.brand && a.brand.toLowerCase().includes(q)) ||
      (a.model && a.model.toLowerCase().includes(q));
    const matchesStatus =
      filterStatus === "ALL" || (a.status || "READY") === filterStatus;
    return matchesQ && matchesStatus;
  });

  const statusCounts = armadas.reduce(
    (acc, a) => {
      const s = a.status || "READY";
      acc[s] = (acc[s] || 0) + 1;
      acc.ALL = (acc.ALL || 0) + 1;
      return acc;
    },
    { ALL: 0 }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingArmada ? "PUT" : "POST";
      const url = editingArmada
        ? `/api/vehicles/${editingArmada.id}`
        : "/api/vehicles";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("save failed");
      setIsDialogOpen(false);
      setEditingArmada(null);
      await fetchArmadas();
    } catch (err) {
      console.error("Failed to save armada", err);
    }
  };

  const handleEdit = (armada) => {
    const known = ["Innova Reborn", "Hi-Ace"];
    setEditingArmada(armada);
    // model holds the 'Tipe' (Innova, Hi-Ace). If it's not in known list, treat as custom
    setIsCustomModel(Boolean(armada.model && !known.includes(armada.model)));
    setFormData({
      license_plate: armada.license_plate || "",
      brand: armada.brand || "",
      model: armada.model || "",
      status: armada.status || "READY",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    await executeAction(
      `delete-${id}`,
      async () => {
        const res = await fetch(`/api/vehicles/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Gagal menghapus armada");
        await fetchArmadas();
      },
      {
        successMessage: "Armada berhasil dihapus",
        errorMessage: "Gagal menghapus armada",
      }
    );
  };

  const handleMaintenance = async (armada) => {
    await executeAction(
      `maintenance-${armada.id}`,
      async () => {
        // Set status to MAINTENANCE (align with Prisma enum)
        const payload = { ...armada, status: "MAINTENANCE" };
        const res = await fetch(`/api/vehicles/${armada.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Gagal mengubah status maintenance");
        await fetchArmadas();
      },
      {
        successMessage: "Status maintenance berhasil diubah",
        errorMessage: "Gagal mengubah status maintenance",
      }
    );
  };

  const openNewArmadaDialog = () => {
    setEditingArmada(null);
    setFormData({
      license_plate: "",
      brand: "",
      model: "",
      status: "READY",
      description: "",
    });
    setIsCustomModel(false);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <ArmadaHeader onAdd={openNewArmadaDialog} />

      <ArmadaFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        statusCounts={statusCounts}
      />

      <div className="p-4">
        {isLoading ? (
          <CardSkeleton count={6} variant="detailed" />
        ) : filteredArmadas.length === 0 ? (
          <div className="rounded-lg border-dashed border-2 border-slate-200 p-6 text-center">
            <p className="text-lg font-medium mb-2">Belum ada armada</p>
            <p className="text-sm text-muted-foreground mb-4">
              Tambahkan armada pertama Anda untuk mulai mencatat kendaraan.
            </p>
            <Button onClick={openNewArmadaDialog}>Tambah Armada</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArmadas.map((a) => {
              const isArmadaInUse =
                a.status === "BOOKED" || a.status === "ON_TRIP";
              return (
                <ArmadaCard
                  key={a.id}
                  armada={a}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onMaintenance={handleMaintenance}
                  isDisabled={isArmadaInUse}
                  isDeleting={isActionLoading(`delete-${a.id}`)}
                  isMaintenance={isActionLoading(`maintenance-${a.id}`)}
                />
              );
            })}
          </div>
        )}
      </div>

      <ArmadaDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingArmada={editingArmada}
        formData={formData}
        handleInputChange={handleInputChange}
        isCustomModel={isCustomModel}
        setIsCustomModel={setIsCustomModel}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
