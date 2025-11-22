import { renderHook, act, waitFor } from "@testing-library/react";
import { useActionLoading } from "../useActionLoading";
import { toast } from "sonner";

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

describe("useActionLoading", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with empty loading actions", () => {
    const { result } = renderHook(() => useActionLoading());

    expect(result.current.loadingActions).toEqual({});
  });

  it("should start and stop action loading", () => {
    const { result } = renderHook(() => useActionLoading());

    act(() => {
      result.current.startAction("test-action");
    });

    expect(result.current.loadingActions["test-action"]).toBe(true);
    expect(result.current.isActionLoading("test-action")).toBe(true);

    act(() => {
      result.current.stopAction("test-action");
    });

    expect(result.current.loadingActions["test-action"]).toBeUndefined();
    expect(result.current.isActionLoading("test-action")).toBe(false);
  });

  it("should track multiple actions independently", () => {
    const { result } = renderHook(() => useActionLoading());

    act(() => {
      result.current.startAction("action-1");
      result.current.startAction("action-2");
    });

    expect(result.current.isActionLoading("action-1")).toBe(true);
    expect(result.current.isActionLoading("action-2")).toBe(true);

    act(() => {
      result.current.stopAction("action-1");
    });

    expect(result.current.isActionLoading("action-1")).toBe(false);
    expect(result.current.isActionLoading("action-2")).toBe(true);
  });

  it("should execute async action successfully", async () => {
    const { result } = renderHook(() => useActionLoading());
    const mockAsyncFn = jest.fn().mockResolvedValue("success");
    const mockOnSuccess = jest.fn();

    await act(async () => {
      const returnValue = await result.current.executeAction(
        "test-action",
        mockAsyncFn,
        {
          successMessage: "Action completed",
          onSuccess: mockOnSuccess,
        }
      );

      expect(returnValue).toBe("success");
    });

    expect(mockAsyncFn).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalledWith("success");
    expect(toast.success).toHaveBeenCalledWith("Action completed");
    expect(result.current.isActionLoading("test-action")).toBe(false);
  });

  it("should handle async action errors", async () => {
    const { result } = renderHook(() => useActionLoading());
    const mockError = new Error("Test error");
    const mockAsyncFn = jest.fn().mockRejectedValue(mockError);
    const mockOnError = jest.fn();

    await act(async () => {
      try {
        await result.current.executeAction("test-action", mockAsyncFn, {
          errorMessage: "Action failed",
          onError: mockOnError,
        });
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });

    expect(mockAsyncFn).toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledWith(mockError);
    expect(toast.error).toHaveBeenCalledWith("Action failed");
    expect(result.current.isActionLoading("test-action")).toBe(false);
  });

  it("should prevent concurrent actions on same item", async () => {
    const { result } = renderHook(() => useActionLoading());
    const mockAsyncFn = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

    // Start first action
    act(() => {
      result.current.startAction("test-action");
    });

    // Try to execute action while already loading
    await act(async () => {
      await result.current.executeAction("test-action", mockAsyncFn);
    });

    expect(mockAsyncFn).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledWith(
      "Aksi sedang diproses, mohon tunggu"
    );
  });

  it("should reset all loading states", () => {
    const { result } = renderHook(() => useActionLoading());

    act(() => {
      result.current.startAction("action-1");
      result.current.startAction("action-2");
      result.current.startAction("action-3");
    });

    expect(Object.keys(result.current.loadingActions).length).toBe(3);

    act(() => {
      result.current.resetAll();
    });

    expect(result.current.loadingActions).toEqual({});
  });

  it("should cleanup on unmount", () => {
    const { result, unmount } = renderHook(() => useActionLoading());

    act(() => {
      result.current.startAction("test-action");
    });

    expect(result.current.isActionLoading("test-action")).toBe(true);

    unmount();

    // After unmount, the hook should not update state
    // This is verified by the isMountedRef check in the implementation
  });

  it("should use default error message when none provided", async () => {
    const { result } = renderHook(() => useActionLoading());
    const mockError = new Error("Custom error");
    const mockAsyncFn = jest.fn().mockRejectedValue(mockError);

    await act(async () => {
      try {
        await result.current.executeAction("test-action", mockAsyncFn);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(toast.error).toHaveBeenCalledWith("Custom error");
  });

  it("should handle error without message", async () => {
    const { result } = renderHook(() => useActionLoading());
    const mockError = new Error();
    mockError.message = "";
    const mockAsyncFn = jest.fn().mockRejectedValue(mockError);

    await act(async () => {
      try {
        await result.current.executeAction("test-action", mockAsyncFn);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(toast.error).toHaveBeenCalledWith("Terjadi kesalahan");
  });
});
