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
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "American Airlines <noreply@quickreg.ng>",
        to: [passengerEmail],
        subject: `Booking Confirmed — PNR: ${booking.pnr} | ${seg1?.fromCode || ""} → ${lastSeg?.toCode || ""}`,
        html: html,
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

async function sendEmail(to, name, subject, html) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "American Airlines <noreply@quickreg.ng>",
        to: [to],
        subject,
        html,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));
    return { success: true };
  } catch (err) {
    console.error("Email error:", err);
    return { error: err.message };
  }
}

function emailWrapper(headerColor, headerLabel, passengerName, pnr, bodyHTML, frontendUrl) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:${headerColor};padding:20px 28px;border-radius:16px 16px 0 0;">
            <div style="color:white;font-size:20px;font-weight:800;">American Airlines</div>
            <div style="color:rgba(255,255,255,0.7);font-size:10px;letter-spacing:0.15em;margin-top:2px;">${headerLabel}</div>
          </td>
        </tr>
        <tr>
          <td style="background:white;padding:28px;">
            <p style="font-size:15px;color:#0f172a;">Dear <strong>${passengerName},</strong></p>
            ${bodyHTML}
            <div style="text-align:center;margin:24px 0;">
              <a href="${frontendUrl}?pnr=${pnr}" style="display:inline-block;background:linear-gradient(135deg,#CC0000,#a80000);color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;">
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
</html>`;
}

export async function sendDelayNotification(booking, segment) {
  const passenger = booking.passenger;
  const passengerName = `${passenger.title} ${passenger.firstName} ${passenger.lastName}`;
  const frontendUrl = process.env.FRONTEND_URL || "https://aa-tracker-frontend.vercel.app";

  const body = `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
      <div style="font-size:18px;font-weight:800;color:#ea580c;margin-bottom:8px;">⚠ Flight Delay Notice</div>
      <div style="font-size:13px;color:#64748b;">Your flight has been delayed. Please see updated times below.</div>
    </div>
    <div style="background:#f8faff;border:1px solid #e2e8f4;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
      <div style="font-size:13px;font-weight:700;color:#0047AB;margin-bottom:12px;">FLIGHT ${segment.flightNumber} · ${segment.fromCode} → ${segment.toCode}</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:50%;padding-bottom:8px;">
            <div style="font-size:11px;color:#94a3b8;">NEW DEPARTURE</div>
            <div style="font-size:18px;font-weight:700;color:#0f172a;">${segment.departsTime}</div>
            <div style="font-size:11px;color:#94a3b8;">${segment.departsDate}</div>
          </td>
          <td style="width:50%;padding-bottom:8px;text-align:right;">
            <div style="font-size:11px;color:#94a3b8;">NEW ARRIVAL</div>
            <div style="font-size:18px;font-weight:700;color:#0f172a;">${segment.arrivesTime}</div>
            <div style="font-size:11px;color:#94a3b8;">${segment.arrivesDate}</div>
          </td>
        </tr>
      </table>
    </div>
    <p style="font-size:13px;color:#64748b;">We apologize for the inconvenience. Please check the latest updates on your booking page.</p>
  `;

  const html = emailWrapper("#ea580c", "FLIGHT DELAY NOTIFICATION", passengerName, booking.pnr, body, frontendUrl);
  return sendEmail(passenger.email, passengerName, `Flight Delay — ${segment.flightNumber} | ${segment.fromCode} → ${segment.toCode}`, html);
}

export async function sendOnTimeNotification(booking, segment) {
  const passenger = booking.passenger;
  const passengerName = `${passenger.title} ${passenger.firstName} ${passenger.lastName}`;
  const frontendUrl = process.env.FRONTEND_URL || "https://aa-tracker-frontend.vercel.app";

  const body = `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
      <div style="font-size:18px;font-weight:800;color:#16a34a;margin-bottom:8px;">✅ Flight Back On Time</div>
      <div style="font-size:13px;color:#64748b;">Good news! Your flight is back on schedule.</div>
    </div>
    <div style="background:#f8faff;border:1px solid #e2e8f4;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
      <div style="font-size:13px;font-weight:700;color:#0047AB;margin-bottom:12px;">FLIGHT ${segment.flightNumber} · ${segment.fromCode} → ${segment.toCode}</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:50%;">
            <div style="font-size:11px;color:#94a3b8;">DEPARTURE</div>
            <div style="font-size:18px;font-weight:700;color:#0f172a;">${segment.departsTime}</div>
            <div style="font-size:11px;color:#94a3b8;">${segment.departsDate}</div>
          </td>
          <td style="width:50%;text-align:right;">
            <div style="font-size:11px;color:#94a3b8;">ARRIVAL</div>
            <div style="font-size:18px;font-weight:700;color:#0f172a;">${segment.arrivesTime}</div>
            <div style="font-size:11px;color:#94a3b8;">${segment.arrivesDate}</div>
          </td>
        </tr>
      </table>
    </div>
    <p style="font-size:13px;color:#64748b;">Your flight is operating as scheduled. Have a great trip!</p>
  `;

  const html = emailWrapper("#16a34a", "FLIGHT STATUS UPDATE", passengerName, booking.pnr, body, frontendUrl);
  return sendEmail(passenger.email, passengerName, `Flight On Time — ${segment.flightNumber} | ${segment.fromCode} → ${segment.toCode}`, html);
}

export async function sendLandedNotification(booking, segment) {
  const passenger = booking.passenger;
  const passengerName = `${passenger.title} ${passenger.firstName} ${passenger.lastName}`;
  const frontendUrl = process.env.FRONTEND_URL || "https://aa-tracker-frontend.vercel.app";

  const body = `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
      <div style="font-size:18px;font-weight:800;color:#0047AB;margin-bottom:8px;">🛬 Flight Has Landed</div>
      <div style="font-size:13px;color:#64748b;">Your flight has arrived at its destination.</div>
    </div>
    <div style="background:#f8faff;border:1px solid #e2e8f4;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
      <div style="font-size:13px;font-weight:700;color:#0047AB;margin-bottom:12px;">FLIGHT ${segment.flightNumber} · ${segment.fromCode} → ${segment.toCode}</div>
      <div style="font-size:24px;font-weight:800;color:#0f172a;">${segment.toCode}</div>
      <div style="font-size:13px;color:#64748b;">${segment.toCity}</div>
      <div style="font-size:15px;font-weight:700;color:#0f172a;margin-top:8px;">Arrived: ${segment.arrivesTime} · ${segment.arrivesDate}</div>
    </div>
    <p style="font-size:13px;color:#64748b;">Welcome to ${segment.toCity}! We hope you had a pleasant flight with American Airlines.</p>
  `;

  const html = emailWrapper("#0047AB", "FLIGHT ARRIVED", passengerName, booking.pnr, body, frontendUrl);
  return sendEmail(passenger.email, passengerName, `Flight Landed — ${segment.flightNumber} arrived at ${segment.toCode}`, html);
}

export async function sendBookingUpdateNotification(booking) {
  const passenger = booking.passenger;
  const passengerName = `${passenger.title} ${passenger.firstName} ${passenger.lastName}`;
  const frontendUrl = process.env.FRONTEND_URL || "https://aa-tracker-frontend.vercel.app";

  const body = `
    <div style="background:#f8faff;border:1px solid #e2e8f4;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
      <div style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:8px;">📋 Booking Updated</div>
      <div style="font-size:13px;color:#64748b;">Your booking has been updated. Please review the latest details.</div>
    </div>
    <div style="background:linear-gradient(135deg,#0047AB,#003580);border-radius:14px;padding:20px 24px;margin-bottom:20px;">
      <div style="color:rgba(255,255,255,0.6);font-size:10px;letter-spacing:0.15em;">BOOKING REFERENCE</div>
      <div style="color:white;font-size:36px;font-weight:800;letter-spacing:0.2em;">${booking.pnr}</div>
    </div>
    <p style="font-size:13px;color:#64748b;">Click the button below to view your updated itinerary and confirm all details are correct.</p>
  `;

  const html = emailWrapper("#CC0000", "BOOKING UPDATE NOTIFICATION", passengerName, booking.pnr, body, frontendUrl);
  return sendEmail(passenger.email, passengerName, `Booking Updated — PNR: ${booking.pnr}`, html);
}