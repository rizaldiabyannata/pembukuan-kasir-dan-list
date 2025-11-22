import "@testing-library/jest-dom";
import fc from "fast-check";

// Configure fast-check for property-based testing
fc.configureGlobal({
  numRuns: 100, // Run each property test 100 times (minimum as per design doc)
  verbose: false, // Set to true for debugging
  seed: Date.now(), // Use current time as seed for reproducibility
});

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "";
  },
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Plus: () => "PlusIcon",
  Trash2: () => "Trash2Icon",
  Hotel: () => "HotelIcon",
  Map: () => "MapIcon",
  Settings: () => "SettingsIcon",
  ChevronDown: () => "ChevronDownIcon",
  ChevronRight: () => "ChevronRightIcon",
  MoreHorizontal: () => "MoreHorizontalIcon",
  Eye: () => "EyeIcon",
  Edit: () => "EditIcon",
  Trash: () => "TrashIcon",
  X: () => "XIcon",
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

// Global test utilities
global.testUtils = {
  createMockPackage: (overrides = {}) => ({
    id: "pkg-1",
    name: "Test Package",
    type: "TOUR_PACKAGE",
    description: "Test description",
    price: 100000,
    overtimeRate: 50000,
    isCustomizable: false,
    customizableItems: [],
    includes: "Include items",
    excludes: "Exclude items",
    ...overrides,
  }),

  createMockFormData: (overrides = {}) => ({
    namaPaket: "Test Package",
    tipePaket: "Sewa Mobil",
    deskripsi: "Test description",
    hargaDefault: 100000,
    tarifOvertime: 50000,
    isCustomizable: false,
    customizableItems: [],
    include: "Include items",
    exclude: "Exclude items",
    ...overrides,
  }),
};
