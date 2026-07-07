import express from "express";
import prisma from "../lib/prisma.js";
import { protect } from "../middleware/auth.js";
import { sendBookingConfirmation, sendDelayNotification, sendOnTimeNotification, sendLandedNotification, sendBookingUpdateNotification } from "../lib/email.js";

const router = express.Router();
router.use(protect);

function generatePNR() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pnr = "AA";
  for (let i = 0; i < 5; i++) pnr += chars[Math.floor(Math.random() * chars.length)];
  return pnr;
}

const FULL_INCLUDE = {
  passenger: true,
  segments: { orderBy: { order: "asc" } },
  fare: true,
  baggage: true,
  alerts: true,
  baggageStages: { orderBy: { order: "asc" } },
layovers: { orderBy: { order: "asc" }, include: { tips: { orderBy: { order: "asc" } } } },  visaEntries: { orderBy: { order: "asc" } },
  seatConfig: true,
  mealOptions: { orderBy: { order: "asc" } },
  assistanceOptions: { orderBy: { order: "asc" } },
  createdBy: { select: { name: true, email: true } },
};

// GET all bookings
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({ include: FULL_INCLUDE, orderBy: { createdAt: "desc" } });
    res.json({ bookings });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single booking
router.get("/bookings/:id", async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id }, include: FULL_INCLUDE });
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    res.json({ booking });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CREATE booking
router.post("/bookings", async (req, res) => {
  try {
    const { passenger, segments, fare, baggage, alerts, baggageStages, layovers, visaEntries, seatConfig, mealOptions, assistanceOptions, status, bookingDate, ticketNumber, tourCode, tripType } = req.body;

    let pnr, unique = false;
    while (!unique) {
      pnr = generatePNR();
      const ex = await prisma.booking.findUnique({ where: { pnr } });
      if (!ex) unique = true;
    }

    const booking = await prisma.booking.create({
      data: {
        pnr, status: status || "CONFIRMED",
        tripType: tripType || "ONE_WAY",
        bookingDate: bookingDate || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        ticketNumber: ticketNumber || "001-" + Math.floor(Math.random() * 9000000000 + 1000000000),
        tourCode: tourCode || null,
        userId: req.user.id,
        passenger: passenger ? { create: { title: passenger.title, firstName: passenger.firstName, lastName: passenger.lastName, email: passenger.email || null, frequentFlyer: passenger.frequentFlyer || null, passport: passenger.passport || null } } : undefined,
        segments: segments?.length ? { create: segments.map((s, i) => ({ flightNumber: s.flightNumber, aircraft: s.aircraft, fromCode: s.fromCode, fromCity: s.fromCity, fromTerminal: s.fromTerminal, fromGate: s.fromGate, fromLat: parseFloat(s.fromLat)||0, fromLng: parseFloat(s.fromLng)||0, toCode: s.toCode, toCity: s.toCity, toTerminal: s.toTerminal, toGate: s.toGate, toLat: parseFloat(s.toLat)||0, toLng: parseFloat(s.toLng)||0, departsDate: s.departsDate, departsTime: s.departsTime, arrivesDate: s.arrivesDate, arrivesTime: s.arrivesTime, duration: s.duration, seat: s.seat, cabinClass: s.cabinClass, meal: s.meal, status: s.status||"On Time", order: i })) } : undefined,
        fare: fare ? { create: { basis: fare.basis, cabinClass: fare.cabinClass, ticketFare: fare.ticketFare, fuelSurcharge: fare.fuelSurcharge, taxes: fare.taxes, serviceCharge: fare.serviceCharge, aviationLevy: fare.aviationLevy, total: fare.total, payment: fare.payment, purchaseDate: fare.purchaseDate, validBefore: fare.validBefore||null, validAfter: fare.validAfter||null, co2: fare.co2||null, changesBefore: fare.changesBefore||null, changesAfter: fare.changesAfter||null, cancelBefore: fare.cancelBefore||null, cancelAfter: fare.cancelAfter||null, noShow: fare.noShow||null, notValidNote: fare.notValidNote||null } } : undefined,
        baggage: baggage ? { create: { personal: baggage.personal, carryOn: baggage.carryOn, checked: baggage.checked } } : undefined,
        alerts: alerts?.length ? { create: alerts.map(a => ({ type: a.type, icon: a.icon, message: a.message })) } : undefined,
        baggageStages: baggageStages?.length ? { create: baggageStages.map((s, i) => ({ label: s.label, icon: s.icon, description: s.description, time: s.time||null, isCurrent: s.isCurrent||false, order: i })) } : undefined,
        layovers: layovers?.length ? { create: layovers.map((l, i) => ({ airport: l.airport, code: l.code, country: l.country, connectionTime: l.connectionTime, arrivalFlight: l.arrivalFlight, arrivalTime: l.arrivalTime, arrivalTerminal: l.arrivalTerminal, arrivalGate: l.arrivalGate, depFlight: l.depFlight, depTime: l.depTime, depTerminal: l.depTerminal, depGate: l.depGate, sameTerminal: l.sameTerminal!==false, transferWalk: l.transferWalk||null, order: i, tips: l.tips?.length ? { create: l.tips.map((t, j) => ({ icon: t.icon, title: t.title, text: t.text, order: j })) } : undefined })) } : undefined,
        visaEntries: visaEntries?.length ? { create: visaEntries.map((v, i) => ({ country: v.country, code: v.code, flag: v.flag, purpose: v.purpose, status: v.status, statusLabel: v.statusLabel, statusColor: v.statusColor, summary: v.summary, tip: v.tip, tipType: v.tipType||"info", requirements: v.requirements, exemptions: v.exemptions, checklist: v.checklist||null, order: i })) } : undefined,
        seatConfig: seatConfig ? { create: { aircraft: seatConfig.aircraft, flightLabel: seatConfig.flightLabel, selectedSeat: seatConfig.selectedSeat, sections: seatConfig.sections ?? [{ name: "Economy", rows: Array.from({ length: 30 }, (_, i) => ({ row: i + 1, seats: ["A","B","C","D","E","F"] })) }], occupied: seatConfig.occupied, exits: seatConfig.exits } } : undefined,
        mealOptions: mealOptions?.length ? { create: mealOptions.map((m, i) => ({ icon: m.icon, label: m.label, desc: m.desc, tag: m.tag||null, order: i })) } : undefined,
        assistanceOptions: assistanceOptions?.length ? { create: assistanceOptions.map((a, i) => ({ icon: a.icon, label: a.label, desc: a.desc, category: a.category, code: a.code, order: i })) } : undefined,
      },
      include: FULL_INCLUDE,
    });

    // Send confirmation email
    if (booking.passenger?.email) {
      const emailData = {
        pnr: booking.pnr,
        status: booking.status,
        tripType: booking.tripType,
        bookingDate: booking.bookingDate,
        ticketNumber: booking.ticketNumber,
        tourCode: booking.tourCode,
        passenger: booking.passenger,
        segments: booking.segments,
        fare: booking.fare,
        baggage: booking.baggage,
      };
      sendBookingConfirmation(emailData).catch(err => console.error("Email failed:", err));
    }

    res.status(201).json({ message: "Booking created.", pnr, booking });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// UPDATE booking
router.put("/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tourCode, tripType, passenger, segments, fare, baggage, alerts, baggageStages, layovers, visaEntries, seatConfig, mealOptions, assistanceOptions } = req.body;

await prisma.booking.update({ where: { id }, data: { status, tourCode: tourCode||null, ...(tripType !== undefined ? { tripType } : {}) } });
    if (passenger) await prisma.passenger.upsert({ where: { bookingId: id }, update: passenger, create: { bookingId: id, ...passenger } });

  let oldSegments = [];
if (segments) {
  oldSegments = await prisma.segment.findMany({ where: { bookingId: id } });
  await prisma.segment.deleteMany({ where: { bookingId: id } });
  if (segments.length) await prisma.segment.createMany({ data: segments.map((s, i) => ({ bookingId: id, flightNumber: s.flightNumber, aircraft: s.aircraft, fromCode: s.fromCode, fromCity: s.fromCity, fromTerminal: s.fromTerminal, fromGate: s.fromGate, fromLat: parseFloat(s.fromLat)||0, fromLng: parseFloat(s.fromLng)||0, toCode: s.toCode, toCity: s.toCity, toTerminal: s.toTerminal, toGate: s.toGate, toLat: parseFloat(s.toLat)||0, toLng: parseFloat(s.toLng)||0, departsDate: s.departsDate, departsTime: s.departsTime, arrivesDate: s.arrivesDate, arrivesTime: s.arrivesTime, duration: s.duration, seat: s.seat, cabinClass: s.cabinClass, meal: s.meal, status: s.status||"On Time", order: i })) });
}

    if (fare) await prisma.fare.upsert({ where: { bookingId: id }, update: fare, create: { bookingId: id, ...fare } });
    if (baggage) await prisma.baggage.upsert({ where: { bookingId: id }, update: { personal: baggage.personal, carryOn: baggage.carryOn, checked: baggage.checked }, create: { bookingId: id, ...baggage } });

    if (alerts) {
      await prisma.alert.deleteMany({ where: { bookingId: id } });
      if (alerts.length) await prisma.alert.createMany({ data: alerts.map(a => ({ bookingId: id, type: a.type, icon: a.icon, message: a.message })) });
    }

    if (baggageStages) {
      await prisma.baggageStage.deleteMany({ where: { bookingId: id } });
      if (baggageStages.length) await prisma.baggageStage.createMany({ data: baggageStages.map((s, i) => ({ bookingId: id, label: s.label, icon: s.icon, description: s.description, time: s.time||null, isCurrent: s.isCurrent||false, order: i })) });
    }

   if (layovers !== undefined) {
      await prisma.layoverTip.deleteMany({ where: { layover: { bookingId: id } } });
      await prisma.layover.deleteMany({ where: { bookingId: id } });
      if (layovers.length) {
        for (const [i, l] of layovers.entries()) {
          await prisma.layover.create({ data: { bookingId: id, airport: l.airport, code: l.code, country: l.country, connectionTime: l.connectionTime, arrivalFlight: l.arrivalFlight, arrivalTime: l.arrivalTime, arrivalTerminal: l.arrivalTerminal, arrivalGate: l.arrivalGate, depFlight: l.depFlight, depTime: l.depTime, depTerminal: l.depTerminal, depGate: l.depGate, sameTerminal: l.sameTerminal!==false, transferWalk: l.transferWalk||null, order: i, tips: l.tips?.length ? { create: l.tips.map((t, j) => ({ icon: t.icon, title: t.title, text: t.text, order: j })) } : undefined } });
        }
      }
    }

    if (visaEntries) {
      await prisma.visaEntry.deleteMany({ where: { bookingId: id } });
      if (visaEntries.length) await prisma.visaEntry.createMany({ data: visaEntries.map((v, i) => ({ bookingId: id, country: v.country, code: v.code, flag: v.flag, purpose: v.purpose, status: v.status, statusLabel: v.statusLabel, statusColor: v.statusColor, summary: v.summary, tip: v.tip, tipType: v.tipType||"info", requirements: v.requirements, exemptions: v.exemptions, checklist: v.checklist||null, order: i })) });
    }

    if (seatConfig) {
  const defaultSections = [{ name: "Economy", rows: Array.from({ length: 30 }, (_, i) => ({ row: i + 1, seats: ["A","B","C","D","E","F"] })) }];
  await prisma.seatConfig.upsert({
    where: { bookingId: id },
    update: {
      aircraft: seatConfig.aircraft,
      flightLabel: seatConfig.flightLabel,
      selectedSeat: seatConfig.selectedSeat,
      sections: seatConfig.sections ?? defaultSections,
      occupied: seatConfig.occupied,
      exits: seatConfig.exits
    },
    create: {
      bookingId: id,
      aircraft: seatConfig.aircraft,
      flightLabel: seatConfig.flightLabel,
      selectedSeat: seatConfig.selectedSeat,
      sections: seatConfig.sections ?? defaultSections,
      occupied: seatConfig.occupied,
      exits: seatConfig.exits
    }
  });
}

    if (mealOptions) {
      await prisma.mealOption.deleteMany({ where: { bookingId: id } });
      if (mealOptions.length) await prisma.mealOption.createMany({ data: mealOptions.map((m, i) => ({ bookingId: id, icon: m.icon, label: m.label, desc: m.desc, tag: m.tag||null, order: i })) });
    }

    if (assistanceOptions) {
      await prisma.assistanceOption.deleteMany({ where: { bookingId: id } });
      if (assistanceOptions.length) await prisma.assistanceOption.createMany({ data: assistanceOptions.map((a, i) => ({ bookingId: id, icon: a.icon, label: a.label, desc: a.desc, category: a.category, code: a.code, order: i })) });
    }

    const updated = await prisma.booking.findUnique({ where: { id }, include: FULL_INCLUDE });

if (updated.passenger?.email) {
  console.log("Sending update email to:", updated.passenger.email);
  sendBookingUpdateNotification(updated).catch(err => console.error("Email error:", err));
}
// Send email notifications
if (segments && updated.passenger?.email) {
  for (const seg of segments) {
    const oldSeg = oldSegments.find(s => s.flightNumber === seg.flightNumber);
    if (oldSeg && oldSeg.status !== seg.status) {
      if (seg.status === "Delayed") {
        sendDelayNotification(updated, seg).catch(err => console.error("Email error:", err));
      } else if (seg.status === "On Time" && oldSeg.status === "Delayed") {
        sendOnTimeNotification(updated, seg).catch(err => console.error("Email error:", err));
      } else if (seg.status === "Landed") {
        sendLandedNotification(updated, seg).catch(err => console.error("Email error:", err));
      }
    }
  }
}

res.json({ message: "Booking updated.", booking: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE booking
router.delete("/bookings/:id", async (req, res) => {
  try {
    await prisma.booking.delete({ where: { id: req.params.id } });
    res.json({ message: "Booking deleted." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
