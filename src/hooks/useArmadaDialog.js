import { useState } from "react";
import * as armadaService from "@/services/armadaService";

const INITIAL_FORM_DATA = {
  license_plate: "",
  brand: "",
  model: "",
  status: "READY",
  description: "",
};

export const useArmadaDialog = (onSuccess) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArmada, setEditingArmada] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isCustomModel, setIsCustomModel] = useState(false);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((p) => ({ ...p, [id]: value }));
  };

  const openNewArmadaDialog = () => {
    setEditingArmada(null);
    setFormData(INITIAL_FORM_DATA);
    setIsCustomModel(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (armada) => {
    const known = ["Innova Reborn", "Hi-Ace"];
    setEditingArmada(armada);
    setIsCustomModel(Boolean(armada.model && !known.includes(armada.model)));
    setFormData({
      license_plate: armada.license_plate || "",
      brand: armada.brand || "",
      model: armada.model || "",
      status: armada.status || "READY",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingArmada) {
        await armadaService.updateArmada(editingArmada.id, formData);
      } else {
        await armadaService.createArmada(formData);
      }
      setIsDialogOpen(false);
      setEditingArmada(null);
      onSuccess(); // Callback to refetch data
    } catch (err) {
      console.error(err.message);
    }
  };

  return {
    isDialogOpen,
    editingArmada,
    formData,
    isCustomModel,
    setIsDialogOpen,
    handleInputChange,
    setIsCustomModel,
    handleSubmit,
    openNewArmadaDialog,
    handleEdit,
  };
};
