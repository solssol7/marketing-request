import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// 구글 인증 로직을 API 내부로 가져와 디버깅 용이하게 변경
async function getSheetsClient() {
    try {
        const email = process.env.GOOGLE_CLIENT_EMAIL;
        const key = process.env.GOOGLE_PRIVATE_KEY;

        console.log('[Debug] Auth Info Check:', {
            hasEmail: !!email,
            hasKey: !!key,
            keyLength: key ? key.length : 0
        });

        if (!email || !key) {
            throw new Error('환경변수(GOOGLE_CLIENT_EMAIL 또는 GOOGLE_PRIVATE_KEY)가 설정되지 않았습니다.');
        }

        // 줄바꿈 문자 처리 강화
        const formattedKey = key.replace(/\\n/g, '\n');

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: email,
                private_key: formattedKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const client = await auth.getClient();
        return google.sheets({ version: 'v4', auth: client });
    } catch (e) {
        console.error('[Debug] Auth Error:', e);
        throw new Error(`구글 인증 실패: ${e.message}`);
    }
}

export async function GET() {
    const debugLogs = [];
    const log = (msg) => {
        console.log(`[API] ${msg}`);
        debugLogs.push(msg);
    };

    try {
        log('Init API 시작');
        
        const spreadsheetId = process.env.SPREADSHEET_ID;
        log(`Spreadsheet ID 확인: ${spreadsheetId ? 'OK' : 'MISSING'}`);
        
        if (!spreadsheetId) throw new Error('SPREADSHEET_ID 환경변수가 없습니다.');

        const sheets = await getSheetsClient();
        log('구글 시트 클라이언트 생성 성공');

        // 1. 유저 정보 가져오기
        log('유저 정보 조회 시도 (유저 정보!A2:A)');
        const userResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: '유저 정보!A2:A',
        });
        const users = userResponse.data.values ? userResponse.data.values.flat() : [];
        log(`유저 데이터 ${users.length}건 로드됨`);

        // 2. 마트 정보 가져오기
        log('마트 정보 조회 시도 (마트!A2:D)');
        const martResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: '마트!A2:D',
        });
        
        const marts = martResponse.data.values
            ? martResponse.data.values.map(row => ({ name: row[0], id: row[3] || 'NoID' }))
            : [];
        log(`마트 데이터 ${marts.length}건 로드됨`);

        return NextResponse.json({ 
            success: true,
            users, 
            marts,
            debugLogs // 클라이언트 디버그 패널용
        });

    } catch (error) {
        console.error('[API Error]', error);
        return NextResponse.json({ 
            success: false,
            error: error.message,
            stack: error.stack,
            debugLogs 
        }, { status: 500 });
    }
}
