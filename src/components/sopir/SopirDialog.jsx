"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";

export default function SopirDialog({
  open,
  onOpenChange,
  editingDriver,
  formData,
  handleInputChange,
  handleSubmit,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await handleSubmit(e);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm md:max-w-md w-full rounded-lg bg-white p-6 shadow-xl">
        <DialogHeader className="mb-4">
          <DialogTitle>
            {editingDriver ? "Edit Sopir" : "Formulir Sopir Baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="pb-1" htmlFor="driver_name">
              Nama Sopir
            </Label>
            <Input
              id="driver_name"
              placeholder="Masukkan Nama Sopir"
              value={formData.driver_name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label className="pb-1" htmlFor="nik">
              NIK Sopir
            </Label>
            <Input
              id="nik"
              placeholder="Masukkan NIK Sopir"
              value={formData.nik ?? ""}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label className="pb-1" htmlFor="phone_number">
              Nomor Hp Sopir
            </Label>
            <Input
              id="phone_number"
              placeholder="+62"
              value={formData.phone_number}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label className="pb-1" htmlFor="address">
              Alamat
            </Label>
            <Input
              id="address"
              placeholder="Masukkan alamat (opsional)"
              value={formData.address ?? ""}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label className="pb-1" htmlFor="status">
              Status
            </Label>
            <select
              id="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="READY">Ready</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="OFF_DUTY">Off / Libur</option>
            </select>
          </div>

          <div>
            <LoadingButton
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-600 text-white"
              isLoading={isSubmitting}
              loadingText="Menyimpan..."
              aria-busy={isSubmitting}
            >
              Simpan
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
