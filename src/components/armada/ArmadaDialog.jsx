import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";

// Function to format Indonesian license plate
const formatLicensePlate = (value) => {
  if (!value) return "";

  // Remove all spaces and convert to uppercase
  const cleanValue = value.replace(/\s/g, "").toUpperCase();

  // Indonesian license plate patterns:
  // - 1-2 letters + 4 digits + 1-2 letters (e.g., B1234AA, DR1234AB)
  // - 1-2 letters + 1-4 digits + 1-2 letters

  // Try to match common patterns
  if (cleanValue.length >= 5) {
    // Pattern: 1-2 letters + space + 4 digits + space + 1-2 letters
    const match = cleanValue.match(/^([A-Z]{1,2})(\d{1,4})([A-Z]{0,2})$/);
    if (match) {
      const [_, letters, numbers, suffix] = match;
      let formatted = letters;
      if (numbers) formatted += " " + numbers;
      if (suffix) formatted += " " + suffix;
      return formatted;
    }
  }

  // If no pattern matches, just return uppercase with spaces removed
  return cleanValue;
};

export default function ArmadaDialog({
  open,
  onOpenChange,
  editingArmada,
  formData,
  handleInputChange,
  isCustomModel,
  setIsCustomModel,
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
        <LoadingOverlay
          isVisible={isSubmitting}
          message="Menyimpan armada..."
        />

        <DialogHeader className="mb-4">
          <DialogTitle>
            {editingArmada ? "Edit Armada" : "Formulir Armada Baru"}
          </DialogTitle>
          <DialogDescription>Isi detail armada di bawah ini.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="pb-1" htmlFor="license_plate">
              Nomor Plat
            </Label>
            <Input
              id="license_plate"
              placeholder="B 1234 AA"
              value={formData.license_plate}
              onChange={(e) => {
                const formattedValue = formatLicensePlate(e.target.value);
                handleInputChange({
                  target: { id: "license_plate", value: formattedValue },
                });
              }}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Format: [Kode Wilayah] [Angka] [Huruf] (contoh: B 1234 AA)
            </p>
          </div>

          <div>
            <Label className="pb-1" htmlFor="brand">
              Merk
            </Label>
            <Input
              id="brand"
              placeholder="Contoh: Toyota"
              value={formData.brand}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label className="pb-1" htmlFor="model">
              Tipe
            </Label>
            <Select
              value={isCustomModel ? "__other__" : formData.model}
              onValueChange={(val) => {
                if (val === "__other__") {
                  setIsCustomModel(true);
                  /* clear model */ handleInputChange({
                    target: { id: "model", value: "" },
                  });
                } else {
                  setIsCustomModel(false);
                  handleInputChange({ target: { id: "model", value: val } });
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih tipe (atau 'Lainnya...')" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Tipe Armada</SelectLabel>
                  <SelectItem value="Innova Reborn">Innova Reborn</SelectItem>
                  <SelectItem value="Hi-Ace">Hi-Ace</SelectItem>
                  <SelectItem value="__other__">Lainnya...</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {isCustomModel && (
              <div className="mt-2">
                <Input
                  id="model"
                  placeholder="Masukkan tipe armada"
                  value={formData.model}
                  onChange={handleInputChange}
                />
              </div>
            )}

            <div className="mt-2">
              <Label className="pb-1" htmlFor="status">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  handleInputChange({ target: { id: "status", value: val } })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih status armada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Status Armada</SelectLabel>
                    <SelectItem value="READY">READY</SelectItem>
                    <SelectItem value="BOOKED">BOOKED</SelectItem>
                    <SelectItem value="ON_TRIP">ON TRIP</SelectItem>
                    <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <LoadingButton
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white"
              isLoading={isSubmitting}
              loadingText="Menyimpan..."
              disabled={isSubmitting}
            >
              Simpan
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
