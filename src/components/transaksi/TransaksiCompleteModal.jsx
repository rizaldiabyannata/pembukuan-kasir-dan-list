"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Car, User, Calculator } from "lucide-react";
import { useAlertDialog } from "@/components/ui/alert-dialog-provider";
import {
  calculateOvertime,
  formatCurrency,
  formatDateTime,
} from "@/lib/transaction-utils";

export default function TransaksiCompleteModal({
  open,
  onOpenChange,
  transaction,
  onComplete,
  isLoading,
}) {
  const { showAlert } = useAlertDialog();
  const [actualCheckinTime, setActualCheckinTime] = useState("");
  const [overtimeCost, setOvertimeCost] = useState(0);
  const [calculatedOvertimeHours, setCalculatedOvertimeHours] = useState(0);

  const calculateOvertimeLocal = useCallback(
    (checkinTime) => {
      if (!transaction || !checkinTime) return;

      const packageDuration = transaction.package?.durationHours || 12;
      const overtimeRate = transaction.overtime_rate_per_hour || 0;

      const result = calculateOvertime(
        transaction.checkout_datetime,
        checkinTime,
        packageDuration,
        overtimeRate
      );

      setCalculatedOvertimeHours(result.overtimeHours);
      setOvertimeCost(result.overtimeCost);
    },
    [transaction]
  );

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction) {
      // Set default actual checkin time to current time
      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000;
      const localISOTime = new Date(now.getTime() - tzOffset)
        .toISOString()
        .slice(0, 16);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActualCheckinTime(localISOTime);

      // Calculate initial overtime
      calculateOvertimeLocal(localISOTime);
    }
  }, [transaction, calculateOvertimeLocal]);

  const handleCheckinTimeChange = (e) => {
    const newTime = e.target.value;
    setActualCheckinTime(newTime);
    calculateOvertimeLocal(newTime);
  };

  const handleSubmit = async () => {
    if (!actualCheckinTime) {
      await showAlert({
        message: "Waktu mobil kembali harus diisi",
        type: "warning",
      });
      return;
    }

    // Convert datetime-local string to full ISO string
    let checkinDateTime;
    try {
      checkinDateTime = new Date(actualCheckinTime).toISOString();
      console.log(
        "Converted checkin time:",
        actualCheckinTime,
        "to:",
        checkinDateTime
      );
    } catch (error) {
      console.error("Error converting date:", error);
      await showAlert({
        message: "Format waktu tidak valid",
        type: "error",
      });
      return;
    }

    // When completing transaction, all payments are considered settled (lunas)
    // remaining_payment is always 0 for completed transactions
    onComplete({
      actual_checkin_datetime: checkinDateTime,
      actual_overtime_cost: overtimeCost,
      remaining_payment: 0, // Always 0 when completing transaction
    });
  };

  if (!transaction) return null;

  const packageDuration = transaction.package?.durationHours || 12;
  const totalDuration = calculatedOvertimeHours + packageDuration;
  const baseRate = transaction.all_in_rate || 0;
  const totalAmount = baseRate + overtimeCost;

  // Calculate remaining payment (sisa tagihan)
  const dpAmount = transaction.dp_amount || 0;
  const sisaTagihan = totalAmount - dpAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto relative"
        aria-busy={isLoading}
      >
        <LoadingOverlay
          isVisible={isLoading}
          message="Memproses transaksi..."
        />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Selesaikan Transaksi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Transaksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Invoice:</span>
                <Badge variant="outline">{transaction.invoice_code}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Pelanggan:
                </span>
                <span className="font-medium">{transaction.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Armada:</span>
                <span className="font-medium flex items-center gap-1">
                  <Car className="h-4 w-4" />
                  {transaction.armada?.license_plate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Sopir:</span>
                <span className="font-medium flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {transaction.driver?.driver_name}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Time Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Waktu Mobil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Waktu Keluar
                  </Label>
                  <p className="font-medium">
                    {formatDateTime(transaction.checkout_datetime)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Estimasi Kembali
                  </Label>
                  <p className="font-medium">
                    {formatDateTime(transaction.checkin_datetime)}
                  </p>
                </div>
              </div>

              <div>
                <Label
                  htmlFor="actualCheckinTime"
                  className="text-sm font-medium"
                >
                  Jam Pulang Aktual *
                </Label>
                <DateTimePicker
                  date={
                    actualCheckinTime ? new Date(actualCheckinTime) : undefined
                  }
                  setDate={(date) => {
                    if (date) {
                      const tzOffset = date.getTimezoneOffset() * 60000;
                      const localISOTime = new Date(date.getTime() - tzOffset)
                        .toISOString()
                        .slice(0, 16);
                      handleCheckinTimeChange({
                        target: { value: localISOTime },
                      });
                    }
                  }}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Overtime Calculation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Perhitungan Overtime
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Durasi Paket
                  </Label>
                  <p className="font-medium">{packageDuration} jam</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Total Durasi Aktual
                  </Label>
                  <p className="font-medium">{totalDuration.toFixed(1)} jam</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Overtime
                  </Label>
                  <p className="font-medium text-orange-600">
                    {calculatedOvertimeHours.toFixed(1)} jam
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Rate per Jam
                  </Label>
                  <p className="font-medium">
                    {formatCurrency(transaction.overtime_rate_per_hour || 0)}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="overtimeCost" className="text-sm font-medium">
                  Biaya Overtime
                </Label>
                <CurrencyInput
                  id="overtimeCost"
                  value={overtimeCost}
                  onChange={(value) => setOvertimeCost(Number(value) || 0)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg text-green-800">
                Ringkasan Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Tarif Dasar:</span>
                <span className="font-medium">{formatCurrency(baseRate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Overtime:</span>
                <span className="font-medium text-orange-600">
                  +{formatCurrency(overtimeCost)}
                </span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Tagihan:</span>
                <span className="text-green-800">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              {dpAmount > 0 && (
                <>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>DP Sudah Dibayar:</span>
                    <span>-{formatCurrency(dpAmount)}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Sisa Tagihan:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(0)} (LUNAS)
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <LoadingButton
            onClick={handleSubmit}
            isLoading={isLoading}
            loadingText="Menyimpan..."
          >
            Selesaikan Transaksi
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
