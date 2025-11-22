/**
 * Example usage of useActionLoading hook
 *
 * This file demonstrates how to use the useActionLoading hook
 * for managing individual item actions in lists and tables.
 */

import { useActionLoading } from "./useActionLoading";
import { LoadingButton } from "@/components/ui/loading-button";

// Example 1: Delete action with item-specific loading
function TransactionList({ transactions, onDelete }) {
  const { isActionLoading, executeAction } = useActionLoading();

  const handleDelete = async (transactionId) => {
    await executeAction(
      `delete-${transactionId}`, // Unique action ID
      async () => {
        const response = await fetch(`/api/transactions/${transactionId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Gagal menghapus transaksi");
        return response.json();
      },
      {
        successMessage: "Transaksi berhasil dihapus",
        errorMessage: "Gagal menghapus transaksi",
        onSuccess: () => {
          onDelete(transactionId);
        },
      }
    );
  };

  return (
    <div>
      {transactions.map((transaction) => (
        <div key={transaction.id}>
          <span>{transaction.customer_name}</span>
          <button
            onClick={() => handleDelete(transaction.id)}
            disabled={isActionLoading(`delete-${transaction.id}`)}
          >
            {isActionLoading(`delete-${transaction.id}`)
              ? "Menghapus..."
              : "Hapus"}
          </button>
        </div>
      ))}
    </div>
  );
}

// Example 2: Multiple action types per item
function ExpenseList({ expenses, onApprove, onReject }) {
  const { isActionLoading, executeAction } = useActionLoading();

  const handleApprove = async (expenseId) => {
    await executeAction(
      `approve-${expenseId}`,
      async () => {
        const response = await fetch(
          `/api/expenses/${expenseId}/approve-edit`,
          { method: "POST" }
        );
        if (!response.ok) throw new Error("Gagal menyetujui pengeluaran");
        return response.json();
      },
      {
        successMessage: "Pengeluaran berhasil disetujui",
        onSuccess: () => onApprove(expenseId),
      }
    );
  };

  const handleReject = async (expenseId) => {
    await executeAction(
      `reject-${expenseId}`,
      async () => {
        const response = await fetch(`/api/expenses/${expenseId}/reject`, {
          method: "POST",
        });
        if (!response.ok) throw new Error("Gagal menolak pengeluaran");
        return response.json();
      },
      {
        successMessage: "Pengeluaran berhasil ditolak",
        onSuccess: () => onReject(expenseId),
      }
    );
  };

  return (
    <div>
      {expenses.map((expense) => (
        <div key={expense.id}>
          <span>{expense.description}</span>
          <button
            onClick={() => handleApprove(expense.id)}
            disabled={
              isActionLoading(`approve-${expense.id}`) ||
              isActionLoading(`reject-${expense.id}`)
            }
          >
            {isActionLoading(`approve-${expense.id}`)
              ? "Menyetujui..."
              : "Setujui"}
          </button>
          <button
            onClick={() => handleReject(expense.id)}
            disabled={
              isActionLoading(`approve-${expense.id}`) ||
              isActionLoading(`reject-${expense.id}`)
            }
          >
            {isActionLoading(`reject-${expense.id}`) ? "Menolak..." : "Tolak"}
          </button>
        </div>
      ))}
    </div>
  );
}

// Example 3: Using with LoadingButton component
function VehicleCard({ vehicle, onEdit, onDelete }) {
  const { isActionLoading, executeAction } = useActionLoading();

  const handleEdit = async () => {
    await executeAction(
      `edit-${vehicle.id}`,
      async () => {
        // Edit logic here
        return { success: true };
      },
      {
        successMessage: "Kendaraan berhasil diperbarui",
      }
    );
  };

  const handleDelete = async () => {
    await executeAction(
      `delete-${vehicle.id}`,
      async () => {
        const response = await fetch(`/api/vehicles/${vehicle.id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Gagal menghapus kendaraan");
        return response.json();
      },
      {
        successMessage: "Kendaraan berhasil dihapus",
        onSuccess: () => onDelete(vehicle.id),
      }
    );
  };

  return (
    <div>
      <h3>{vehicle.name}</h3>
      <LoadingButton
        isLoading={isActionLoading(`edit-${vehicle.id}`)}
        onClick={handleEdit}
        loadingText="Menyimpan..."
      >
        Edit
      </LoadingButton>
      <LoadingButton
        isLoading={isActionLoading(`delete-${vehicle.id}`)}
        onClick={handleDelete}
        loadingText="Menghapus..."
        variant="destructive"
      >
        Hapus
      </LoadingButton>
    </div>
  );
}

// Example 4: Manual control with startAction/stopAction
function CustomComponent() {
  const { isActionLoading, startAction, stopAction } = useActionLoading();

  const handleCustomAction = async (itemId) => {
    const actionId = `custom-${itemId}`;

    startAction(actionId);

    try {
      // Your custom logic here
      await someAsyncOperation();

      // Show success toast manually if needed
      toast.success("Operasi berhasil");
    } catch (error) {
      // Show error toast manually
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      stopAction(actionId);
    }
  };

  return <div>{/* Your component */}</div>;
}
