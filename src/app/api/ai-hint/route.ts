import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with API key from environment (secure - never exposed to client)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// System prompt that enforces hint-only behavior with context awareness
const SYSTEM_PROMPT = `Kamu adalah AI Hint Assistant yang cerdas untuk LMS pendidikan SMP dan SMA di Indonesia.
Tugasmu adalah membantu siswa memahami materi dan menyelesaikan soal SENDIRI, bukan memberitahu jawabannya.

PRINSIP UTAMA:
1. **Analisis Konteks**: Perhatikan baik-baik soal, opsi jawaban (jika ada), dan rubrik (jika essay).
2. **Socratic Method**: Ajukan pertanyaan yang memancing pemikiran kritis siswa.
3. **Step-by-Step**: Bimbing siswa langkah demi langkah. Jangan loncat ke hasil akhir.
4. **Adaptif**: Sesuaikan level bantuan dengan 'attemptCount'. Awalnya berikan clue umum, lalu makin spesifik jika siswa masih salah.

ATURAN KERAS (HARD RULES):
- ❌ JANGAN BERIKAN JAWABAN AKHIR (angka/pilihan). Contoh: Jangan bilang "Jawabannya C" atau "Hasilnya 10".
- ❌ JANGAN selesaikan seluruh persamaan matematika sekaligus.
- ❌ JANGAN tuliskan essay penuh untuk siswa.
- ✅ GUNAKAN Bahasa Indonesia yang edukatif, menyemangati, dan mudah dipahami siswa SMP/SMA.
- ✅ JIKA soal pilihan ganda, bahas mengapa opsi lain mungkin salah atau arahkan ke cara mengeleminasi.

TINGKAT PETUNJUK (LEVELS):
- Level 1 (Konsep): Ingatkan rumus, definisi, atau konsep dasar yang relevan. Jangan bahas angka soal dulu.
- Level 2 (Aplikasi): Berikan panduan cara menggunakan rumus/konsep pada soal ini. Tanyakan "Langkah pertama apa?".
- Level 3 (Spesifik): Berikan contoh paralel dengan angka berbeda, atau cek langkah perhitungan mereka.

FORMAT RESPONS JSON:
{
  "hint": "Teks petunjukmu di sini (max 3 kalimat)",
  "level": 1|2|3,
  "followUp": "Pertanyaan pendek untuk memancing siswa berpikir (opsional)"
}`;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { question, subject, attemptCount, userMessage, context, language = 'id' } = body;

        // Validate required fields
        if (!question) {
            return NextResponse.json(
                { error: 'Question is required' },
                { status: 400 }
            );
        }

        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'API key not configured' },
                { status: 500 }
            );
        }

        // Determine hint level based on attempts
        const hintLevel = attemptCount <= 1 ? 1 : attemptCount <= 3 ? 2 : 3;

        // Build the rich context prompt
        const additionalContext = context ? `
Informasi Tambahan:
${context.options ? `- Opsi Jawaban: ${context.options.join(', ')}` : ''}
${context.rubric ? `- Rubrik/Kriteria: ${context.rubric}` : ''}
${context.type ? `- Tipe Soal: ${context.type}` : ''}
` : '';

        const userPrompt = `
Konteks Pembelajaran:
- Mata Pelajaran: ${subject || 'Umum'}
- Bahasa Pengantar: ${language === 'id' ? 'Bahasa Indonesia' : 'English'}
- Level Bantuan: Level ${hintLevel} (Attempt ke-${attemptCount})
${additionalContext}

SOAL SISWA:
"${question}"

${userMessage ? `PERTANYAAN/INPUT SISWA:\n"${userMessage}"` : 'Siswa meminta petunjuk umum.'}

TUGAS:
Berikan petunjuk Level ${hintLevel} yang spesifik untuk soal ini. 
Ingat: JANGAN beri jawaban langsung. Fokus pada pemahaman konsep.
`;

        // Call Gemini API
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 300,
            },
        });

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                {
                    role: 'model',
                    parts: [{ text: 'Saya mengerti. Saya akan memberikan petunjuk saja, tidak pernah jawaban langsung. Saya siap membantu siswa belajar dengan cara yang benar.' }],
                },
            ],
        });

        const result = await chat.sendMessage(userPrompt);
        const responseText = result.response.text();

        // Try to parse as JSON, fallback to plain text
        let parsedResponse;
        try {
            // Extract JSON from response if wrapped in markdown code blocks
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                [null, responseText];
            parsedResponse = JSON.parse(jsonMatch[1] || responseText);
        } catch {
            // If not valid JSON, wrap the text response
            parsedResponse = {
                hint: responseText.trim(),
                level: hintLevel,
            };
        }

        return NextResponse.json({
            success: true,
            hint: parsedResponse.hint,
            level: parsedResponse.level || hintLevel,
            followUp: parsedResponse.followUp || null,
        });

    } catch (error) {
        console.error('AI Hint API Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate hint',
                fallbackHint: 'Coba pikirkan langkah pertama yang perlu dilakukan. Apa yang kamu ketahui tentang soal ini?'
            },
            { status: 500 }
        );
    }
}

// Only allow POST requests
export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}
