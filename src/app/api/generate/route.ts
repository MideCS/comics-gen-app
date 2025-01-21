import { NextResponse } from "next/server";
import OpenAI from "openai";
import Replicate from "replicate";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://models.inference.ai.azure.com",
});

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Fixed typo in model name
      messages: [
        {
          role: "system",
          content:
            "You are a comic story writer. Create a 3-panel story in JSON format. Each panel should have a 'title' and 'content' field. The content should be exactly 2 sentences.",
        },
        {
          role: "user",
          content: `Create a JSON object with a 'panels' array containing 3 panels based on this prompt: ${prompt}. Format: {"panels": [{"title": "string", "content": "string"}]}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const storyData = JSON.parse(
      completion.choices[0].message.content || '{"panels": []}'
    );

    // Generate images for each panel
    const panelImages = await Promise.all(
      storyData.panels.map(async (panel) => {
        const prediction = await replicate.predictions.create({
          version:
            "8beff3369e81422112d93b89ca01426147de542cd4684c244b673b105188fe5f", // SDXL version
          input: {
            prompt: `${panel.title}: ${panel.content}`,
            width: 768,
            height: 512,
          },
        });

        // Wait for the prediction to complete
        let imageResult = await replicate.predictions.get(prediction.id);
        while (
          imageResult.status !== "succeeded" &&
          imageResult.status !== "failed"
        ) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          imageResult = await replicate.predictions.get(prediction.id);
        }

        return imageResult.output?.[0] || null;
      })
    );

    return NextResponse.json({
      story: storyData.panels.map((panel, index) => ({
        content: panel.content,
        image: panelImages[index],
      })),
      success: true,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to generate story and images", success: false },
      { status: 500 }
    );
  }
}
