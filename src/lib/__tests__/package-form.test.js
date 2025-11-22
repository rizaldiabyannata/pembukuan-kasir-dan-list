/**
 * Unit Tests for PackageForm Component
 * Tests the complex package form with validation, field arrays, and different package types
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { PackageForm } from "../../components/packages/PackageForm";

// Mock @/lib/utils cn function
jest.mock("@/lib/utils", () => ({
  cn: (...classes) => classes.filter(Boolean).join(" "),
}));

// Mock all UI components
jest.mock("@/components/ui/form", () => {
  const React = require("react");
  return {
    Form: ({ children, ...props }) =>
      React.createElement("form", props, children),
    FormField: ({ children }) => React.createElement("div", null, children),
    FormItem: ({ children }) => React.createElement("div", null, children),
    FormLabel: ({ children }) => React.createElement("label", null, children),
    FormControl: ({ children }) => React.createElement("div", null, children),
    FormMessage: ({ children }) =>
      React.createElement("div", { className: "text-red-500" }, children),
  };
});

jest.mock("@/components/ui/dialog", () => {
  const React = require("react");
  return {
    Dialog: ({ children, open }) =>
      open
        ? React.createElement("div", { "data-testid": "dialog" }, children)
        : null,
    DialogContent: ({ children }) =>
      React.createElement("div", { "data-testid": "dialog-content" }, children),
    DialogDescription: ({ children }) =>
      React.createElement("div", null, children),
    DialogHeader: ({ children }) => React.createElement("div", null, children),
    DialogTitle: ({ children }) => React.createElement("h2", null, children),
  };
});

jest.mock("@/components/ui/button", () => {
  const React = require("react");
  return {
    Button: ({ children, onClick, disabled, type, ...props }) =>
      React.createElement(
        "button",
        {
          type: type || "button",
          onClick,
          disabled,
          ...props,
        },
        children
      ),
  };
});

jest.mock("@/components/ui/input", () => {
  const React = require("react");
  return {
    Input: (props) => React.createElement("input", props),
  };
});

jest.mock("@/components/ui/currency-input", () => {
  const React = require("react");
  return {
    CurrencyInput: (props) =>
      React.createElement("input", { type: "number", ...props }),
  };
});

jest.mock("@/components/ui/label", () => {
  const React = require("react");
  return {
    Label: ({ children }) => React.createElement("label", null, children),
  };
});

jest.mock("@/components/ui/textarea", () => {
  const React = require("react");
  return {
    Textarea: (props) => React.createElement("textarea", props),
  };
});

jest.mock("@/components/ui/select", () => {
  const React = require("react");
  return {
    Select: ({ children, value, onValueChange }) =>
      React.createElement(
        "div",
        { "data-testid": "select" },
        React.createElement(
          "select",
          {
            value,
            onChange: (e) => onValueChange(e.target.value),
          },
          children
        )
      ),
    SelectContent: ({ children }) => React.createElement("div", null, children),
    SelectItem: ({ value, children }) =>
      React.createElement("option", { value }, children),
    SelectTrigger: ({ children }) => React.createElement("div", null, children),
    SelectValue: ({ placeholder }) =>
      React.createElement("span", null, placeholder),
  };
});

jest.mock("@/components/ui/tabs", () => {
  const React = require("react");
  return {
    Tabs: ({ children, value, onValueChange }) =>
      React.createElement(
        "div",
        { "data-testid": "tabs", "data-value": value },
        children
      ),
    TabsContent: ({ children, value }) =>
      React.createElement("div", { "data-testid": `tab-${value}` }, children),
    TabsList: ({ children }) => React.createElement("div", null, children),
    TabsTrigger: ({ value, children }) =>
      React.createElement(
        "button",
        { "data-testid": `tab-trigger-${value}` },
        children
      ),
  };
});

jest.mock("@/components/ui/switch", () => {
  const React = require("react");
  return {
    Switch: ({ checked, onCheckedChange, ...props }) =>
      React.createElement("input", {
        type: "checkbox",
        checked,
        onChange: (e) => onCheckedChange(e.target.checked),
        ...props,
      }),
  };
});

jest.mock("@/components/ui/badge", () => {
  const React = require("react");
  return {
    Badge: ({ children, ...props }) =>
      React.createElement("span", props, children),
  };
});

jest.mock("@/components/packages/HotelListInput", () => {
  const React = require("react");
  return {
    HotelListInput: ({ value, onChange }) =>
      React.createElement("input", {
        "data-testid": "hotel-list-input",
        value: value?.join(", ") || "",
        onChange: (e) => onChange(e.target.value.split(", ")),
      }),
  };
});

// Mock react-hook-form
jest.mock("react-hook-form", () => {
  const React = require("react");
  return {
    useForm: jest.fn(),
    Controller: ({ render }) =>
      render({ field: { value: [], onChange: jest.fn() } }),
    useFieldArray: jest.fn(),
  };
});

// Mock lucide icons
jest.mock("lucide-react", () => {
  const React = require("react");
  return {
    Plus: () => React.createElement("span", null, "+"),
    Trash2: () => React.createElement("span", null, "🗑️"),
    Hotel: () => React.createElement("span", null, "🏨"),
    Map: () => React.createElement("span", null, "🗺️"),
    Settings: () => React.createElement("span", null, "⚙️"),
  };
});

// Mock utils
jest.mock("@/lib/utils", () => ({
  validatePriceRangesForTier: jest.fn(),
  getPriceRangeConflicts: jest.fn(),
}));

describe("PackageForm Component", () => {
  const mockOnOpenChange = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnSubmit = jest.fn();

  const mockUseForm = {
    register: jest.fn(),
    handleSubmit: jest.fn((fn) => (e) => {
      e.preventDefault();
      fn(mockFormData);
    }),
    reset: jest.fn(),
    control: {},
    watch: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(),
    setError: jest.fn(),
    clearErrors: jest.fn(),
    formState: {
      errors: {},
      isSubmitting: false,
    },
  };

  const mockUseFieldArray = {
    fields: [],
    append: jest.fn(),
    remove: jest.fn(),
  };

  let mockFormData;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormData = {
      namaPaket: "Test Package",
      tipePaket: "Sewa Mobil",
      deskripsi: "Test description",
      hargaDefault: 100000,
      tarifOvertime: 50000,
      isCustomizable: false,
      customizableItems: [],
      include: "Include items",
      exclude: "Exclude items",
    };

    // Setup mocks
    require("react-hook-form").useForm.mockReturnValue(mockUseForm);
    require("react-hook-form").useFieldArray.mockReturnValue(mockUseFieldArray);
    require("@/lib/utils").validatePriceRangesForTier.mockReturnValue({
      ok: true,
    });
    require("@/lib/utils").getPriceRangeConflicts.mockReturnValue({
      errors: [],
      overlaps: [],
    });
  });

  describe("Dialog State", () => {
    it("should not render when open is false", () => {
      render(
        <PackageForm
          open={false}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });

    it("should render when open is true", () => {
      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId("dialog")).toBeInTheDocument();
      expect(screen.getByText("Tambah Paket Jasa Baru")).toBeInTheDocument();
    });
  });

  describe("Form Fields", () => {
    it("should render basic form fields", () => {
      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText("Nama Paket")).toBeInTheDocument();
      expect(screen.getByText("Tipe Paket")).toBeInTheDocument();
      expect(screen.getByText("Deskripsi Paket")).toBeInTheDocument();
    });

    it("should show car rental fields for Sewa Mobil type", () => {
      mockUseForm.watch.mockReturnValue("Sewa Mobil");

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText("Harga Default (per PAX)")).toBeInTheDocument();
      expect(screen.getByText("Tarif Overtime (per Jam)")).toBeInTheDocument();
    });

    it("should show tour package fields for Paket Tour type", () => {
      mockUseForm.watch.mockReturnValue("Paket Tour");

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText("Durasi (Hari)")).toBeInTheDocument();
      expect(screen.getByTestId("tab-hotel")).toBeInTheDocument();
      expect(screen.getByTestId("tab-itinerary")).toBeInTheDocument();
    });
  });

  describe("Package Type Selection", () => {
    it("should handle package type change", () => {
      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "Paket Tour" } });

      expect(mockUseForm.watch).toHaveBeenCalledWith("tipePaket");
    });
  });

  describe("Customizable Items", () => {
    it("should show customizable items section when isCustomizable is true", () => {
      mockUseForm.watch.mockImplementation((field) => {
        if (field === "isCustomizable") return true;
        return "";
      });

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(
        screen.getByText("Item yang Dapat Disesuaikan")
      ).toBeInTheDocument();
    });

    it("should not show customizable items section when isCustomizable is false", () => {
      mockUseForm.watch.mockImplementation((field) => {
        if (field === "isCustomizable") return false;
        return "";
      });

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(
        screen.queryByText("Item yang Dapat Disesuaikan")
      ).not.toBeInTheDocument();
    });
  });

  describe("Hotel Tiers (Paket Tour)", () => {
    beforeEach(() => {
      mockUseForm.watch.mockReturnValue("Paket Tour");
      mockUseFieldArray.fields = [
        {
          id: "hotel-1",
          tingkat: "Bintang 3",
          tarifPerPax: 500000,
          daftarHotel: [],
        },
      ];
    });

    it("should render hotel tier fields", () => {
      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId("tab-hotel")).toBeInTheDocument();
      expect(screen.getByTestId("hotel-list-input")).toBeInTheDocument();
    });

    it("should allow adding hotel tier", () => {
      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      const addButton = screen.getByText("Tambah Tingkat Hotel");
      fireEvent.click(addButton);

      expect(mockUseFieldArray.append).toHaveBeenCalled();
    });

    it("should allow removing hotel tier", () => {
      mockUseFieldArray.fields = [
        { id: "hotel-1", tingkat: "Bintang 3" },
        { id: "hotel-2", tingkat: "Bintang 4" },
      ];

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      const removeButtons = screen.getAllByText("🗑️");
      fireEvent.click(removeButtons[0]);

      expect(mockUseFieldArray.remove).toHaveBeenCalledWith(0);
    });
  });

  describe("Itinerary (Paket Tour)", () => {
    beforeEach(() => {
      mockUseForm.watch.mockReturnValue("Paket Tour");
      mockUseFieldArray.fields = [
        { id: "itinerary-1", hari: 1, aktivitas: "Day 1 activity" },
      ];
    });

    it("should render itinerary fields", () => {
      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId("tab-itinerary")).toBeInTheDocument();
      expect(screen.getByText("Tambah Hari")).toBeInTheDocument();
    });

    it("should allow adding itinerary day", () => {
      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      fireEvent.click(screen.getByText("Tambah Hari"));

      expect(mockUseFieldArray.append).toHaveBeenCalledWith({
        hari: 2,
        aktivitas: "",
      });
    });

    it("should allow removing itinerary day", () => {
      mockUseFieldArray.fields = [
        { id: "itinerary-1", hari: 1 },
        { id: "itinerary-2", hari: 2 },
      ];

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      const removeButtons = screen.getAllByText("🗑️");
      fireEvent.click(removeButtons[1]); // Remove second itinerary

      expect(mockUseFieldArray.remove).toHaveBeenCalledWith(1);
    });
  });

  describe("Form Submission", () => {
    it("should call onSave when form is submitted successfully", async () => {
      mockUseForm.handleSubmit.mockImplementation((fn) => async (e) => {
        e.preventDefault();
        await fn(mockFormData);
      });

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      const submitButton = screen.getByText("Simpan");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it("should transform data correctly for Sewa Mobil type", async () => {
      mockFormData.tipePaket = "Sewa Mobil";

      mockUseForm.handleSubmit.mockImplementation((fn) => async (e) => {
        e.preventDefault();
        await fn(mockFormData);
      });

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      fireEvent.click(screen.getByText("Simpan"));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            namaPaket: "Test Package",
            tipePaket: "Sewa Mobil",
            hargaDefault: 100000,
            tarifOvertime: 50000,
          })
        );
      });
    });

    it("should transform data correctly for Paket Tour type", async () => {
      mockFormData.tipePaket = "Paket Tour";
      mockFormData.durasiHari = 3;
      mockFormData.durasiMalam = 2;
      mockFormData.tarifHotel = [{ tingkat: "Bintang 3", tarifPerPax: 500000 }];
      mockFormData.itinerary = [{ hari: 1, aktivitas: "Day 1" }];

      mockUseForm.handleSubmit.mockImplementation((fn) => async (e) => {
        e.preventDefault();
        await fn(mockFormData);
      });

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      fireEvent.click(screen.getByText("Simpan"));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            namaPaket: "Test Package",
            tipePaket: "Paket Tour",
            durasi: { hari: 3, malam: 2 },
            tarifHotel: [{ tingkat: "Bintang 3", tarifPerPax: 500000 }],
            itinerary: [{ hari: 1, aktivitas: "Day 1" }],
          })
        );
      });
    });

    it("should validate price ranges for Paket Tour", async () => {
      mockFormData.tipePaket = "Paket Tour";
      mockFormData.tarifHotel = [
        {
          tingkat: "Bintang 3",
          tarifPerPax: 1500000,
          daftarHotel: [],
          priceRanges: [
            { minPax: 1, maxPax: 5, price: 1500000 },
            { minPax: 3, maxPax: 8, price: 1400000 }, // Invalid - overlaps
          ],
        },
      ];
      require("@/lib/utils").validatePriceRangesForTier.mockReturnValue({
        ok: false,
        message: "Invalid price ranges",
      });

      mockUseForm.handleSubmit.mockImplementation((fn) => async (e) => {
        e.preventDefault();
        await fn(mockFormData);
      });

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      fireEvent.click(screen.getByText("Simpan"));

      await waitFor(() => {
        expect(mockUseForm.setError).toHaveBeenCalled();
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });
  });

  describe("Form Reset", () => {
    it("should reset form when package prop changes", () => {
      const { rerender } = render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      rerender(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
          package_={{ id: "pkg-1", name: "Updated Package" }}
        />
      );

      expect(mockUseForm.reset).toHaveBeenCalled();
    });

    it("should reset form when defaultValues prop changes", () => {
      const { rerender } = render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      rerender(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
          defaultValues={{ id: "pkg-1", name: "Default Package" }}
        />
      );

      expect(mockUseForm.reset).toHaveBeenCalled();
    });
  });

  describe("Dialog Actions", () => {
    it("should call onOpenChange with false when cancel button is clicked", () => {
      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      fireEvent.click(screen.getByText("Batal"));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("should disable submit button when submitting", () => {
      mockUseForm.formState.isSubmitting = true;

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      const submitButton = screen.getByText("Simpan");
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    it("should display form errors", () => {
      mockUseForm.formState.errors = {
        namaPaket: { message: "Nama paket wajib diisi" },
      };

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText("Nama paket wajib diisi")).toBeInTheDocument();
    });
  });

  describe("Data Transformation", () => {
    it("should transform package data from database format", () => {
      const dbPackage = {
        id: "pkg-1",
        name: "Test Package",
        type: "TOUR_PACKAGE",
        description: "Test description",
        durationDays: 3,
        durationNights: 2,
        isCustomizable: true,
        customizableItems: ["Item 1", "Item 2"],
        price: 100000,
        overtimeRate: 50000,
        includes: "Include items",
        excludes: "Exclude items",
        hotelTiers: [
          {
            starRating: 3,
            pricePerPax: 500000,
            hotels: [{ name: "Hotel A" }, { name: "Hotel B" }],
            priceRanges: [
              { minPax: 1, maxPax: 5, price: 500000 },
              { minPax: 6, maxPax: 10, price: 450000 },
            ],
          },
        ],
        itineraries: [
          { day: 1, title: "Day 1", description: "First day activities" },
          { day: 2, title: "Day 2", description: "Second day activities" },
        ],
      };

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
          package_={dbPackage}
        />
      );

      expect(mockUseForm.reset).toHaveBeenCalled();
    });
  });
});
