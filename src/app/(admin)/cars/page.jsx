"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import ArmadaHeader from "@/components/armada/ArmadaHeader";
import ArmadaFilters from "@/components/armada/ArmadaFilters";
import ArmadaCard from "@/components/armada/ArmadaCard";
import ArmadaDialog from "@/components/armada/ArmadaDialog";
import { useArmada } from "@/hooks/useArmada";
import { useArmadaDialog } from "@/hooks/useArmadaDialog";

export default function ArmadaPage() {
  const {
    armadas,
    isLoading,
    searchTerm,
    filterStatus,
    statusCounts,
    handleSearchChange,
    setFilterStatus,
    handleDelete,
    handleMaintenance,
    refetchArmadas,
  } = useArmada();

  const dialog = useArmadaDialog(refetchArmadas);

  return (
    <div>
      <ArmadaHeader onAdd={dialog.openNewArmadaDialog} />

      <ArmadaFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        statusCounts={statusCounts}
      />

      <div className="p-4">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border bg-white p-4"
              >
                <div className="h-36 bg-slate-100 rounded mb-3" />
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : armadas.length === 0 ? (
          <div className="rounded-lg border-dashed border-2 border-slate-200 p-6 text-center">
            <p className="text-lg font-medium mb-2">Belum ada armada</p>
            <p className="text-sm text-muted-foreground mb-4">
              Tambahkan armada pertama Anda untuk mulai mencatat kendaraan.
            </p>
            <Button onClick={dialog.openNewArmadaDialog}>Tambah Armada</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {armadas.map((a) => (
              <ArmadaCard
                key={a.id}
                armada={a}
                onEdit={() => dialog.handleEdit(a)}
                onDelete={() => handleDelete(a.id)}
                onMaintenance={() => handleMaintenance(a)}
              />
            ))}
          </div>
        )}
      </div>

      <ArmadaDialog
        open={dialog.isDialogOpen}
        onOpenChange={dialog.setIsDialogOpen}
        editingArmada={dialog.editingArmada}
        formData={dialog.formData}
        handleInputChange={dialog.handleInputChange}
        isCustomModel={dialog.isCustomModel}
        setIsCustomModel={dialog.setIsCustomModel}
        handleSubmit={dialog.handleSubmit}
      />
    </div>
  );
}
