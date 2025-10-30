"use client";

import { Button } from "@/components/ui/button";
import PackageHeader from "@/components/packages/PackageHeader";
import { PackageForm } from "@/components/packages/PackageForm";
import { PackageList } from "@/components/packages/PackageList";
import { PackageDetail } from "@/components/packages/PackageDetail";
import { DeleteConfirmation } from "@/components/packages/DeleteConfirmation";
import { usePackages } from "@/hooks/usePackages";
import { usePackageDialog } from "@/hooks/usePackageDialog";

export default function PackagesPage() {
  const { packages, isLoading, refetchPackages } = usePackages();
  const dialog = usePackageDialog(refetchPackages);

  const renderContent = () => {
    if (isLoading) {
      return (
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
      );
    }

    if (!packages || packages.length === 0) {
      return (
        <div className="rounded-lg border-dashed border-2 border-slate-200 p-6 text-center">
          <p className="text-lg font-medium mb-2">Belum ada paket jasa</p>
          <p className="text-sm text-muted-foreground mb-4">
            Tambahkan paket jasa pertama Anda untuk mulai mencatat layanan.
          </p>
          <Button onClick={dialog.openCreateForm}>Tambah Paket</Button>
        </div>
      );
    }

    return (
      <PackageList
        packages={packages}
        onEdit={dialog.openEditForm}
        onDelete={dialog.openDeleteConfirm}
        onView={dialog.openDetailView}
      />
    );
  };

  return (
    <div>
      <PackageHeader onAdd={dialog.openCreateForm} />

      <div className="p-4">{renderContent()}</div>

      <PackageForm
        open={dialog.isFormOpen}
        onOpenChange={dialog.setIsFormOpen}
        onSubmit={dialog.handleFormSubmit}
        defaultValues={dialog.selectedPackage}
      />

      <PackageDetail
        open={dialog.isDetailOpen}
        onOpenChange={dialog.setIsDetailOpen}
        pkg={dialog.selectedPackage}
      />

      <DeleteConfirmation
        open={dialog.isDeleteConfirmOpen}
        onOpenChange={dialog.setIsDeleteConfirmOpen}
        onConfirm={dialog.handleDelete}
      />
    </div>
  );
}
