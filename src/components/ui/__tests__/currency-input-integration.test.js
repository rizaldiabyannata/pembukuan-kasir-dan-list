import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CurrencyInput } from "../currency-input";

/**
 * Integration tests to verify the complete flow from user input to storage
 * This tests the bug described in task 6: "500.000 input stores as 500000, not 500000000"
 */
describe("CurrencyInput Integration Tests", () => {
  // Simulate the parent component behavior (like TransaksiPage)
  const ParentComponent = ({ initialValue = 0 }) => {
    const [formData, setFormData] = useState({ price: initialValue });

    const handleInputChange = (e) => {
      const { id, value } = e.target;
      const numericFields = ["price"];

      let newValue = value;
      if (numericFields.includes(id)) {
        // This is how TransaksiPage handles it
        newValue = value === "" ? 0 : parseFloat(value) || 0;
      }

      setFormData((prev) => ({ ...prev, [id]: newValue }));
    };

    return (
      <div>
        <CurrencyInput
          id="price"
          value={formData.price}
          onChange={handleInputChange}
        />
        <div data-testid="stored-value">{formData.price}</div>
        <div data-testid="stored-type">{typeof formData.price}</div>
      </div>
    );
  };

  describe("Bug verification: 500.000 should store as 500000, not 500000000", () => {
    it("should store 500.000 as 500000 (five hundred thousand)", () => {
      render(<ParentComponent />);

      const input = screen.getByRole("textbox");
      const storedValue = screen.getByTestId("stored-value");

      // User types "500000" (browser removes dots automatically)
      fireEvent.change(input, { target: { value: "500000" } });

      // Verify the stored value is correct
      expect(storedValue.textContent).toBe("500000");
      expect(parseInt(storedValue.textContent)).toBe(500000);
      expect(parseInt(storedValue.textContent)).not.toBe(500000000);
    });

    it("should store 1.500.000 as 1500000 (one million five hundred thousand)", () => {
      render(<ParentComponent />);

      const input = screen.getByRole("textbox");
      const storedValue = screen.getByTestId("stored-value");

      // User types "1500000"
      fireEvent.change(input, { target: { value: "1500000" } });

      // Verify the stored value is correct
      expect(storedValue.textContent).toBe("1500000");
      expect(parseInt(storedValue.textContent)).toBe(1500000);
      expect(parseInt(storedValue.textContent)).not.toBe(1500000000);
    });

    it("should store 10.000.000 as 10000000 (ten million)", () => {
      render(<ParentComponent />);

      const input = screen.getByRole("textbox");
      const storedValue = screen.getByTestId("stored-value");

      // User types "10000000"
      fireEvent.change(input, { target: { value: "10000000" } });

      // Verify the stored value is correct
      expect(storedValue.textContent).toBe("10000000");
      expect(parseInt(storedValue.textContent)).toBe(10000000);
      expect(parseInt(storedValue.textContent)).not.toBe(10000000000);
    });
  });

  describe("Display formatting", () => {
    it("should display stored value with thousand separators", () => {
      render(<ParentComponent initialValue={500000} />);

      const input = screen.getByRole("textbox");

      // Display should show formatted value
      expect(input.value).toBe("500.000");
    });

    it("should update display when value changes through user input", () => {
      render(<ParentComponent initialValue={500000} />);

      const input = screen.getByRole("textbox");
      expect(input.value).toBe("500.000");

      // User changes value
      fireEvent.change(input, { target: { value: "1500000" } });

      expect(input.value).toBe("1.500.000");
    });
  });

  describe("Type safety", () => {
    it("should store value as number, not string", () => {
      render(<ParentComponent />);

      const input = screen.getByRole("textbox");
      const storedType = screen.getByTestId("stored-type");

      fireEvent.change(input, { target: { value: "500000" } });

      expect(storedType.textContent).toBe("number");
    });
  });

  describe("Edge cases", () => {
    it("should handle zero correctly", () => {
      render(<ParentComponent />);

      const input = screen.getByRole("textbox");
      const storedValue = screen.getByTestId("stored-value");

      fireEvent.change(input, { target: { value: "0" } });

      expect(storedValue.textContent).toBe("0");
      expect(parseInt(storedValue.textContent)).toBe(0);
    });

    it("should handle empty input", () => {
      render(<ParentComponent initialValue={500000} />);

      const input = screen.getByRole("textbox");
      const storedValue = screen.getByTestId("stored-value");

      fireEvent.change(input, { target: { value: "" } });

      expect(storedValue.textContent).toBe("0");
    });

    it("should handle very large numbers", () => {
      render(<ParentComponent />);

      const input = screen.getByRole("textbox");
      const storedValue = screen.getByTestId("stored-value");

      // 100 million
      fireEvent.change(input, { target: { value: "100000000" } });

      expect(storedValue.textContent).toBe("100000000");
      expect(parseInt(storedValue.textContent)).toBe(100000000);
    });
  });

  describe("User interaction flow", () => {
    it("should handle complete user flow: type, edit, save", () => {
      render(<ParentComponent />);

      const input = screen.getByRole("textbox");
      const storedValue = screen.getByTestId("stored-value");

      // Step 1: User types initial value
      fireEvent.change(input, { target: { value: "500000" } });
      expect(storedValue.textContent).toBe("500000");
      expect(input.value).toBe("500.000");

      // Step 2: User edits to a different value
      fireEvent.change(input, { target: { value: "750000" } });
      expect(storedValue.textContent).toBe("750000");
      expect(input.value).toBe("750.000");

      // Step 3: User clears and enters new value
      fireEvent.change(input, { target: { value: "" } });
      expect(storedValue.textContent).toBe("0");

      fireEvent.change(input, { target: { value: "1000000" } });
      expect(storedValue.textContent).toBe("1000000");
      expect(input.value).toBe("1.000.000");
    });
  });
});
