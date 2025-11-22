"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Car, Calendar, Wrench, Trash, Pencil } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ArmadaCard({
  armada,
  onEdit,
  onDelete,
  onMaintenance = () => {},
  isDisabled = false,
  isDeleting = false,
  isMaintenance = false,
}) {
  const status = armada.status || "READY";
  const year =
    armada.year ??
    (armada.createdAt ? new Date(armada.createdAt).getFullYear() : null);

  // Check if armada is currently in use (BOOKED or ON_TRIP)
  const armadaStatusMessage = isDisabled
    ? `Armada sedang ${status === "BOOKED" ? "dipesan" : "dalam perjalanan"}`
    : null;

  return (
    <TooltipProvider>
      <Card
        key={armada.id}
        className="group hover:shadow-xl transition-all duration-300 border-gray-200 overflow-hidden flex flex-col"
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="relative">
                <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Car className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 wrap-break-word">
                  {armada.license_plate}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className={`border-0 ${
                      status === "READY"
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : status === "ON_TRIP"
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          : status === "MAINTENANCE"
                            ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status === "READY"
                      ? "Siap"
                      : status === "ON_TRIP"
                        ? "Sedang Jalan"
                        : status === "MAINTENANCE"
                          ? "Perawatan"
                          : status === "BOOKED"
                            ? "Dipesan"
                            : status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pb-4 flex-1">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-gray-500 mb-1.5">Merk & Model</p>
            <p className="text-gray-900 wrap-break-word">
              {armada.brand} {armada.model}
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 rounded-lg border border-blue-100">
            <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
            <div>
              <p className="text-blue-900">Tahun {year ?? "-"}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0 pb-5 flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <LoadingButton
                variant="outline"
                size="sm"
                className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => onEdit(armada)}
                disabled={isDisabled || isDeleting || isMaintenance}
                isLoading={false}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </LoadingButton>
            </TooltipTrigger>
            {isDisabled && (
              <TooltipContent>
                <p>{armadaStatusMessage}</p>
              </TooltipContent>
            )}
          </Tooltip>
          <LoadingButton
            variant="outline"
            size="sm"
            className="flex-1 border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
            onClick={() => onMaintenance(armada)}
            disabled={isDeleting}
            isLoading={isMaintenance}
            loadingText="Memproses..."
          >
            <Wrench className="h-4 w-4 mr-2" />
            Maintenance
          </LoadingButton>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <LoadingButton
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isDisabled || isMaintenance}
                    isLoading={isDeleting}
                    loadingText=""
                  >
                    <Trash className="h-4 w-4" />
                  </LoadingButton>
                </AlertDialogTrigger>

                <AlertDialogContent className="max-w-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                    <AlertDialogDescription>
                      Anda yakin ingin menghapus armada{" "}
                      <strong>{armada.license_plate}</strong>? Tindakan ini
                      tidak dapat dikembalikan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(armada.id)}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TooltipTrigger>
            {isDisabled && (
              <TooltipContent>
                <p>{armadaStatusMessage}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
