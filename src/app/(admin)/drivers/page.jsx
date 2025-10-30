"use client";

import React from "react";
import SopirCard from "@/components/sopir/SopirCard";
import SopirTopHeader from "@/components/sopir/SopirTopHeader";
import SopirDialog from "@/components/sopir/SopirDialog";
import { useDrivers } from "@/hooks/useDrivers";
import { useDriverDialog } from "@/hooks/useDriverDialog";

export default function SopirPage() {
  const {
    drivers,
    isLoading,
    searchTerm,
    handleSearchChange,
    handleSetStatus,
    handleDelete,
    refetchDrivers,
  } = useDrivers();

  const dialog = useDriverDialog(refetchDrivers);

  return (
    <div>
      <div className="flex flex-col gap-4 p-4 pt-0">
        <SopirTopHeader
          onAdd={dialog.openNewDriverDialog}
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
        />
        <div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drivers.map((driver) => (
              <SopirCard
                key={driver.id}
                driver={driver}
                onEdit={() => dialog.handleEdit(driver)}
                onSetStatus={handleSetStatus}
                onDelete={() => handleDelete(driver.id)}
              />
            ))}
          </div>
        </div>

        <SopirDialog
          open={dialog.isDialogOpen}
          onOpenChange={dialog.setIsDialogOpen}
          editingDriver={dialog.editingDriver}
          formData={dialog.formData}
          handleInputChange={dialog.handleInputChange}
          handleSubmit={dialog.handleSubmit}
        />
      </div>
    </div>
  );
}
