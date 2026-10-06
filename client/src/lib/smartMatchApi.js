// One place for the Smart Match endpoints. Follows the pattern the rest of
// the app uses for data fetching: localStorage token as a Bearer header,
// relative URL through the Vite proxy.

const token = () => localStorage.getItem("token");

async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
      ...(options.headers || {}),
    },
  });

  // 401 means the token is gone or expired — the caller redirects to login.
  if (res.status === 401) {
    const err = new Error("Session expired");
    err.status = 401;
    throw err;
  }

  let body;
  try {
    body = await res.json();
  } catch {
    // Express's HTML error page, or an empty body. Either way it isn't JSON.
    const err = new Error(`Unexpected response from ${path}`);
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(body?.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return body;
}

// GET /api/{role}/feed
//
// `exclude` carries the ids the client already holds. The backend demotes
// passed cards rather than removing them, so without this a card swiped a
// moment ago can come straight back at the tail of the next batch.
//
// Returns { cards, remaining, exhausted, poolDrained, modelVersion }.
export function getFeed(role, { limit = 15, exclude = [] } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (exclude.length) params.set("exclude", exclude.join(","));

  return request(`/api/${role}/feed?${params}`);
}

// POST /api/swipe
// Returns { ok, isMatch, connection, duplicate? }.
export function swipe(targetId, action) {
  return request("/api/swipe", {
    method: "POST",
    body: JSON.stringify({ targetId, action }),
  });
}

// GET /api/connections — mutual matches, newest first.
export function getConnections() {
  return request("/api/connections");
}