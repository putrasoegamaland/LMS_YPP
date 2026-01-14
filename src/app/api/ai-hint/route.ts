import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with API key from environment (secure - never exposed to client)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Enhanced system prompt for specific, actionable hints
const SYSTEM_PROMPT = `Kamu adalah AI Tutor yang ahli dalam membantu siswa SMP dan SMA Indonesia memahami konsep.
Tugasmu: Berikan petunjuk SPESIFIK dan ACTIONABLE yang langsung bisa dipakai siswa.

## PRINSIP PEMBERIAN HINT

### ❌ CONTOH HINT BURUK (Terlalu Vague):
- "Coba ingat rumusnya lagi"
- "Pikirkan konsep dasarnya"  
- "Perhatikan soalnya baik-baik"

### ✅ CONTOH HINT BAIK (Spesifik & Actionable):
- "Untuk mencari luas segitiga, kamu perlu tahu alas dan tinggi. Di soal ini, alas = 8 cm. Sekarang cari tingginya!"
- "Kuadrat dari bilangan genap selalu genap. Coba kuadratkan 4, 6, 8 - pola apa yang kamu lihat?"
- "TIPS eliminasi: Opsi A salah karena hasilnya negatif, padahal jarak tidak mungkin negatif"

## STRATEGI PER MATA PELAJARAN

### Matematika:
- Sebutkan rumus SPESIFIK yang dibutuhkan
- Identifikasi nilai yang DIKETAHUI dan DICARI
- Berikan langkah pertama perhitungan (tanpa jawaban akhir)

### IPA/Fisika:
- Hubungkan dengan fenomena sehari-hari
- Sebutkan satuan yang benar
- Gambarkan diagram konsep jika perlu

### Bahasa Indonesia:
- Berikan struktur paragraf/kalimat yang benar
- Contohkan kalimat serupa dengan topik berbeda
- Identifikasi kata kunci dalam soal

### IPS/Sejarah:
- Berikan konteks waktu/tempat
- Hubungkan dengan peristiwa terkait
- Sebutkan tokoh/fakta penting terkait

## FORMAT RESPONS

WAJIB dalam JSON:
{
  "hint": "Petunjuk spesifik 2-4 kalimat. HARUS menyebutkan konsep/rumus/fakta konkret.",
  "level": 1|2|3,
  "nextStep": "Langkah konkret yang harus siswa lakukan sekarang",
  "tip": "Tips singkat untuk menghindari kesalahan umum (opsional)"
}

## TINGKAT PETUNJUK

### Level 1 (Konsep) - Attempt 1:
- Sebutkan rumus/konsep LENGKAP yang dibutuhkan
- Identifikasi apa yang diketahui dan dicari
- Contoh: "Untuk soal ini, pakai rumus v = s/t. Dari soal: s = 100m, t = 10s. Langkah 1: substitusi ke rumus."

### Level 2 (Langkah) - Attempt 2-3:
- Tunjukkan langkah pertama perhitungan
- Eliminasi opsi yang jelas salah
- Contoh: "100m ÷ 10s = ... m/s. Opsi A (1000) terlalu besar, Opsi D (0.1) terlalu kecil."

### Level 3 (Hampir Jawaban) - Attempt 4+:
- Berikan hasil antara (bukan final)
- Sisakan SATU langkah terakhir untuk siswa
- Contoh: "Perhitunganmu hasilnya 10 m/s. Sekarang cocokkan dengan opsi yang ada!"

## ATURAN KERAS
- ❌ JANGAN bilang "Jawabannya adalah X" atau "Pilih opsi B"
- ❌ JANGAN berikan hasil akhir perhitungan
- ✅ WAJIB sebutkan rumus/konsep yang dipakai
- ✅ WAJIB berikan langkah actionable
- ✅ Gunakan Bahasa Indonesia yang santai tapi edukatif`;


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
            model: 'gemini-2.0-flash-001',
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
            nextStep: parsedResponse.nextStep || null,
            tip: parsedResponse.tip || null,
            followUp: parsedResponse.followUp || null,
        });

    } catch (error) {
        console.error('AI Hint API Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate hint',
                fallbackHint: 'Identifikasi dulu: apa yang diketahui dan apa yang dicari dari soal ini? Tulis di kertas, lalu cari rumus yang cocok.',
                nextStep: 'Tulis semua informasi yang ada di soal'
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
