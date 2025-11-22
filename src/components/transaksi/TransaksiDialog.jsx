"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { DateTimePicker, DatePicker } from "@/components/ui/datetime-picker";

function formatCurrency(amount) {
  if (typeof amount !== "number" || isNaN(amount)) {
    return "-";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function TransaksiDialog({
  open,
  onOpenChange,
  isEditing,
  formData,
  calculatedData,
  handleSubmit,
  handleInputChange,
  handleSelectChange,
  handleDateChange,
  paketList,
  armadaList,
  sopirList,
  isLoadingDependencies,
  userRole,
  isSubmitting = false,
}) {
  // Cari paket yang dipilih untuk cek tipenya
  const selectedPackage = paketList.find(
    (pkg) => pkg.id === formData.packageId
  );

  // Debug log
  React.useEffect(() => {
    console.log("📋 TransaksiDialog - paketList updated:", {
      count: paketList.length,
      items: paketList.map((p) => ({ id: p.id, name: p.name })),
    });
  }, [paketList]);

  const isCustomPricing = selectedPackage?.type === "CUSTOM_PRICING";
  const isTourPackage = selectedPackage?.type === "TOUR_PACKAGE";
  const isFullDayTrip = selectedPackage?.type === "FULL_DAY_TRIP";
  const showOvertimeField = !isTourPackage && !isFullDayTrip;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Transaksi" : "Input Transaksi Baru"}
          </DialogTitle>
          <DialogDescription>
            Isi semua detail transaksi di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <form id="transaksi-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
            <div className="flex flex-col gap-4">
              <fieldset className="rounded-md border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium text-muted-foreground">
                  Data Pelanggan
                </legend>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="customer_name">Nama Pelanggan</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="customer_phone">No. HP</Label>
                    <Input
                      id="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="rounded-md border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium text-muted-foreground">
                  Data Order
                </legend>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="packageId">Pilih Paket Jasa</Label>
                    <Select
                      value={formData.packageId || "KUSTOM"}
                      onValueChange={(value) =>
                        handleSelectChange(
                          "packageId",
                          value === "KUSTOM" ? null : value
                        )
                      }
                      disabled={isLoadingDependencies}
                    >
                      <SelectTrigger id="packageId">
                        <SelectValue placeholder="Memuat paket..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KUSTOM">
                          Kustom / Input Manual
                        </SelectItem>
                        {paketList.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="armadaId">Pilih Armada</Label>
                    <Select
                      value={formData.armadaId}
                      onValueChange={(value) =>
                        handleSelectChange("armadaId", value)
                      }
                      disabled={isLoadingDependencies}
                      required
                    >
                      <SelectTrigger id="armadaId">
                        <SelectValue
                          placeholder={
                            isLoadingDependencies
                              ? "Memuat armada..."
                              : "Pilih armada..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {armadaList.length === 0 && !isLoadingDependencies && (
                          <SelectItem value="-" disabled>
                            Tidak ada armada &apos;Ready&apos;
                          </SelectItem>
                        )}
                        {armadaList.map((armada) => (
                          <SelectItem key={armada.id} value={armada.id}>
                            {armada.license_plate} - {armada.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="driverId">Pilih Sopir</Label>
                    <Select
                      value={formData.driverId}
                      onValueChange={(value) =>
                        handleSelectChange("driverId", value)
                      }
                      disabled={isLoadingDependencies}
                      required
                    >
                      <SelectTrigger id="driverId">
                        <SelectValue
                          placeholder={
                            isLoadingDependencies
                              ? "Memuat sopir..."
                              : "Pilih sopir..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {sopirList.length === 0 && !isLoadingDependencies && (
                          <SelectItem value="-" disabled>
                            Tidak ada sopir &apos;Ready&apos;
                          </SelectItem>
                        )}
                        {sopirList.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.driver_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Field Hotel Tier dan Pax - Hanya muncul untuk TOUR_PACKAGE */}
                  {isTourPackage && (
                    <>
                      <div className="grid gap-1.5">
                        <Label htmlFor="hotel_tier_id">
                          Tingkat Hotel{" "}
                          <span className="text-xs text-muted-foreground">
                            (Wajib)
                          </span>
                        </Label>
                        <Select
                          value={formData.hotel_tier_id || ""}
                          onValueChange={(value) =>
                            handleSelectChange("hotel_tier_id", value)
                          }
                          disabled={isLoadingDependencies}
                          required
                        >
                          <SelectTrigger id="hotel_tier_id">
                            <SelectValue placeholder="Pilih tingkat hotel..." />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedPackage?.hotelTiers?.length === 0 && (
                              <SelectItem value="-" disabled>
                                Tidak ada tingkat hotel tersedia
                              </SelectItem>
                            )}
                            {selectedPackage?.hotelTiers?.map((tier) => (
                              <SelectItem key={tier.id} value={tier.id}>
                                {tier.starRating} Bintang -{" "}
                                {tier.hotels?.length || 0} Hotel
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Hotel selection - only show if hotel tier is selected */}
                      {formData.hotel_tier_id && (
                        <div className="grid gap-1.5">
                          <Label htmlFor="hotel_name">
                            Pilih Hotel{" "}
                            <span className="text-xs text-muted-foreground">
                              (Wajib)
                            </span>
                          </Label>
                          <Select
                            value={formData.hotel_name || ""}
                            onValueChange={(value) =>
                              handleSelectChange("hotel_name", value)
                            }
                            disabled={isLoadingDependencies}
                            required
                          >
                            <SelectTrigger id="hotel_name">
                              <SelectValue placeholder="Pilih hotel..." />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const selectedTier =
                                  selectedPackage?.hotelTiers?.find(
                                    (tier) => tier.id === formData.hotel_tier_id
                                  );
                                if (!selectedTier?.hotels?.length) {
                                  return (
                                    <SelectItem value="-" disabled>
                                      Tidak ada hotel tersedia di tingkat ini
                                    </SelectItem>
                                  );
                                }
                                return selectedTier.hotels.map((hotel) => (
                                  <SelectItem key={hotel.id} value={hotel.name}>
                                    {hotel.name}
                                  </SelectItem>
                                ));
                              })()}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="grid gap-1.5">
                        <Label htmlFor="pax_count">
                          Jumlah Pax{" "}
                          <span className="text-xs text-muted-foreground">
                            (Penumpang)
                          </span>
                        </Label>
                        <Input
                          id="pax_count"
                          type="number"
                          min="1"
                          value={formData.pax_count || ""}
                          onChange={handleInputChange}
                          placeholder="Contoh: 5"
                          required
                        />
                      </div>

                      {/* Display package duration for TOUR_PACKAGE */}
                      {selectedPackage?.durationDays && (
                        <div className="grid gap-1.5">
                          <Label>Durasi Paket</Label>
                          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                            {selectedPackage.durationDays} Hari{" "}
                            {selectedPackage.durationNights ??
                              selectedPackage.durationDays - 1}{" "}
                            Malam
                          </div>
                        </div>
                      )}

                      {/* Display pricing info for selected hotel */}
                      {formData.hotel_name && formData.hotel_tier_id && (
                        <div className="grid gap-1.5">
                          <Label>Detail Hotel & Tarif</Label>
                          <div className="text-sm bg-muted p-3 rounded space-y-2">
                            {(() => {
                              const selectedTier =
                                selectedPackage?.hotelTiers?.find(
                                  (tier) => tier.id === formData.hotel_tier_id
                                );
                              if (!selectedTier) return null;

                              return (
                                <div>
                                  <div className="font-medium text-base">
                                    {formData.hotel_name}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {selectedTier.starRating} Bintang
                                  </div>
                                  <div className="border-t pt-2 mt-2">
                                    <div className="font-medium mb-1">
                                      Tarif per Pax:
                                    </div>
                                    {selectedTier.priceRanges?.map(
                                      (range, idx) => (
                                        <div
                                          key={idx}
                                          className="text-xs text-muted-foreground flex justify-between"
                                        >
                                          <span>
                                            {range.minPax}-{range.maxPax} orang
                                          </span>
                                          <span className="font-medium">
                                            {formatCurrency(range.price)}/pax
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </fieldset>
            </div>

            <div className="flex flex-col gap-4">
              <fieldset className="rounded-md border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium text-muted-foreground">
                  Data Waktu
                </legend>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="booking_date">Tanggal Booking</Label>
                    <DatePicker
                      date={
                        formData.booking_date
                          ? new Date(formData.booking_date)
                          : undefined
                      }
                      setDate={(date) => {
                        if (date) {
                          const dateString = date.toISOString().split("T")[0];
                          handleDateChange("booking_date", dateString);
                        }
                      }}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="checkout_datetime">Mobil Out (Jalan)</Label>
                    <DateTimePicker
                      date={
                        formData.checkout_datetime
                          ? new Date(formData.checkout_datetime)
                          : undefined
                      }
                      setDate={(date) => {
                        if (date) {
                          const tzOffset = date.getTimezoneOffset() * 60000;
                          const localISOTime = new Date(
                            date.getTime() - tzOffset
                          )
                            .toISOString()
                            .slice(0, 16);
                          handleDateChange("checkout_datetime", localISOTime);
                        }
                      }}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="checkin_datetime">Mobil In (Selesai)</Label>
                    <DateTimePicker
                      date={
                        formData.checkin_datetime
                          ? new Date(formData.checkin_datetime)
                          : undefined
                      }
                      setDate={(date) => {
                        if (date) {
                          const tzOffset = date.getTimezoneOffset() * 60000;
                          const localISOTime = new Date(
                            date.getTime() - tzOffset
                          )
                            .toISOString()
                            .slice(0, 16);
                          handleDateChange("checkin_datetime", localISOTime);
                        }
                      }}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="rounded-md border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium text-muted-foreground">
                  Data Keuangan (Input)
                </legend>
                <div className="grid gap-4">
                  {/* Primary pricing field - always shown */}
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor={isCustomPricing ? "custom_price" : "all_in_rate"}
                    >
                      {isCustomPricing ? "Harga Custom" : "Tarif Sewa"}
                      {!isCustomPricing && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (dari paket)
                        </span>
                      )}
                      {isCustomPricing && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (Wajib untuk paket custom)
                        </span>
                      )}
                    </Label>
                    <CurrencyInput
                      id={isCustomPricing ? "custom_price" : "all_in_rate"}
                      value={
                        isCustomPricing
                          ? formData.custom_price
                          : formData.all_in_rate
                      }
                      onChange={handleInputChange}
                      required
                      disabled={!isCustomPricing && selectedPackage}
                      placeholder={
                        isCustomPricing
                          ? "Masukkan harga yang disepakati"
                          : selectedPackage
                            ? "Otomatis dari paket terpilih"
                            : "Masukkan tarif sewa"
                      }
                    />
                  </div>

                  {/* Secondary fields in a consistent 2-column layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {showOvertimeField && (
                      <div className="grid gap-1.5">
                        <Label htmlFor="overtime_rate_per_hour">
                          Overtime/Jam
                        </Label>
                        <CurrencyInput
                          id="overtime_rate_per_hour"
                          value={formData.overtime_rate_per_hour}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    )}

                    {/* DP Amount - spans full width when overtime is hidden, half width when shown */}
                    <div
                      className={`grid gap-1.5 ${showOvertimeField ? "" : "md:col-span-2"}`}
                    >
                      <Label htmlFor="dp_amount">
                        Jumlah DP{" "}
                        <span className="text-xs text-muted-foreground"></span>
                      </Label>
                      <CurrencyInput
                        id="dp_amount"
                        value={formData.dp_amount}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </fieldset>
            </div>
          </div>

          <fieldset className="mt-4 rounded-md border p-4">
            <legend className="-ml-1 px-1 text-sm font-medium text-muted-foreground">
              Kalkulasi Otomatis
            </legend>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Lama Sewa
                </Label>
                <p className="font-semibold">
                  {calculatedData.lamaSewaJam || 0} Jam
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Overtime
                </Label>
                <p className="font-semibold">
                  {calculatedData.lamaOvertimeJam || 0} Jam
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Total Pendapatan
                </Label>
                <p className="font-semibold text-blue-600">
                  {formatCurrency(calculatedData.totalPendapatan)}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Laba Kotor
                </Label>
                <p className="font-semibold text-green-600">
                  {formatCurrency(calculatedData.labaKotor)}
                </p>
              </div>
            </div>
          </fieldset>
        </form>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Batal
            </Button>
          </DialogClose>
          <LoadingButton
            type="submit"
            form="transaksi-form"
            isLoading={isSubmitting}
            loadingText="Menyimpan..."
          >
            {isEditing
              ? userRole === "OPERATOR"
                ? "Ajukan Perubahan"
                : "Simpan Perubahan"
              : "Simpan Transaksi"}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
