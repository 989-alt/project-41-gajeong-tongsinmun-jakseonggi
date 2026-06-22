# Cycle 1 — Tester 결과

## 발견 버그
| ID | 심각도 | 재현 절차 | 기대 | 실제 |
|---|---|---|---|---|
| B1 | P1 | 템플릿 선택 → 우측 미리보기 확인 | 빈 상태 placeholder 사라지고 통신문만 표시 | placeholder 텍스트("왼쪽에서 템플릿을 선택해 주세요")가 통신문 위에 겹쳐 노출 |

## 원인
`.paper-empty { position: absolute; inset: 0; display: flex; }` 의 `display: flex` 가 HTML `hidden` 속성이 부여하는 user-agent `display: none` 을 덮어씀.

## 자동화 통과
- 다른 모든 시나리오: 학교 정보 입력·저장, 7종 중 2종 템플릿 선택, 필드 → 미리보기 동기화, 템플릿 전환 시 상태 격리, PDF/인쇄 버튼 활성화, 라이트/다크 토글, 인쇄 후 최근 리스트 추가, 포커스 링 가시 — 모두 0 fail.
- Console error 0, page error 0.
