const axios = require("axios");

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || null;
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

function buildSimulatedWeather(lat, lng) {
  const baseTemp = 25 + Math.random() * 10;
  return {
    temperature_celsius: parseFloat(baseTemp.toFixed(1)),
    feels_like_celsius: parseFloat((baseTemp + 2).toFixed(1)),
    humidity_percent: Math.round(50 + Math.random() * 40),
    pressure_hpa: Math.round(1008 + Math.random() * 15),
    wind_speed_mps: parseFloat((1 + Math.random() * 5).toFixed(1)),
    wind_direction_deg: Math.round(Math.random() * 360),
    description: "Clear sky (simulated)",
    icon: "01d",
    simulated: true,
    source: "Simulated",
  };
}

async function fetchWeatherByCoords(lat, lng) {
  if (!OPENWEATHER_API_KEY) {
    return buildSimulatedWeather(lat, lng);
  }

  try {
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        lat: lat,
        lon: lng,
        appid: OPENWEATHER_API_KEY,
        units: "metric",
      },
      timeout: 5000,
    });

    const data = response.data;
    return {
      temperature_celsius: data.main.temp,
      feels_like_celsius: data.main.feels_like,
      humidity_percent: data.main.humidity,
      pressure_hpa: data.main.pressure,
      wind_speed_mps: data.wind.speed,
      wind_direction_deg: data.wind.deg || 0,
      description: data.weather[0]?.description || "Clear",
      icon: data.weather[0]?.icon || "01d",
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      source: "OpenWeatherMap",
    };
  } catch (err) {
    console.error("[Weather API Error]:", err.message);
    return buildSimulatedWeather(lat, lng);
  }
}

async function fetchWeatherByCityName(cityName, countryCode = "IN") {
  if (!OPENWEATHER_API_KEY) {
    return buildSimulatedWeather(0, 0);
  }

  try {
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        q: `${cityName},${countryCode}`,
        appid: OPENWEATHER_API_KEY,
        units: "metric",
      },
      timeout: 5000,
    });

    const data = response.data;
    return {
      temperature_celsius: data.main.temp,
      feels_like_celsius: data.main.feels_like,
      humidity_percent: data.main.humidity,
      pressure_hpa: data.main.pressure,
      wind_speed_mps: data.wind.speed,
      wind_direction_deg: data.wind.deg || 0,
      description: data.weather[0]?.description || "Clear",
      icon: data.weather[0]?.icon || "01d",
      city: data.name,
      country: data.sys.country,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      source: "OpenWeatherMap",
    };
  } catch (err) {
    console.error("[Weather API Error]:", err.message);
    return buildSimulatedWeather(0, 0);
  }
}

module.exports = { fetchWeatherByCoords, fetchWeatherByCityName };
