
export async function uploadCSV(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch("/api/products/upload-csv", {
    method: "POST",
    body: formData,
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Failed to upload CSV");
  }

  return response.json();
}
