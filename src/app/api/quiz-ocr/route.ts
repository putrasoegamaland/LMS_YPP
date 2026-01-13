import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
You are an expert OCR and Educational Content Parser.
Your task is to analyze an image of a quiz/exam and extract the structure into a strict JSON format.

OUTPUT FORMAT:
Return ONLY a JSON array of objects. Do not include markdown code blocks (\`\`\`json).
Structure:
[
  {
    "type": "choice" | "essay",
    "question": {
       "id": "Question text in Indonesian (or original language)",
       "en": "Question text translated to English (optional, okay to copy id if unsure)"
    },
    "options": ["Option A", "Option B", "Option C", "Option D"], // null if essay
    "correctAnswer": "The full text of the correct answer", // null if not marked
    "points": 10,
    "difficulty": "medium"
  }
]

RULES:
1. Detect if questions are multiple choice or essay/open-ended.
2. If there are checkmarks, circles, or highlights on an option, assume it is the correct answer.
3. If no answer is indicated, leave "correctAnswer" as null.
4. Clean up any OCR artifacts (e.g., stray dots, scanner lines).
5. For "options", exclude the letter (A, B, C) if it's just a label. We want the content.
6. If the image contains no readable text or is not a quiz, return an empty array [].
`;

export async function POST(req: NextRequest) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
        }

        // Parse base64
        // Format: "data:image/jpeg;base64,..."
        const matches = image.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
        }

        const mimeType = matches[1];
        const data = matches[2];

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent([
            SYSTEM_PROMPT,
            {
                inlineData: {
                    mimeType,
                    data
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up markdown if present (Gemini sometimes adds ```json ... ```)
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let questions;
        try {
            questions = JSON.parse(cleanText);
        } catch (e) {
            console.error('Failed to parse AI response:', cleanText);
            return NextResponse.json({ error: 'Failed to parse AI response', raw: cleanText }, { status: 500 });
        }

        return NextResponse.json({ questions });

    } catch (error) {
        console.error('Quiz OCR Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
