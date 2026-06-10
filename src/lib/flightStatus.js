export async function getFlightStatus(flightNumber) {
  try {
    const iata = flightNumber.replace(/\s/g, "");
    console.log("Fetching AirLabs for:", iata);
    const response = await fetch(
      `https://airlabs.co/api/v9/flight?flight_iata=${iata}&api_key=${process.env.AIRLABS_API_KEY}`
    );
    const data = await response.json();
    console.log("AirLabs response:", JSON.stringify(data));
    if (!data.response) return null;

    const flight = data.response;
    return {
      status: flight.status,
      dep_actual: flight.dep_actual || flight.dep_estimated || null,
      arr_actual: flight.arr_actual || flight.arr_estimated || null,
      dep_delay: flight.dep_delayed || 0,
      arr_delay: flight.arr_delayed || 0,
      dep_gate: flight.dep_gate || null,
      arr_gate: flight.arr_gate || null,
      dep_terminal: flight.dep_terminal || null,
      arr_terminal: flight.arr_terminal || null,
    };
  } catch (err) {
    console.error("AirLabs error:", err);
    return null;
  }
}