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
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Edit,
  FileText,
  CheckSquare,
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import ExpenseApprovalBadge from "./ExpenseApprovalBadge";
import { Spinner } from "@/components/ui/spinner";

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

function formatMonth(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

function formatCategory(category) {
  const categoryMap = {
    LISTRIK: "Listrik",
    INTERNET: "Internet",
    PAKET_DATA: "Paket Data",
    KONSUMSI: "Konsumsi",
    GAJI_STAF_OPERASIONAL: "Gaji Staf Operasional",
    GAJI_STAF_ADMIN: "Gaji Staf Admin",
    PAJAK: "Pajak",
    ALAT_TULIS_KANTOR: "Alat Tulis Kantor (ATK)",
    KOMPUTER_SUPPLIES: "Komputer Supplies",
    OPERASIONAL_LAINNYA: "Operasional Lainnya",
    BBM: "BBM (Armada)",
    PERAWATAN_ARMADA: "Perawatan Armada",
    GAJI_SOPIR: "Gaji Sopir",
    LAINNYA: "Lainnya",
  };
  return categoryMap[category] || category;
}

export default function PengeluaranTable({
  isLoading,
  data,
  onEdit,
  onDelete,
  onView,
  onRequestEdit,
  onRequestDelete,
  onReviewApproval,
  userRole = "OPERATOR", // Default to OPERATOR for safety
  loadingActions = {},
}) {
  const isAdmin = userRole === "ADMIN";
  const isOperator = userRole === "OPERATOR";
  const isRoleLoading = userRole === null;
  if (isLoading) {
    return (
      <div className="rounded-md border" aria-busy="true">
        <TableSkeleton rows={5} columns={7} showHeader={true} />
      </div>
    );
  }

  if (!isLoading && data.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-200 p-6 text-center">
        <p className="text-lg font-medium">Belum ada data pengeluaran</p>
        <p className="text-sm text-muted-foreground">
          Klik &quot;Tambah Pengeluaran&quot; untuk mulai mencatat.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Bulan</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Deskripsi</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right w-[180px]">Jumlah</TableHead>
            <TableHead className="w-[200px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const approvalStatus = item.approval_status || "APPROVED";
            const hasPendingRequest =
              approvalStatus === "PENDING_EDIT" ||
              approvalStatus === "PENDING_DELETE";
            const canRequestActions =
              isOperator && !isRoleLoading && approvalStatus === "APPROVED";
            const canReview = isAdmin && !isRoleLoading && hasPendingRequest;
            const canDeleteDirectly =
              isAdmin && !isRoleLoading && !hasPendingRequest;
            const canEditDirectly =
              !isRoleLoading &&
              (isAdmin ||
                (isOperator &&
                  (approvalStatus === "DRAFT" ||
                    approvalStatus === null ||
                    approvalStatus === "APPROVED")));

            return (
              <TableRow key={item.id}>
                <TableCell>{formatDate(item.date)}</TableCell>
                <TableCell>{formatMonth(item.paymentMonth)}</TableCell>
                <TableCell>{formatCategory(item.category)}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>
                  <ExpenseApprovalBadge status={approvalStatus} />
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.amount)}
                </TableCell>
                <TableCell>
                  {/* Mobile Dropdown */}
                  <div className="lg:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onView(item)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Lihat Detail
                        </DropdownMenuItem>

                        {/* Edit actions - separate from delete */}
                        {canEditDirectly && (
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}

                        {/* Delete actions */}
                        {canDeleteDirectly && (
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

                        {/* Admin review pending request */}
                        {canReview && (
                          <DropdownMenuItem
                            onClick={() => onReviewApproval(item)}
                          >
                            <CheckSquare className="mr-2 h-4 w-4 text-blue-600" />
                            Review{" "}
                            {approvalStatus === "PENDING_EDIT"
                              ? "Edit"
                              : "Delete"}
                          </DropdownMenuItem>
                        )}

                        {/* Operator request actions */}
                        {canRequestActions && (
                          <>
                            <DropdownMenuItem
                              onClick={() => onRequestEdit(item)}
                              disabled={
                                loadingActions[`submit-request-${item.id}`]
                              }
                            >
                              {loadingActions[`submit-request-${item.id}`] ? (
                                <>
                                  <Spinner size="sm" className="mr-2" />
                                  Mengajukan...
                                </>
                              ) : (
                                <>
                                  <Edit className="mr-2 h-4 w-4 text-blue-600" />
                                  Request Edit
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onRequestDelete(item)}
                              className="text-orange-600"
                              disabled={
                                loadingActions[`submit-request-${item.id}`]
                              }
                            >
                              {loadingActions[`submit-request-${item.id}`] ? (
                                <>
                                  <Spinner size="sm" className="mr-2" />
                                  Mengajukan...
                                </>
                              ) : (
                                <>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Request Delete
                                </>
                              )}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Desktop Buttons */}
                  <div className="hidden lg:flex lg:items-center lg:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(item)}
                    >
                      <Eye className="mr-1 h-3 w-3" /> Lihat
                    </Button>

                    {/* Edit actions - separate from delete */}
                    {canEditDirectly && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        <Pencil className="mr-1 h-3 w-3" /> Edit
                      </Button>
                    )}

                    {/* Delete actions */}
                    {canDeleteDirectly && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                        className="text-red-500 hover:text-red-600 hover:border-red-400"
                        disabled={loadingActions[`delete-${item.id}`]}
                      >
                        {loadingActions[`delete-${item.id}`] ? (
                          <Spinner size="sm" />
                        ) : (
                          <>
                            <Trash2 className="mr-1 h-3 w-3" /> Hapus
                          </>
                        )}
                      </Button>
                    )}

                    {/* Admin review button */}
                    {canReview && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReviewApproval(item)}
                        className="text-blue-600 hover:text-blue-700 hover:border-blue-400"
                      >
                        <CheckSquare className="mr-1 h-3 w-3" />
                        Review
                      </Button>
                    )}

                    {/* Operator request buttons */}
                    {canRequestActions && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRequestEdit(item)}
                          className="text-blue-600 hover:text-blue-700"
                          disabled={loadingActions[`submit-request-${item.id}`]}
                        >
                          {loadingActions[`submit-request-${item.id}`] ? (
                            <Spinner size="sm" />
                          ) : (
                            <>
                              <Edit className="mr-1 h-3 w-3" /> Request Edit
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRequestDelete(item)}
                          className="text-orange-600 hover:text-orange-700"
                          disabled={loadingActions[`submit-request-${item.id}`]}
                        >
                          {loadingActions[`submit-request-${item.id}`] ? (
                            <Spinner size="sm" />
                          ) : (
                            <>
                              <FileText className="mr-1 h-3 w-3" /> Request
                              Delete
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
