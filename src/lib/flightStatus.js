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
    // ... rest of function