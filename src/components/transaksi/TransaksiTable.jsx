"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Printer,
  CheckCircle,
  Send,
  CheckSquare,
  XSquare,
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Badge } from "@/components/ui/badge";
import ApprovalStatusBadge from "./ApprovalStatusBadge";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const getStatusVariant = (status) => {
  switch (status) {
    case "PAID":
    case "LUNAS":
      return "success";
    case "DOWN_PAYMENT":
    case "DP":
      return "warning";
    case "UNPAID":
    case "BELUM_LUNAS":
    default:
      return "destructive";
  }
};

export default function TransaksiTable({
  isLoading,
  data,
  onEdit,
  onDelete,
  onViewDetails,
  onUpdateStatus,
  onPrint,
  onCompleteTransaction,
  onSubmitForApproval,
  onApprove,
  onReject,
  onReviewEditApproval,
  userRole = "OPERATOR", // Default to OPERATOR for safety
  loadingActions = {},
}) {
  const isAdmin = userRole === "ADMIN";
  const isOperator = userRole === "OPERATOR";
  const getCalculatedData = (item) => {
    const durasiPaketJam = item.package?.durationHours || 12;
    const start = new Date(item.checkout_datetime);
    const end = new Date(item.checkin_datetime);

    if (end <= start) {
      return {
        totalTagihan: Number(item.all_in_rate) || 0,
        sisaTagihan: 0,
      };
    }

    const lamaSewaJam = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    );
    const lamaOvertimeJam = Math.max(0, lamaSewaJam - durasiPaketJam);

    const totalOvertimeFee =
      lamaOvertimeJam * (item.overtime_rate_per_hour || 0);
    const totalTagihan = (item.all_in_rate || 0) + totalOvertimeFee;

    // Hitung sisa tagihan jika ada DP
    const dpAmount = item.dp_amount || 0;
    const sisaTagihan =
      item.payment_status === "DOWN_PAYMENT" && dpAmount > 0
        ? Math.max(0, totalTagihan - dpAmount)
        : 0;

    return { totalTagihan, sisaTagihan };
  };

  // Check if any transaction has DP status with dp_amount
  const hasAnyDP = data.some(
    (item) =>
      item.payment_status === "DOWN_PAYMENT" &&
      item.dp_amount &&
      item.dp_amount > 0
  );

  if (isLoading) {
    return (
      <div
        className="rounded-md border"
        role="region"
        aria-label="Tabel transaksi"
      >
        <TableSkeleton
          rows={5}
          columns={10}
          showHeader={true}
          aria-label="Memuat data transaksi..."
        />
      </div>
    );
  }

  if (!isLoading && data.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-200 p-6 text-center">
        <p className="text-lg font-medium">Belum ada data transaksi</p>
        <p className="text-sm text-muted-foreground">
          Klik &quot;Input Transaksi Baru&quot; untuk mulai mencatat.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-full w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Tanggal</TableHead>
              <TableHead className="whitespace-nowrap">Invoice</TableHead>
              <TableHead className="whitespace-nowrap">Pelanggan</TableHead>
              <TableHead className="whitespace-nowrap">Jasa</TableHead>
              <TableHead className="whitespace-nowrap">Armada</TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Total Tagihan
              </TableHead>
              {hasAnyDP && (
                <TableHead className="text-right whitespace-nowrap">
                  Sisa Tagihan
                </TableHead>
              )}
              <TableHead className="min-w-[160px] whitespace-nowrap">
                Status Pembayaran
              </TableHead>
              <TableHead className="min-w-[180px] whitespace-nowrap">
                Status Approval
              </TableHead>
              <TableHead className="min-w-[200px] whitespace-nowrap">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => {
              const { totalTagihan, sisaTagihan } = getCalculatedData(item);
              const isCompleted = !!item.actual_checkin_datetime;

              const showSisaTagihan =
                !isCompleted &&
                item.payment_status === "DOWN_PAYMENT" &&
                item.dp_amount &&
                item.dp_amount > 0;
              const approvalStatus = item.approval_status || "DRAFT";

              // Check if armada is currently booked or on trip (preventing modifications)
              const isArmadaInUse =
                item.armada?.status === "BOOKED" ||
                item.armada?.status === "ON_TRIP";
              const armadaStatusMessage = isArmadaInUse
                ? `Armada sedang ${item.armada?.status === "BOOKED" ? "dipesan" : "on trip"}`
                : null;

              const canEdit =
                !isCompleted &&
                !isArmadaInUse &&
                (isAdmin || (isOperator && approvalStatus === "DRAFT"));
              const canDelete = isAdmin && !isCompleted && !isArmadaInUse;
              const canSubmitForApproval =
                isOperator &&
                approvalStatus === "DRAFT" &&
                !isCompleted &&
                !isArmadaInUse;
              const canApproveReject =
                isAdmin && approvalStatus === "PENDING" && !isArmadaInUse;
              const canReviewEditApproval =
                isAdmin && approvalStatus === "PENDING_EDIT" && !isArmadaInUse;

              return (
                <TableRow
                  key={item.id}
                  className={cn(isCompleted && "bg-green-50/50")}
                >
                  <TableCell>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      {formatDate(item.booking_date)}
                      {isCompleted && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-300 shrink-0"
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Selesai
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">{item.invoice_code}</div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="font-medium">
                          Invoice: {item.invoice_code}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="max-w-[150px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="truncate cursor-help">
                          {item.customer_name}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="font-medium">{item.customer_name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="max-w-[120px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="truncate cursor-help">
                          {item.package?.name || "Kustom"}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-2">
                          <p className="font-semibold">
                            {item.package?.name || "Paket Kustom"}
                          </p>
                          {item.package ? (
                            <>
                              <p className="text-sm">
                                <span className="font-medium">Tipe:</span>{" "}
                                {item.package.type === "CAR_RENTAL"
                                  ? "Sewa Mobil"
                                  : item.package.type === "TOUR_PACKAGE"
                                    ? "Paket Tour"
                                    : item.package.type === "FULL_DAY_TRIP"
                                      ? "Full Day Trip"
                                      : item.package.type === "CUSTOM_PRICING"
                                        ? "Harga Custom"
                                        : item.package.type}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Durasi:</span>{" "}
                                {item.package.durationHours
                                  ? `${item.package.durationHours} jam`
                                  : item.package.durationDays
                                    ? `${item.package.durationDays} hari`
                                    : "Custom"}
                              </p>
                              {item.package.type === "CAR_RENTAL" &&
                                item.package.price && (
                                  <p className="text-sm">
                                    <span className="font-medium">Harga:</span>{" "}
                                    {new Intl.NumberFormat("id-ID", {
                                      style: "currency",
                                      currency: "IDR",
                                      minimumFractionDigits: 0,
                                    }).format(item.package.price)}
                                  </p>
                                )}
                              {item.package.description && (
                                <p className="text-sm line-clamp-3">
                                  {item.package.description}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm">Paket yang disesuaikan</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="max-w-[120px]">
                    <div className="flex flex-col gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="truncate cursor-help font-medium">
                            {item.armada?.license_plate || "N/A"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {item.armada?.license_plate || "Tidak ada armada"}
                            </p>
                            {item.armada && (
                              <>
                                <p className="text-sm">
                                  {item.armada.brand} {item.armada.model}
                                </p>
                              </>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      {!isCompleted && isArmadaInUse && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs w-fit",
                            item.armada?.status === "BOOKED" &&
                              "bg-yellow-50 text-yellow-700 border-yellow-300",
                            item.armada?.status === "ON_TRIP" &&
                              "bg-blue-50 text-blue-700 border-blue-300"
                          )}
                        >
                          {item.armada?.status === "BOOKED"
                            ? "Dipesan"
                            : "On Trip"}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrency(totalTagihan)}
                  </TableCell>
                  {hasAnyDP && (
                    <TableCell className="text-right whitespace-nowrap">
                      {showSisaTagihan ? (
                        <span className="font-semibold text-orange-600">
                          {formatCurrency(sisaTagihan)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Select
                      value={item.payment_status}
                      onValueChange={(newStatus) =>
                        onUpdateStatus(item.id, newStatus)
                      }
                      disabled={
                        isCompleted ||
                        loadingActions[`update-status-${item.id}`]
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "w-full min-w-[120px]",
                          item.payment_status === "PAID" && "border-green-500",
                          item.payment_status === "DOWN_PAYMENT" &&
                            "border-yellow-500",
                          item.payment_status === "UNPAID" && "border-red-500",
                          isCompleted && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNPAID">Belum Lunas</SelectItem>
                        <SelectItem value="DOWN_PAYMENT">DP</SelectItem>
                        <SelectItem value="PAID">Lunas</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <ApprovalStatusBadge status={approvalStatus} />
                  </TableCell>
                  <TableCell>
                    <div className="lg:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isAdmin && (
                            <DropdownMenuItem
                              onClick={() => {
                                console.log(
                                  "📱 [DEBUG] Mobile complete button clicked for item:",
                                  item
                                );
                                onCompleteTransaction(item);
                              }}
                              disabled={isCompleted}
                              title={
                                isCompleted
                                  ? "Transaksi sudah diselesaikan"
                                  : "Selesaikan transaksi"
                              }
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              {isCompleted
                                ? "Sudah Selesai ✓"
                                : "Selesaikan Transaksi"}
                            </DropdownMenuItem>
                          )}
                          {canApproveReject && (
                            <DropdownMenuItem
                              onClick={() => onApprove(item.id)}
                            >
                              <CheckSquare className="mr-2 h-4 w-4 text-green-600" />
                              Review Approval
                            </DropdownMenuItem>
                          )}
                          {canReviewEditApproval && (
                            <DropdownMenuItem
                              onClick={() => onReviewEditApproval(item)}
                            >
                              <CheckSquare className="mr-2 h-4 w-4 text-blue-600" />
                              Review Edit Request
                            </DropdownMenuItem>
                          )}
                          {canSubmitForApproval && (
                            <DropdownMenuItem
                              onClick={() => onSubmitForApproval(item.id)}
                              disabled={
                                loadingActions[`submit-approval-${item.id}`]
                              }
                            >
                              {loadingActions[`submit-approval-${item.id}`] ? (
                                <>
                                  <Spinner size="sm" className="mr-2" />
                                  Mengajukan...
                                </>
                              ) : (
                                <>
                                  <Send className="mr-2 h-4 w-4" />
                                  Ajukan Approval
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          {!canSubmitForApproval &&
                            isOperator &&
                            approvalStatus === "DRAFT" &&
                            !isCompleted &&
                            isArmadaInUse && (
                              <DropdownMenuItem
                                disabled
                                className="opacity-50 cursor-not-allowed"
                                title={armadaStatusMessage}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Ajukan Approval (Disabled)
                              </DropdownMenuItem>
                            )}
                          <DropdownMenuItem onClick={() => onPrint(item)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Cetak Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onViewDetails(item)}>
                            Lihat Detail
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem
                              onClick={() => onEdit(item)}
                              disabled={isCompleted}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {!canEdit && !isCompleted && (
                            <DropdownMenuItem
                              disabled
                              className="opacity-50 cursor-not-allowed"
                              title={
                                isArmadaInUse
                                  ? armadaStatusMessage
                                  : isOperator && approvalStatus !== "DRAFT"
                                    ? "Hanya draft yang bisa diedit"
                                    : "Tidak dapat diedit"
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit (Disabled)
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(item.id)}
                              className="text-red-500"
                              disabled={loadingActions[`delete-${item.id}`]}
                            >
                              {loadingActions[`delete-${item.id}`] ? (
                                <>
                                  <Spinner size="sm" className="mr-2" />
                                  Menghapus...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hapus
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          {!canDelete &&
                            isAdmin &&
                            !isCompleted &&
                            isArmadaInUse && (
                              <DropdownMenuItem
                                disabled
                                className="opacity-50 cursor-not-allowed text-red-500"
                                title={armadaStatusMessage}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus (Disabled)
                              </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="hidden lg:flex lg:items-center lg:gap-1 lg:flex-wrap">
                      {isAdmin && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log(
                                  "🖥️ [DEBUG] Desktop complete button clicked for item:",
                                  item
                                );
                                onCompleteTransaction(item);
                              }}
                              className="text-green-600 hover:text-green-700"
                              disabled={isCompleted}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {isCompleted
                                ? "Transaksi sudah diselesaikan"
                                : "Selesaikan transaksi"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {canApproveReject && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onApprove(item.id)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Review dan approve/reject transaksi"
                        >
                          <CheckSquare className="h-3 w-3" />
                        </Button>
                      )}
                      {canReviewEditApproval && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReviewEditApproval(item)}
                          className="text-purple-600 hover:text-purple-700"
                          title="Review permintaan edit transaksi"
                        >
                          <CheckSquare className="h-3 w-3" />
                        </Button>
                      )}
                      {!canApproveReject &&
                        isAdmin &&
                        approvalStatus === "PENDING" &&
                        isArmadaInUse && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="text-blue-600 opacity-50 cursor-not-allowed"
                            title={`${armadaStatusMessage} - Tidak dapat review approval`}
                          >
                            <CheckSquare className="h-3 w-3" />
                          </Button>
                        )}
                      {canSubmitForApproval && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSubmitForApproval(item.id)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Ajukan untuk approval"
                          disabled={
                            loadingActions[`submit-approval-${item.id}`]
                          }
                        >
                          {loadingActions[`submit-approval-${item.id}`] ? (
                            <Spinner size="sm" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      {!canSubmitForApproval &&
                        isOperator &&
                        approvalStatus === "DRAFT" &&
                        !isCompleted &&
                        isArmadaInUse && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="text-blue-600 opacity-50 cursor-not-allowed"
                            title={`${armadaStatusMessage} - Tidak dapat ajukan approval`}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPrint(item)}
                        title="Cetak invoice"
                      >
                        <Printer className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(item)}
                        title="Lihat detail transaksi"
                      >
                        Detail
                      </Button>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(item)}
                          disabled={
                            isCompleted ||
                            (isOperator && approvalStatus !== "DRAFT")
                          }
                          title={
                            isCompleted
                              ? "Transaksi selesai tidak bisa diedit"
                              : isOperator && approvalStatus !== "DRAFT"
                                ? "Hanya draft yang bisa diedit"
                                : "Edit transaksi"
                          }
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                      {!canEdit && !isCompleted && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title={
                            isArmadaInUse
                              ? armadaStatusMessage
                              : isOperator && approvalStatus !== "DRAFT"
                                ? "Hanya draft yang bisa diedit"
                                : "Tidak dapat diedit"
                          }
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(item.id)}
                          className="text-red-500 hover:text-red-600"
                          title="Hapus transaksi"
                          disabled={loadingActions[`delete-${item.id}`]}
                        >
                          {loadingActions[`delete-${item.id}`] ? (
                            <Spinner size="sm" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      {!canDelete &&
                        isAdmin &&
                        !isCompleted &&
                        isArmadaInUse && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="text-red-500 opacity-50 cursor-not-allowed"
                            title={armadaStatusMessage}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
