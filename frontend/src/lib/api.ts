const BASE_URL = "http://localhost:3000";

export const api = {
  login: (phone: string, password: string) =>
    fetch(`${BASE_URL}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, password }) }),
  register: (phone: string, password: string, name: string) =>
    fetch(`${BASE_URL}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, password, name }) }),
  triggerSOS: (lat: number, lng: number) =>
    fetch(`${BASE_URL}/api/sos/trigger`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lat, lng }) }),
  resolveSOS: () =>
    fetch(`${BASE_URL}/api/sos/resolve`, { method: "POST" }),
  getTrustedTravellers: () =>
    fetch(`${BASE_URL}/api/trusted-traveller`),
  addTrustedTraveller: (data: { name: string; type: string; vehicleNumber: string; area: string }) =>
    fetch(`${BASE_URL}/api/trusted-traveller`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  recommendTraveller: (id: string) =>
    fetch(`${BASE_URL}/api/trusted-traveller/${id}/recommend`, { method: "POST" }),
  getHeatmap: () =>
    fetch(`${BASE_URL}/api/heatmap`),
  submitReport: (data: { type: string; lat: number; lng: number; area: string; description: string }) =>
    fetch(`${BASE_URL}/api/report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  generateComplaint: (data: { type: string; location: string; time: string }) =>
    fetch(`${BASE_URL}/api/complaint/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  uploadEvidence: (formData: FormData) =>
    fetch(`${BASE_URL}/api/evidence/upload`, { method: "POST", body: formData }),
};
