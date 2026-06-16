import { Router } from "express";
import { generateText } from "../services/geminiService";

const router = Router();

router.post("/generate", async (req, res) => {
  // Holt nun prompt, history und context aus dem Frontend-Request
  const { prompt, history, context } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt fehlt" });
  }

  try {
    // Reicht alle Parameter an den aktualisierten Service weiter
    const result = await generateText(prompt, history, context);
    res.json({ text: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
