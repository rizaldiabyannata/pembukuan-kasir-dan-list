import { useState } from "react";
import * as driverService from "@/services/driverService";

const INITIAL_FORM_DATA = {
  driver_name: "",
  phone_number: "",
  address: "",
  nik: "",
  status: "READY",
};

export const useDriverDialog = (onSuccess) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        await driverService.updateDriver(editingDriver.id, formData);
      } else {
        await driverService.createDriver(formData);
      }
      setIsDialogOpen(false);
      setEditingDriver(null);
      onSuccess();
    } catch (err) {
      console.error("Failed to save driver", err);
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

  const openNewDriverDialog = () => {
    setEditingDriver(null);
    setFormData(INITIAL_FORM_DATA);
    setIsDialogOpen(true);
  };

  return {
    isDialogOpen,
    editingDriver,
    formData,
    setIsDialogOpen,
    handleInputChange,
    handleSubmit,
    handleEdit,
    openNewDriverDialog,
  };
};
