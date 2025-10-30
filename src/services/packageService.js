const API_BASE_URL = "/api/packages";

export const getPackages = async () => {
  const res = await fetch(API_BASE_URL);
  if (!res.ok) {
    console.error("Failed to fetch packages:", res.status, await res.text());
    return [];
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const createPackage = async (data) => {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create package");
  return res.json();
};

export const updatePackage = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update package");
  return res.json();
};

export const deletePackage = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete package");
};
