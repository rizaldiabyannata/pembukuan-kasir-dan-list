const API_BASE_URL = "/api/sopir";

export const getDrivers = async () => {
  const res = await fetch(API_BASE_URL);
  if (!res.ok) throw new Error("Failed to fetch drivers");
  return res.json();
};

export const createDriver = async (data) => {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create driver");
  return res.json();
};

export const updateDriver = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update driver");
  return res.json();
};

export const deleteDriver = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete driver");
};
