import { NextResponse } from 'next/server';
// 빌드 오류 방지를 위해 상대 경로 사용
import { getGoogleSheets } from '../../../lib/google'; 
import axios from 'axios';

/**
 * 구글 시트에 상세 로그를 기록하는 함수 (IP 및 기기 정보 포함)
 */
async function writeLog(sheets, spreadsheetId, status, requester, ip, ua, details = '') {
    try {
        const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: '로그!A:F', // 컬럼이 A~F까지 확장됨
            valueInputOption: 'USER_ENTERED',
            requestBody: { 
                values: [[timestamp, status, requester, ip, ua, details]] 
            },
        });
    } catch (e) {
        console.error('Sheet Logging Failed:', e);
    }
}

export async function POST(req) {
    let sheets;
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    // 1. 접속자 메타데이터 추출 (IP 및 User-Agent)
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'Unknown';
    const ua = req.headers.get('user-agent') || 'Unknown';
    
    let requesterName = 'Unknown';

    try {
        const formData = await req.json();
        requesterName = formData.요청자 || 'Unknown';
        sheets = await getGoogleSheets();

        // 2. 유저 정보 조회
        const userSheetData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: '유저 정보!A2:F',
        });
        const userRows = userSheetData.data.values || [];
        const userInfo = userRows.find(row => row[0] === formData.요청자);

        const isDistributor = formData.요청자.includes('총판');
        const slackId = userInfo ? userInfo[3] : null; 
        const requesterGid = userInfo ? userInfo[5] : ''; 

        // 3. 요청 품목 분석 (분할 처리)
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
            year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul'
        }).replace(/\. /g, '-').replace(/\./g, '');

        const rowsToAppend = [];
        const slackNotifications = [];

        // 4. 품목별 개별 행 데이터 생성
        categories.forEach((type, index) => {
            const requestId = `${baseRequestId}_${index}`;
            const newRow = Array(30).fill(''); 
            
            newRow[0] = requestId;
            newRow[1] = formData.요청자;
            newRow[2] = formData.마트명;
            newRow[3] = requestDate;
            newRow[4] = formData.마감기한;
            newRow[24] = requesterGid;
            newRow[28] = type;
            newRow[29] = formData.마트Id;

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

        // 5. 구글 시트 저장
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: '내역!A:A',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: rowsToAppend },
        });

        // 6. 슬랙 알림 발송 (storeId, requestDate 포함)
        const webhookUrl = isDistributor ? process.env.SLACK_WEBHOOK_DISTRIBUTOR : process.env.SLACK_WEBHOOK_NORMAL;
        if (webhookUrl) {
            for (const notice of slackNotifications) {
                await axios.post(webhookUrl, {
                    requestId: notice.requestId,
                    requester: isDistributor ? formData.요청자 : slackId,
                    storeName: formData.마트명,
                    storeId: formData.마트Id,
                    requestDate: requestDate,
                    dueDate: formData.마감기한,
                    thread: notice.threadText,
                    requestSummary: notice.type,
                    isDistributor: isDistributor
                });
            }
        }

        // 성공 로그 기록 (IP/UA 포함)
        await writeLog(sheets, spreadsheetId, 'SUCCESS', requesterName, ip, ua, `${formData.마트명} (${categories.join(', ')})`);
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('API Error:', error);
        if (sheets) {
            await writeLog(sheets, spreadsheetId, 'ERROR', requesterName, ip, ua, error.message);
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
