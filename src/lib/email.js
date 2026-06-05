import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBookingConfirmation(booking) {
  const passenger = booking.passenger;
  const segments = booking.segments || [];
  const fare = booking.fare;
  const baggage = booking.baggage;
  const seg1 = segments[0];
  const lastSeg = segments[segments.length - 1];

  const passengerName = passenger
    ? `${passenger.title} ${passenger.firstName} ${passenger.lastName}`
    : "Passenger";

  const passengerEmail = passenger?.email;
  if (!passengerEmail) return { error: "No passenger email provided" };

  // Build segments HTML
  const segmentsHTML = segments.map((seg, i) => `
    <tr>
      <td style="padding:0 0 16px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1px solid #e2e8f4;border-radius:12px;">
          <tr>
            <td style="padding:12px 16px;background:linear-gradient(135deg,#0047AB,#003580);border-radius:12px 12px 0 0;">
              <span style="color:white;font-size:13px;font-weight:700;">FLIGHT ${seg.flightNumber} &nbsp;·&nbsp; ${seg.aircraft}</span>
              <span style="float:right;background:rgba(74,222,128,0.2);color:#4ade80;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;">${seg.status || "Confirmed"}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:left;width:35%;">
                    <div style="font-size:32px;font-weight:800;color:#0f172a;">${seg.fromCode}</div>
                    <div style="font-size:12px;color:#64748b;">${seg.fromCity}</div>
                    <div style="font-size:20px;font-weight:700;color:#0f172a;margin-top:8px;">${seg.departsTime}</div>
                    <div style="font-size:11px;color:#94a3b8;">${seg.departsDate}</div>
                    <div style="font-size:11px;color:#64748b;margin-top:4px;">${seg.fromTerminal} · Gate ${seg.fromGate}</div>
                  </td>
                  <td style="text-align:center;width:30%;">
                    <div style="font-size:11px;color:#94a3b8;">${seg.duration}</div>
                    <div style="font-size:18px;color:#0047AB;">✈</div>
                    <div style="font-size:10px;color:#0047AB;font-weight:600;">${i === 0 && segments.length > 1 ? "LAYOVER" : "NONSTOP"}</div>
                  </td>
                  <td style="text-align:right;width:35%;">
                    <div style="font-size:32px;font-weight:800;color:#0f172a;">${seg.toCode}</div>
                    <div style="font-size:12px;color:#64748b;">${seg.toCity}</div>
                    <div style="font-size:20px;font-weight:700;color:#0f172a;margin-top:8px;">${seg.arrivesTime}</div>
                    <div style="font-size:11px;color:#94a3b8;">${seg.arrivesDate}</div>
                    <div style="font-size:11px;color:#64748b;margin-top:4px;">${seg.toTerminal} · Gate ${seg.toGate}</div>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;padding-top:12px;border-top:1px dashed #e2e8f4;">
                <tr>
                  <td style="font-size:11px;color:#64748b;"><span style="color:#94a3b8;">SEAT</span><br/><strong style="color:#0f172a;">${seg.seat}</strong></td>
                  <td style="font-size:11px;color:#64748b;"><span style="color:#94a3b8;">CLASS</span><br/><strong style="color:#0f172a;">${seg.cabinClass}</strong></td>
                  <td style="font-size:11px;color:#64748b;"><span style="color:#94a3b8;">MEAL</span><br/><strong style="color:#0f172a;">${seg.meal}</strong></td>
                  <td style="font-size:11px;color:#64748b;"><span style="color:#94a3b8;">AIRCRAFT</span><br/><strong style="color:#0f172a;">${seg.aircraft}</strong></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join("");

  const fareHTML = fare ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1px solid #e2e8f4;border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:14px 16px;border-bottom:1px solid #e2e8f4;"><strong style="font-size:13px;color:#0f172a;">Fare Summary</strong></td></tr>
      ${[
        ["Ticket Fare", fare.ticketFare],
        ["Fuel Surcharge", fare.fuelSurcharge],
        ["Taxes & Levies", fare.taxes],
        ["Service Charge", fare.serviceCharge],
        ["Aviation Levy", fare.aviationLevy],
      ].map(([l, v]) => `<tr><td style="padding:8px 16px;font-size:12px;color:#64748b;">${l}</td><td style="padding:8px 16px;font-size:12px;color:#0f172a;text-align:right;">${v || "—"}</td></tr>`).join("")}
      <tr style="border-top:1px solid #e2e8f4;">
        <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#0f172a;">Total</td>
        <td style="padding:12px 16px;font-size:16px;font-weight:800;color:#0047AB;text-align:right;">${fare.total}</td>
      </tr>
      <tr>
        <td style="padding:6px 16px 12px;font-size:11px;color:#94a3b8;">Payment</td>
        <td style="padding:6px 16px 12px;font-size:11px;color:#64748b;text-align:right;">${fare.payment}</td>
      </tr>
    </table>
  ` : "";

  const baggageHTML = baggage ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1px solid #e2e8f4;border-radius:12px;margin-bottom:20px;">
      <tr><td colspan="3" style="padding:14px 16px;border-bottom:1px solid #e2e8f4;"><strong style="font-size:13px;color:#0f172a;">Baggage Allowance</strong></td></tr>
      <tr>
        <td style="padding:12px 16px;text-align:center;border-right:1px solid #e2e8f4;">
          <div style="font-size:20px;">✈</div>
          <div style="font-size:10px;color:#94a3b8;margin-top:4px;">PERSONAL ITEM</div>
          <div style="font-size:12px;font-weight:600;color:#0f172a;margin-top:2px;">${baggage.personal}</div>
        </td>
        <td style="padding:12px 16px;text-align:center;border-right:1px solid #e2e8f4;">
          <div style="font-size:20px;">🧳</div>
          <div style="font-size:10px;color:#94a3b8;margin-top:4px;">CARRY-ON</div>
          <div style="font-size:12px;font-weight:600;color:#0f172a;margin-top:2px;">${baggage.carryOn}</div>
        </td>
        <td style="padding:12px 16px;text-align:center;">
          <div style="font-size:20px;">📦</div>
          <div style="font-size:10px;color:#94a3b8;margin-top:4px;">CHECKED BAG</div>
          <div style="font-size:12px;font-weight:600;color:#0f172a;margin-top:2px;">${baggage.checked}</div>
        </td>
      </tr>
    </table>
  ` : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#CC0000;padding:20px 28px;border-radius:16px 16px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="color:white;font-size:20px;font-weight:800;letter-spacing:0.02em;">American Airlines</div>
                    <div style="color:rgba(255,255,255,0.7);font-size:10px;letter-spacing:0.15em;margin-top:2px;">BOOKING CONFIRMATION</div>
                  </td>
                  <td align="right">
                    <div style="color:rgba(255,255,255,0.8);font-size:24px;">✈</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <div style="height:4px;background:linear-gradient(90deg,#0047AB,#003580,#CC0000);"></div>

          <!-- Body -->
          <tr>
            <td style="background:white;padding:28px;">

              <!-- Greeting -->
              <p style="font-size:15px;color:#0f172a;margin:0 0 6px 0;">Dear <strong>${passengerName},</strong></p>
              <p style="font-size:13px;color:#64748b;margin:0 0 24px 0;">Thank you for choosing American Airlines. Your booking has been confirmed. Please find your itinerary details below.</p>

              <!-- PNR Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0047AB,#003580);border-radius:14px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="color:rgba(255,255,255,0.6);font-size:10px;letter-spacing:0.15em;margin-bottom:4px;">BOOKING REFERENCE (PNR)</div>
                    <div style="color:white;font-size:36px;font-weight:800;letter-spacing:0.2em;">${booking.pnr}</div>
                    <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:6px;">Ticket: ${booking.ticketNumber} &nbsp;·&nbsp; Booked: ${booking.bookingDate}</div>
                  </td>
                  <td style="padding:20px 24px;" align="right">
                    <div style="background:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.3);border-radius:20px;padding:6px 16px;display:inline-block;">
                      <span style="color:#4ade80;font-size:12px;font-weight:700;">● ${booking.status}</span>
                    </div>
                    <div style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:8px;">${seg1?.fromCode || ""} → ${lastSeg?.toCode || ""}</div>
                  </td>
                </tr>
              </table>

              <!-- Passenger Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1px solid #e2e8f4;border-radius:12px;margin-bottom:20px;">
                <tr>
                  <td style="padding:14px 16px;border-bottom:1px solid #e2e8f4;"><strong style="font-size:13px;color:#0f172a;">Passenger Details</strong></td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;">
                    <div style="font-size:18px;font-weight:700;color:#0f172a;">${passengerName}</div>
                    ${passenger?.frequentFlyer ? `<div style="font-size:12px;color:#64748b;margin-top:4px;">AAdvantage: ${passenger.frequentFlyer}</div>` : ""}
                    ${passenger?.passport ? `<div style="font-size:12px;color:#64748b;margin-top:2px;">Passport: ${passenger.passport}</div>` : ""}
                  </td>
                </tr>
              </table>

              <!-- Flight Segments -->
              <div style="font-size:11px;color:#94a3b8;letter-spacing:0.15em;margin-bottom:12px;">FLIGHT ITINERARY</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${segmentsHTML}
              </table>

              <!-- Baggage -->
              ${baggageHTML}

              <!-- Fare -->
              ${fareHTML}

              <!-- Important Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <div style="font-size:12px;font-weight:700;color:#b45309;margin-bottom:8px;">⚠ IMPORTANT NOTICES</div>
                    <ul style="margin:0;padding:0 0 0 16px;font-size:12px;color:#92400e;line-height:1.8;">
                      <li>Please arrive at least 3 hours before international departure.</li>
                      <li>Carry a valid passport and any required visas.</li>
                      <li>Online check-in opens 24 hours before departure.</li>
                      <li>Gates close 20 minutes before scheduled departure.</li>
                      <li>This e-ticket serves as your official booking confirmation.</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL || "https://aa-tracker-frontend.vercel.app"}?pnr=${booking.pnr}" style="display:inline-block;background:linear-gradient(135deg,#CC0000,#a80000);color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.04em;">View Full Itinerary →</a>
                  </td>
                </tr>
              </table>

              <!-- Valid on line -->
              <div style="background:#f1f5f9;border-radius:8px;padding:10px 14px;font-size:11px;color:#64748b;margin-bottom:16px;">
                <strong style="color:#0f172a;">VALID ON AA ONLY / ${booking.pnr}${booking.bookingDate?.replace(/[,\s]/g,"").toUpperCase() || ""}</strong>
                ${booking.tourCode ? `&nbsp;·&nbsp; Tour Code: ${booking.tourCode}` : ""}
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:20px 28px;border-radius:0 0 16px 16px;">
              <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-bottom:6px;">This is an automated booking confirmation from American Airlines.</div>
              <div style="color:rgba(255,255,255,0.4);font-size:11px;">americanairlines.com &nbsp;|&nbsp; AAdvantage Service: 1-800-882-8880 &nbsp;|&nbsp; International: +1-817-786-3523</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const result = await resend.emails.send({
      from: "American Airlines <onboarding@resend.dev>",
      to: [passengerEmail],
      subject: `Booking Confirmed — PNR: ${booking.pnr} | ${seg1?.fromCode || ""} → ${lastSeg?.toCode || ""}`,
      html,
    });
    return { success: true, id: result.id };
  } catch (err) {
    console.error("Email error:", err);
    return { error: err.message };
  }
}
