import { NextResponse } from 'next/server';
import { getGoogleSheets } from '../../../lib/google';

export async function GET() {
    try {
        const sheets = await getGoogleSheets();
        const spreadsheetId = process.env.SPREADSHEET_ID;

        // 1. 유저 정보 가져오기 (A열: 이름)
        const userResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: '유저 정보!A2:A', // 헤더 제외하고 이름만
        });

        // 2. 마트 정보 가져오기 (A열: 이름, D열: ID)
        const martResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: '마트!A2:D',
        });

        const users = userResponse.data.values ? userResponse.data.values.flat() : [];

        // 마트 데이터 가공 (A열=이름, D열=ID)
        const marts = martResponse.data.values
            ? martResponse.data.values.map(row => ({ name: row[0], id: row[3] }))
            : [];

        return NextResponse.json({ users, marts });
    } catch (error) {
        console.error('Init Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}