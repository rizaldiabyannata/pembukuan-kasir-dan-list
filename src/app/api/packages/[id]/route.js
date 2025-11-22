import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { validatePriceRangesForTier } from "@/lib/utils";
import {
  protectedRoute,
  successResponse,
  errorResponse,
  getClientIp,
  getUserAgent,
} from "@/lib/middleware";
import { logPackageEvent } from "@/lib/audit";

const prisma = new PrismaClient();

async function handleGetPackage(request, { params }) {
  try {
    const { id } = await params;

    const packageData = await prisma.servicePackage.findUnique({
      where: { id },
      include: {
        hotelTiers: {
          include: {
            hotels: true,
            priceRanges: true,
          },
        },
        itineraries: true,
      },
    });

    if (!packageData) {
      return errorResponse("Package not found", 404);
    }

    return successResponse(packageData);
  } catch (error) {
    console.error("Error fetching package:", error);
    return errorResponse("Failed to fetch package", 500);
  }
}

async function handleUpdatePackage(request, { params }) {
  try {
    const data = await request.json();
    console.log("=== PUT /api/packages/[id] ===");
    console.log("Received data:", JSON.stringify(data, null, 2));

    // Accept payloads shaped like the frontend form (Indonesian keys)
    const {
      tarifHotel: hotelTiers,
      itinerary: itineraries,
      namaPaket,
      tipePaket,
      deskripsi,
      isCustomizable,
      customizableItems,
      hargaDefault,
      tarifOvertime,
      include,
      exclude,
      durasi,
      ...rest
    } = data;

    // durations may come nested under `durasi` (hari/malam) or as top-level fields
    // durasiHari can mean either hours (for CAR_RENTAL/FULL_DAY_TRIP) or days (for TOUR_PACKAGE)
    const durasiHari = (durasi && durasi.hari) || data.durasiHari || null;
    const durasiMalam = (durasi && durasi.malam) || data.durasiMalam || null;

    // Map incoming form fields (Indonesian) to Prisma schema fields (English)
    const type =
      tipePaket === "Paket Tour"
        ? "TOUR_PACKAGE"
        : tipePaket === "Full Day Trip"
          ? "FULL_DAY_TRIP"
          : tipePaket === "Harga Custom"
            ? "CUSTOM_PRICING"
            : "CAR_RENTAL";

    console.log("Mapped type:", type);
    console.log("durasiHari received:", durasiHari);
    console.log("durasiMalam received:", durasiMalam);

    const includes =
      typeof include === "string"
        ? include
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : include;
    const excludes =
      typeof exclude === "string"
        ? exclude
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : exclude;

    const updateData = {
      name: namaPaket,
      type,
      description: deskripsi || null,
      includes: includes || [],
      excludes: excludes || [],
      isCustomizable: !!isCustomizable,
      customizableItems: customizableItems || [],
    };

    // Ensure fields are set/cleared according to the selected package type
    if (type === "TOUR_PACKAGE") {
      // Tour packages use durationDays/durationNights; clear price/overtime/hours
      updateData.durationDays = durasiHari ? Number(durasiHari) : null;
      updateData.durationNights = durasiMalam ? Number(durasiMalam) : null;
      updateData.price = null;
      updateData.durationHours = null;
      updateData.overtimeRate = null;
      console.log(
        "TOUR_PACKAGE: setting durationDays =",
        updateData.durationDays,
        "durationNights =",
        updateData.durationNights
      );
    } else if (type === "FULL_DAY_TRIP") {
      // Full day trips use durationHours, price, and overtimeRate
      // Convert from thousands to full rupiah (CurrencyInput sends in thousands)
      updateData.price =
        typeof hargaDefault === "number"
          ? hargaDefault
          : hargaDefault
            ? Number(hargaDefault)
            : null;
      updateData.overtimeRate =
        typeof tarifOvertime === "number"
          ? tarifOvertime
          : tarifOvertime
            ? Number(tarifOvertime)
            : null;
      updateData.durationHours = durasiHari ? Number(durasiHari) : null;
      updateData.durationDays = null;
      updateData.durationNights = null;
      console.log(
        "FULL_DAY_TRIP: setting durationHours =",
        updateData.durationHours,
        "price =",
        updateData.price
      );
    } else if (type === "CUSTOM_PRICING") {
      // Custom pricing packages don't have fixed pricing or duration
      updateData.price = null;
      updateData.durationHours = null;
      updateData.overtimeRate = null;
      updateData.durationDays = null;
      updateData.durationNights = null;
      console.log("CUSTOM_PRICING: clearing all pricing and duration fields");
    } else if (type === "CAR_RENTAL") {
      // Car rentals use durationHours, price, and overtimeRate
      // Convert from thousands to full rupiah (CurrencyInput sends in thousands)
      updateData.price =
        typeof hargaDefault === "number"
          ? hargaDefault
          : hargaDefault
            ? Number(hargaDefault)
            : null;
      updateData.overtimeRate =
        typeof tarifOvertime === "number"
          ? tarifOvertime
          : tarifOvertime
            ? Number(tarifOvertime)
            : null;
      updateData.durationHours = durasiHari ? Number(durasiHari) : null;
      updateData.durationDays = null;
      updateData.durationNights = null;
      console.log(
        "CAR_RENTAL: setting durationHours =",
        updateData.durationHours,
        "price =",
        updateData.price,
        "overtimeRate =",
        updateData.overtimeRate
      );
    }

    console.log("Update data prepared:", JSON.stringify(updateData, null, 2));

    const { id } = await params;
    console.log("Package ID to update:", id);

    // Verify package exists
    const existingPackage = await prisma.servicePackage.findUnique({
      where: { id },
    });

    if (!existingPackage) {
      console.error("Package not found:", id);
      return errorResponse("Package not found", 404);
    }

    console.log("Existing package found:", existingPackage.name);

    // Fetch existing package with all relations for diff calculation
    const existingPackageWithRelations = await prisma.servicePackage.findUnique({
      where: { id },
      include: {
        hotelTiers: {
          include: {
            hotels: true,
            priceRanges: true,
          },
        },
        itineraries: true,
      },
    });

    if (!existingPackageWithRelations) {
      console.error("Package not found:", id);
      return errorResponse("Package not found", 404);
    }

    // Update hotel tiers and itineraries with diff-based logic
    const tx = [];

    // Update the main package data first
    console.log("Updating main package data...");
    tx.push(
      prisma.servicePackage.update({
        where: { id },
        data: updateData,
      })
    );

    // Handle hotel tiers for TOUR_PACKAGE
    if (type === "TOUR_PACKAGE") {
      if (hotelTiers && Array.isArray(hotelTiers) && hotelTiers.length > 0) {
        console.log("Processing hotel tiers...", hotelTiers.length);

        // Validate all tiers first
        for (let i = 0; i < hotelTiers.length; i++) {
          const tier = hotelTiers[i];

          // Ensure priceRanges exist and is not empty
          if (
            !tier.priceRanges ||
            !Array.isArray(tier.priceRanges) ||
            tier.priceRanges.length === 0
          ) {
            return errorResponse(
              `Tingkat hotel ke-${i + 1} harus memiliki minimal satu rentang harga`,
              400
            );
          }

          // Validate price ranges
          const v = validatePriceRangesForTier(tier.priceRanges);
          if (!v.ok) {
            console.error("Price range validation failed:", v.message);
            return errorResponse(
              `Validasi priceRanges gagal di tingkat ke-${i + 1}: ${v.message}`,
              400
            );
          }

          // Ensure at least one price range has valid price > 0
          const hasValidPrice = tier.priceRanges.some((r) => {
            const price =
              typeof r.price === "string"
                ? Number(r.price.trim() || 0)
                : Number(r.price || 0);
            return price > 0;
          });

          if (!hasValidPrice) {
            return errorResponse(
              `Tingkat hotel ke-${i + 1} harus memiliki minimal satu rentang harga dengan nilai > 0`,
              400
            );
          }
        }

        // Compute diff for hotel tiers
        const existingTierIds = new Set(existingPackageWithRelations.hotelTiers.map(t => t.id));
        const incomingTierIds = new Set(hotelTiers.filter(t => t.id).map(t => t.id));

        const tiersToDelete = [...existingTierIds].filter(id => !incomingTierIds.has(id));
        const tiersToUpdate = [...existingTierIds].filter(id => incomingTierIds.has(id));
        const tiersToCreate = hotelTiers.filter(t => !t.id);

        console.log(`Hotel tiers - Delete: ${tiersToDelete.length}, Update: ${tiersToUpdate.length}, Create: ${tiersToCreate.length}`);

        // Delete removed hotel tiers (with cascade)
        for (const tierId of tiersToDelete) {
          console.log(`Deleting hotel tier ${tierId}`);
          tx.push(prisma.hotelTier.delete({ where: { id: tierId } }));
        }

        // Update existing hotel tiers
        for (const tier of hotelTiers.filter(t => t.id && tiersToUpdate.includes(t.id))) {
          const starRating = (() => {
            const m = String(tier.tingkat || "").match(/\d+/);
            return m ? Number(m[0]) : tier.starRating || 0;
          })();

          console.log(`Updating hotel tier ${tier.id}`);
          tx.push(
            prisma.hotelTier.update({
              where: { id: tier.id },
              data: {
                starRating,
                // Handle hotels - delete all and recreate
                hotels: tier.daftarHotel && Array.isArray(tier.daftarHotel)
                  ? {
                      deleteMany: {},
                      create: tier.daftarHotel.map((hotel) => ({
                        name: typeof hotel === 'string' ? hotel : hotel.name,
                      })),
                    }
                  : { deleteMany: {} },
                // Handle price ranges - delete all and recreate
                priceRanges: tier.priceRanges && Array.isArray(tier.priceRanges)
                  ? {
                      deleteMany: {},
                      create: tier.priceRanges.map((r) => ({
                        minPax: Number(r.minPax || 0),
                        maxPax: Number(r.maxPax || 0),
                        price: Number(r.price || 0),
                      })),
                    }
                  : { deleteMany: {} },
              },
            })
          );
        }

        // Create new hotel tiers
        for (const tier of tiersToCreate) {
          const starRating = (() => {
            const m = String(tier.tingkat || "").match(/\d+/);
            return m ? Number(m[0]) : tier.starRating || 0;
          })();

          console.log(`Creating new hotel tier`);
          tx.push(
            prisma.hotelTier.create({
              data: {
                servicePackageId: id,
                starRating,
                hotels: tier.daftarHotel && Array.isArray(tier.daftarHotel)
                  ? {
                      create: tier.daftarHotel.map((hotel) => ({
                        name: typeof hotel === 'string' ? hotel : hotel.name,
                      })),
                    }
                  : undefined,
                priceRanges: tier.priceRanges && Array.isArray(tier.priceRanges)
                  ? {
                      create: tier.priceRanges.map((r) => ({
                        minPax: Number(r.minPax || 0),
                        maxPax: Number(r.maxPax || 0),
                        price: Number(r.price || 0),
                      })),
                    }
                  : undefined,
              },
            })
          );
        }
      } else {
        // No hotel tiers provided, delete all existing ones
        console.log("Deleting all hotel tiers...");
        tx.push(
          prisma.hotelTier.deleteMany({
            where: { servicePackageId: id },
          })
        );
      }
    } else {
      // Not TOUR_PACKAGE, ensure no hotel tiers exist
      console.log("Deleting all hotel tiers (not TOUR_PACKAGE)...");
      tx.push(
        prisma.hotelTier.deleteMany({
          where: { servicePackageId: id },
        })
      );
    }

    // Handle itineraries for TOUR_PACKAGE and FULL_DAY_TRIP
    if (type === "TOUR_PACKAGE" || type === "FULL_DAY_TRIP") {
      if (itineraries && Array.isArray(itineraries) && itineraries.length > 0) {
        console.log("Processing itineraries...", itineraries.length);

        // Compute diff for itineraries
        const existingItineraryIds = new Set(existingPackageWithRelations.itineraries.map(i => i.id));
        const incomingItineraryIds = new Set(itineraries.filter(i => i.id).map(i => i.id));

        const itinerariesToDelete = [...existingItineraryIds].filter(id => !incomingItineraryIds.has(id));
        const itinerariesToUpdate = [...existingItineraryIds].filter(id => incomingItineraryIds.has(id));
        const itinerariesToCreate = itineraries.filter(i => !i.id);

        console.log(`Itineraries - Delete: ${itinerariesToDelete.length}, Update: ${itinerariesToUpdate.length}, Create: ${itinerariesToCreate.length}`);

        // Delete removed itineraries
        for (const itineraryId of itinerariesToDelete) {
          console.log(`Deleting itinerary ${itineraryId}`);
          tx.push(prisma.itineraryDay.delete({ where: { id: itineraryId } }));
        }

        // Update existing itineraries
        for (const itinerary of itineraries.filter(i => i.id && itinerariesToUpdate.includes(i.id))) {
          console.log(`Updating itinerary ${itinerary.id}`);
          tx.push(
            prisma.itineraryDay.update({
              where: { id: itinerary.id },
              data: {
                day: itinerary.hari ? Number(itinerary.hari) : 0,
                title: itinerary.aktivitas || String(itinerary.title || ""),
                description: itinerary.deskripsi || null,
              },
            })
          );
        }

        // Create new itineraries
        for (const itinerary of itinerariesToCreate) {
          console.log(`Creating new itinerary`);
          tx.push(
            prisma.itineraryDay.create({
              data: {
                servicePackageId: id,
                day: itinerary.hari ? Number(itinerary.hari) : 0,
                title: itinerary.aktivitas || String(itinerary.title || ""),
                description: itinerary.deskripsi || null,
              },
            })
          );
        }
      } else {
        // No itineraries provided, delete all existing ones
        console.log("Deleting all itineraries...");
        tx.push(
          prisma.itineraryDay.deleteMany({
            where: { servicePackageId: id },
          })
        );
      }
    } else {
      // Not TOUR_PACKAGE or FULL_DAY_TRIP, ensure no itineraries exist
      console.log("Deleting all itineraries (not TOUR_PACKAGE or FULL_DAY_TRIP)...");
      tx.push(
        prisma.itineraryDay.deleteMany({
          where: { servicePackageId: id },
        })
      );
    }

    console.log("Executing transaction with", tx.length, "operations...");
    await prisma.$transaction(tx);
    console.log("Transaction completed successfully");

    const result = await prisma.servicePackage.findUnique({
      where: { id },
      include: {
        hotelTiers: {
          include: {
            hotels: true,
            priceRanges: true,
          },
        },
        itineraries: true,
      },
    });

    // Log audit event
    await logPackageEvent(
      request.auth.user.id,
      "UPDATE",
      id,
      { name: result.name, type: result.type },
      getClientIp(request),
      getUserAgent(request)
    );

    console.log("Updated package result:", result?.name);
    return successResponse(result);
  } catch (error) {
    console.error("=== PUT /api/packages/[id] ERROR ===");
    console.error("Error details:", error);
    console.error("Error stack:", error.stack);
    return errorResponse("Failed to update package", 500, {
      details: error.message,
    });
  }
}

async function handleDeletePackage(request, { params }) {
  try {
    const { id } = await params;

    // Get package data before deletion for audit log
    const existingPackage = await prisma.servicePackage.findUnique({
      where: { id },
      select: { id: true, name: true, type: true },
    });

    if (!existingPackage) {
      return errorResponse("Package not found", 404);
    }

    await prisma.servicePackage.delete({
      where: { id },
    });

    // Log audit event
    await logPackageEvent(
      request.auth.user.id,
      "DELETE",
      id,
      { name: existingPackage.name, type: existingPackage.type },
      getClientIp(request),
      getUserAgent(request)
    );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting package:", error);
    return errorResponse("Failed to delete package", 500);
  }
}

// ADMIN and OPERATOR can view packages
export const GET = protectedRoute(handleGetPackage, {
  roles: ["ADMIN", "OPERATOR"],
});

// Only ADMIN can update packages
export const PUT = protectedRoute(handleUpdatePackage, {
  roles: ["ADMIN"],
});

// Only ADMIN can delete packages
export const DELETE = protectedRoute(handleDeletePackage, {
  roles: ["ADMIN"],
});
