const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitMap.get(ip) || []).filter((t) => t > windowStart);
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (isRateLimited(ip)) {
    return jsonResponse({ error: "Too many requests. Please try again later." }, 429);
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return jsonResponse({ error: "Supabase is not configured yet." }, 500);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 160);
  const company = cleanText(body.company, 160);
  const message = cleanText(body.message, 2000);

  if (!name || !email || !message) {
    return jsonResponse({ error: "Name, email, and message are required." }, 400);
  }

  if (!isValidEmail(email)) {
    return jsonResponse({ error: "Please enter a valid email address." }, 400);
  }

  const supabaseUrl = env.SUPABASE_URL.replace(/\/$/, "");
  const supabaseKey = env.SUPABASE_ANON_KEY;
  const payload = {
    name,
    email,
    company: company || null,
    message,
  };

  let supabaseResponse;
  try {
    supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/contact_messages`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return jsonResponse({ error: "Message could not be saved." }, 500);
  }

  if (!supabaseResponse.ok) {
    return jsonResponse({ error: "Message could not be saved." }, 500);
  }

  return jsonResponse({ message: "Message sent." });
}
