// Patient Journey Engine — frontend client. Same conventions as
// pharmacyService.js / theatreService.js.

const API_URL = "https://hospitalos-api.johnpadeola.workers.dev";

function authHeaders() {
  const token = localStorage.getItem("hospitalos_session_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Returns [] rather than throwing on failure — this feeds the Alerts
// aggregator, and one failing source must never blank out every other
// alert on the page (same principle the aggregator already follows: each
// source is independent).
export async function listIncompleteJourneys() {
  try {
    const res = await fetch(`${API_URL}/journeys/incomplete`, {
      headers: { "Content-Type": "application/json", ...authHeaders() },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.journeys || [];
  } catch {
    return [];
  }
}
