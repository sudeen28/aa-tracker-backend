export async function getFlightStatus(flightNumber, date) {
  try {
    const iata = flightNumber.replace(/\s/g, "");
    const response = await fetch(
      `https://airlabs.co/api/v9/flight?flight_iata=${iata}&api_key=${process.env.AIRLABS_API_KEY}`
    );
    const data = await response.json();
    if (!data.response) return null;

    const flight = data.response;
    return {
      status: flight.status, // "scheduled", "active", "landed", "cancelled", "diverted"
      dep_actual: flight.dep_actual || flight.dep_estimated || null,
      arr_actual: flight.arr_actual || flight.arr_estimated || null,
      dep_delay: flight.dep_delayed || 0,
      arr_delay: flight.arr_delayed || 0,
      dep_terminal: flight.dep_terminal || null,
      dep_gate: flight.dep_gate || null,
      arr_terminal: flight.arr_terminal || null,
      arr_gate: flight.arr_gate || null,
    };
  } catch (err) {
    console.error("AirLabs error:", err);
    return null;
  }
}