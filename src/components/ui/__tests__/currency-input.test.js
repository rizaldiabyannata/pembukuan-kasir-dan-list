import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CurrencyInput } from "../currency-input";

describe("CurrencyInput", () => {
  describe("Currency parsing and formatting", () => {
    it("should parse 500.000 as 500000", () => {
      const handleChange = jest.fn();
      render(
        <CurrencyInput id="test-input" value={0} onChange={handleChange} />
      );

      const input = screen.getByRole("textbox");

      // Simulate user typing "500000" (after dots are removed by browser)
      fireEvent.change(input, { target: { value: "500000" } });

      // Check that onChange was called with the correct numeric value
      expect(handleChange).toHaveBeenCalled();
      const event = handleChange.mock.calls[0][0];
      expect(event.target.value).toBe("500000");
      expect(event.target.id).toBe("test-input");
    });

    it("should parse 1.500.000 as 1500000", () => {
      const handleChange = jest.fn();
      render(
        <CurrencyInput id="test-input" value={0} onChange={handleChange} />
      );

      const input = screen.getByRole("textbox");

      // Simulate user typing "1500000"
      fireEvent.change(input, { target: { value: "1500000" } });

      expect(handleChange).toHaveBeenCalled();
      const event = handleChange.mock.calls[0][0];
      expect(event.target.value).toBe("1500000");
    });

    it("should format numeric value with thousand separators", () => {
      const { rerender } = render(
        <CurrencyInput id="test-input" value={500000} onChange={jest.fn()} />
      );

      const input = screen.getByRole("textbox");
      expect(input.value).toBe("500.000");

      // Test with larger number
      rerender(
        <CurrencyInput id="test-input" value={1500000} onChange={jest.fn()} />
      );
      expect(input.value).toBe("1.500.000");
    });

    it("should handle empty input", () => {
      const handleChange = jest.fn();
      render(
        <CurrencyInput id="test-input" value={0} onChange={handleChange} />
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "" } });

      expect(handleChange).toHaveBeenCalled();
      const event = handleChange.mock.calls[0][0];
      expect(event.target.value).toBe("");
    });

    it("should remove non-digit characters", () => {
      const handleChange = jest.fn();
      render(
        <CurrencyInput id="test-input" value={0} onChange={handleChange} />
      );

      const input = screen.getByRole("textbox");

      // User types with dots (Indonesian format)
      fireEvent.change(input, { target: { value: "500.000" } });

      expect(handleChange).toHaveBeenCalled();
      const event = handleChange.mock.calls[0][0];
      // Should strip dots and pass only digits
      expect(event.target.value).toBe("500000");
    });
  });

  describe("Round-trip consistency", () => {
    it("should maintain value 100000 through format and parse cycle", () => {
      const handleChange = jest.fn();
      render(
        <CurrencyInput id="test-input" value={0} onChange={handleChange} />
      );

      const inputElement = screen.getByRole("textbox");
      fireEvent.change(inputElement, { target: { value: "100000" } });

      expect(handleChange).toHaveBeenCalled();
      const event = handleChange.mock.calls[0][0];
      expect(parseInt(event.target.value)).toBe(100000);
    });

    it("should maintain value 500000 through format and parse cycle", () => {
      const handleChange = jest.fn();
      render(
        <CurrencyInput
          id="test-input2"
          value={100000}
          onChange={handleChange}
        />
      );

      const inputElement = screen.getByRole("textbox");
      fireEvent.change(inputElement, { target: { value: "500000" } });

      expect(handleChange).toHaveBeenCalled();
      const event = handleChange.mock.calls[0][0];
      expect(parseInt(event.target.value)).toBe(500000);
    });

    it("should maintain value 1500000 through format and parse cycle", () => {
      const handleChange = jest.fn();
      render(
        <CurrencyInput
          id="test-input3"
          value={500000}
          onChange={handleChange}
        />
      );

      const inputElement = screen.getByRole("textbox");
      fireEvent.change(inputElement, { target: { value: "1500000" } });

      expect(handleChange).toHaveBeenCalled();
      const event = handleChange.mock.calls[0][0];
      expect(parseInt(event.target.value)).toBe(1500000);
    });
  });

  describe("Parent component integration", () => {
    it("should work correctly with parent parseFloat conversion", () => {
      const handleChange = jest.fn((e) => {
        // Simulate parent component behavior
        const numericValue =
          e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
        return numericValue;
      });

      render(
        <CurrencyInput id="test-input" value={0} onChange={handleChange} />
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "500000" } });

      const result = handleChange.mock.results[0].value;
      expect(result).toBe(500000);
      expect(result).not.toBe(500000000); // Should NOT be multiplied by 1000
    });
  });
});
