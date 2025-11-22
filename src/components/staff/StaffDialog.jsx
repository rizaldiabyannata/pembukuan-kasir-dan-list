"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { Textarea } from "@/components/ui/textarea";

export default function StaffDialog({
  open,
  onOpenChange,
  editingStaff,
  formData,
  handleInputChange,
  handleSubmit,
  isSubmitting = false,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm md:max-w-2xl w-full rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle>
            {editingStaff ? "Edit Staff" : "Formulir Staff Baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kolom Kiri */}
            <div className="space-y-4">
              <div>
                <Label className="pb-1" htmlFor="staff_name">
                  Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="staff_name"
                  placeholder="Masukkan Nama Lengkap"
                  value={formData.staff_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label className="pb-1" htmlFor="nik">
                  NIK
                </Label>
                <Input
                  id="nik"
                  placeholder="Masukkan NIK (opsional)"
                  value={formData.nik ?? ""}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label className="pb-1" htmlFor="position">
                  Posisi <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="position"
                  list="position-suggestions"
                  placeholder="Masukkan posisi (contoh: Admin, Finance, Mekanik)"
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                />
                <datalist id="position-suggestions">
                  <option value="Admin" />
                  <option value="Finance" />
                  <option value="Keuangan" />
                  <option value="Operasional" />
                  <option value="Mekanik" />
                  <option value="Customer Service" />
                  <option value="HR" />
                  <option value="Marketing" />
                  <option value="IT" />
                </datalist>
              </div>

              <div>
                <Label className="pb-1" htmlFor="phone_number">
                  Nomor HP <span className="text-red-500">*</span>
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
                <Label className="pb-1" htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@contoh.com"
                  value={formData.email ?? ""}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label className="pb-1" htmlFor="join_date">
                  Tanggal Bergabung <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="join_date"
                  type="date"
                  value={formData.join_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Kolom Kanan */}
            <div className="space-y-4">
              <div>
                <Label className="pb-1" htmlFor="salary_amount">
                  Gaji Pokok <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="salary_amount"
                  type="number"
                  placeholder="0"
                  value={formData.salary_amount}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>

              <div>
                <Label className="pb-1" htmlFor="allowances">
                  Tunjangan
                </Label>
                <Input
                  id="allowances"
                  type="number"
                  placeholder="0"
                  value={formData.allowances ?? "0"}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div>
                <Label className="pb-1" htmlFor="bank_name">
                  Nama Bank
                </Label>
                <Input
                  id="bank_name"
                  placeholder="Contoh: BCA, Mandiri, BNI"
                  value={formData.bank_name ?? ""}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label className="pb-1" htmlFor="bank_account">
                  Nomor Rekening
                </Label>
                <Input
                  id="bank_account"
                  placeholder="Masukkan nomor rekening"
                  value={formData.bank_account ?? ""}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label className="pb-1" htmlFor="account_holder">
                  Nama Pemilik Rekening
                </Label>
                <Input
                  id="account_holder"
                  placeholder="Nama sesuai rekening"
                  value={formData.account_holder ?? ""}
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
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Tidak Aktif</option>
                  <option value="ON_LEAVE">Cuti</option>
                  <option value="TERMINATED">Resign</option>
                </select>
              </div>
            </div>
          </div>

          {/* Full Width Fields */}
          <div>
            <Label className="pb-1" htmlFor="address">
              Alamat Lengkap
            </Label>
            <Textarea
              id="address"
              placeholder="Masukkan alamat lengkap (opsional)"
              value={formData.address ?? ""}
              onChange={handleInputChange}
              rows={2}
            />
          </div>

          <div>
            <Label className="pb-1" htmlFor="notes">
              Catatan
            </Label>
            <Textarea
              id="notes"
              placeholder="Catatan tambahan (opsional)"
              value={formData.notes ?? ""}
              onChange={handleInputChange}
              rows={2}
            />
          </div>

          <div>
            <LoadingButton
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-600 text-white"
              isLoading={isSubmitting}
              loadingText="Menyimpan..."
            >
              Simpan
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
