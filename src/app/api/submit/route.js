import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import axios from 'axios';

export async function POST(req) {
    try {
        const formData = await req.json();
        
        // 환경변수 체크
        const email = process.env.GOOGLE_CLIENT_EMAIL;
        const key = process.env.GOOGLE_PRIVATE_KEY;
        const spreadsheetId = process.env.SPREADSHEET_ID;

        if (!email || !key) throw new Error('구글 인증 환경변수 미설정');

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: email,
                private_key: key.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        // 1. 유저 정보 조회 (Slack ID 매칭용)
        const userSheetData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: '유저 정보!A2:F',
        });
        const userRows = userSheetData.data.values || [];
        const userInfo = userRows.find(row => row[0] === formData.요청자);

        const isDistributor = formData.요청자.includes('총판');
        const slackId = userInfo ? userInfo[3] : null; // D열 Slack ID
        const requesterGid = userInfo ? userInfo[5] : ''; // F열 GID

        // 2. 데이터 가공
        const timestamp = new Date();
        const requestId = timestamp.getTime();
        const requestDate = timestamp.toISOString().split('T')[0];

        // 요청 타입 요약
        let requestType = "기타";
        if (parseInt(formData.실내용X배너개수) > 0 || parseInt(formData.실외용X배너개수) > 0) requestType = "X배너";
        else if (formData.현수막가로) requestType = "현수막";
        else if (formData.전단지가로) requestType = "전단지";
        else if (formData.디자인용도) requestType = "디자인";

        // 구글 시트 행 데이터 (순서 중요)
        const newRow = [
            requestId,                  // 0: ID
            formData.요청자,            // 1: 요청자
            formData.마트명,            // 2: 마트명
            requestDate,                // 3: 요청일
            formData.마감기한,          // 4: 마감기한
            '', '',                     // 5, 6
            formData.실내용X배너개수 || 0, // 7
            Array.isArray(formData.x배너디자인) ? formData.x배너디자인.join(', ') : '', // 8
            formData.실외용X배너개수 || 0, // 9
            formData.디자인용도 || '',     // 10
            formData.현수막가로 || '',     // 11
            formData.현수막세로 || '',     // 12
            formData.현수막디자인 || '',   // 13
            formData.전단지가로 || '',     // 14
            formData.전단지세로 || '',     // 15
            formData.전단지디자인 || '',   // 16
            formData.기타 || '',           // 17
            '', '', '', '', '', '', '',    // 18~23
            requesterGid,                  // 24
            '', '',                        // 25, 26
            formData.디자인사이즈 || '',   // 27
            requestType,                   // 28
            formData.마트Id || ''          // 29
        ];

        // 3. 시트에 추가
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: '내역!A:A',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [newRow] },
        });

        // 4. 슬랙 알림
        const webhookUrl = isDistributor
            ? process.env.SLACK_WEBHOOK_DISTRIBUTOR
            : process.env.SLACK_WEBHOOK_NORMAL;

        if (webhookUrl) {
            let threadText = `◼︎ ${requestType} 요청\n`;
            if (requestType === 'X배너') threadText += `- 실내: ${newRow[7]}, 실외: ${newRow[9]}\n- 디자인: ${newRow[8]}`;
            if (requestType === '현수막') threadText += `- 사이즈: ${newRow[11]}x${newRow[12]}\n- 디자인: ${newRow[13]}`;
            if (requestType === '전단지') threadText += `- 사이즈: ${newRow[14]}x${newRow[15]}`;
            if (requestType === '기타') threadText += `- 내용: ${newRow[17]}`;
            
            await axios.post(webhookUrl, {
                requestId: requestId.toString(),
                requester: isDistributor ? formData.요청자 : slackId,
                storeName: formData.마트명,
                dueDate: formData.마감기한,
                thread: threadText,
                requestSummary: requestType,
                isDistributor: isDistributor
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Submit Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
