# Cycle 1 — Full Stack Dev 수정

## B1: 빈 상태 placeholder 겹침
**파일**: `styles.css`

```css
.paper-empty[hidden],
.paper-doc[hidden] { display: none !important; }
```

**근거**: `[hidden]` 속성에 대한 CSS 규칙을 명시해 `display: flex` 보다 더 구체적 + `!important` 로 user-agent 와 동일한 강제력 부여. 단순·로컬 수정.

## e2e 보강
`tests/e2e.py` 의 템플릿 선택 직후 단계에 `expect(page.locator("#paper-empty")).to_be_hidden()` 명시적 가시성 검증 추가.

## Cycle 1 재실행
Failures: 0. Console / page error 0. Loop 종료 조건 충족 (P0·P1 0건 + e2e 0 fail) → 배포 단계로 진행.
