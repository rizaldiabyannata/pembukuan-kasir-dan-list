import React, { useEffect, useState } from "react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Hotel, Map, Settings } from "lucide-react";
import {
  validatePriceRangesForTier,
  getPriceRangeConflicts,
} from "@/lib/utils";
import { HotelListInput } from "./HotelListInput";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export function PackageForm({
  open,
  onOpenChange,
  package_,
  onSave,
  onSubmit: onSubmitProp,
  defaultValues,
}) {
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      isCustomizable: false,
      customizableItems: [],
      tarifHotel: [
        {
          tingkat: "Bintang 3",
          daftarHotel: [],
          priceRanges: [],
        },
      ],
      itinerary: [{ hari: 1, aktivitas: "" }],
    },
  });

  // Deep compare helper
  function deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a !== "object" || a === null || b === null) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const k of aKeys) {
      if (!deepEqual(a[k], b[k])) return false;
    }
    return true;
  }

  // Watch all form values
  const watchedValues = watch();
  // Build initial values for comparison
  const [initialValues, setInitialValues] = useState(null);
  useEffect(() => {
    setInitialValues(getValues());
    // eslint-disable-next-line
  }, [open]);

  // Determine if form is dirty (changed)
  const isDirty = initialValues
    ? !deepEqual(watchedValues, initialValues)
    : true;

  const {
    fields: hotelFields,
    append: appendHotel,
    remove: removeHotel,
  } = useFieldArray({
    control,
    name: "tarifHotel",
  });

  const {
    fields: itineraryFields,
    append: appendItinerary,
    remove: removeItinerary,
  } = useFieldArray({
    control,
    name: "itinerary",
  });

  // Chips for customizableItems (no need for useFieldArray, just use array)

  const tipePaket = watch("tipePaket");
  const isCustomizable = watch("isCustomizable");
  const [newCustomItem, setNewCustomItem] = useState("");
  const [pendingType, setPendingType] = useState(null);
  const [showTypeConfirm, setShowTypeConfirm] = useState(false);

  useEffect(() => {
    const pkg = package_ ?? defaultValues;
    console.log("PackageForm useEffect - Received package:", pkg);

    if (pkg) {
      setIsLoadingData(true);
      // support both English- and Indonesian-shaped package objects
      const namaPaket = pkg.namaPaket ?? pkg.name ?? "";
      const typeMap = {
        CAR_RENTAL: "Sewa Mobil",
        FULL_DAY_TRIP: "Full Day Trip",
        TOUR_PACKAGE: "Paket Tour",
        CUSTOM_PRICING: "Harga Custom",
        // passthrough for already-localized labels
        "Sewa Mobil": "Sewa Mobil",
        "Full Day Trip": "Full Day Trip",
        "Paket Tour": "Paket Tour",
        "Harga Custom": "Harga Custom",
      };

      const rawTipe = pkg.type ?? pkg.tipePaket ?? "Sewa Mobil";
      const mappedTipe = typeMap[rawTipe] ?? rawTipe ?? "-";
      const deskripsi = pkg.deskripsi ?? pkg.description ?? "";
      const durasiHari =
        pkg.durasi?.hari ?? pkg.durationDays ?? pkg.durationHours ?? 1;
      const durasiMalam = pkg.durasi?.malam ?? pkg.durationNights ?? 0;
      const isCustom = pkg.isCustomizable ?? pkg.isCustomizable ?? false;
      const customizableItems =
        pkg.customizableItems ?? pkg.customizableItems ?? [];
      const hargaDefault = pkg.hargaDefault ?? pkg.price ?? 0;
      const tarifOvertime = pkg.tarifOvertime ?? pkg.overtimeRate ?? 0;
      const include = pkg.include ?? pkg.includes ?? "";
      const exclude = pkg.exclude ?? pkg.excludes ?? "";

      // Transform hotelTiers from database format to form format
      let tarifHotelVal = [];
      if (
        pkg.hotelTiers &&
        Array.isArray(pkg.hotelTiers) &&
        pkg.hotelTiers.length > 0
      ) {
        // Always prefer database format if available
        console.log("Transforming hotelTiers from DB:", pkg.hotelTiers);
        // For TOUR_PACKAGE, prices are stored in thousands; for others, in full rupiah
        const isTourPackage = rawTipe === "TOUR_PACKAGE";
        tarifHotelVal = pkg.hotelTiers.map((tier) => ({
          id: tier.id, // Preserve the database ID for updates
          tingkat: `Bintang ${tier.starRating}`,
          daftarHotel: Array.isArray(tier.hotels)
            ? tier.hotels.map((h) => ({ id: h.id, name: h.name })) // Include hotel IDs
            : [],
          priceRanges: Array.isArray(tier.priceRanges)
            ? tier.priceRanges.map((pr) => ({
                id: pr.id, // Preserve price range ID
                minPax: pr.minPax,
                maxPax: pr.maxPax,
                price: isTourPackage ? pr.price : pr.price / 1000, // TOUR_PACKAGE already in thousands, others convert from full rupiah
              }))
            : [],
        }));
        console.log("Transformed tarifHotelVal:", tarifHotelVal);
      } else if (pkg.tarifHotel && Array.isArray(pkg.tarifHotel)) {
        // Fallback to existing tarifHotel format
        tarifHotelVal = pkg.tarifHotel;
      }

      // Transform itineraries from database format to form format
      let itineraryVal = [];
      if (
        pkg.itineraries &&
        Array.isArray(pkg.itineraries) &&
        pkg.itineraries.length > 0
      ) {
        // Always prefer database format if available
        console.log("Transforming itineraries from DB:", pkg.itineraries);
        itineraryVal = pkg.itineraries.map((it) => ({
          id: it.id, // Preserve the database ID for updates
          hari: it.day,
          aktivitas: it.title || "",
          deskripsi: it.description || "",
        }));
        console.log("Transformed itineraryVal:", itineraryVal);
      } else if (pkg.itinerary && Array.isArray(pkg.itinerary)) {
        // Fallback to existing itinerary format
        itineraryVal = pkg.itinerary;
      }

      // Build reset payload depending on package type so we don't prefill irrelevant data
      const base = {
        namaPaket,
        tipePaket: mappedTipe,
        deskripsi,
        isCustomizable: isCustom,
        customizableItems: customizableItems || [],
        include,
        exclude,
      };

      if (mappedTipe === "Paket Tour") {
        // Tour: include hotel tiers and itinerary
        const resetData = {
          ...base,
          durasiHari: durasiHari || 1,
          durasiMalam: durasiMalam || 0,
          hargaDefault: 0,
          tarifOvertime: 0,
          tarifHotel:
            Array.isArray(tarifHotelVal) && tarifHotelVal.length > 0
              ? tarifHotelVal
              : [
                  {
                    tingkat: "Bintang 3",
                    daftarHotel: [],
                    priceRanges: [],
                  },
                ],
        };
        console.log("Resetting form for Paket Tour with data:", resetData);
        reset(resetData);

        // Set itinerary separately to avoid duplication issues
        const finalItinerary =
          Array.isArray(itineraryVal) && itineraryVal.length > 0
            ? itineraryVal
            : [{ hari: 1, aktivitas: "" }];
        setValue("itinerary", finalItinerary);
      } else if (mappedTipe === "Full Day Trip") {
        // Full day: include price/overtime and itinerary; clear hotel tiers
        reset({
          ...base,
          durasiHari: durasiHari || 1,
          durasiMalam: durasiMalam || 0,
          hargaDefault: hargaDefault || 0,
          tarifOvertime: tarifOvertime || 0,
          tarifHotel: [],
        });

        // Set itinerary separately to avoid duplication issues
        const finalItinerary =
          Array.isArray(itineraryVal) && itineraryVal.length > 0
            ? itineraryVal
            : [{ hari: 1, aktivitas: "" }];
        setValue("itinerary", finalItinerary);
      } else if (mappedTipe === "Harga Custom") {
        // Custom pricing: no fixed price or duration, just basic info
        reset({
          ...base,
          durasiHari: 0,
          durasiMalam: 0,
          hargaDefault: 0,
          tarifOvertime: 0,
          tarifHotel: [],
        });
        setValue("itinerary", [{ hari: 1, aktivitas: "" }]);
      } else {
        // Sewa Mobil / default: include price/overtime; clear tour-specific fields
        reset({
          ...base,
          durasiHari: durasiHari || 1,
          durasiMalam: 0, // Car rental doesn't have nights
          hargaDefault: hargaDefault || 0,
          tarifOvertime: tarifOvertime || 0,
          tarifHotel: [],
        });
        setValue("itinerary", [{ hari: 1, aktivitas: "" }]);
      }
    } else {
      reset({
        namaPaket: "",
        tipePaket: "Sewa Mobil",
        deskripsi: "",
        durasiHari: 1,
        durasiMalam: 0, // Car rental doesn't have nights
        isCustomizable: false,
        customizableItems: [],
        hargaDefault: 0,
        tarifOvertime: 0,
        include: "",
        exclude: "",
        tarifHotel: [],
      });
      setValue("itinerary", [{ hari: 1, aktivitas: "" }]);
    }

    setIsLoadingData(false);
  }, [package_, defaultValues, reset, open, setValue]);

  // When the user changes the package type in the form, clear or set fields
  // that are not relevant for the selected type to avoid accidental edits.
  useEffect(() => {
    if (!open) return;

    if (tipePaket === "Paket Tour") {
      const currentHotel = getValues("tarifHotel");
      if (!Array.isArray(currentHotel) || currentHotel.length === 0) {
        setValue("tarifHotel", [
          { tingkat: "Bintang 3", daftarHotel: [], priceRanges: [] },
        ]);
      }
      const it = getValues("itinerary");
      if (!Array.isArray(it) || it.length === 0) {
        setValue("itinerary", [{ hari: 1, aktivitas: "" }]);
      }
      // clear price fields
      setValue("hargaDefault", 0);
      setValue("tarifOvertime", 0);
      // ensure durasiMalam is set for tour packages
      if (getValues("durasiMalam") === undefined) {
        setValue("durasiMalam", 0);
      }
    } else if (tipePaket === "Full Day Trip") {
      // ensure price fields present, clear hotel tiers
      setValue("hargaDefault", getValues("hargaDefault") ?? 0);
      setValue("tarifOvertime", getValues("tarifOvertime") ?? 0);
      setValue("tarifHotel", []);
      if (
        !Array.isArray(getValues("itinerary")) ||
        getValues("itinerary").length === 0
      ) {
        setValue("itinerary", [{ hari: 1, aktivitas: "" }]);
      }
      // ensure durasiMalam is set for full day trip
      if (getValues("durasiMalam") === undefined) {
        setValue("durasiMalam", 0);
      }
    } else if (tipePaket === "Harga Custom") {
      // Custom pricing: no fixed price or duration, clear all pricing and duration fields
      setValue("hargaDefault", 0);
      setValue("tarifOvertime", 0);
      setValue("tarifHotel", []);
      setValue("itinerary", [{ hari: 1, aktivitas: "" }]);
      setValue("durasiHari", 0);
      setValue("durasiMalam", 0);
    } else {
      // Sewa Mobil or other: clear tour-specific data
      setValue("tarifHotel", []);
      setValue("itinerary", [{ hari: 1, aktivitas: "" }]);
      setValue("hargaDefault", getValues("hargaDefault") ?? 0);
      setValue("tarifOvertime", getValues("tarifOvertime") ?? 0);
      // clear durasiMalam for car rental
      setValue("durasiMalam", 0);
    }
  }, [tipePaket, open, setValue, getValues]);

  // Live validation: watch tarifHotel priceRanges and validate on change
  const watchedTarifHotel = watch("tarifHotel");
  useEffect(() => {
    if (!watchedTarifHotel || !Array.isArray(watchedTarifHotel)) return;
    watchedTarifHotel.forEach((tier, i) => {
      // clear any previous nested errors for this tier
      clearErrors(`tarifHotel.${i}.priceRanges`);

      if (
        tier?.priceRanges &&
        Array.isArray(tier.priceRanges) &&
        tier.priceRanges.length > 0
      ) {
        const detail = getPriceRangeConflicts(tier.priceRanges);

        // field-level validation errors (min/max invalid)
        if (Array.isArray(detail.errors) && detail.errors.length > 0) {
          detail.errors.forEach((err) => {
            // set error on minPax field of that range (will show next to inputs)
            setError(`tarifHotel.${i}.priceRanges.${err.index}.minPax`, {
              type: "manual",
              message: err.message,
            });
            setError(`tarifHotel.${i}.priceRanges.${err.index}.maxPax`, {
              type: "manual",
              message: err.message,
            });
          });
        }

        // overlaps: mark both ranges involved
        if (Array.isArray(detail.overlaps) && detail.overlaps.length > 0) {
          detail.overlaps.forEach((ov) => {
            const aMsg = `Overlap dengan rentang ${ov.b.min}-${ov.b.max}`;
            const bMsg = `Overlap dengan rentang ${ov.a.min}-${ov.a.max}`;
            setError(`tarifHotel.${i}.priceRanges.${ov.aIndex}.minPax`, {
              type: "manual",
              message: aMsg,
            });
            setError(`tarifHotel.${i}.priceRanges.${ov.aIndex}.maxPax`, {
              type: "manual",
              message: aMsg,
            });
            setError(`tarifHotel.${i}.priceRanges.${ov.bIndex}.minPax`, {
              type: "manual",
              message: bMsg,
            });
            setError(`tarifHotel.${i}.priceRanges.${ov.bIndex}.maxPax`, {
              type: "manual",
              message: bMsg,
            });
          });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedTarifHotel]);

  const onSubmit = async (data) => {
    // client-side validation for priceRanges when Paket Tour
    if (data.tipePaket === "Paket Tour" && Array.isArray(data.tarifHotel)) {
      let hasValidPriceRange = false;

      for (let i = 0; i < data.tarifHotel.length; i++) {
        const tier = data.tarifHotel[i];

        // Ensure priceRanges exist and is an array
        if (!tier.priceRanges || !Array.isArray(tier.priceRanges)) {
          setError(`tarifHotel.${i}.priceRanges`, {
            type: "manual",
            message: "Tarif hotel harus memiliki rentang harga",
          });
          return;
        }

        // Ensure priceRanges is not empty
        if (tier.priceRanges.length === 0) {
          setError(`tarifHotel.${i}.priceRanges`, {
            type: "manual",
            message: "Minimal satu rentang harga harus diisi",
          });
          return;
        }

        // Validate each price range
        const v = validatePriceRangesForTier(tier.priceRanges);
        if (!v.ok) {
          // set form error on the nested field and abort submit
          setError(`tarifHotel.${i}.priceRanges`, {
            type: "manual",
            message: v.message,
          });
          return;
        } else {
          clearErrors(`tarifHotel.${i}.priceRanges`);
          // Check if this tier has at least one valid price range with price > 0
          if (
            tier.priceRanges.some((pr) => {
              const price =
                typeof pr.price === "string"
                  ? Number(pr.price.trim() || 0)
                  : Number(pr.price || 0);
              return price > 0;
            })
          ) {
            hasValidPriceRange = true;
          }
        }
      }

      // Ensure at least one tier has valid price ranges
      if (!hasValidPriceRange) {
        setError("tarifHotel", {
          type: "manual",
          message:
            "Paket Tour harus memiliki setidaknya satu rentang harga yang valid (harga > 0)",
        });
        return;
      } else {
        clearErrors("tarifHotel");
      }
    }

    setIsSaving(true);
    try {
      const packageData = {
        namaPaket: data.namaPaket,
        tipePaket: data.tipePaket,
        deskripsi: data.deskripsi,
        isCustomizable: data.isCustomizable,
        customizableItems: data.isCustomizable
          ? data.customizableItems
          : undefined,
        include: data.include,
        exclude: data.exclude,
      };

      // Only include duration for non-custom pricing packages
      if (data.tipePaket !== "Harga Custom") {
        packageData.durasi = {
          hari: data.durasiHari,
          malam: data.durasiMalam,
        };
      }

      if (
        data.tipePaket === "Sewa Mobil" ||
        data.tipePaket === "Full Day Trip"
      ) {
        packageData.hargaDefault = data.hargaDefault;
        packageData.tarifOvertime = data.tarifOvertime;
        if (data.tipePaket === "Full Day Trip") {
          packageData.itinerary = data.itinerary;
        }
      } else if (data.tipePaket === "Paket Tour") {
        packageData.tarifHotel = data.tarifHotel;
        packageData.itinerary = data.itinerary;
      }
      // CUSTOM_PRICING doesn't need special fields - it's just a template

      // preserve id whether caller passed package_ or defaultValues
      if (package_?.id) {
        packageData.id = package_.id;
      } else if (defaultValues?.id) {
        packageData.id = defaultValues.id;
      }

      if (typeof onSave === "function") {
        await onSave(packageData);
        return;
      }
      if (typeof onSubmitProp === "function") {
        await onSubmitProp(packageData);
        return;
      }
      console.warn("PackageForm: no save handler provided");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {package_ ? "Edit Paket Jasa" : "Tambah Paket Jasa Baru"}
          </DialogTitle>
          <DialogDescription>
            {package_
              ? "Perbarui informasi paket jasa. Klik simpan untuk menyimpan perubahan."
              : "Masukkan data paket jasa baru. Klik simpan untuk menambahkan ke database."}
          </DialogDescription>
        </DialogHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <LoadingOverlay isVisible={isLoadingData} message="Memuat data..." />
          <LoadingOverlay isVisible={isSaving} message="Menyimpan..." />
          <div className="grid gap-4 py-4">
            <FormField>
              <FormItem>
                <FormLabel htmlFor="namaPaket">
                  Nama Paket <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id="namaPaket"
                    placeholder="Contoh: Paket Tour Lombok 4D3N"
                    {...register("namaPaket", {
                      required: "Nama paket harus diisi",
                    })}
                  />
                </FormControl>
                {errors.namaPaket && (
                  <FormMessage className="text-red-500">
                    {errors.namaPaket.message}
                  </FormMessage>
                )}
              </FormItem>
            </FormField>

            <FormField>
              <FormItem>
                <FormLabel htmlFor="tipePaket">
                  Tipe Paket <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Controller
                    name="tipePaket"
                    control={control}
                    rules={{ required: "Tipe paket harus dipilih" }}
                    render={({ field }) => {
                      const willCauseDataLoss = (oldType, newType) => {
                        if (!oldType || oldType === newType) return false;
                        const tarifHotel = getValues("tarifHotel") || [];
                        const itinerary = getValues("itinerary") || [];
                        const price = Number(getValues("hargaDefault") || 0);
                        const overtime = Number(
                          getValues("tarifOvertime") || 0
                        );
                        const durasiMalam = Number(
                          getValues("durasiMalam") || 0
                        );

                        // Tour -> switching away will remove hotel tiers + itineraries + nights
                        if (
                          oldType === "Paket Tour" &&
                          newType !== "Paket Tour"
                        ) {
                          return (
                            (Array.isArray(tarifHotel) &&
                              tarifHotel.length > 0) ||
                            (Array.isArray(itinerary) &&
                              itinerary.length > 0) ||
                            durasiMalam > 0
                          );
                        }

                        // Sewa Mobil -> switching away may remove price/overtime
                        if (
                          oldType === "Sewa Mobil" &&
                          newType !== "Sewa Mobil"
                        ) {
                          return price > 0 || overtime > 0;
                        }

                        // Full Day Trip -> switching away may remove itinerary or price
                        if (
                          oldType === "Full Day Trip" &&
                          newType !== "Full Day Trip"
                        ) {
                          return (
                            (Array.isArray(itinerary) &&
                              itinerary.length > 0) ||
                            price > 0 ||
                            overtime > 0
                          );
                        }

                        // Custom pricing -> switching away doesn't lose data
                        if (oldType === "Harga Custom") {
                          return false;
                        }

                        return false;
                      };

                      const handleTypeChange = (val) => {
                        const old = field.value || getValues("tipePaket");
                        if (willCauseDataLoss(old, val)) {
                          setPendingType(val);
                          setShowTypeConfirm(true);
                        } else {
                          field.onChange(val);
                        }
                      };

                      const confirmChange = () => {
                        if (pendingType) {
                          // apply the pending type
                          setValue("tipePaket", pendingType);
                        }
                        setPendingType(null);
                        setShowTypeConfirm(false);
                      };

                      const cancelChange = () => {
                        setPendingType(null);
                        setShowTypeConfirm(false);
                      };

                      // compute details for the confirmation dialog
                      const tarifHotelVals = getValues("tarifHotel") || [];
                      const hotelTierCount = Array.isArray(tarifHotelVals)
                        ? tarifHotelVals.length
                        : 0;
                      const hotelCount = Array.isArray(tarifHotelVals)
                        ? tarifHotelVals.reduce(
                            (acc, t) =>
                              acc +
                              (Array.isArray(t.daftarHotel)
                                ? t.daftarHotel.length
                                : Array.isArray(t.hotels)
                                  ? t.hotels.length
                                  : 0),
                            0
                          )
                        : 0;
                      const itineraryVals = getValues("itinerary") || [];
                      const itineraryCount = Array.isArray(itineraryVals)
                        ? itineraryVals.length
                        : 0;
                      const priceVal = Number(getValues("hargaDefault") || 0);
                      const overtimeVal = Number(
                        getValues("tarifOvertime") || 0
                      );
                      const fmt = (v) => {
                        try {
                          return new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0,
                          }).format(v);
                        } catch (e) {
                          return String(v);
                        }
                      };

                      return (
                        <>
                          <Select
                            onValueChange={handleTypeChange}
                            value={field.value}
                          >
                            <SelectTrigger id="tipePaket">
                              <SelectValue placeholder="Pilih tipe paket" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sewa Mobil">
                                Sewa Mobil
                              </SelectItem>
                              <SelectItem value="Full Day Trip">
                                Full Day Trip (1 Hari)
                              </SelectItem>
                              <SelectItem value="Paket Tour">
                                Paket Tour (Multi Hari)
                              </SelectItem>
                              <SelectItem value="Harga Custom">
                                Harga Custom
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <Dialog
                            open={showTypeConfirm}
                            onOpenChange={setShowTypeConfirm}
                          >
                            <DialogContent className="sm:max-w-[420px]">
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                  Konfirmasi Perubahan Tipe
                                </h3>
                                <p>
                                  Anda akan mengubah tipe paket dari{" "}
                                  <strong>{field.value}</strong> ke{" "}
                                  <strong>{pendingType}</strong>.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Perubahan berikut akan terjadi jika Anda
                                  melanjutkan:
                                </p>
                                <ul className="list-disc pl-5 text-sm space-y-1">
                                  {field.value === "Paket Tour" &&
                                    pendingType !== "Paket Tour" && (
                                      <>
                                        <li>
                                          Menghapus {hotelTierCount} tingkat
                                          hotel (total {hotelCount} hotel)
                                        </li>
                                        <li>
                                          Menghapus {itineraryCount} hari
                                          itinerary
                                        </li>
                                      </>
                                    )}

                                  {field.value === "Sewa Mobil" &&
                                    pendingType !== "Sewa Mobil" &&
                                    (priceVal > 0 || overtimeVal > 0) && (
                                      <>
                                        {priceVal > 0 && (
                                          <li>
                                            Menghapus Harga Default:{" "}
                                            {fmt(priceVal)}
                                          </li>
                                        )}
                                        {overtimeVal > 0 && (
                                          <li>
                                            Menghapus Tarif Overtime:{" "}
                                            {fmt(overtimeVal)}/jam
                                          </li>
                                        )}
                                      </>
                                    )}

                                  {field.value === "Full Day Trip" &&
                                    pendingType !== "Full Day Trip" && (
                                      <>
                                        {itineraryCount > 0 && (
                                          <li>
                                            Menghapus {itineraryCount} hari
                                            itinerary
                                          </li>
                                        )}
                                        {priceVal > 0 && (
                                          <li>
                                            Menghapus Harga Default:{" "}
                                            {fmt(priceVal)}
                                          </li>
                                        )}
                                        {overtimeVal > 0 && (
                                          <li>
                                            Menghapus Tarif Overtime:{" "}
                                            {fmt(overtimeVal)}/jam
                                          </li>
                                        )}
                                      </>
                                    )}

                                  {field.value === "Harga Custom" && (
                                    <>
                                      <li className="text-green-600">
                                        Paket harga custom tidak memiliki data
                                        yang akan hilang
                                      </li>
                                    </>
                                  )}

                                  <li className="text-gray-600">
                                    Data lain yang relevan dengan tipe saat ini
                                    akan dihapus atau dikosongkan.
                                  </li>
                                </ul>

                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={cancelChange}
                                  >
                                    Batal
                                  </Button>
                                  <Button
                                    onClick={confirmChange}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Lanjutkan
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      );
                    }}
                  />
                </FormControl>
                {errors.tipePaket && (
                  <FormMessage className="text-red-500">
                    {errors.tipePaket.message}
                  </FormMessage>
                )}
              </FormItem>
            </FormField>

            <FormField>
              <FormItem>
                <FormLabel htmlFor="deskripsi">
                  Deskripsi Paket <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    id="deskripsi"
                    placeholder="Deskripsi singkat tentang paket ini"
                    rows={2}
                    {...register("deskripsi", {
                      required: "Deskripsi harus diisi",
                    })}
                  />
                </FormControl>
                {errors.deskripsi && (
                  <FormMessage className="text-red-500">
                    {errors.deskripsi.message}
                  </FormMessage>
                )}
              </FormItem>
            </FormField>

            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-indigo-600" />
                  <Label htmlFor="isCustomizable" className="cursor-pointer">
                    Paket Dapat Disesuaikan (Customizable)
                  </Label>
                </div>
                <Controller
                  name="isCustomizable"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="isCustomizable"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
              {isCustomizable && (
                <div className="mt-3 space-y-2">
                  <Label className="text-indigo-700">
                    Item yang Dapat Disesuaikan
                  </Label>
                  <Controller
                    name="customizableItems"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <div className="flex flex-wrap gap-2 items-center mb-2">
                          {field.value?.map((item, idx) => (
                            <Badge
                              key={item + idx}
                              color="teal"
                              className="flex items-center gap-1"
                            >
                              {item}
                              <button
                                type="button"
                                className="ml-1 text-xs"
                                onClick={() => {
                                  const newArr = field.value.filter(
                                    (_, i) => i !== idx
                                  );
                                  field.onChange(newArr);
                                }}
                              >
                                <span className="text-xs">×</span>
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2 items-center">
                          <Input
                            value={newCustomItem}
                            onChange={(e) => setNewCustomItem(e.target.value)}
                            placeholder="Tambah item..."
                            className="w-auto min-w-[120px]"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (
                                  newCustomItem.trim() &&
                                  !field.value.includes(newCustomItem.trim())
                                ) {
                                  field.onChange([
                                    ...field.value,
                                    newCustomItem.trim(),
                                  ]);
                                  setNewCustomItem("");
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (
                                newCustomItem.trim() &&
                                !field.value.includes(newCustomItem.trim())
                              ) {
                                field.onChange([
                                  ...field.value,
                                  newCustomItem.trim(),
                                ]);
                                setNewCustomItem("");
                              }
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  />
                  <p className="text-indigo-600">
                    Contoh: Pilih Destinasi, Tingkat Hotel, Durasi, Jumlah
                    Peserta, dll.
                  </p>
                </div>
              )}
            </div>

            {tipePaket === "Harga Custom" ? (
              <div className="flex items-center justify-center p-4 bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-200">
                <p className="text-sm text-yellow-700 text-center">
                  Paket harga custom tidak memerlukan durasi tetap
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <FormField>
                  <FormItem>
                    <FormLabel htmlFor="durasiHari">
                      {tipePaket === "Sewa Mobil"
                        ? "Durasi (Jam)"
                        : "Durasi (Hari)"}{" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="durasiHari"
                        type="number"
                        placeholder={tipePaket === "Sewa Mobil" ? "24" : "4"}
                        {...register("durasiHari", {
                          required:
                            tipePaket === "Sewa Mobil"
                              ? "Durasi jam harus diisi"
                              : "Durasi hari harus diisi",
                          min: {
                            value: 1,
                            message:
                              tipePaket === "Sewa Mobil"
                                ? "Minimal 1 jam"
                                : "Minimal 1 hari",
                          },
                          valueAsNumber: true,
                        })}
                      />
                    </FormControl>
                    {errors.durasiHari && (
                      <FormMessage className="text-red-500">
                        {errors.durasiHari.message}
                      </FormMessage>
                    )}
                  </FormItem>
                </FormField>

                {tipePaket === "Paket Tour" || tipePaket === "Full Day Trip" ? (
                  <FormField>
                    <FormItem>
                      <FormLabel htmlFor="durasiMalam">
                        Durasi (Malam) <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="durasiMalam"
                          type="number"
                          placeholder={
                            tipePaket === "Full Day Trip" ? "0" : "3"
                          }
                          {...register("durasiMalam", {
                            required: "Durasi malam harus diisi",
                            min: {
                              value: 0,
                              message: "Minimal 0 malam",
                            },
                            valueAsNumber: true,
                          })}
                        />
                      </FormControl>
                      {errors.durasiMalam && (
                        <FormMessage className="text-red-500">
                          {errors.durasiMalam.message}
                        </FormMessage>
                      )}
                    </FormItem>
                  </FormField>
                ) : (
                  <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <p className="text-sm text-gray-500 text-center">
                      Sewa Mobil tidak memiliki durasi malam
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField>
                <FormItem>
                  <FormLabel htmlFor="include">Include</FormLabel>
                  <FormControl>
                    <Textarea
                      id="include"
                      placeholder="Mobil + Sopir, BBM, Hotel, Sarapan"
                      rows={2}
                      {...register("include")}
                    />
                  </FormControl>
                </FormItem>
              </FormField>

              <FormField>
                <FormItem>
                  <FormLabel htmlFor="exclude">Exclude</FormLabel>
                  <FormControl>
                    <Textarea
                      id="exclude"
                      placeholder="Tiket pesawat, Makan, Tiket wisata"
                      rows={2}
                      {...register("exclude")}
                    />
                  </FormControl>
                </FormItem>
              </FormField>
            </div>

            <div className="space-y-4">
              {tipePaket === "Harga Custom" && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <h3 className="font-medium text-yellow-900">
                      Paket Harga Custom
                    </h3>
                  </div>
                  <p className="text-yellow-700 mt-2">
                    Paket ini memungkinkan harga yang disesuaikan per transaksi.
                    Harga akan ditentukan saat membuat transaksi.
                  </p>
                </div>
              )}

              {tipePaket === "Paket Tour" && (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Hotel className="h-4 w-4 text-purple-600" />
                      <h3 className="font-medium text-purple-900">
                        Konfigurasi Paket Tour
                      </h3>
                    </div>

                    <Tabs defaultValue="hotel" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger
                          value="hotel"
                          className="flex items-center gap-2"
                        >
                          <Hotel className="h-4 w-4" />
                          Tarif Hotel
                        </TabsTrigger>
                        <TabsTrigger
                          value="itinerary"
                          className="flex items-center gap-2"
                        >
                          <Map className="h-4 w-4" />
                          Itinerary
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="hotel" className="space-y-3 mt-4">
                        {hotelFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="p-4 bg-gray-50 rounded-lg border space-y-3"
                          >
                            <div className="flex gap-3 items-start">
                              <div className="flex-1 grid grid-cols-2 gap-3">
                                <FormField>
                                  <FormItem>
                                    <FormLabel>Tingkat Hotel</FormLabel>
                                    <FormControl>
                                      <Controller
                                        name={`tarifHotel.${index}.tingkat`}
                                        control={control}
                                        rules={{
                                          required:
                                            "Tingkat hotel harus dipilih",
                                        }}
                                        render={({ field }) => (
                                          <Select
                                            className="w-full min-w-0"
                                            onValueChange={field.onChange}
                                            value={field.value}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Pilih tingkat" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem
                                                value="Bintang 2"
                                                className="w-full"
                                              >
                                                Bintang 2
                                              </SelectItem>
                                              <SelectItem value="Bintang 3">
                                                Bintang 3
                                              </SelectItem>
                                              <SelectItem value="Bintang 4">
                                                Bintang 4
                                              </SelectItem>
                                              <SelectItem value="Bintang 5">
                                                Bintang 5
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        )}
                                      />
                                    </FormControl>
                                  </FormItem>
                                </FormField>
                              </div>
                              {hotelFields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={() => removeHotel(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <FormField>
                              <FormItem>
                                <FormLabel>Daftar Hotel</FormLabel>
                                <FormControl>
                                  <Controller
                                    name={`tarifHotel.${index}.daftarHotel`}
                                    control={control}
                                    render={({ field }) => (
                                      <HotelListInput
                                        hotels={field.value || []}
                                        onChange={field.onChange}
                                      />
                                    )}
                                  />
                                </FormControl>
                              </FormItem>
                            </FormField>

                            <FormField>
                              <FormItem>
                                <FormLabel>Price Ranges (per Pax)</FormLabel>
                                <FormControl>
                                  <div className="space-y-2">
                                    {(
                                      getValues(
                                        `tarifHotel.${index}.priceRanges`
                                      ) || []
                                    ).map((r, ri) => {
                                      const fieldError =
                                        errors?.tarifHotel?.[index]
                                          ?.priceRanges?.[ri]?.minPax
                                          ?.message ||
                                        errors?.tarifHotel?.[index]
                                          ?.priceRanges?.[ri]?.maxPax
                                          ?.message ||
                                        errors?.tarifHotel?.[index]
                                          ?.priceRanges?.[ri]?.price?.message;
                                      return (
                                        <div
                                          key={ri}
                                          className="flex gap-2 items-center"
                                        >
                                          <Input
                                            type="number"
                                            className={`w-24 ${
                                              fieldError ? "border-red-500" : ""
                                            }`}
                                            {...register(
                                              `tarifHotel.${index}.priceRanges.${ri}.minPax`,
                                              { valueAsNumber: true }
                                            )}
                                            placeholder="min"
                                          />
                                          <span className="text-sm">-</span>
                                          <Input
                                            type="number"
                                            className={`w-24 ${
                                              fieldError ? "border-red-500" : ""
                                            }`}
                                            {...register(
                                              `tarifHotel.${index}.priceRanges.${ri}.maxPax`,
                                              { valueAsNumber: true }
                                            )}
                                            placeholder="max"
                                          />
                                          <Controller
                                            name={`tarifHotel.${index}.priceRanges.${ri}.price`}
                                            control={control}
                                            render={({ field }) => (
                                              <CurrencyInput
                                                className={`w-40 ${
                                                  fieldError
                                                    ? "border-red-500"
                                                    : ""
                                                }`}
                                                value={field.value}
                                                onChange={(e) => {
                                                  field.onChange(
                                                    e.target.value
                                                  );
                                                }}
                                                placeholder="Harga"
                                              />
                                            )}
                                          />
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                              const arr =
                                                getValues(
                                                  `tarifHotel.${index}.priceRanges`
                                                ) || [];
                                              const next = arr.filter(
                                                (_, i) => i !== ri
                                              );
                                              setValue(
                                                `tarifHotel.${index}.priceRanges`,
                                                next
                                              );
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                          {fieldError && (
                                            <p className="text-red-600 text-sm ml-2">
                                              {fieldError}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })}

                                    <div>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const arr =
                                            getValues(
                                              `tarifHotel.${index}.priceRanges`
                                            ) || [];
                                          setValue(
                                            `tarifHotel.${index}.priceRanges`,
                                            [
                                              ...arr,
                                              {
                                                minPax: 1,
                                                maxPax: 1,
                                                price: 0,
                                              },
                                            ]
                                          );
                                        }}
                                      >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Tambah Rentang
                                      </Button>
                                    </div>
                                    {errors?.tarifHotel?.[index]
                                      ?.priceRanges && (
                                      <p className="text-red-600 text-sm mt-1">
                                        {
                                          errors.tarifHotel[index].priceRanges
                                            .message
                                        }
                                      </p>
                                    )}
                                  </div>
                                </FormControl>
                              </FormItem>
                            </FormField>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full border-teal-200 text-teal-600 hover:bg-teal-50"
                          onClick={() =>
                            appendHotel({
                              tingkat: "Bintang 3",
                              daftarHotel: [],
                              priceRanges: [],
                            })
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Tambah Tingkat Hotel
                        </Button>
                      </TabsContent>

                      <TabsContent value="itinerary" className="space-y-3 mt-4">
                        {itineraryFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg border"
                          >
                            <div className="flex-1 grid gap-2">
                              <FormField>
                                <FormItem>
                                  <FormLabel>Hari ke-{index + 1}</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Aktivitas hari ini..."
                                      rows={2}
                                      {...register(
                                        `itinerary.${index}.aktivitas`,
                                        {
                                          required: "Aktivitas harus diisi",
                                        }
                                      )}
                                    />
                                  </FormControl>
                                  {errors?.itinerary?.[index]?.aktivitas && (
                                    <FormMessage className="text-red-500">
                                      {
                                        errors.itinerary[index].aktivitas
                                          .message
                                      }
                                    </FormMessage>
                                  )}
                                  <input
                                    type="hidden"
                                    {...register(`itinerary.${index}.hari`)}
                                    value={index + 1}
                                  />
                                </FormItem>
                              </FormField>
                            </div>
                            {itineraryFields.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => removeItinerary(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full border-teal-200 text-teal-600 hover:bg-teal-50"
                          onClick={() =>
                            appendItinerary({
                              hari: itineraryFields.length + 1,
                              aktivitas: "",
                            })
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Tambah Hari
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              )}

              {(tipePaket === "Sewa Mobil" || tipePaket === "Full Day Trip") &&
                tipePaket !== "Harga Custom" && (
                  <>
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h3 className="font-medium text-blue-900">
                          {tipePaket === "Sewa Mobil"
                            ? "Konfigurasi Sewa Mobil"
                            : "Konfigurasi Full Day Trip"}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField>
                          <FormItem>
                            <FormLabel htmlFor="hargaDefault">
                              Harga Default{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Controller
                                name="hargaDefault"
                                control={control}
                                rules={{
                                  required:
                                    tipePaket === "Sewa Mobil" ||
                                    tipePaket === "Full Day Trip"
                                      ? "Harga harus diisi"
                                      : false,
                                  validate: (value) => {
                                    const num = Number(value || 0);
                                    if (num < 0) return "Harga minimal 0";
                                    return true;
                                  },
                                }}
                                render={({ field }) => (
                                  <CurrencyInput
                                    id="hargaDefault"
                                    placeholder="500.000"
                                    value={field.value}
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                    }}
                                  />
                                )}
                              />
                            </FormControl>
                            {errors.hargaDefault && (
                              <FormMessage className="text-red-500">
                                {errors.hargaDefault.message}
                              </FormMessage>
                            )}
                          </FormItem>
                        </FormField>

                        <FormField>
                          <FormItem>
                            <FormLabel htmlFor="tarifOvertime">
                              Tarif Overtime (per Jam)
                            </FormLabel>
                            <FormControl>
                              <Controller
                                name="tarifOvertime"
                                control={control}
                                rules={{
                                  validate: (value) => {
                                    const num = Number(value || 0);
                                    if (num < 0) return "Tarif minimal 0";
                                    return true;
                                  },
                                }}
                                render={({ field }) => (
                                  <CurrencyInput
                                    id="tarifOvertime"
                                    placeholder="50.000"
                                    value={field.value}
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                    }}
                                  />
                                )}
                              />
                            </FormControl>
                            {errors.tarifOvertime && (
                              <FormMessage className="text-red-500">
                                {errors.tarifOvertime.message}
                              </FormMessage>
                            )}
                          </FormItem>
                        </FormField>
                      </div>
                    </div>

                    {tipePaket === "Full Day Trip" && (
                      <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <Map className="h-4 w-4 text-green-600" />
                          <h3 className="font-medium text-green-900">
                            Itinerary Full Day Trip
                          </h3>
                        </div>
                        {itineraryFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="p-3 bg-white rounded-lg border space-y-2"
                          >
                            <FormField>
                              <FormItem>
                                <FormLabel>Aktivitas</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Deskripsi aktivitas sepanjang hari..."
                                    rows={4}
                                    {...register(
                                      `itinerary.${index}.aktivitas`,
                                      {
                                        required: "Aktivitas harus diisi",
                                      }
                                    )}
                                  />
                                </FormControl>
                                {errors?.itinerary?.[index]?.aktivitas && (
                                  <FormMessage className="text-red-500">
                                    {errors.itinerary[index].aktivitas.message}
                                  </FormMessage>
                                )}
                                <input
                                  type="hidden"
                                  {...register(`itinerary.${index}.hari`)}
                                  value={1}
                                />
                              </FormItem>
                            </FormField>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <LoadingButton
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={!isDirty}
              isLoading={isSubmitting}
              loadingText="Menyimpan..."
            >
              Simpan
            </LoadingButton>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
