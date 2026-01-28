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
            throw new Error('환경변수 설정 오류: Vercel Settings를 확인하세요.');
        }

        // 2. 구글 인증
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: email,
                private_key: key.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        // 3. 데이터 가져오기
        const userRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: '유저 정보!A2:A' });
        
        // [수정됨] 범위 확장 A2:D -> A2:E (E열 담당자 포함)
        const martRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: '마트!A2:E' });

        const users = userRes.data.values ? userRes.data.values.flat() : [];
        
        const marts = martRes.data.values
            ? martRes.data.values.map(row => ({
                name: row[0],             // A열: 마트명
                orderable: row[1] === 'TRUE', // B열: 주문가능여부
                date: row[2],             // C열: 등록날짜
                id: row[3],               // D열: ID
                manager: row[4] || '-'    // [추가됨] E열: 담당자 (없으면 '-')
            }))
            : [];

        return NextResponse.json({ success: true, users, marts });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
