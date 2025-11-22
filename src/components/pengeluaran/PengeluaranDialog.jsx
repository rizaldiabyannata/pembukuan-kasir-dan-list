"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import ExpenseFilePreview from "./ExpenseFilePreview";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

const kategoriOptions = [
  { value: "LISTRIK", label: "Listrik" },
  { value: "INTERNET", label: "Internet" },
  { value: "PAKET_DATA", label: "Paket Data" },
  { value: "KONSUMSI", label: "Konsumsi" },
  { value: "GAJI_STAF_OPERASIONAL", label: "Gaji Staf Operasional" },
  { value: "GAJI_STAF_ADMIN", label: "Gaji Staf Admin" },
  { value: "INSENTIF_BONUS", label: "Insentif/Bonus" },
  { value: "PAJAK", label: "Pajak" },
  { value: "ALAT_TULIS_KANTOR", label: "Alat Tulis Kantor (ATK)" },
  { value: "KOMPUTER_SUPPLIES", label: "Komputer Supplies" },
  { value: "OPERASIONAL_LAINNYA", label: "Operasional Lainnya" },
  { value: "BBM", label: "BBM (Armada)" },
  { value: "PERAWATAN_ARMADA", label: "Perawatan Armada" },
  { value: "GAJI_SOPIR", label: "Gaji Sopir" },
  { value: "LAINNYA", label: "Lainnya..." },
];

const bulanOptions = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const getFileIcon = (file) => {
  if (file.type.startsWith("image/")) {
    return <ImageIcon className="h-8 w-8 text-blue-500" />;
  } else if (file.type === "application/pdf") {
    return <FileText className="h-8 w-8 text-red-500" />;
  }
  return <FileText className="h-8 w-8 text-gray-500" />;
};

export default function PengeluaranDialog({
  open,
  onOpenChange,
  isEditing,
  formData,
  handleInputChange,
  handleSelectChange,
  handleSubmit,
  handleFileChange,
  handleRemoveFile,
  armadaList,
  driverList,
  stafList,
  isLoadingDependencies,
  existingAttachments = [],
  expenseId,
  isLoading = false,
  userRole,
  originalData,
  onRequestApproval,
}) {
  const [insentifType, setInsentifType] = React.useState("custom");

  React.useEffect(() => {
    if (formData.staffId) {
      setInsentifType("staff");
    } else if (formData.driverId) {
      setInsentifType("driver");
    } else {
      setInsentifType("custom");
    }
  }, [formData.staffId, formData.driverId]);

  const isOperatorRequest = userRole === "OPERATOR" && isEditing;

  const armadaCategories = ["BBM", "PERAWATAN_ARMADA", "PAJAK"];
  const stafCategories = ["GAJI_STAF_OPERASIONAL", "GAJI_STAF_ADMIN"];
  const insentifCategories = ["INSENTIF_BONUS"];

  const handleOpenChange = (newOpen) => {
    // Prevent closing dialog when loading
    if (isLoading && !newOpen) return;
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Pengeluaran" : "Tambah Pengeluaran Baru"}
          </DialogTitle>
        </DialogHeader>

        <form
          id="pengeluaran-form"
          onSubmit={
            isOperatorRequest
              ? (e) => {
                  e.preventDefault();
                  onRequestApproval();
                }
              : handleSubmit
          }
          className="space-y-4 py-4"
        >
          <div className="space-y-2">
            <Label htmlFor="date">Tanggal</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              placeholder="Pilih tanggal pengeluaran..."
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMonth">Alokasi Bulan</Label>
            <Select
              value={formData.paymentMonth || undefined}
              onValueChange={(value) =>
                handleSelectChange("paymentMonth", value)
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih bulan alokasi..." />
              </SelectTrigger>
              <SelectContent>
                {bulanOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleSelectChange("category", value)}
              required
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori..." />
              </SelectTrigger>
              <SelectContent>
                {kategoriOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.category === "LAINNYA" && (
            <div className="space-y-2">
              <Label htmlFor="kategoriLainnya">Kategori Lainnya</Label>
              <Input
                id="kategoriLainnya"
                value={formData.kategoriLainnya}
                onChange={handleInputChange}
                placeholder="Contoh: Transportasi, Marketing, dll..."
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Masukkan deskripsi pengeluaran..."
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah</Label>
            <CurrencyInput
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Masukkan jumlah pengeluaran..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Bukti Transaksi</Label>
            <div className="space-y-3">
              {/* File Upload Area */}
              {!formData.file && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="file"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600">
                        Klik untuk upload
                      </span>{" "}
                      atau drag & drop
                    </div>
                    <div className="text-xs text-gray-500">
                      JPG, PNG, PDF (max. 5MB)
                    </div>
                  </label>
                </div>
              )}

              {/* File Preview */}
              {formData.file && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-3">
                    {getFileIcon(formData.file)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {formData.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(formData.file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Image Preview */}
                  {formData.file.type.startsWith("image/") && (
                    <div className="mt-3">
                      <img
                        src={URL.createObjectURL(formData.file)}
                        alt="Preview"
                        className="max-w-full max-h-32 object-contain rounded border"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Existing Attachments for Edit */}
          {isEditing && existingAttachments.length > 0 && !formData.file && (
            <div className="space-y-2">
              <Label>Lampiran yang Ada</Label>
              <div className="text-sm text-muted-foreground mb-2">
                Upload file baru akan mengganti file yang ada
              </div>
              <div className="space-y-3">
                {existingAttachments.map((attachment) => (
                  <ExpenseFilePreview
                    key={attachment.id}
                    file={attachment}
                    expenseId={expenseId}
                    onDownload={(fileId, fileName) =>
                      window.open(
                        `/api/expenses/${expenseId}/files/${fileId}`,
                        "_blank"
                      )
                    }
                    showThumbnail={true}
                    thumbnailHeight="h-24"
                  />
                ))}
              </div>
            </div>
          )}

          {armadaCategories.includes(formData.category) && (
            <div className="space-y-2">
              <Label htmlFor="armadaId">Plat Mobil</Label>
              <Select
                value={formData.armadaId || ""}
                onValueChange={(value) =>
                  handleSelectChange(
                    "armadaId",
                    value === "NONE" ? null : value
                  )
                }
                disabled={isLoadingDependencies}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingDependencies ? "Memuat..." : "Pilih armada..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Tidak Terkait</SelectItem>
                  {armadaList.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.license_plate} ({item.model})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.category === "GAJI_SOPIR" && (
            <div className="space-y-2">
              <Label htmlFor="driverId">Nama Sopir</Label>
              <Select
                value={formData.driverId || ""}
                onValueChange={(value) =>
                  handleSelectChange(
                    "driverId",
                    value === "NONE" ? null : value
                  )
                }
                disabled={isLoadingDependencies}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingDependencies ? "Memuat..." : "Pilih sopir..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Tidak Terkait</SelectItem>
                  {driverList.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.driver_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {stafCategories.includes(formData.category) && (
            <div className="space-y-2">
              <Label htmlFor="staffId">Nama Staf</Label>
              <Select
                value={formData.staffId || ""}
                onValueChange={(value) =>
                  handleSelectChange("staffId", value === "NONE" ? null : value)
                }
                disabled={isLoadingDependencies}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingDependencies ? "Memuat..." : "Pilih staf..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Tidak Terkait</SelectItem>
                  {stafList.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.staff_name} ({item.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {insentifCategories.includes(formData.category) && (
            <div className="space-y-4 border rounded-lg p-3 bg-blue-50">
              <div className="space-y-2">
                <Label htmlFor="insentifType">Jenis Penerima</Label>
                <Select
                  value={insentifType}
                  onValueChange={(value) => {
                    setInsentifType(value);
                    if (value === "staff") {
                      handleSelectChange("driverId", null);
                      handleSelectChange("namaPenerima", null);
                    } else if (value === "driver") {
                      handleSelectChange("staffId", null);
                      handleSelectChange("namaPenerima", null);
                    } else {
                      handleSelectChange("staffId", null);
                      handleSelectChange("driverId", null);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis penerima..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="driver">Sopir</SelectItem>
                    <SelectItem value="custom">Nama Bebas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {insentifType === "staff" && (
                <div className="space-y-2">
                  <Label htmlFor="staffId">Pilih Staff</Label>
                  <Select
                    value={formData.staffId || ""}
                    onValueChange={(value) =>
                      handleSelectChange(
                        "staffId",
                        value === "NONE" ? null : value
                      )
                    }
                    disabled={isLoadingDependencies}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingDependencies ? "Memuat..." : "Pilih staff..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Tidak Terkait</SelectItem>
                      {stafList.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.staff_name} ({item.position})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {insentifType === "driver" && (
                <div className="space-y-2">
                  <Label htmlFor="driverId">Pilih Sopir</Label>
                  <Select
                    value={formData.driverId || ""}
                    onValueChange={(value) =>
                      handleSelectChange(
                        "driverId",
                        value === "NONE" ? null : value
                      )
                    }
                    disabled={isLoadingDependencies}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingDependencies ? "Memuat..." : "Pilih sopir..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Tidak Terkait</SelectItem>
                      {driverList.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.driver_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {insentifType === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="namaPenerima">Nama Penerima</Label>
                  <Input
                    id="namaPenerima"
                    value={formData.namaPenerima || ""}
                    onChange={handleInputChange}
                    placeholder="Contoh: John Doe, PT ABC, dll..."
                    required
                  />
                </div>
              )}
            </div>
          )}
        </form>

        <LoadingOverlay
          isVisible={isLoading}
          message={
            isOperatorRequest
              ? "Mengajukan persetujuan..."
              : "Menyimpan data..."
          }
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              Batal
            </Button>
          </DialogClose>
          <LoadingButton
            type={isOperatorRequest ? "button" : "submit"}
            form="pengeluaran-form"
            isLoading={isLoading}
            loadingText={isOperatorRequest ? "Mengajukan..." : "Menyimpan..."}
            onClick={isOperatorRequest ? onRequestApproval : undefined}
          >
            {isOperatorRequest ? "Ajukan Persetujuan" : "Simpan"}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
