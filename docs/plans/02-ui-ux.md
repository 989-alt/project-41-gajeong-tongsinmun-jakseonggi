# UI/UX 설계 — 가정통신문 자동 작성기

> ui-ux-pro-max skill 적용. 브랜드: **Resend** (편집 UI) + **Notion**-paper (인쇄될 통신문). design.md 토큰 우선.

## 화면 구조 — 3-pane editor
```
┌──────────┬─────────────────────────┬─────────────────────────────┐
│ Sidebar  │ Form (scrollable)       │ Preview (A4 paper)          │
│ 280px    │ flex 1, max-w 460px     │ flex 1, A4 종횡비, 흰 종이  │
│ dark     │ dark                    │ light (인쇄 그대로)         │
└──────────┴─────────────────────────┴─────────────────────────────┘
```
모바일(<960px): 사이드바 → 상단 가로 스크롤 chip row, 폼/미리보기 세로 스택.

## Sidebar — 템플릿 선택 + 머리글 + 최근 통신문
1. 상단 브랜드 마크 "Letter Studio" (Domaine Display 대용 = Noto Serif KR Black + ss 효과 모사 letter-spacing tight).
2. 학교/학년/반/교사 머리글 폼 (collapse 가능).
3. 템플릿 7종 카드 — 선택 시 액센트 좌측 바.
4. "최근 통신문 5개" 리스트 — 비어있을 땐 안내 카피.
5. 하단: JSON 내보내기/가져오기 · 정보 초기화 · 다크/라이트 토글.

## Form — 동적 필드
- 선택된 템플릿 schema에 따라 필드 렌더.
- 공통 상단: 제목(자동 생성, 수정 가능) · 발송일.
- 본문 textarea — 마지막 칸. "AI로 본문 초안 받기" 버튼은 textarea 우상단.
- 모든 필드 `<label for>` 명시, 필수 칸은 `*` + aria-required.
- 입력 시 우측 미리보기 즉시 갱신.

## Preview — A4 paper
- 비율 1 : 1.414 (A4). 배경 `#ffffff`, 잉크 `#0a0a0c`.
- 폰트: 헤드 Noto Serif KR (700), 본문 Inter (또는 시스템 산세리프), 메타 캡션 ABC Favorit 대체 시스템 mono.
- 머리글 영역: 학교명 large serif, 학년/반/교사명 작은 캡션.
- 제목 영역: serif 32~36px, 양옆 hairline rule.
- 본문 영역: 16px / 1.7 line-height, 양끝맞춤(`text-align: justify`) — 인쇄물 분위기.
- 푸터: 발송일, 학교 직인 자리 박스 (선택).
- 인쇄 시 편집 UI hide → `@media print` 으로 preview 영역만 페이지에 채움.

## 색·타이포 (Resend 토큰)
- canvas `#000000`, surface-card `#0a0a0c`, surface-elevated `#101012`, hairline `rgba(255,255,255,0.06)`, hairline-strong `rgba(255,255,255,0.14)`.
- ink `#fcfdff`, body `rgba(252,253,255,0.86)`, mute `#a1a4a5`.
- 액센트: blue `#3b9eff` (선택·포커스) + orange `#ff801f` (저장·다운로드 액션).
- 폰트: Inter + Noto Serif KR + JetBrains Mono (대체) — 모두 로컬 폴백 system stack.
- 라운드: 8/12px. 그림자 거의 없음. 1px hairline border 빈도↑.

## 접근성 체크리스트
- [ ] 모든 input `<label for>` 연결.
- [ ] focus ring: 2px solid accent-blue + 2px offset.
- [ ] 대비: ink/body on canvas 모두 ≥ 14:1 (검정 배경에 흰 글씨), placeholder 4.7:1 측정.
- [ ] 키보드 only: 사이드바 카드 tabindex, enter로 선택.
- [ ] reduced-motion: 미리보기 갱신 transition 0으로 처리.
- [ ] 인쇄 미리보기에서 편집 UI 완전 숨김 확인.

## 마이크로 인터랙션
- 템플릿 카드 hover: 1px border → hairline-strong.
- 입력 갱신: 150ms ease 없음 (즉시 반영, depth 인지 부담 최소).
- PDF 버튼 클릭: 1.2s 비활성 + "생성 중…" spinner.
- AI 초안 버튼: 클릭 시 progress shimmer, 결과 도착하면 textarea fade.

## 빈 상태 (empty state)
- 머리글 미입력 + 템플릿 미선택 → 미리보기 영역에 흐릿한 placeholder paper + "왼쪽에서 템플릿을 선택해 주세요" 캡션.
