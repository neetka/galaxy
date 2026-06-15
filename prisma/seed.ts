import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding started...");

  // Delete all existing workflows for the placeholder user
  await prisma.workflow.deleteMany({
    where: {
      userId: "user_placeholder",
    },
  });

  const nodes = [
    {
      id: "request-inputs-1",
      type: "requestInputs",
      position: { x: 100, y: 300 },
      data: {
        label: "Request Inputs",
        fields: [
          { id: "text-input", name: "Product Text Description", type: "text_field", value: "A high-performance gaming laptop with RTX 4080 graphics and a beautiful OLED screen." },
          { id: "image-input", name: "Product Image", type: "image_field", value: "" },
        ],
      },
      deletable: false,
    },
    {
      id: "crop-image-1",
      type: "cropImage",
      position: { x: 400, y: 100 },
      data: {
        label: "Crop Image #1",
        x: 0,
        y: 0,
        width: 50,
        height: 50,
      },
    },
    {
      id: "crop-image-2",
      type: "cropImage",
      position: { x: 400, y: 500 },
      data: {
        label: "Crop Image #2",
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      },
    },
    {
      id: "gemini-1",
      type: "gemini",
      position: { x: 400, y: 300 },
      data: {
        label: "Gemini #1 (Copywriter)",
        model: "gemini-3.1-pro",
        systemPrompt: "You are a marketing copywriter. Write a one-paragraph product description.",
        prompt: "",
        temperature: 0.7,
        maxTokens: 8192,
        topP: 0.95,
      },
    },
    {
      id: "gemini-2",
      type: "gemini",
      position: { x: 700, y: 300 },
      data: {
        label: "Gemini #2 (Twitter Hook)",
        model: "gemini-3.1-pro",
        systemPrompt: "Condense the following product description into a tweet-length hook under 240 characters.",
        prompt: "",
        temperature: 0.7,
        maxTokens: 8192,
        topP: 0.95,
      },
    },
    {
      id: "final-gemini",
      type: "gemini",
      position: { x: 1000, y: 300 },
      data: {
        label: "Final Gemini (Social Post)",
        model: "gemini-3.1-pro",
        systemPrompt: "You are a social media manager. Combine the tweet hook and the two product crops into a final marketing post.",
        prompt: "",
        temperature: 0.7,
        maxTokens: 8192,
        topP: 0.95,
      },
    },
    {
      id: "response-1",
      type: "response",
      position: { x: 1300, y: 300 },
      data: {
        label: "Response",
        result: "",
      },
      deletable: false,
    },
  ];

  const edges = [
    {
      id: "e1",
      source: "request-inputs-1",
      target: "crop-image-1",
      sourceHandle: "image-input_image",
      targetHandle: "inputImage",
      animated: true,
      style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
    },
    {
      id: "e2",
      source: "request-inputs-1",
      target: "crop-image-2",
      sourceHandle: "image-input_image",
      targetHandle: "inputImage",
      animated: true,
      style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
    },
    {
      id: "e3",
      source: "request-inputs-1",
      target: "gemini-1",
      sourceHandle: "text-input",
      targetHandle: "prompt",
      animated: true,
      style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
    },
    {
      id: "e4",
      source: "gemini-1",
      target: "gemini-2",
      sourceHandle: "response",
      targetHandle: "prompt",
      animated: true,
      style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
    },
    {
      id: "e5",
      source: "crop-image-1",
      target: "final-gemini",
      sourceHandle: "outputImage",
      targetHandle: "image",
      animated: true,
      style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
    },
    {
      id: "e6",
      source: "crop-image-2",
      target: "final-gemini",
      sourceHandle: "outputImage",
      targetHandle: "image",
      animated: true,
      style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
    },
    {
      id: "e7",
      source: "gemini-2",
      target: "final-gemini",
      sourceHandle: "response",
      targetHandle: "prompt",
      animated: true,
      style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
    },
    {
      id: "e8",
      source: "final-gemini",
      target: "response-1",
      sourceHandle: "response",
      targetHandle: "result",
      animated: true,
      style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
    },
  ];

  await prisma.workflow.create({
    data: {
      userId: "user_placeholder",
      name: "Social Marketing Campaign",
      nodes: nodes as any,
      edges: edges as any,
    },
  });

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
