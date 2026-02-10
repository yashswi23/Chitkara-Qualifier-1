import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// --------- GEMINI SETUP ---------
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing from environment");
}

const genAI = new GoogleGenerativeAI(apiKey);
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const model = genAI.getGenerativeModel({ model: MODEL_NAME });




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

  if (!req.body) {
    return res.status(400).json({
      is_success: false,
      error: "Request body missing",
    });
  }

  const body = req.body;

  let result;

  try {
    // PRIME 
    if (body.prime) {
      result = body.prime.filter((num) => isPrime(num));
    }

    // LCM 
    else if (body.lcm) {
      result = lcm(body.lcm);
    }

    // HCF 
    else if (body.hcf) {
      result = hcf(body.hcf);
    }

    // AI LOGIC (GEMINI)
    else if (body.AI) {
      const prompt = `Respond with exactly one JSON field: {"data":"..."}. Keep it plain text, no markdown or extra keys. Question: ${body.AI}`;
      const aiResult = await model.generateContent(prompt);
      const text = aiResult.response.text();

      try {
        const parsed = JSON.parse(text);
        result = typeof parsed?.data === "string" ? parsed.data : text;
      } catch {
        result = text;
      }
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
