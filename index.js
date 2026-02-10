import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "32kb" }));

// --------- GEMINI SETUP ---------
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const model = genAI ? genAI.getGenerativeModel({ model: MODEL_NAME }) : null;




// --------- HELPER FUNCTIONS ---------

const isPrime = (n) => {
  if (n < 2) return false;

  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
};

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

const lcm = (arr) => arr.reduce((acc, num) => (acc * num) / gcd(acc, num));

const hcf = (arr) => arr.reduce((acc, num) => gcd(acc, num));

const isIntegerArray = (value) =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((num) => Number.isInteger(num));

const isPositiveInteger = (value) =>
  Number.isInteger(value) && value > 0;

const fibonacciSeries = (n) => {
  const series = [0, 1];
  if (n === 1) return [0];
  if (n === 2) return series;

  for (let i = 2; i < n; i++) {
    series.push(series[i - 1] + series[i - 2]);
  }
  return series;
};

// --------- ROUTES ---------

app.get("/health", (req, res) => {
  res.json({
    is_success: true,
    official_email: "yashswi1324.be23@chitkara.edu.in",
  });
});

app.get("/models", async (req, res) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await response.json();

    res.json({
      is_success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      is_success: false,
      error: error.message,
    });
  }
});

app.post("/bfhl", async (req, res) => {

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      is_success: false,
      error: "Request body missing",
    });
  }

  const body = req.body;
  const keys = Object.keys(body);
  if (keys.length !== 1) {
    return res.status(400).json({
      is_success: false,
      error: "Exactly one key must be provided",
    });
  }

  let result;

  try {
    // FIBONACCI
    if (Object.prototype.hasOwnProperty.call(body, "fibonacci")) {
      if (!isPositiveInteger(body.fibonacci) || body.fibonacci > 1000) {
        return res.status(400).json({
          is_success: false,
          error: "fibonacci must be a positive integer <= 1000",
        });
      }
      result = fibonacciSeries(body.fibonacci);
    }

    // PRIME
    else if (Object.prototype.hasOwnProperty.call(body, "prime")) {
      if (!isIntegerArray(body.prime)) {
        return res.status(400).json({
          is_success: false,
          error: "prime must be a non-empty array of integers",
        });
      }
      result = body.prime.filter((num) => isPrime(num));
    }

    // LCM
    else if (Object.prototype.hasOwnProperty.call(body, "lcm")) {
      if (!isIntegerArray(body.lcm)) {
        return res.status(400).json({
          is_success: false,
          error: "lcm must be a non-empty array of integers",
        });
      }
      result = lcm(body.lcm.map((num) => Math.abs(num)));
    }

    // HCF
    else if (Object.prototype.hasOwnProperty.call(body, "hcf")) {
      if (!isIntegerArray(body.hcf)) {
        return res.status(400).json({
          is_success: false,
          error: "hcf must be a non-empty array of integers",
        });
      }
      result = hcf(body.hcf.map((num) => Math.abs(num)));
    }

    // AI LOGIC (GEMINI)
    else if (Object.prototype.hasOwnProperty.call(body, "AI")) {
      if (typeof body.AI !== "string" || body.AI.trim().length === 0) {
        return res.status(400).json({
          is_success: false,
          error: "AI must be a non-empty string",
        });
      }
      if (!model) {
        return res.status(500).json({
          is_success: false,
          error: "AI service is not configured",
        });
      }

      const prompt = `Answer the question in exactly one word. Do not use punctuation or markdown. Question: ${body.AI}`;
      const aiResult = await model.generateContent(prompt);
      const text = aiResult.response.text();
      const firstWord = text.trim().split(/\s+/)[0]?.replace(/[^A-Za-z0-9_-]/g, "");
      result = firstWord || "";
    }

    // INVALID
    else {
      return res.status(400).json({
        is_success: false,
        error: "Invalid Input Format",
      });
    }

    res.json({
      is_success: true,
      official_email: "yashswi1324.be23@chitkara.edu.in",
      data: result,
    });

  } catch (error) {
    res.status(500).json({
      is_success: false,
      error: error.message,
    });
  }
});

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
