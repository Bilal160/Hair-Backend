const axios = require("axios");

export async function getPostalCodeFromLatLng(lat: number, lng: number) {
  const apiKey = process.env.GOOGLE_MAP_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const results = response.data.results;

    if (results.length === 0) {
      return "";
    }

    // Find postal_code component
    for (const result of results) {
      for (const component of result.address_components) {
        if (component.types.includes("postal_code")) {
          console.log(component, "component");
          return component.long_name;
        }
      }
    }

    return ""; // Postal code not found
  } catch (error: any) {
    console.error("Error fetching postal code:", error.message);
    throw error;
  }
}
