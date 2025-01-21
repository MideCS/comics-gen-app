"use client"; // Add this to enable client-side functionality

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [story, setStory] = useState<string[]>([]);

  const handleGenerate = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate story: ${response.statusText}`);
      }

      const data = await response.json();
      setStory(data.story);
    } catch (error) {
      console.error("Error generating story:", error);
      alert("Failed to generate story. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center">
      <main className="w-full max-w-2xl flex flex-col gap-6">
        <h1 className="text-5xl font-mono text-center mb-8">
          Write a Story...
        </h1>

        <textarea
          className="w-full p-4 border border-gray-300 rounded-xl shadow min-h-[300px] resize-none font-mono focus:outline-none focus:ring-1 focus:ring-gray-300"
          placeholder="Push your imagination..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          className="bg-gray-500 hover:bg-gray-600 text-white font-mono py-10 px-8 rounded-lg transition-colors disabled:opacity-50 text-2xl"
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
        >
          {isLoading ? "Generating..." : "Generate Comic"}
        </button>

        {story.length > 0 && (
          <div className="mt-8 space-y-8">
            {story.map((panel, index) => (
              <div
                key={index}
                className="p-8 border-2 rounded-xl bg-white shadow-lg"
              >
                {panel.image && (
                  <div className="aspect-video mb-4 rounded-lg border overflow-hidden">
                    <Image
                      src={panel.image}
                      alt={`Panel ${index + 1}`}
                      width={768}
                      height={512}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="font-bold text-xl font-mono">
                    Panel {index + 1}
                  </h3>
                  <p className="font-mono">{panel.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
