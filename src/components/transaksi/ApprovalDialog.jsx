"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

export default function ApprovalDialog({
  isOpen,
  onClose,
  transaction,
  onApprove,
  onReject,
  isSubmitting,
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");

  const handleOpenChange = (newOpen) => {
    // Prevent closing dialog when submitting
    if (isSubmitting && !newOpen) return;
    onClose();
  };

  const handleApprove = async () => {
    setError("");
    try {
      await onApprove(transaction.id);
      onClose();
    } catch (err) {
      setError(err.message || "Gagal menyetujui transaksi");
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Alasan penolakan harus diisi");
      return;
    }

    setError("");
    try {
      await onReject(transaction.id, rejectionReason);
      setRejectionReason("");
      onClose();
    } catch (err) {
      setError(err.message || "Gagal menolak transaksi");
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Approval Transaksi</DialogTitle>
          <DialogDescription>
            Review dan setujui atau tolak transaksi ini
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction Info */}
          <div className="rounded-lg border bg-slate-50 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Invoice:</span>
              <span className="font-medium">{transaction.invoice_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pelanggan:</span>
              <span className="font-medium">{transaction.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="font-medium">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(transaction.all_in_rate || 0)}
              </span>
            </div>
            {transaction.submitted_by && (
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  Diajukan oleh:
                </span>
                <span className="text-sm font-medium">
                  {transaction.submitted_by.name ||
                    transaction.submitted_by.email ||
                    "Unknown"}
                </span>
              </div>
            )}
          </div>

          {/* Rejection Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">
              Alasan Penolakan (opsional untuk approve)
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="Masukkan alasan jika menolak transaksi..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleReject}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <Spinner size="sm" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Tolak
          </Button>
          <Button
            type="button"
            onClick={handleApprove}
            disabled={isSubmitting}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <Spinner size="sm" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Setujui
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
