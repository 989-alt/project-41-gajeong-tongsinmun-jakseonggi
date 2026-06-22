# Day 41 · #041 가정통신문 자동 작성기 (행정)

## 토픽 한 줄
행사·견학·안전공지 등 7종 템플릿에 빈 칸(날짜·장소·준비물)만 채우면 즉시 인쇄·PDF 가능한 정형 가정통신문이 완성된다.

## 원본 명세 (100-vibecoding-topics.md #041)
- **포함 기능**: 템플릿 7종 · 자동 줄바꿈·여백 · 학교/학년/반 머리글 자동 · PDF 인쇄
- **배제 기능**: 학부모 전자 발송, 외부 공유
- **기술 스택**: HTML/CSS/JS, print CSS, html2pdf
- **저장 방식**: localStorage(학교/반 머리글) + JSON
- **AI 옵션**: ⭕ (선택, Gemini로 본문 초안)
- **대상**: 교사용 · **환경**: 교사 업무
- **DESIGN.md**: Resend (커뮤니케이션) / 보조: Notion

## 구현 제약 결정
- **스택**: 단일 `index.html` + vanilla CSS + vanilla JS. 빌드 단계 0.
- **PDF**: `html2pdf.js` CDN(jsPDF + html2canvas 번들). 환경 차단 시 `window.print()` + print CSS로 graceful fallback.
- **Gemini**: 공용 프록시 (`https://gemini-proxy.1d1v.workers.dev`) + `gemini.js` 클라이언트 헬퍼. 모델 `gemini-2.5-flash`, `thinkingBudget: 0`. 본문 초안 1회 생성용.
- **저장**: localStorage key `gtm.school` (학교/학년/반/교사명) · `gtm.lastUsedTemplate` · `gtm.recentLetters`(JSON 5개 캐시).
- **편집 가능 모드**: 모든 입력은 폼 필드, 미리보기는 contenteditable 비활성 — 출력 정형성 우선.

## 7종 템플릿 (확정)
1. 현장 체험학습 안내
2. 학예 발표회 안내
3. 안전(폭염/한파/미세먼지) 알림
4. 학부모 상담 주간 안내
5. 방학식·개학식 안내
6. 준비물·과제 안내
7. 학교 행사(운동회·축제) 안내

## DESIGN.md 매핑
- **편집 UI** (사이드바·폼·미리보기 컨테이너): Resend 스타일 (검정 캔버스, 하얀 ink, 단일 액센트, 모노타입 코드, 12px 라운드).
- **인쇄될 통신문 자체**: 흰 종이 + 검정 잉크 + Noto Serif KR 헤드라인 + Inter 본문 (Notion 영향). 인쇄 친화.
- 충돌 시 design.md 가이드(타이포·색·간격 토큰) 우선.

## 성공 기준
- 7종 템플릿 모두 선택 가능 + 필드 입력 → 미리보기 즉시 반영.
- PDF 다운로드 1회 정상 동작 (jsPDF 폴백 포함).
- `window.print()` → 인쇄 미리보기에 편집 UI 미포함, 통신문만 A4 1장에 정렬.
- 학교/학년/반 정보 localStorage 영속화.
- Gemini 초안 생성: 키 입력 없이 프록시 호출, 실패 시 친화적 토스트.
- 접근성: 모든 필드 label, focus ring 가시, 대비 4.5:1.
- console error 0, page error 0.

## 비목표 (MUST NOT — 단계 2에서 확장)
- 학부모 이메일/SMS 발송 기능 어떤 형태도 금지.
- 학생 개인정보(이름·번호) 입력 칸 자체 금지.
- Gemini 키 직접 호출/저장/노출 금지 — 무조건 프록시.
