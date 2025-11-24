"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  User,
  Pencil,
  Trash,
  Moon,
  Phone,
  MapPin,
  CreditCard,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

export default function SopirCard({
  driver,
  onEdit,
  onSetStatus,
  onDelete,
  isDisabled = false,
  isDeleting = false,
}) {
  const status = driver.status || "READY";

  // Check if driver is currently in use (BOOKED or ON_TRIP)
  const driverStatusMessage = isDisabled
    ? `Sopir sedang ${status === "BOOKED" ? "dipesan" : "dalam perjalanan"}`
    : null;

  return (
    <TooltipProvider>
      <Card
        key={driver.id}
        className="group hover:shadow-xl transition-all duration-300 border-gray-200 overflow-hidden flex flex-col"
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="relative">
                <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center">
                  <User className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 wrap-break-word">
                  {driver.driver_name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className={`border-0 ${
                      status === "READY"
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : status === "ON_TRIP"
                          ? "bg-sky-100 text-sky-700 hover:bg-sky-200"
                          : status === "OFF_DUTY"
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status === "READY"
                      ? "Siap"
                      : status === "ON_TRIP"
                        ? "Sedang Jalan"
                        : status === "OFF_DUTY"
                          ? "Libur"
                          : status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pb-4 flex-1">
          {driver.nik && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <CreditCard className="h-4 w-4 text-gray-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">NIK</p>
                <p className="text-gray-900 wrap-break-word">{driver.nik}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-2.5 bg-purple-50 rounded-lg border border-purple-100">
            <Phone className="h-4 w-4 text-purple-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-purple-600">No. HP</p>
              <p className="text-purple-900 wrap-break-word">
                {driver.phone_number ?? "-"}
              </p>
            </div>
          </div>

          {driver.address && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 mb-1.5 text-xs">Alamat</p>
                  <p className="text-gray-900 wrap-break-word text-sm">
                    {driver.address}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0 pb-5 flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => onEdit(driver)}
                disabled={isDisabled}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </TooltipTrigger>
            {isDisabled && (
              <TooltipContent>
                <p>{driverStatusMessage}</p>
              </TooltipContent>
            )}
          </Tooltip>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
            onClick={() => onSetStatus(driver, "OFF_DUTY")}
          >
            <Moon className="h-4 w-4 mr-2" />
            Libur
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isDisabled || isDeleting}
                    aria-busy={isDeleting}
                  >
                    {isDeleting ? (
                      <Spinner size="sm" />
                    ) : (
                      <Trash className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent className="max-w-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                    <AlertDialogDescription>
                      Anda yakin ingin menghapus sopir{" "}
                      <strong>{driver.driver_name}</strong>? Tindakan ini tidak
                      dapat dikembalikan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(driver.id)}
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
                <p>{driverStatusMessage}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
