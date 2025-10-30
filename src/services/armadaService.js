const API_BASE_URL = "/api/armada";

export const getArmadas = async () => {
  const res = await fetch(API_BASE_URL);
  if (!res.ok) throw new Error("Failed to fetch armadas");
  return res.json();
};

export const createArmada = async (data) => {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create armada");
  return res.json();
};

export const updateArmada = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update armada");
  return res.json();
};

export const deleteArmada = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete armada");
};
