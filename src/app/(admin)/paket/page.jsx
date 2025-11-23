"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PlusCircle } from "lucide-react";
import { PackageForm } from "@/components/packages/PackageForm";
import { PackageList } from "@/components/packages/PackageList";
import { PackageDetail } from "@/components/packages/PackageDetail";
import { DeleteConfirmation } from "@/components/packages/DeleteConfirmation";
import { CardSkeleton } from "@/components/ui/card-skeleton";

export default function PackagesPage() {
  const [packages, setPackages] = useState(null); // null = loading, [] = empty, [...] = loaded
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const fetchPackages = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/packages", {
        credentials: "include",
      });
      console.log("Fetch /api/packages response:", res);
      if (!res.ok) {
        const text = await res.text().catch(() => "<no body>");
        console.error("Failed to fetch packages:", res.status, text);
        setPackages([]);
        return;
      }

      const result = await res.json().catch((err) => {
        console.error("Failed to parse /api/packages response as JSON", err);
        return null;
      });

      // API returns { success, data, message }
      const data = result?.data || result;

      if (!Array.isArray(data)) {
        console.warn(
          "/api/packages returned unexpected payload, expected array.",
          data
        );
        setPackages([]);
        return;
      }

      setPackages(data);
    } catch (err) {
      console.error("Error fetching packages:", err);
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPackages();
  }, [fetchPackages]);

  const handleFormSubmit = async (data) => {
    const method = selectedPackage && selectedPackage.id ? "PUT" : "POST";
    const url =
      selectedPackage && selectedPackage.id
        ? `/api/packages/${selectedPackage.id}`
        : "/api/packages";

    console.log("=== Submitting package form ===");
    console.log("Method:", method);
    console.log("URL:", url);
    console.log("Data:", JSON.stringify(data, null, 2));

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      console.log(`Submit package form response (${method} ${url}):`, res);

      if (res.ok) {
        console.log("Package saved successfully");
        toast.success(
          selectedPackage
            ? "Paket berhasil diupdate!"
            : "Paket berhasil ditambahkan!",
          {
            description: data.name || data.namaPaket || "Paket",
          }
        );
        setIsFormOpen(false);
        setSelectedPackage(null);
        await fetchPackages(); // Wait for fetch to complete
      } else {
        let detail = "";
        let errorData = null;
        try {
          const text = await res.text();
          detail = text;
          try {
            errorData = JSON.parse(text);
            detail = errorData.error || errorData.details || text;
          } catch {}
        } catch {}
        console.error("Failed to save package", res.status, detail);
        toast.error(`Gagal menyimpan paket (status ${res.status})`, {
          description: detail || "Coba lagi atau periksa log server.",
        });
      }
    } catch (err) {
      console.error("Failed to save package", err);
      toast.error("Gagal menyimpan paket", {
        description: err?.message || err,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedPackage) return;
    try {
      const res = await fetch(`/api/packages/${selectedPackage.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setIsDeleteConfirmOpen(false);
        setSelectedPackage(null);
        fetchPackages();
      } else {
        console.error("Failed to delete package");
      }
    } catch (err) {
      console.error("Failed to delete package", err);
    }
  };

  const openCreateForm = () => {
    setSelectedPackage(null);
    setIsFormOpen(true);
  };

  const openEditForm = (pkg) => {
    setSelectedPackage(pkg);
    setIsFormOpen(true);
  };

  const openDetailView = (pkg) => {
    setSelectedPackage(pkg);
    setIsDetailOpen(true);
  };

  const openDeleteConfirm = (pkg) => {
    setSelectedPackage(pkg);
    setIsDeleteConfirmOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Manajemen Paket"
        description="Kelola paket layanan Anda — tambah, edit, dan lihat detail paket."
      >
        <Button onClick={openCreateForm}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Paket
        </Button>
      </PageHeader>

      <div className="p-4">
        {isLoading ? (
          <CardSkeleton count={6} variant="detailed" />
        ) : packages.length === 0 ? (
          <div className="rounded-lg border-dashed border-2 border-slate-200 p-6 text-center">
            <p className="text-lg font-medium mb-2">Belum ada paket jasa</p>
            <p className="text-sm text-muted-foreground mb-4">
              Tambahkan paket jasa pertama Anda untuk mulai mencatat layanan.
            </p>
            <Button onClick={openCreateForm}>Tambah Paket</Button>
          </div>
        ) : (
          <PackageList
            packages={packages}
            onEdit={openEditForm}
            onDelete={openDeleteConfirm}
            onView={openDetailView}
          />
        )}
      </div>

      <PackageForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        defaultValues={selectedPackage}
      />

      <PackageDetail
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        pkg={selectedPackage}
      />

      <DeleteConfirmation
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={handleDelete}
      />
    </div>
  );
}
