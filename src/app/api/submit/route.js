import { NextResponse } from 'next/server';
// 빌드 오류를 방지하기 위해 상대 경로로 수정
import { getGoogleSheets } from '../../../lib/google'; 
import axios from 'axios';

// 구글 시트에 로그를 기록하는 함수 (Vercel 로그 제한 우회용)
async function writeLog(sheets, spreadsheetId, message, details = '') {
    try {
        const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: '로그!A:C', 
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[timestamp, message, details]] },
        });
    } catch (e) {
        console.error('Sheet Logging Failed:', e);
    }
}

export async function POST(req) {
    let sheets;
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    try {
        const formData = await req.json();
        sheets = await getGoogleSheets();

        // 1. 유저 정보 조회
        const userSheetData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: '유저 정보!A2:F',
        });
        const userRows = userSheetData.data.values || [];
        const userInfo = userRows.find(row => row[0] === formData.요청자);

        const isDistributor = formData.요청자.includes('총판');
        const slackId = userInfo ? userInfo[3] : null; 
        const requesterGid = userInfo ? userInfo[5] : ''; 

        // 2. 요청 품목 분석 (X배너, 현수막 등이 섞여 있으면 분리)
        const categories = [];
        if (Number(formData.실내용X배너개수) > 0 || Number(formData.실외용X배너개수) > 0) categories.push("X배너");
        if (formData.현수막가로 || formData.현수막세로) categories.push("현수막");
        if (formData.전단지가로 || formData.전단지세로) categories.push("전단지");
        if (formData.디자인용도) categories.push("디자인");
        if (formData.기타 && categories.length === 0) categories.push("기타");
        else if (formData.기타) categories.push("기타");

        const timestamp = new Date();
        const baseRequestId = timestamp.getTime();
        
        // 요청일 생성 (KST 기준)
        const requestDate = new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'Asia/Seoul'
        }).replace(/\. /g, '-').replace(/\./g, '');

        const rowsToAppend = [];
        const slackNotifications = [];

        // 3. 품목별로 데이터 행(Row) 생성
        categories.forEach((type, index) => {
            const requestId = `${baseRequestId}_${index}`; // 각 행마다 고유한 ID 부여
            const newRow = Array(30).fill(''); // 30개의 빈 열 생성
            
            // 공통 정보 입력 (인덱스 주의)
            newRow[0] = requestId;          // A: ID
            newRow[1] = formData.요청자;     // B: 요청자
            newRow[2] = formData.마트명;     // C: 마트명
            newRow[3] = requestDate;        // D: 요청일 (시트 기록용)
            newRow[4] = formData.마감기한;   // E: 마감기한
            newRow[24] = requesterGid;      // Y: GID (25번째 열)
            newRow[28] = type;              // AC: 요청매체 (29번째 열) - 정확한 위치 고정
            newRow[29] = formData.마트Id;    // AD: 마트 ID (30번째 열) - 정확한 위치 고정

            let threadText = `◼︎ ${type} 요청\n`;

            if (type === "X배너") {
                newRow[7] = formData.실내용X배너개수 || 0;
                newRow[8] = Array.isArray(formData.x배너디자인) ? formData.x배너디자인.join(', ') : '';
                newRow[9] = formData.실외용X배너개수 || 0;
                threadText += `- 실내: ${newRow[7]}, 실외: ${newRow[9]}\n- 디자인: ${newRow[8]}`;
            } else if (type === "현수막") {
                newRow[11] = formData.현수막가로 || '';
                newRow[12] = formData.현수막세로 || '';
                newRow[13] = formData.현수막디자인 || '';
                threadText += `- 사이즈: ${newRow[11]}x${newRow[12]}\n- 디자인: ${newRow[13]}`;
            } else if (type === "전단지") {
                newRow[14] = formData.전단지가로 || '';
                newRow[15] = formData.전단지세로 || '';
                newRow[16] = formData.전단지디자인 || '';
                threadText += `- 사이즈: ${newRow[14]}x${newRow[15]}`;
            } else if (type === "디자인") {
                newRow[10] = formData.디자인용도 || '';
                newRow[27] = formData.디자인사이즈 || '';
                threadText += `- 용도: ${newRow[10]}\n- 사이즈: ${newRow[27]}`;
            } else if (type === "기타") {
                newRow[17] = formData.기타 || '';
                threadText += `- 내용: ${newRow[17]}`;
            }

            rowsToAppend.push(newRow);
            slackNotifications.push({ type, threadText, requestId });
        });

        // 4. 구글 시트 전송
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: '내역!A:A',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: rowsToAppend },
        });

        // 5. 슬랙 알림 전송 (항목별 개별 메시지)
        const webhookUrl = isDistributor ? process.env.SLACK_WEBHOOK_DISTRIBUTOR : process.env.SLACK_WEBHOOK_NORMAL;
        if (webhookUrl) {
            for (const notice of slackNotifications) {
                await axios.post(webhookUrl, {
                    requestId: notice.requestId,
                    requester: isDistributor ? formData.요청자 : slackId,
                    storeName: formData.마트명,
                    requestDate: requestDate, // ★ 추가됨: 이제 슬랙에서도 요청일이 보입니다.
                    dueDate: formData.마감기한,
                    thread: notice.threadText,
                    requestSummary: notice.type,
                    isDistributor: isDistributor
                });
            }
        }

        // 로그 기록
        await writeLog(sheets, spreadsheetId, 'SUCCESS', `${formData.마트명} (${categories.join(', ')})`);
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('API Error:', error);
        if (sheets) await writeLog(sheets, spreadsheetId, 'ERROR', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
