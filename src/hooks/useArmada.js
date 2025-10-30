import { useState, useEffect, useMemo } from "react";
import * as armadaService from "@/services/armadaService";

export const useArmada = () => {
  const [armadas, setArmadas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const fetchArmadas = async () => {
    try {
      setIsLoading(true);
      const data = await armadaService.getArmadas();
      setArmadas(data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArmadas();
  }, []);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const filteredArmadas = useMemo(() => {
    return armadas.filter((a) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesQ =
        !q ||
        (a.license_plate && a.license_plate.toLowerCase().includes(q)) ||
        (a.brand && a.brand.toLowerCase().includes(q)) ||
        (a.model && a.model.toLowerCase().includes(q));
      const matchesStatus =
        filterStatus === "ALL" || (a.status || "READY") === filterStatus;
      return matchesQ && matchesStatus;
    });
  }, [armadas, searchTerm, filterStatus]);

  const statusCounts = useMemo(() => {
    return armadas.reduce(
      (acc, a) => {
        const s = a.status || "READY";
        acc[s] = (acc[s] || 0) + 1;
        acc.ALL = (acc.ALL || 0) + 1;
        return acc;
      },
      { ALL: 0 }
    );
  }, [armadas]);

  const handleDelete = async (id) => {
    if (!confirm("Hapus armada ini?")) return;
    try {
      await armadaService.deleteArmada(id);
      await fetchArmadas();
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleMaintenance = async (armada) => {
    try {
      const payload = { ...armada, status: "MAINTENANCE" };
      await armadaService.updateArmada(armada.id, payload);
      await fetchArmadas();
    } catch (err) {
      console.error(err.message);
    }
  };

  return {
    armadas: filteredArmadas,
    isLoading,
    searchTerm,
    filterStatus,
    statusCounts,
    handleSearchChange,
    setFilterStatus,
    handleDelete,
    handleMaintenance,
    refetchArmadas: fetchArmadas,
  };
};
