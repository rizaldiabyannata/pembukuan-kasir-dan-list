import { useState, useEffect, useCallback } from "react";
import * as packageService from "@/services/packageService";

export const usePackages = () => {
  const [packages, setPackages] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPackages = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await packageService.getPackages();
      setPackages(data);
    } catch (err) {
      console.error("Error fetching packages:", err);
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  return {
    packages,
    isLoading,
    refetchPackages: fetchPackages,
  };
};
