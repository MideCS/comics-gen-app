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
            "You are a comic story writer. Create a 3-panel story in JSON format about 'mideaivirtual' who is a black male with an afro. Each panel should have a 'title' and 'content' field. The content should be exactly 2 sentences.",
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
        const output = await replicate.run(
          "sundai-club/mide:592f97c9f3e02bd5d37b6c31de45d21a28ca2c2a097ff04e8a03dc56ffc316b2",
          {
            input: {
              prompt: `${panel.title}: ${panel.content}`,
              width: 768,
              height: 512,
            },
          }
        );
        const imgURL = String(output[0]);
        return imgURL;
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
