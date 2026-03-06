요청하신 날짜와 버전 정보를 포함하여 업데이트된 `README.md` 내용입니다.

---

# 마케팅 요청 시스템 (Marketing Request System)

이 프로젝트는 마트 유인물 및 디자인 자재(X배너, 현수막, 전단지 등)를 효율적으로 신청하고 관리하기 위한 Next.js 기반의 웹 애플리케이션입니다. 신청된 데이터는 구글 스프레드시트와 동기화되며, 슬랙(Slack)을 통해 실시간 알림이 발송됩니다.

## 📌 버전 정보

* **현재 버전**: v0.1.0
* **최근 업데이트**: 2026년 3월 6일

## 🚀 주요 기능

1. **단계별 신청 폼**: 기본 정보 입력, 품목 선택, 최종 확인의 3단계 프로세스를 통해 사용자 편의성을 높였습니다.
2. **복수 품목 분할 처리**: 한 번의 신청에 여러 종류의 디자인(예: X배너 + 현수막)이 포함된 경우, 구글 시트의 개별 행으로 나누어 저장하여 관리가 용이합니다.
3. **실시간 데이터 연동**: 구글 시트에서 유저 목록과 마트 정보를 실시간으로 불러와 선택할 수 있습니다.
4. **슬랙 알림 통합**: 일반 요청과 총판 요청을 구분하여 지정된 슬랙 채널로 상세 내역을 전송합니다.
5. **자체 로그 시스템**: Vercel의 짧은 로그 보관 주기를 보완하기 위해 구글 시트 내 '로그' 탭에 모든 성공/실패 기록을 영구적으로 저장합니다.

## 🛠 기술 스택

* **Framework**: Next.js (App Router)
* **Language**: JavaScript
* **Database/Storage**: Google Sheets API (v4)
* **Notification**: Slack Webhooks (Axios)
* **Deployment**: Vercel

## 📋 사전 준비 사항

프로젝트가 정상적으로 작동하려면 구글 스프레드시트에 다음 명칭의 시트(탭)들이 존재해야 합니다.

* **유저 정보**: 요청자 목록 및 Slack ID, GID 관리
* **마트**: 마트명, 담당자, 주문 가능 여부 관리
* **내역**: 신청 내역이 기록되는 메인 시트
* **로그**: 시스템 동작 및 에러 로그 기록용 시트

## ⚙️ 환경 변수 설정 (.env)

Vercel 또는 로컬 환경에 아래 변수들을 반드시 설정해야 합니다.

```env
GOOGLE_CLIENT_EMAIL=your-service-account-email
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"
SPREADSHEET_ID=your-google-spreadsheet-id
SLACK_WEBHOOK_NORMAL=your-slack-webhook-url-for-normal
SLACK_WEBHOOK_DISTRIBUTOR=your-slack-webhook-url-for-distributor

```

> **참고**: `GOOGLE_PRIVATE_KEY` 입력 시 줄바꿈 기호(`\n`) 처리에 주의하십시오.

## 🛠 주요 수정 사항 내역 (v0.1.0)
* **슬랙 페이로드 보완**: 슬랙 알림 발송 시 `requestDate`와 `storeId`가 누락되지 않도록 추가하였습니다.
* **빌드 오류 해결**: 모듈 참조 방식을 상대 경로로 변경하여 Vercel 배포 시 `Module not found` 에러를 해결했습니다.
* **열 밀림 현상 고정**: `newRow` 배열 인덱스를 강제 지정하여 데이터가 구글 시트의 정확한 위치(AC, AD열 등)에 기록되도록 개선했습니다.
* **데이터 행 분리 저장**: 여러 품목 신청 시 품목별로 고유 ID(`${baseRequestId}_${index}`)를 생성하여 구글 시트의 별개 행으로 저장하고 슬랙 알림도 각각 발송합니다.
