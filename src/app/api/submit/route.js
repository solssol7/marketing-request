import { NextResponse } from 'next/server';
import { getGoogleSheets } from '../../../lib/google';
import axios from 'axios';

export async function POST(req) {
    try {
        const formData = await req.json(); // 프론트에서 보낸 데이터 받기
        const sheets = await getGoogleSheets();
        const spreadsheetId = process.env.SPREADSHEET_ID;

        // 1. 유저 정보 시트에서 Slack ID 등 조회
        const userSheetData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: '유저 정보!A2:F',
        });
        const userRows = userSheetData.data.values || [];

        // 유저 찾기 함수
        const findUser = (name) => userRows.find(row => row[0] === name);

        const requesterName = formData['요청자'];
        const userInfo = findUser(requesterName);

        // 총판 여부 및 Slack ID, GID 확인
        const isDistributor = requesterName.includes('총판');
        const slackId = userInfo ? userInfo[3] : null; // D열
        const requesterGid = userInfo ? userInfo[5] : ''; // F열 (이메일 등)

        // 2. 데이터 가공 (기존 GAS 로직 매핑)
        const timestamp = new Date();
        const requestId = timestamp.getTime();
        const requestDate = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD

        // 요청 타입 결정 함수
        const getRequestType = (data) => {
            if (parseInt(data['실내용X배너개수']) > 0 || parseInt(data['실외용X배너개수']) > 0) return "X배너";
            if (data['현수막가로'] && data['현수막세로']) return "현수막";
            if (data['전단지가로'] && data['전단지세로']) return "전단지";
            if (data['디자인사이즈'] && data['디자인용도']) return "디자인";
            if (data['기타']) return "기타";
            return "알 수 없음";
        };

        const requestType = getRequestType(formData);

        // 시트에 들어갈 행 데이터 생성 (인덱스 주의!)
        // GAS 코드의 배열 순서와 정확히 일치시킴
        const newRow = [
            requestId,                  // 0: ID
            requesterName,              // 1: 요청자
            formData['마트명'],         // 2: 마트명
            requestDate,                // 3: 요청일
            formData['마감기한'],       // 4: 마감기한
            '', '',                     // 5, 6: 공란
            formData['실내용X배너개수'] || 0, // 7
            Array.isArray(formData['x배너디자인']) ? formData['x배너디자인'].join(', ') : formData['x배너디자인'], // 8
            formData['실외용X배너개수'] || 0, // 9
            formData['디자인용도'] || '',     // 10
            formData['현수막가로'] || '',     // 11
            formData['현수막세로'] || '',     // 12
            formData['현수막디자인'] || '',   // 13
            formData['전단지가로'] || '',     // 14
            formData['전단지세로'] || '',     // 15
            formData['전단지디자인'] || '',   // 16
            formData['기타'] || '',           // 17
            '', '', '', '', '', '', '',       // 18~23: 공란
            requesterGid,                     // 24: 요청자 GID (이메일)
            '', '',                           // 25, 26
            formData['디자인사이즈'] || '',   // 27
            requestType,                      // 28: 요청 요약
            formData['마트Id']                // 29: 마트 ID
        ];

        // 3. 구글 시트 '내역' 탭에 추가
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: '내역!A:A',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [newRow] },
        });

        // 4. 슬랙 전송
        const webhookUrl = isDistributor
            ? process.env.SLACK_WEBHOOK_DISTRIBUTOR
            : process.env.SLACK_WEBHOOK_NORMAL;

        // 슬랙 쓰레드 텍스트 생성 (간소화)
        let threadText = `◼︎ ${requestType}\n`;
        if (requestType === 'X배너') threadText += `- 실내: ${newRow[7]}, 실외: ${newRow[9]}\n- 디자인: ${newRow[8]}`;
        if (requestType === '현수막') threadText += `- 사이즈: ${newRow[11]}x${newRow[12]}\n- 디자인: ${newRow[13]}`;
        if (requestType === '전단지') threadText += `- 사이즈: ${newRow[14]}x${newRow[15]}\n- 디자인: ${newRow[16]}`;
        if (requestType === '기타') threadText += `- 내용: ${newRow[17]}`;
        if (requestType === '디자인') threadText += `- 용도: ${newRow[10]}, 사이즈: ${newRow[27]}`;

        await axios.post(webhookUrl, {
            requestId: requestId.toString(),
            requester: isDistributor ? requesterName : slackId, // 총판은 이름, 일반은 ID 맨션
            storeName: formData['마트명'],
            storeId: formData['마트Id'],
            requestDate: requestDate,
            dueDate: formData['마감기한'],
            thread: threadText,
            requestSummary: requestType,
            isDistributor: isDistributor
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Submit Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}