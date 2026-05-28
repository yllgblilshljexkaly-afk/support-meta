const UPSTASH_REDIS_REST_URL = "https://apparent-hen-6640.upstash.io";
const UPSTASH_REDIS_REST_TOKEN = "ARnwAAImcDE2Y2NjYjFiMTZlZGQ0YjhjYWRjOTVmYjUwODcxM2YzOXAxNjY0MA";

async function redisCmd(command, ...args) {
  const res = await fetch(
    `${UPSTASH_REDIS_REST_URL}/${command}/${args.map(encodeURIComponent).join("/")}`,
    { headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` } }
  );
  const data = await res.json();
  return data.result;
}

function dayKeyVN() {
  const now = new Date();
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return vnTime.toISOString().slice(0, 10); // yyyy-mm-dd
}

function displayVN(day) {
  const [y, m, d] = String(day).split("-");
  if (!y || !m || !d) return day;
  return `${d}/${m}/${y}`;
}

async function incView() {
  const day = dayKeyVN();
  await redisCmd("INCR", `views:${day}`);
  return day;
}

async function incConfirmOncePerIp(ip) {
  const day = dayKeyVN();
  const safeIp = ip || "unknown";

  const added = await redisCmd("SADD", `confirm_ips:${day}`, safeIp);

  if (Number(added) === 1) {
    await redisCmd("INCR", `confirm:${day}`);
  }

  return day;
}

async function getCounts() {
  const day = dayKeyVN();
  const views = (await redisCmd("GET", `views:${day}`)) || 0;
  const confirm = (await redisCmd("GET", `confirm:${day}`)) || 0;
  return { day, views: Number(views), confirm: Number(confirm) };
}

function formatCounts(day, views, confirm) {
  const dayShow = displayVN(day);
  return `📊 <b>Day (${dayShow})</b>\n👀 View: <b>${views}</b>\n✅ Send: <b>${confirm}</b>`;
}

module.exports = { incView, incConfirmOncePerIp, getCounts, formatCounts };
