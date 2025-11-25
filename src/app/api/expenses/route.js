import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { logExpenseEvent } from "@/lib/audit";
import { initStorage, uploadFile } from "@/lib/file-storage";
import { v4 as uuidv4 } from "uuid";

async function handleGetExpenses(request) {
  try {

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 10;
    const search = url.searchParams.get("search") || "";
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { description: { contains: search } }, // Default is case-insensitive in some DBs, but for SQLite/Postgres might need mode: 'insensitive'
        { category: { contains: search } },
      ];
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Get total count for pagination with filters
    const totalCount = await prisma.expense.count({ where });

    const data = await prisma.expense.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: {
        date: "desc",
      },
      include: {
        armada: true,
        driver: true,
        staff: true,
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            createdAt: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalCount / limit);

    return successResponse({
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching pengeluaran:", error);
    return errorResponse("Gagal mengambil data", 500);
  }
}

async function handleCreateExpense(request) {
  try {

    const formData = await request.formData();

    // Extract fields from FormData
    const body = {};
    for (const [key, value] of formData.entries()) {
      if (key === "file") {
        // Handle file separately if needed
        body.file = value;
      } else {
        body[key] = value;
      }
    }

    // Parse date and paymentMonth if present
    if (body.date) {
      body.date = new Date(body.date);
    }
    if (body.paymentMonth) {
      body.paymentMonth = new Date(body.paymentMonth);
    }

    if (!body.date || !body.category || !body.description || !body.amount) {
      return errorResponse("Data tidak lengkap", 400);
    }

    // Validate amount is a number
    const amount =
      typeof body.amount === "number" ? body.amount : parseInt(body.amount, 10);
    if (isNaN(amount) || amount <= 0) {
      return errorResponse(
        "Jumlah harus berupa angka yang valid dan lebih dari 0",
        400
      );
    }

    let finalCategory = body.category;
    if (body.category === "LAINNYA" && body.kategoriLainnya) {
      finalCategory = body.kategoriLainnya;
    } else if (body.category === "LAINNYA" && !body.kategoriLainnya) {
      return errorResponse("Kategori 'Lainnya' tidak boleh kosong", 400);
    }

    const approvalData = request.auth.adminAutoApprove
      ? {
          approval_status: "APPROVED",
          approved_by_id: request.auth.user.id,
          approved_at: new Date(),
        }
      : {};

    // Build the data object with proper Prisma relations
    const createData = {
      date: body.date,
      paymentMonth: body.paymentMonth || null,
      category: finalCategory,
      description: body.description,
      amount: amount,
      namaPenerima: body.namaPenerima || null,
      ...approvalData,
    };

    // Add optional relations using connect
    if (body.armadaId) {
      createData.armada = { connect: { id: body.armadaId } };
    }
    if (body.driverId) {
      createData.driver = { connect: { id: body.driverId } };
    }
    if (body.staffId) {
      createData.staff = { connect: { id: body.staffId } };
    }

    const newData = await prisma.expense.create({
      data: createData,
      include: {
        armada: true,
        driver: true,
        staff: true,
        attachments: true,
      },
    });

    // Handle file upload if present
    if (body.file && body.file instanceof File) {
      try {
        await initStorage();

        const fileBuffer = Buffer.from(await body.file.arrayBuffer());
        const fileExt = body.file.name.split(".").pop();
        const fileName = `expense-${newData.id}-${uuidv4()}.${fileExt}`;

        const filePath = await uploadFile(fileName, fileBuffer, body.file.type);

        // Create attachment record
        await prisma.expenseAttachment.create({
          data: {
            expenseId: newData.id,
            fileName: body.file.name,
            filePath: filePath,
            fileSize: body.file.size,
            mimeType: body.file.type,
          },
        });
      } catch (fileError) {
        console.error("Error uploading file:", fileError);
        // Don't fail the whole request if file upload fails
      }
    }

    // Fetch updated data with attachments
    const finalData = await prisma.expense.findUnique({
      where: { id: newData.id },
      include: {
        armada: true,
        driver: true,
        staff: true,
        attachments: true,
      },
    });

    // Log audit event
    await logExpenseEvent(
      request.auth.user.id,
      "CREATE",
      finalData.id,
      finalData,
      request.auth.ipAddress,
      request.auth.userAgent
    );

    return successResponse(finalData, 201);
  } catch (error) {
    console.error("Error creating pengeluaran:", error);
    console.error("Error stack:", error.stack);
    return errorResponse(
      error.message || "Gagal membuat data",
      error.statusCode || 500
    );
  }
}

// ADMIN and OPERATOR can view and create expenses
// OPERATOR creates as DRAFT and must submit for approval
export const GET = protectedRoute(handleGetExpenses, {
  permissions: ["canViewExpenses"],
});

export const POST = protectedRoute(handleCreateExpense, {
  permissions: ["canCreateExpense"],
  adminAutoApprove: true,
});
