import express from "express";
import prisma from "../lib/prisma.js";
import { getFlightStatus } from "../lib/flightStatus.js";

const router = express.Router();

router.get("/:pnr", async (req, res) => {
  try {
    const pnr = req.params.pnr.toUpperCase().trim();
    const booking = await prisma.booking.findUnique({
      where: { pnr },
      include: {
        passenger: true,
        segments: { orderBy: { order: "asc" } },
        fare: true,
        baggage: true,
        alerts: true,
        baggageStages: { orderBy: { order: "asc" } },
        layover: { include: { tips: { orderBy: { order: "asc" } } } },
        visaEntries: { orderBy: { order: "asc" } },
        seatConfig: true,
        mealOptions: { orderBy: { order: "asc" } },
        assistanceOptions: { orderBy: { order: "asc" } },
      },
    });

    if (!booking) return res.status(404).json({ error: "No booking found for PNR: " + pnr });

    const segmentsWithStatus = await Promise.all(
      booking.segments.map(async (s) => {
        const live = await getFlightStatus(s.flightNumber);
        return {
          ...s,
          liveStatus: live ? {
            status: live.status,
            dep_actual: live.dep_actual,
            arr_actual: live.arr_actual,
            dep_delay: live.dep_delay,
            arr_delay: live.arr_delay,
            dep_gate: live.dep_gate,
            arr_gate: live.arr_gate,
          } : null,
        };
      })
    );

    const response = {
      pnr: booking.pnr,
      status: booking.status,
      booking_date: booking.bookingDate,
      ticket_number: booking.ticketNumber,
      passenger: booking.passenger ? {
        title: booking.passenger.title,
        name: booking.passenger.firstName + " " + booking.passenger.lastName,
        email: booking.passenger.email || null,
        frequent_flyer: booking.passenger.frequentFlyer || "N/A",
        passport: booking.passenger.passport || "N/A",
      } : null,
      segments: segmentsWithStatus.map(s => ({
        flight: s.flightNumber, aircraft: s.aircraft,
        from: { code: s.fromCode, city: s.fromCity, terminal: s.fromTerminal, gate: s.fromGate, lat: s.fromLat, lng: s.fromLng },
        to: { code: s.toCode, city: s.toCity, terminal: s.toTerminal, gate: s.toGate, lat: s.toLat, lng: s.toLng },
        departs: s.departsDate, dep_time: s.departsTime,
        arrives: s.arrivesDate, arr_time: s.arrivesTime,
        duration: s.duration, seat: s.seat, class: s.cabinClass, meal: s.meal, status: s.status,
        liveStatus: s.liveStatus,
      })),
      baggage: booking.baggage ? { personal: booking.baggage.personal, carry_on: booking.baggage.carryOn, checked: booking.baggage.checked } : null,
      fare: booking.fare ? {
        basis: booking.fare.basis, cabin_class: booking.fare.cabinClass,
        ticket_fare: booking.fare.ticketFare, fuel_surcharge: booking.fare.fuelSurcharge,
        taxes: booking.fare.taxes, service_charge: booking.fare.serviceCharge,
        aviation_levy: booking.fare.aviationLevy, total: booking.fare.total,
        payment: booking.fare.payment, purchase_date: booking.fare.purchaseDate,
        tour_code: booking.tourCode || "N/A",
        valid_before: booking.fare.validBefore || "-", valid_after: booking.fare.validAfter || "-",
        co2: booking.fare.co2 || "N/A", not_valid_note: booking.fare.notValidNote || "",
        fare_conditions: { changes_before: booking.fare.changesBefore || "N/A", changes_after: booking.fare.changesAfter || "N/A", cancel_before: booking.fare.cancelBefore || "N/A", cancel_after: booking.fare.cancelAfter || "N/A", no_show: booking.fare.noShow || "N/A" },
      } : null,
      alerts: booking.alerts.map(a => ({ type: a.type, icon: a.icon, message: a.message })),
      baggage_stages: booking.baggageStages.map(s => ({ label: s.label, icon: s.icon, desc: s.description, time: s.time, isCurrent: s.isCurrent })),
      layover: booking.layover ? {
        airport: booking.layover.airport, code: booking.layover.code, country: booking.layover.country,
        connection_time: booking.layover.connectionTime,
        arrival: { flight: booking.layover.arrivalFlight, time: booking.layover.arrivalTime, terminal: booking.layover.arrivalTerminal, gate: booking.layover.arrivalGate },
        departure: { flight: booking.layover.depFlight, time: booking.layover.depTime, terminal: booking.layover.depTerminal, gate: booking.layover.depGate },
        same_terminal: booking.layover.sameTerminal, transfer_walk: booking.layover.transferWalk,
        tips: booking.layover.tips.map(t => ({ icon: t.icon, title: t.title, text: t.text })),
      } : null,
      visa_entries: booking.visaEntries.map(v => ({
        country: v.country, code: v.code, flag: v.flag, purpose: v.purpose,
        status: v.status, statusLabel: v.statusLabel, statusColor: v.statusColor,
        summary: v.summary, tip: v.tip, tipType: v.tipType,
        requirements: v.requirements, exemptions: v.exemptions, checklist: v.checklist,
      })),
      seat_config: booking.seatConfig ? {
        aircraft: booking.seatConfig.aircraft, flight_label: booking.seatConfig.flightLabel,
        selected_seat: booking.seatConfig.selectedSeat, sections: booking.seatConfig.sections,
        occupied: booking.seatConfig.occupied, exits: booking.seatConfig.exits,
      } : null,
      meal_options: booking.mealOptions.map(m => ({ icon: m.icon, label: m.label, desc: m.desc, tag: m.tag, id: m.id })),
      assistance_options: booking.assistanceOptions.map(a => ({ icon: a.icon, label: a.label, desc: a.desc, category: a.category, id: a.code })),
    };

    res.json(response);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;