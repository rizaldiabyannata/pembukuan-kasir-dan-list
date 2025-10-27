"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Truck, Check, Wrench, MapPin } from "lucide-react";
import ArmadaHeader from "@/components/armada/ArmadaHeader";
import ArmadaFilters from "@/components/armada/ArmadaFilters";
import ArmadaCard from "@/components/armada/ArmadaCard";
import ArmadaDialog from "@/components/armada/ArmadaDialog";

export default function ArmadaPage() {
  // Small animated number component: briefly scales when value changes
  function CountNumber({ value }) {
    const [pop, setPop] = useState(false);
    const prev = React.useRef(value);

    useEffect(() => {
      if (prev.current !== value) {
        setPop(true);
        const t = setTimeout(() => setPop(false), 300);
        prev.current = value;
        return () => clearTimeout(t);
      }
    }, [value]);

    return (
      <p
        className={`text-3xl font-extrabold text-slate-900 transition-transform duration-300 ease-out ${
          pop ? "scale-110" : "scale-100"
        }`}
      >
        {value}
      </p>
    );
  }
  const [armadas, setArmadas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArmada, setEditingArmada] = useState(null);
  const [formData, setFormData] = useState({
    license_plate: "",
    brand: "",
    model: "",
    status: "READY",
    description: "",
  });
  const [isCustomModel, setIsCustomModel] = useState(false);

  async function fetchArmadas() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/armada");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setArmadas(data);
    } catch (err) {
      console.error("Failed to load armadas", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchArmadas();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((p) => ({ ...p, [id]: value }));
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const filteredArmadas = armadas.filter((a) => {
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

  const statusCounts = armadas.reduce(
    (acc, a) => {
      const s = a.status || "READY";
      acc[s] = (acc[s] || 0) + 1;
      acc.ALL = (acc.ALL || 0) + 1;
      return acc;
    },
    { ALL: 0 }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingArmada ? "PUT" : "POST";
      const url = editingArmada
        ? `/api/armada/${editingArmada.id}`
        : "/api/armada";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("save failed");
      setIsDialogOpen(false);
      setEditingArmada(null);
      await fetchArmadas();
    } catch (err) {
      console.error("Failed to save armada", err);
    }
  };

  const handleEdit = (armada) => {
    const known = ["Innova Reborn", "Hi-Ace"];
    setEditingArmada(armada);
    // model holds the 'Tipe' (Innova, Hi-Ace). If it's not in known list, treat as custom
    setIsCustomModel(Boolean(armada.model && !known.includes(armada.model)));
    setFormData({
      license_plate: armada.license_plate || "",
      brand: armada.brand || "",
      model: armada.model || "",
      status: armada.status || "READY",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus armada ini?")) return;
    try {
      const res = await fetch(`/api/armada/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      await fetchArmadas();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const handleMaintenance = async (armada) => {
    try {
      // Set status to MAINTENANCE (align with Prisma enum)
      const payload = { ...armada, status: "MAINTENANCE" };
      const res = await fetch(`/api/armada/${armada.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("maintenance update failed");
      await fetchArmadas();
    } catch (err) {
      console.error("Failed to update maintenance status", err);
    }
  };

  const openNewArmadaDialog = () => {
    setEditingArmada(null);
    setFormData({
      license_plate: "",
      brand: "",
      model: "",
      status: "READY",
      description: "",
    });
    setIsCustomModel(false);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <ArmadaHeader onAdd={openNewArmadaDialog} />

      {/* Info cards showing counts per status (uses shared Card component) */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(statusCounts).map(([k, v]) => {
            const key = k;
            const count = v;
            const props =
              key === "ALL"
                ? { label: "Total Armada", color: "slate", icon: Truck }
                : key === "READY"
                ? { label: "Ready", color: "emerald", icon: Check }
                : key === "MAINTENANCE"
                ? { label: "Maintenance", color: "amber", icon: Wrench }
                : key === "ON_TRIP"
                ? { label: "On Trip", color: "sky", icon: MapPin }
                : { label: key, color: "slate", icon: Truck };

            const color = props.color;
            const Icon = props.icon;
            const badgeClass =
              color === "emerald"
                ? "bg-gradient-to-tr from-emerald-500 to-emerald-600 text-white"
                : color === "sky"
                ? "bg-gradient-to-tr from-sky-500 to-sky-600 text-white"
                : color === "amber"
                ? "bg-gradient-to-tr from-amber-500 to-amber-600 text-white"
                : "bg-gradient-to-tr from-slate-300 to-slate-400 text-slate-900";

            const accentBar =
              color === "emerald"
                ? "bg-emerald-500"
                : color === "sky"
                ? "bg-sky-500"
                : color === "amber"
                ? "bg-amber-500"
                : "bg-slate-300";

            return (
              <Card
                key={key}
                className="relative overflow-hidden rounded-lg border p-0 bg-white hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                {/* left accent bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${accentBar}`}
                />

                <div className="p-4">
                  <CardHeader className="flex items-start gap-3 pb-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-slate-50">
                      <Icon className="h-5 w-5 text-current" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {props.label}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">Overview</p>
                    </div>
                  </CardHeader>

                  <CardContent className="flex items-center justify-between pt-2">
                    <div>
                      <CountNumber value={count} />
                      <p className="text-xs text-muted-foreground mt-1">
                        items
                      </p>
                    </div>

                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center ${badgeClass} font-semibold`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <ArmadaFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        statusCounts={statusCounts}
      />

      <div className="p-4">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border bg-white p-4"
              >
                <div className="h-36 bg-slate-100 rounded mb-3" />
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredArmadas.length === 0 ? (
          <div className="rounded-lg border-dashed border-2 border-slate-200 p-6 text-center">
            <p className="text-lg font-medium mb-2">Belum ada armada</p>
            <p className="text-sm text-muted-foreground mb-4">
              Tambahkan armada pertama Anda untuk mulai mencatat kendaraan.
            </p>
            <Button onClick={openNewArmadaDialog}>Tambah Armada</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArmadas.map((a) => (
              <ArmadaCard
                key={a.id}
                armada={a}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onMaintenance={handleMaintenance}
              />
            ))}
          </div>
        )}
      </div>

      <ArmadaDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingArmada={editingArmada}
        formData={formData}
        handleInputChange={handleInputChange}
        isCustomModel={isCustomModel}
        setIsCustomModel={setIsCustomModel}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
