import { useState } from "react";
import * as packageService from "@/services/packageService";

export const usePackageDialog = (onSuccess) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const handleFormSubmit = async (data) => {
    try {
      if (selectedPackage && selectedPackage.id) {
        await packageService.updatePackage(selectedPackage.id, data);
      } else {
        await packageService.createPackage(data);
      }
      setIsFormOpen(false);
      setSelectedPackage(null);
      onSuccess();
    } catch (err) {
      console.error("Failed to save package", err);
    }
  };

  const handleDelete = async () => {
    if (!selectedPackage) return;
    try {
      await packageService.deletePackage(selectedPackage.id);
      setIsDeleteConfirmOpen(false);
      setSelectedPackage(null);
      onSuccess();
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

  return {
    isFormOpen,
    isDetailOpen,
    isDeleteConfirmOpen,
    selectedPackage,
    setIsFormOpen,
    setIsDetailOpen,
    setIsDeleteConfirmOpen,
    handleFormSubmit,
    handleDelete,
    openCreateForm,
    openEditForm,
    openDetailView,
    openDeleteConfirm,
  };
};
