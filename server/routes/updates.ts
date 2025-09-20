import { RequestHandler } from "express";
import type { UpdatesResponse } from "@shared/api";

export const getUpdates: RequestHandler = async (req, res) => {
  const lat = Number(req.query.lat ?? 10.0);
  const lon = Number(req.query.lon ?? 76.0);
  try {
    const weather = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m&timezone=auto`
    ).then((r) => r.json());

    const temp = weather?.current?.temperature_2m ?? null;
    const wind = weather?.current?.wind_speed_10m ?? null;

    const response: UpdatesResponse = {
      weather: {
        temperatureC: typeof temp === "number" ? temp : null,
        windKph: typeof wind === "number" ? Math.round(wind * 3.6) : null,
        description: "Live weather from Open-Meteo",
      },
      market: [
        { crop: "Tomato", pricePerKgInr: 28 },
        { crop: "Onion", pricePerKgInr: 36 },
      ],
      schemes: [
        { title: "PM-Kisan", status: "Open" },
        { title: "Pradhan Mantri Fasal Bima Yojana", status: "Due 30 Sep" },
      ],
    };
    res.json(response);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch updates", detail: String(e) });
  }
};
