export async function sendBookingConfirmation(booking) {
  const passenger = booking.passenger;
  const segments = booking.segments || [];
  const seg1 = segments[0];
  const lastSeg = segments[segments.length - 1];

  const passengerName = passenger
    ? `${passenger.title} ${passenger.firstName} ${passenger.lastName}`
    : "Passenger";

  const passengerEmail = passenger?.email;
  if (!passengerEmail) return { error: "No passenger email provided" };

  const segmentsHTML = segments.map((seg) => `
    <div style="background:#f8faff;border:1px solid #e2e8f4;border-radius:12px;margin-bottom:16px;">
      <div style="padding:12px 16px;background:linear-gradient(135deg,#0047AB,#003580);border-radius:12px 12px 0 0;">
        <span style="color:white;font-size:13px;font-weight:700;">FLIGHT ${seg.flightNumber} · ${seg.aircraft}</span>
      </div>
      <div style="padding:16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align:left;width:35%;">
              <div style="font-size:28px;font-weight:800;color:#0f172a;">${seg.fromCode}</div>
              <div style="font-size:12px;color:#64748b;">${seg.fromCity}</div>
              <div style="font-size:18px;font-weight:700;color:#0f172a;margin-top:6px;">${seg.departsTime}</div>
              <div style="font-size:11px;color:#94a3b8;">${seg.departsDate}</div>
            </td>
            <td style="text-align:center;width:30%;">
              <div style="font-size:11px;color:#94a3b8;">${seg.duration}</div>
              <div style="font-size:20px;">✈</div>
            </td>
            <td style="text-align:right;width:35%;">
              <div style="font-size:28px;font-weight:800;color:#0f172a;">${seg.toCode}</div>
              <div style="font-size:12px;color:#64748b;">${seg.toCity}</div>
              <div style="font-size:18px;font-weight:700;color:#0f172a;margin-top:6px;">${seg.arrivesTime}</div>
              <div style="font-size:11px;color:#94a3b8;">${seg.arrivesDate}</div>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `).join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#CC0000;padding:20px 28px;border-radius:16px 16px 0 0;">
            <div style="color:white;font-size:20px;font-weight:800;">American Airlines</div>
            <div style="color:rgba(255,255,255,0.7);font-size:10px;letter-spacing:0.15em;margin-top:2px;">BOOKING CONFIRMATION</div>
          </td>
        </tr>
        <tr>
          <td style="background:white;padding:28px;">
            <p style="font-size:15px;color:#0f172a;">Dear <strong>${passengerName},</strong></p>
            <p style="font-size:13px;color:#64748b;">Thank you for choosing American Airlines. Your booking is confirmed.</p>
            <div style="background:linear-gradient(135deg,#0047AB,#003580);border-radius:14px;padding:20px 24px;margin-bottom:24px;">
              <div style="color:rgba(255,255,255,0.6);font-size:10px;letter-spacing:0.15em;">BOOKING REFERENCE</div>
              <div style="color:white;font-size:36px;font-weight:800;letter-spacing:0.2em;">${booking.pnr}</div>
              <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:6px;">Ticket: ${booking.ticketNumber} · Booked: ${booking.bookingDate}</div>
            </div>
            <div style="font-size:11px;color:#94a3b8;letter-spacing:0.15em;margin-bottom:12px;">FLIGHT ITINERARY</div>
            ${segmentsHTML}
            <div style="text-align:center;margin:24px 0;">
              <a href="${process.env.FRONTEND_URL || "https://aa-tracker-frontend.vercel.app"}?pnr=${booking.pnr}"
                style="display:inline-block;background:linear-gradient(135deg,#CC0000,#a80000);color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;">
                View Full Itinerary →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#0f172a;padding:20px 28px;border-radius:0 0 16px 16px;">
            <div style="color:rgba(255,255,255,0.4);font-size:11px;">americanairlines.com | AAdvantage Service: 1-800-882-8880</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "American Airlines", email: "noreply@americanairlines-tracker.com" },
        to: [{ email: passengerEmail, name: passengerName }],
        subject: `Booking Confirmed — PNR: ${booking.pnr} | ${seg1?.fromCode || ""} → ${lastSeg?.toCode || ""}`,
        htmlContent: html,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));
    console.log("Email sent successfully:", data);
    return { success: true };
  } catch (err) {
    console.error("Email error:", err);
    return { error: err.message };
  }
}