import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Wele come to smart trash bin!");
});

app.post("/api/chat", async (req, res) => {
  const { userLocation, bins, stations, message } = req.body;

  const data = {
    userLocation,
    bins,
    stations,
    message,
  };
 
  const prompt = `
        Here is the data for user location, bins, and stations:
        User Location: ${JSON.stringify(userLocation)}
        Bins: ${JSON.stringify(bins, null, 2)}
        Stations: ${JSON.stringify(stations, null, 2)}

        Based on the fill levels, suggest the bins that need to be collected and provide a route summary. The summary should include the order of bins to be collected, the total distance of the route, and end at the nearest station. Format the response like this:

        - **Identify bins to collect:** List bins that are near or above the threshold.
        - **Find the closest distance:** Calculate the closest distance from the user location to the first bin.
        - **Create at least 3 optional routes:** Provide three different routes for bin collection.
        - **Pick the best option:**
        - **Time Sensitivity:** If a bin is close to the threshold, prioritize its collection to avoid it overflowing.
        - **Optional:** If a bin that is not full is on the collecting route and is by itself, include it in the collection.
        - **No priority station:** The route can end at any station.

        Example Route Summary: 
        "Route Summary: Start - bin-8 - bin-6 - bin-5 - bin-2 - bin-3  - bin-1 - bin-9 - End at station-2, Total Distance: 37.43 km, "
        "bins":{[latitude: 11.5681, longitude: 104.8947], [latitude: 11.5681, longitude: 104.8947]}
    `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([prompt]);

    const routeSummary = result.response
      .text()
      .match(/Route Summary: Start - bin.*/)[0];
    res.json({ reply: routeSummary });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
