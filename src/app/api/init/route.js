import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

async function getSheetsClient() {
    const email = process.env.GOOGLE_CLIENT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!email || !key) throw new Error('구글 인증 환경변수 미설정');

    const auth = new google.auth.GoogleAuth({
        credentials: { client_email: email, private_key: key },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return google.sheets({ version: 'v4', auth: await auth.getClient() });
}

export async function GET() {
    try {
        const sheets = await getSheetsClient();
        const spreadsheetId = process.env.SPREADSHEET_ID;

        // 유저 정보
        const userRes = await sheets.spreadsheets.values.get({
            spreadsheetId, range: '유저 정보!A2:A',
        });
        
        // 마트 정보 (A:이름, B:주문가능, C:등록날짜, D:ID)
        const martRes = await sheets.spreadsheets.values.get({
            spreadsheetId, range: '마트!A2:D',
        });

        const users = userRes.data.values ? userRes.data.values.flat() : [];
        
        // 마트 데이터 가공
        const marts = martRes.data.values
            ? martRes.data.values.map(row => ({
                name: row[0],
                orderable: row[1] === 'TRUE', // 문자열 'TRUE'를 불린으로 변환
                date: row[2],
                id: row[3]
            }))
            : [];

        return NextResponse.json({ success: true, users, marts });

    } catch (error) {
        console.error('Init Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
