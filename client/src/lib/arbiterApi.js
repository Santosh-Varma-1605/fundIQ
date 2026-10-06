const BASE_URL = "http://localhost:5000/api/arbiter";

export async function submitArbiterAnalysis(input) {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function getArbiterStatus(runId) {
  const res = await fetch(`${BASE_URL}/${runId}/status`, { credentials: "include" });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function getArbiterTranscript(runId) {
  const res = await fetch(`${BASE_URL}/${runId}/transcript`, { credentials: "include" });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function askArbiterFollowUp(runId, question) {
  const res = await fetch(`${BASE_URL}/${runId}/ask`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function getArbiterFollowUps(runId) {
  const res = await fetch(`${BASE_URL}/${runId}/followups`, { credentials: "include" });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export function pollArbiterStatus(runId, { intervalMs = 3000, maxAttempts = 40, onTick } = {}) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tick = async () => {
      attempts += 1;
      try {
        const data = await getArbiterStatus(runId);
        onTick?.(data, attempts);

        if (data.status === "complete") return resolve(data);
        if (data.status === "failed") return reject(new Error(data.errorMessage || "Arbiter run failed."));
        if (attempts >= maxAttempts) return reject(new Error("Timed out waiting for Arbiter to finish."));

        setTimeout(tick, intervalMs);
      } catch (err) {
        reject(err);
      }
    };

    tick();
  });
}