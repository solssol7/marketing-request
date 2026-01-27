import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. 환경변수 체크
        const email = process.env.GOOGLE_CLIENT_EMAIL;
        const key = process.env.GOOGLE_PRIVATE_KEY;
        const spreadsheetId = process.env.SPREADSHEET_ID;

        if (!email || !key || !spreadsheetId) {
            throw new Error('환경변수(GOOGLE_...)가 설정되지 않았습니다. Vercel Settings를 확인하세요.');
        }

        // 2. 구글 인증 (줄바꿈 문자 처리)
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: email,
                private_key: key.replace(/\\n/g, '\n'), // Vercel 환경변수 줄바꿈 처리
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        // 3. 데이터 가져오기
        const userRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: '유저 정보!A2:A' });
        const martRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: '마트!A2:D' });

        const users = userRes.data.values ? userRes.data.values.flat() : [];
        const marts = martRes.data.values
            ? martRes.data.values.map(row => ({
                name: row[0],
                orderable: row[1] === 'TRUE',
                date: row[2],
                id: row[3]
            }))
            : [];

        return NextResponse.json({ success: true, users, marts });

    } catch (error) {
        console.error('API Error:', error); // Vercel 로그에 남김
        // 에러가 나도 JSON 형식을 유지해서 반환 (Unexpected end of JSON 방지)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
