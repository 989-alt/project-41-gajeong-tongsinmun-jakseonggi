// 7종 가정통신문 템플릿 schema.
// 각 템플릿:
//  - id, label, icon, sub
//  - signatureLabel (서명란 라벨)
//  - sections: [{ title, fields: [{ name, label, type, layout, required, placeholder, hint }] }]
//  - body: default textarea content (지시 톤의 안내문)
//  - render(values, header): { title, summary, fields: [[label, value]], body, dateLabel, signatureLabel }

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, "0")}월 ${String(d.getDate()).padStart(2, "0")}일`;
};
const fmtDateRange = (a, b) => {
  if (a && b && a !== b) return `${fmtDate(a)} ~ ${fmtDate(b)}`;
  return fmtDate(a || b);
};

export const TEMPLATES = [
  {
    id: "fieldtrip",
    label: "현장 체험학습 안내",
    sub: "견학·체험학습",
    icon: "체",
    signatureLabel: "담임 교사",
    sections: [
      {
        title: "기본",
        fields: [
          { name: "title", label: "통신문 제목", type: "text", layout: "single", placeholder: "예) 5학년 1반 가을 현장 체험학습 안내" },
          { name: "summary", label: "한 줄 요약", type: "text", layout: "single", placeholder: "예) 국립중앙박물관 견학 일정 및 준비물 안내" },
        ],
      },
      {
        title: "일정",
        fields: [
          { name: "date", label: "일시", type: "date", layout: "double", required: true },
          { name: "endDate", label: "종료일 (당일이면 동일)", type: "date", layout: "double" },
          { name: "departTime", label: "출발 시각", type: "time", layout: "double" },
          { name: "arriveTime", label: "도착 시각 (귀가)", type: "time", layout: "double" },
        ],
      },
      {
        title: "장소·이동",
        fields: [
          { name: "place", label: "체험 장소", type: "text", layout: "single", required: true, placeholder: "예) 국립중앙박물관" },
          { name: "meetPoint", label: "집결 장소", type: "text", layout: "double", placeholder: "예) 학교 정문 앞" },
          { name: "dismissPoint", label: "해산 장소", type: "text", layout: "double", placeholder: "예) 학교 정문 앞" },
          { name: "transport", label: "교통수단", type: "text", layout: "single", placeholder: "예) 전세버스 2대" },
        ],
      },
      {
        title: "준비·인솔",
        fields: [
          { name: "items", label: "준비물", type: "textarea", layout: "single", placeholder: "예) 점심 도시락, 물 1병, 필기구, 우산(우천 시)" },
          { name: "leaders", label: "인솔자", type: "text", layout: "double", placeholder: "예) 담임 1명, 보조 교사 1명" },
          { name: "emergency", label: "비상 연락", type: "text", layout: "double", placeholder: "예) 학교 02-000-0000" },
        ],
      },
      {
        title: "본문",
        fields: [
          { name: "body", label: "본문", type: "textarea", layout: "single", rows: 8 },
        ],
      },
    ],
    defaults: {
      body:
        "안녕하세요, 학부모님. 학생들의 견문을 넓히고자 아래와 같이 현장 체험학습을 실시합니다. 교통안전과 단체 활동에 대한 사전 지도를 마쳤으며, 인솔 교사 책임하에 안전하게 진행하겠습니다. 학생이 즐겁고 안전하게 다녀올 수 있도록 가정에서도 복장과 컨디션 관리에 협조 부탁드립니다.",
    },
    render(v, h) {
      return {
        title: v.title || "현장 체험학습 안내",
        summary: v.summary || "",
        fields: [
          ["일시", fmtDateRange(v.date, v.endDate) + (v.departTime ? ` (출발 ${v.departTime})` : "")],
          ["장소", v.place || ""],
          ["집결·해산", [v.meetPoint, v.dismissPoint].filter(Boolean).join(" / ")],
          ["교통수단", v.transport || ""],
          ["준비물", v.items || ""],
          ["인솔자", v.leaders || ""],
          ["비상 연락", v.emergency || ""],
        ],
        body: v.body,
        dateLabel: fmtDate(v.date),
      };
    },
  },
  {
    id: "performance",
    label: "학예 발표회 안내",
    sub: "공연·발표",
    icon: "예",
    signatureLabel: "담임 교사",
    sections: [
      {
        title: "기본",
        fields: [
          { name: "title", label: "통신문 제목", type: "text", layout: "single", placeholder: "예) 2학기 학예 발표회 안내" },
          { name: "summary", label: "한 줄 요약", type: "text", layout: "single", placeholder: "예) 학생들의 학습 성과를 발표하는 자리에 학부모님을 초대합니다." },
        ],
      },
      {
        title: "일시·장소",
        fields: [
          { name: "date", label: "일시", type: "date", layout: "double", required: true },
          { name: "time", label: "시작 시각", type: "time", layout: "double" },
          { name: "place", label: "장소", type: "text", layout: "single", placeholder: "예) 본관 4층 다목적 강당" },
        ],
      },
      {
        title: "프로그램·관람",
        fields: [
          { name: "program", label: "주요 프로그램", type: "textarea", layout: "single", placeholder: "예) 1부 합창, 2부 학급별 무대, 3부 작품 전시" },
          { name: "audience", label: "관람 대상", type: "text", layout: "double", placeholder: "예) 학부모 · 가족" },
          { name: "rsvp", label: "참석 회신", type: "text", layout: "double", placeholder: "예) ○월 ○일까지 알림장" },
        ],
      },
      {
        title: "본문",
        fields: [
          { name: "body", label: "본문", type: "textarea", layout: "single", rows: 7 },
        ],
      },
    ],
    defaults: {
      body:
        "한 학기 동안 갈고닦은 학습 성과와 재능을 학생들이 직접 무대에서 발표합니다. 바쁘시더라도 자리를 빛내 주시어 우리 아이들에게 따뜻한 응원을 보내 주시면 큰 힘이 됩니다. 행사장 내 정숙·휴대전화 무음 협조 부탁드리며, 사진·영상 촬영은 본 가정 한정으로 사용해 주시기 바랍니다.",
    },
    render(v, h) {
      return {
        title: v.title || "학예 발표회 안내",
        summary: v.summary || "",
        fields: [
          ["일시", `${fmtDate(v.date)}${v.time ? ` ${v.time}` : ""}`],
          ["장소", v.place || ""],
          ["프로그램", v.program || ""],
          ["관람 대상", v.audience || ""],
          ["참석 회신", v.rsvp || ""],
        ],
        body: v.body,
        dateLabel: fmtDate(v.date),
      };
    },
  },
  {
    id: "safety",
    label: "안전 알림 (폭염·한파·미세먼지)",
    sub: "안전",
    icon: "안",
    signatureLabel: "담임 교사",
    sections: [
      {
        title: "기본",
        fields: [
          { name: "title", label: "통신문 제목", type: "text", layout: "single", placeholder: "예) 폭염 대비 안전 생활 안내" },
          { name: "summary", label: "한 줄 요약", type: "text", layout: "single", placeholder: "예) 폭염주의보 발효에 따른 생활 수칙 안내" },
        ],
      },
      {
        title: "유형·기간",
        fields: [
          { name: "hazard", label: "위험 유형", type: "text", layout: "double", required: true, placeholder: "예) 폭염 / 한파 / 미세먼지" },
          { name: "level", label: "발효 단계", type: "text", layout: "double", placeholder: "예) 주의보 / 경보" },
          { name: "date", label: "안내 일자", type: "date", layout: "double" },
          { name: "endDate", label: "지속 예상 (선택)", type: "date", layout: "double" },
        ],
      },
      {
        title: "수칙·대응",
        fields: [
          { name: "rules", label: "가정·학교 수칙", type: "textarea", layout: "single", placeholder: "예) 외출 자제, 충분한 수분 섭취, KF94 마스크 착용 등" },
          { name: "emergency", label: "비상 연락", type: "text", layout: "single", placeholder: "예) 학교 02-000-0000 / 119" },
        ],
      },
      {
        title: "본문",
        fields: [
          { name: "body", label: "본문", type: "textarea", layout: "single", rows: 7 },
        ],
      },
    ],
    defaults: {
      body:
        "최근 기상·환경 상황에 따라 학생 건강과 안전을 위한 생활 수칙을 안내드립니다. 학교에서는 활동량 조절, 실내 환기, 응급 대응 체계 점검을 진행하고 있으며 가정에서도 충분한 휴식과 수분 섭취, 외출 자제 등에 협조 부탁드립니다. 특이 사항 발생 시 즉시 담임 교사 또는 학교 보건실로 연락 주시기 바랍니다.",
    },
    render(v, h) {
      return {
        title: v.title || `${v.hazard || "안전"} 알림`,
        summary: v.summary || "",
        fields: [
          ["유형", [v.hazard, v.level].filter(Boolean).join(" · ")],
          ["기간", fmtDateRange(v.date, v.endDate)],
          ["수칙", v.rules || ""],
          ["비상 연락", v.emergency || ""],
        ],
        body: v.body,
        dateLabel: fmtDate(v.date),
      };
    },
  },
  {
    id: "consult",
    label: "학부모 상담 주간 안내",
    sub: "상담",
    icon: "상",
    signatureLabel: "담임 교사",
    sections: [
      {
        title: "기본",
        fields: [
          { name: "title", label: "통신문 제목", type: "text", layout: "single", placeholder: "예) 1학기 학부모 상담 주간 안내" },
          { name: "summary", label: "한 줄 요약", type: "text", layout: "single", placeholder: "예) 학기 초 자녀의 학교 생활을 함께 나누는 상담 주간을 안내드립니다." },
        ],
      },
      {
        title: "기간·방식",
        fields: [
          { name: "date", label: "시작일", type: "date", layout: "double", required: true },
          { name: "endDate", label: "종료일", type: "date", layout: "double" },
          { name: "modes", label: "상담 방식", type: "text", layout: "single", placeholder: "예) 대면 / 전화 / 화상 (택1)" },
          { name: "duration", label: "1인당 시간", type: "text", layout: "double", placeholder: "예) 20분" },
          { name: "place", label: "장소(대면 시)", type: "text", layout: "double", placeholder: "예) 본관 3층 5-1 교실" },
        ],
      },
      {
        title: "신청",
        fields: [
          { name: "howApply", label: "신청 방법", type: "textarea", layout: "single", placeholder: "예) 신청서 회신 또는 알림장 / 전화 연락" },
          { name: "deadline", label: "신청 마감", type: "date", layout: "double" },
          { name: "contact", label: "문의 연락", type: "text", layout: "double", placeholder: "예) 학교 02-000-0000" },
        ],
      },
      {
        title: "본문",
        fields: [
          { name: "body", label: "본문", type: "textarea", layout: "single", rows: 7 },
        ],
      },
    ],
    defaults: {
      body:
        "학기 초 자녀의 학교 생활과 학습 상황을 학부모님과 함께 나누고자 상담 주간을 운영합니다. 학생 개개인의 강점과 성장 과제를 살피는 시간이 되도록 미리 궁금하신 부분을 정리해 오시면 더욱 충실한 상담이 가능합니다. 신청 인원에 따라 시간이 조정될 수 있으니 가능한 시간대를 두 가지 이상 알려 주시기 바랍니다.",
    },
    render(v, h) {
      return {
        title: v.title || "학부모 상담 주간 안내",
        summary: v.summary || "",
        fields: [
          ["기간", fmtDateRange(v.date, v.endDate)],
          ["방식", v.modes || ""],
          ["1인당 시간", v.duration || ""],
          ["장소", v.place || ""],
          ["신청 방법", v.howApply || ""],
          ["신청 마감", fmtDate(v.deadline)],
          ["문의", v.contact || ""],
        ],
        body: v.body,
        dateLabel: fmtDate(v.date),
      };
    },
  },
  {
    id: "vacation",
    label: "방학식·개학식 안내",
    sub: "학기",
    icon: "방",
    signatureLabel: "담임 교사",
    sections: [
      {
        title: "기본",
        fields: [
          { name: "title", label: "통신문 제목", type: "text", layout: "single", placeholder: "예) 여름 방학식 및 개학 안내" },
          { name: "summary", label: "한 줄 요약", type: "text", layout: "single", placeholder: "예) 여름 방학식 및 2학기 개학 일정 안내" },
        ],
      },
      {
        title: "일정",
        fields: [
          { name: "closingDate", label: "방학식 일자", type: "date", layout: "double", required: true },
          { name: "closingTime", label: "방학식 하교 시각", type: "time", layout: "double" },
          { name: "vacationStart", label: "방학 시작", type: "date", layout: "double" },
          { name: "vacationEnd", label: "방학 종료", type: "date", layout: "double" },
          { name: "openingDate", label: "개학식 일자", type: "date", layout: "double" },
          { name: "openingTime", label: "개학식 등교 시각", type: "time", layout: "double" },
        ],
      },
      {
        title: "방학 중 활동",
        fields: [
          { name: "hwSummary", label: "주요 과제 (요약)", type: "textarea", layout: "single", placeholder: "예) 독서 5권 + 독후감 1편, 자유 탐구 1주제" },
          { name: "tips", label: "생활 안내", type: "textarea", layout: "single", placeholder: "예) 규칙적인 생활, 안전한 물놀이, 화재·교통 안전" },
        ],
      },
      {
        title: "본문",
        fields: [
          { name: "body", label: "본문", type: "textarea", layout: "single", rows: 7 },
        ],
      },
    ],
    defaults: {
      body:
        "한 학기 동안 모두가 함께 노력해 준 학생들과 늘 따뜻한 관심을 보내 주신 학부모님께 감사드립니다. 방학 동안에도 건강하고 안전한 생활을 이어 갈 수 있도록 가정에서 함께 살펴 주시기 바랍니다. 개학 첫날에는 교과서, 알림장, 준비물을 잊지 말고 가져올 수 있도록 지도 부탁드립니다.",
    },
    render(v, h) {
      return {
        title: v.title || "방학식·개학식 안내",
        summary: v.summary || "",
        fields: [
          ["방학식", `${fmtDate(v.closingDate)}${v.closingTime ? ` (하교 ${v.closingTime})` : ""}`],
          ["방학 기간", fmtDateRange(v.vacationStart, v.vacationEnd)],
          ["개학식", `${fmtDate(v.openingDate)}${v.openingTime ? ` (등교 ${v.openingTime})` : ""}`],
          ["주요 과제", v.hwSummary || ""],
          ["생활 안내", v.tips || ""],
        ],
        body: v.body,
        dateLabel: fmtDate(v.closingDate),
      };
    },
  },
  {
    id: "supplies",
    label: "준비물·과제 안내",
    sub: "수업 준비",
    icon: "준",
    signatureLabel: "담임 교사",
    sections: [
      {
        title: "기본",
        fields: [
          { name: "title", label: "통신문 제목", type: "text", layout: "single", placeholder: "예) 이번 주 준비물 안내" },
          { name: "summary", label: "한 줄 요약", type: "text", layout: "single", placeholder: "예) 다음 주 수업 활동을 위한 준비물 및 과제 안내" },
        ],
      },
      {
        title: "기간",
        fields: [
          { name: "date", label: "기준 시작일", type: "date", layout: "double", required: true },
          { name: "endDate", label: "기준 종료일", type: "date", layout: "double" },
        ],
      },
      {
        title: "준비물·과제",
        fields: [
          { name: "supplies", label: "준비물", type: "textarea", layout: "single", placeholder: "예) 색종이 1세트, 가위, 풀, 자, 색연필" },
          { name: "homework", label: "과제", type: "textarea", layout: "single", placeholder: "예) 수학 익힘책 35~37쪽, 일기 1회" },
          { name: "notes", label: "기타 안내", type: "textarea", layout: "single", placeholder: "예) 미술 시간에 옷이 더러워질 수 있어 편한 복장 권장" },
        ],
      },
      {
        title: "본문",
        fields: [
          { name: "body", label: "본문", type: "textarea", layout: "single", rows: 6 },
        ],
      },
    ],
    defaults: {
      body:
        "다음 학습 활동을 원활히 진행하기 위해 아래와 같이 준비물과 과제를 안내드립니다. 학생 스스로 학용품을 챙기는 습관을 들일 수 있도록 가정에서도 함께 지도 부탁드리며, 부득이하게 준비가 어려운 경우에는 미리 담임 교사에게 알려 주시기 바랍니다.",
    },
    render(v, h) {
      return {
        title: v.title || "준비물·과제 안내",
        summary: v.summary || "",
        fields: [
          ["기간", fmtDateRange(v.date, v.endDate)],
          ["준비물", v.supplies || ""],
          ["과제", v.homework || ""],
          ["기타", v.notes || ""],
        ],
        body: v.body,
        dateLabel: fmtDate(v.date),
      };
    },
  },
  {
    id: "event",
    label: "학교 행사 (운동회·축제)",
    sub: "전교 행사",
    icon: "행",
    signatureLabel: "교장",
    sections: [
      {
        title: "기본",
        fields: [
          { name: "title", label: "통신문 제목", type: "text", layout: "single", placeholder: "예) 한빛 한마당 운동회 안내" },
          { name: "summary", label: "한 줄 요약", type: "text", layout: "single", placeholder: "예) 전교생이 함께하는 가을 운동회에 학부모님을 초대합니다." },
        ],
      },
      {
        title: "일시·장소",
        fields: [
          { name: "date", label: "행사 일자", type: "date", layout: "double", required: true },
          { name: "time", label: "시작 시각", type: "time", layout: "double" },
          { name: "place", label: "장소", type: "text", layout: "single", placeholder: "예) 본교 운동장" },
        ],
      },
      {
        title: "참여·운영",
        fields: [
          { name: "program", label: "주요 프로그램", type: "textarea", layout: "single", placeholder: "예) 학년별 경기, 가족 경기, 응원 무대, 점심 도시락" },
          { name: "audience", label: "참여 대상", type: "text", layout: "double", placeholder: "예) 전교생 · 학부모" },
          { name: "rainPlan", label: "우천 시", type: "text", layout: "double", placeholder: "예) 다음 주 화요일로 순연" },
        ],
      },
      {
        title: "본문",
        fields: [
          { name: "body", label: "본문", type: "textarea", layout: "single", rows: 7 },
        ],
      },
    ],
    defaults: {
      body:
        "학교 공동체의 화합을 다지는 행사를 아래와 같이 진행합니다. 학생들이 한 학기 동안 준비한 모습을 보여드릴 수 있도록 학부모님의 따뜻한 응원을 부탁드립니다. 행사장 주변 주차가 어려우니 가급적 대중교통을 이용해 주시고, 안전사고 예방을 위해 운영 안내에 협조해 주시면 감사하겠습니다.",
    },
    render(v, h) {
      return {
        title: v.title || "학교 행사 안내",
        summary: v.summary || "",
        fields: [
          ["일시", `${fmtDate(v.date)}${v.time ? ` ${v.time}` : ""}`],
          ["장소", v.place || ""],
          ["주요 프로그램", v.program || ""],
          ["참여 대상", v.audience || ""],
          ["우천 시", v.rainPlan || ""],
        ],
        body: v.body,
        dateLabel: fmtDate(v.date),
      };
    },
  },
];

export function findTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || null;
}
