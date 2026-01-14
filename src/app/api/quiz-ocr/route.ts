import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Enhanced prompt with teacher preferences support
const buildPrompt = (preferences?: {
    questionType?: 'choice' | 'essay' | 'mixed';
    difficulty?: 'easy' | 'medium' | 'hard';
    count?: number;
}) => {
    const questionTypeGuide = preferences?.questionType === 'choice'
        ? 'Generate ONLY multiple choice questions.'
        : preferences?.questionType === 'essay'
            ? 'Generate ONLY essay/open-ended questions.'
            : 'Generate a mix of multiple choice and essay questions as appropriate.';

    const difficultyGuide = preferences?.difficulty === 'easy'
        ? 'Questions should be basic/foundational level, suitable for beginners.'
        : preferences?.difficulty === 'hard'
            ? 'Questions should be challenging, requiring deep understanding and application.'
            : 'Questions should be moderate difficulty, testing comprehension and basic application.';

    const countGuide = preferences?.count
        ? `Generate approximately ${preferences.count} questions.`
        : 'Generate as many questions as you can find from the material.';

    return `
You are an expert OCR and Educational Content Parser for Indonesian schools (SD, SMP, SMA).
Your task is to analyze an image of educational material and generate quiz questions.

TEACHER PREFERENCES:
- ${questionTypeGuide}
- ${difficultyGuide}
- ${countGuide}

OUTPUT FORMAT:
Return ONLY a JSON object. Do not include markdown code blocks.
{
  "subject": "Detected subject (e.g., Matematika, IPA, Farmasi)",
  "gradeLevel": "Estimated grade level (e.g., SD Kelas 4, SMP Kelas 9)",
  "questions": [
    {
      "type": "choice" | "essay",
      "question": "Question text in Indonesian",
      "options": ["Option A", "Option B", "Option C", "Option D"], // null if essay
      "correctAnswer": "The correct answer text", // null if not determinable
      "points": 10,
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}

RULES:
1. Read and understand the material from the image first.
2. Generate questions that test understanding of the material.
3. For multiple choice: always provide 4 options, with only 1 correct answer.
4. For essay: create open-ended questions that require explanation.
5. If the image contains existing quiz questions, extract and format them.
6. Clean up any OCR artifacts (stray dots, scanner lines).
7. Use Bahasa Indonesia for all questions.
8. If the image is unreadable or not educational content, return {"questions": []}.
`;
};

export async function POST(req: NextRequest) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({
            error: 'API key not configured',
            message: 'GEMINI_API_KEY tidak dikonfigurasi. Silakan tambahkan di .env.local'
        }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { image, preferences } = body;

        if (!image) {
            return NextResponse.json({
                error: 'Image data is required',
                message: 'Data gambar diperlukan'
            }, { status: 400 });
        }

        // Parse base64
        // Format: "data:image/jpeg;base64,..."
        const matches = image.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return NextResponse.json({
                error: 'Invalid image format',
                message: 'Format gambar tidak valid'
            }, { status: 400 });
        }

        const mimeType = matches[1];
        const data = matches[2];

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-001',
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
            }
        });

        const prompt = buildPrompt(preferences);

        const result = await model.generateContent([
            prompt,
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

        let parsed;
        try {
            parsed = JSON.parse(cleanText);
        } catch (e) {
            console.error('Failed to parse AI response:', cleanText);
            return NextResponse.json({
                error: 'Failed to parse AI response',
                message: 'Gagal memproses respons AI. Coba lagi dengan gambar yang lebih jelas.',
                raw: cleanText
            }, { status: 500 });
        }

        // Normalize response format
        const questions = parsed.questions || parsed;
        const metadata = {
            subject: parsed.subject || 'Umum',
            gradeLevel: parsed.gradeLevel || 'Tidak terdeteksi',
        };

        return NextResponse.json({
            success: true,
            questions: Array.isArray(questions) ? questions : [],
            metadata,
            count: Array.isArray(questions) ? questions.length : 0
        });

    } catch (error: any) {
        console.error('Quiz OCR Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: error?.message || 'Terjadi kesalahan saat memproses gambar'
        }, { status: 500 });
    }
}
