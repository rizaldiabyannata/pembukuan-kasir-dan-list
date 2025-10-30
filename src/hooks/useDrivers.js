import { useState, useEffect, useMemo, useCallback } from "react";
import * as driverService from "@/services/driverService";

export const useDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDrivers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await driverService.getDrivers();
      setDrivers(data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const q = searchTerm.trim().toLowerCase();
      return (
        !q ||
        (d.driver_name && d.driver_name.toLowerCase().includes(q)) ||
        (d.phone_number && d.phone_number.toLowerCase().includes(q))
      );
    });
  }, [drivers, searchTerm]);

  const handleSetStatus = async (driver, newStatus) => {
    try {
      const payload = { ...driver, status: newStatus };
      await driverService.updateDriver(driver.id, payload);
      await fetchDrivers();
    } catch (err) {
      console.error("Failed to update driver status", err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this driver?")) {
      try {
        await driverService.deleteDriver(id);
        await fetchDrivers();
      } catch (err) {
        console.error("Failed to delete driver", err);
      }
    }
  };

  return {
    drivers: filteredDrivers,
    isLoading,
    searchTerm,
    handleSearchChange,
    handleSetStatus,
    handleDelete,
    refetchDrivers: fetchDrivers,
  };
};
