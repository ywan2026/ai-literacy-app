// ===============================================================
//  슬라이드 내용 — 순서·문구를 바꾸려면 이 파일을 고치세요.
//  key: 응답 저장용 고유값(바꾸면 기존 응답과 연결이 끊깁니다)
//  note: 교사 화면에만 보이는 발표자 노트
// ===============================================================
window.SECTIONS = ['시작', '실태조사', '도입', '사진·초상권', 'AI 저작권', '생성 체험', '상황 판정', '마무리'];

window.SLIDES = [
  // ───────────── 시작 ─────────────
  {
    key: 'cover', section: 0, layout: 'cover',
    kicker: '숙명여자고등학교 동아리 특강 · 인공지능 데이터 리터러시',
    title: '내 사진, AI 그림의 주인은 누구일까?',
    html: `<p class="lead">사진 촬영·이미지 사용과 초상권, AI 생성물의 저작권과 침해 예방</p>
      <div class="chips"><span class="chip">50분</span><span class="chip">오른쪽 채팅창에 의견을 남겨요</span><span class="chip">화면은 선생님이 넘겨요</span></div>`,
    chatPrompt: '들어왔다면 인사 한마디!',
    note: '접속 확인(명단 버튼). 전원 접속 후 시작. 오른쪽 채팅은 슬라이드마다 따로 쌓입니다.',
  },

  // ───────────── ① 실태조사 (5분) ─────────────
  {
    key: 'survey-freq', section: 1, title: 'AI를 얼마나 자주 쓰나요?',
    html: `<p class="sub">ChatGPT, Gemini, 뤼튼, 사진 보정 앱의 AI 기능 등 모두 포함해요.</p>`,
    poll: { options: ['거의 매일', '일주일에 2~3번', '한 달에 몇 번', '거의 안 써요'] },
    chatPrompt: '가장 자주 쓰는 AI 서비스 이름을 적어 주세요',
    note: '1분. 결과 그래프를 보며 "우리 반 대부분이 이미 사용자" 확인.',
  },
  {
    key: 'survey-use', section: 1, title: 'AI를 주로 어디에 쓰나요?',
    html: `<p class="sub">해당하는 것을 모두 골라요.</p>`,
    poll: { multi: true, options: ['과제·공부 질문', '글 요약·번역', '이미지·영상 만들기', '사진 보정·필터', '고민 상담·대화', '코딩', '기타'] },
    chatPrompt: '최근에 AI로 한 일 하나를 적어 주세요',
    note: '이미지 생성·사진 보정 비율에 주목 → 오늘 주제로 연결.',
  },
  {
    key: 'survey-photo', section: 1, title: '내 사진이나 얼굴을 AI에 올려 본 적이 있나요?',
    html: `<p class="sub">해당하는 것을 모두 골라요.</p>`,
    poll: { multi: true, options: ['내 사진을 캐릭터·애니풍으로 바꿔 봤다', '보정·배경 제거에 써 봤다', '친구가 나온 사진을 올려 본 적이 있다', '연예인 사진을 올려 본 적이 있다', '없다'] },
    chatPrompt: '어떤 서비스에, 어떤 사진을 올렸나요?',
    note: '"친구 사진" 응답 수를 짚어 두고 ③에서 다시 언급.',
  },
  {
    key: 'survey-free', section: 1, layout: 'question',
    kicker: '자유 응답',
    title: 'AI를 쓰다가 "이거 괜찮나?" 싶었던 순간이 있었나요?',
    html: `<p class="sub">예: 과제에 그대로 내도 되나? · 친구 얼굴을 넣어도 되나? · 이 그림을 SNS에 올려도 되나?</p>`,
    chatPrompt: '그 순간을 짧게 적어 주세요',
    note: '2분. 채팅 중 2~3개를 읽어 주며 오늘 수업이 답할 질문으로 정리.',
  },

  // ───────────── ② 도입 (6분) ─────────────
  {
    key: 'quiz-face', section: 2, title: '진짜 얼굴은 어느 쪽일까?',
    html: `<p class="sub">두 사진 중 하나는 실제 사람, 하나는 AI가 만든 얼굴이에요. 2분 동안 최대한 많이 맞혀 보세요.</p>`,
    link: { url: 'https://www.whichfaceisreal.com/', label: 'Which Face Is Real 열기', hint: '새 탭에서 열려요. 2분 뒤 이 화면으로 돌아와 결과를 골라 주세요.' },
    poll: { options: ['10개 중 0~3개', '4~6개', '7~8개', '9~10개'], label: '몇 개 맞혔나요?' },
    chatPrompt: '무엇을 보고 AI 얼굴을 구별했나요?',
    note: '배경 왜곡, 귀걸이 짝, 머리카락 경계, 치아 등 단서 공유. "구별이 점점 어려워진다"로 마무리.',
  },
  {
    key: 'data-flow', section: 2, title: '내가 올린 사진은 어디로 갈까?',
    html: `<div class="flow">
        <div class="flow-step"><b>1</b><h4>전송·저장</h4><p>사진이 내 기기를 떠나 회사 서버에 저장돼요</p></div>
        <div class="flow-arrow">›</div>
        <div class="flow-step"><b>2</b><h4>서비스 제공</h4><p>답변을 하거나 이미지를 만드는 데 쓰여요</p></div>
        <div class="flow-arrow">›</div>
        <div class="flow-step warn"><b>3</b><h4>학습 데이터</h4><p>설정에 따라 다음 AI를 훈련하는 데 쓰일 수 있어요</p></div>
        <div class="flow-arrow">›</div>
        <div class="flow-step warn"><b>4</b><h4>사람 검토</h4><p>품질·안전 점검을 위해 사람이 읽을 수도 있어요</p></div>
      </div>
      <div class="callout"><b>데이터 리터러시의 시작</b> 친구가 나온 사진을 올리면, 친구의 얼굴 데이터를 <u>친구 대신 내가</u> 회사에 넘기는 셈이에요.</div>`,
    chatPrompt: '내 사진이 학습 데이터가 된다면, 괜찮다/싫다? 이유는?',
    note: '다음 장에서 실제 약관으로 확인.',
  },
  {
    key: 'terms', section: 2, title: '실제 약관에는 뭐라고 쓰여 있을까?',
    html: `<div class="table-wrap"><table class="terms">
        <thead><tr><th></th><th><span class="brand">OpenAI</span>ChatGPT</th><th><span class="brand">Google</span>Gemini</th><th><span class="brand">Anthropic</span>Claude</th></tr></thead>
        <tbody>
          <tr><th>내 대화·이미지가<br>학습에 쓰이나?</th>
            <td>개인용 서비스는 <b>학습에 사용될 수 있음</b></td>
            <td><b>'활동 유지'가 켜져 있으면</b> 생성형 AI 학습을 포함한 서비스 개선에 사용</td>
            <td>2025년 8월 약관 개정 후 <b>사용자가 허용 여부를 선택</b></td></tr>
          <tr><th>사람이 볼 수도?</th>
            <td>—</td>
            <td>일부 대화는 <b>사람 검토자가 읽음</b> (계정 정보와 분리)</td>
            <td>—</td></tr>
          <tr><th>끄는 방법</th>
            <td>설정 › 데이터 제어 › '모두를 위한 모델 개선' 끄기 · <b>임시 채팅</b>은 학습 제외</td>
            <td>Gemini 앱 활동 › '활동 유지' 끄기</td>
            <td>설정 › 개인정보 보호에서 언제든 변경</td></tr>
          <tr><th>보관 기간</th>
            <td>임시 채팅은 기록에 남지 않음</td>
            <td>기본 18개월 · 사람이 검토한 대화는 삭제해도 <b>최대 3년</b></td>
            <td>허용 시 <b>5년</b> · 비허용 시 30일</td></tr>
          <tr><th>이용 연령</th>
            <td>만 13세 이상 (18세 미만은 보호자 동의)</td>
            <td>Google 계정 연령 기준</td>
            <td>만 18세 이상</td></tr>
        </tbody></table></div>
      <div class="callout small"><b>공통점</b> ① 끄지 않으면 쓰일 수 있다 ② 끈 뒤에도 <u>이미 학습된 것은 되돌릴 수 없다</u> ③ 좋아요·싫어요 피드백을 누르면 그 대화가 쓰일 수 있다</div>
      <p class="source">출처: OpenAI 도움말 「모델 성능 향상을 위한 데이터 사용」, Google 「Gemini 앱 개인정보 보호 고지」, Anthropic 「Updates to our Consumer Terms」(2025.8.28). 2026년 10월 확인 · 약관은 바뀔 수 있어요.</p>`,
    chatPrompt: '지금 내가 쓰는 AI의 설정을 확인해 봤나요? 켜져 있었나요?',
    note: '30초 동안 실제 설정 화면 확인하게 해도 좋음. 정책은 바뀔 수 있으니 "직접 확인하는 습관"을 강조.',
  },

  // ───────────── ③ 사진·초상권 (12분) ─────────────
  {
    key: 'two-rights', section: 3, title: '사진 한 장에 붙는 두 가지 권리',
    html: `<div class="grid-2">
        <div class="info-card blue"><div class="tag">찍은 사람의 권리</div><h3>저작권</h3>
          <p>사진을 <b>찍은 사람</b>이 가져요. 구도·순간 포착 등 창작성이 있으면 저작물로 보호돼요.</p>
          <ul><li>허락 없이 복제·게시·변형하면 침해</li><li>AI로 '스타일만 바꾼' 것도 원본의 변형이에요</li><li>근거: 저작권법</li></ul></div>
        <div class="info-card orange"><div class="tag">찍힌 사람의 권리</div><h3>초상권</h3>
          <p>사진에 <b>찍힌 사람</b>이 가져요. 내 얼굴·모습이 함부로 촬영·공개·이용되지 않을 권리예요.</p>
          <ul><li>헌법상 인격권으로 판례가 인정</li><li>침해하면 삭제 요구·손해배상 대상</li><li>유명인의 이름·얼굴을 돈벌이에 쓰면 부정경쟁방지법(퍼블리시티)도 문제</li></ul></div>
      </div>
      <div class="callout"><b>예시</b> 친구가 찍어 준 내 사진 → 저작권은 <u>친구</u>, 초상권은 <u>나</u>. 둘 다의 허락이 필요할 때가 있어요.</div>`,
    chatPrompt: '내가 찍은 친구 사진, 저작권과 초상권은 각각 누구에게?',
    note: '채팅으로 답 확인: 저작권=나, 초상권=친구.',
  },
  {
    key: 'cases-1', section: 3, title: '이럴 땐? 사례로 보는 초상권 ①',
    html: `<p class="sub">카드를 눌러 해설을 확인해요.</p>`,
    flips: [
      { tag: '단체사진', q: '체육대회 단체사진을 친구들 동의 없이 공개 계정에 올렸다.', a: '얼굴을 알아볼 수 있다면 <b>초상권 침해 소지</b>. 올리기 전 동의를 구하거나, 원치 않는 친구는 가리기.' },
      { tag: '브이로그', q: '학교 브이로그를 찍었는데 지나가던 다른 반 친구 얼굴이 그대로 나왔다.', a: '배경이라도 <b>누구인지 알아볼 수 있으면</b> 문제가 될 수 있어요. 모자이크하거나 동의 받기.' },
      { tag: '단톡방 짤', q: '친구의 웃긴 표정 사진을 단톡방에 올리고 짤로 만들어 돌렸다.', a: '동의 없는 공개·변형은 초상권 침해이고, 반복되면 <b>사이버 괴롭힘(학교폭력)</b>이 될 수 있어요.' },
      { tag: '수업 촬영', q: '수업 중 선생님 모습을 몰래 찍어 SNS에 올렸다.', a: '선생님에게도 초상권이 있어요. 몰래 촬영·게시는 <b>교육활동 침해</b>로 처리될 수 있어요.' },
    ],
    chatPrompt: '가장 헷갈렸던 사례는? 이유는?',
    note: '학생들이 각자 카드를 넘김. 2~3분.',
  },
  {
    key: 'cases-2', section: 3, title: '이럴 땐? AI와 만난 초상권 ②',
    html: `<p class="sub">AI가 끼어들면 문제가 더 커져요. 카드를 눌러 확인해요.</p>`,
    flips: [
      { tag: 'AI 변환', q: '인터넷에서 찾은 남의 사진을 AI로 애니풍으로 바꿔 내 작품처럼 올렸다.', a: '원본 사진의 <b>저작권 침해</b>(무단 변형), 사진 속 인물의 <b>초상권</b>까지 두 가지 문제.' },
      { tag: '얼굴 바꾸기', q: '친구 사진을 얼굴 바꾸기 앱에 넣어 재미로 합성했다.', a: '친구 얼굴 데이터를 동의 없이 <b>앱 회사 서버에 넘긴 것</b>. 합성물을 공유하면 초상권 침해, 성적인 합성이면 <b>범죄</b>.' },
      { tag: '연예인 굿즈', q: '좋아하는 아이돌 사진으로 AI 합성 이미지를 만들어 굿즈로 팔았다.', a: '초상권에 더해, 유명인의 얼굴을 돈벌이에 쓰는 것은 <b>부정경쟁방지법상 퍼블리시티 침해</b>가 될 수 있어요.' },
      { tag: '내 사진 도용', q: '내가 찍은 풍경 사진을 누군가 퍼가서 AI로 변환해 판매하고 있다.', a: '이번엔 내가 피해자! <b>내 저작권 침해</b>예요. 원본 파일·촬영 날짜를 증거로 남기고 삭제를 요청할 수 있어요.' },
    ],
    chatPrompt: '내 사진을 지키기 위해 할 수 있는 일 한 가지는?',
    note: '마지막 카드로 "나도 권리자"라는 관점 전환.',
  },
  {
    key: 'deepfake-law', section: 3, title: '딥페이크는 장난이 아니라 범죄예요',
    html: `<div class="grid-2">
        <div class="info-card red"><div class="tag">성폭력처벌법 제14조의2 (2024.10.16. 개정 시행)</div>
          <h3>만들기만 해도</h3><p class="big">7년 이하 징역</p>
          <p>또는 5천만 원 이하 벌금. 예전과 달리 <b>퍼뜨릴 목적이 없어도</b> 합성·편집 자체로 처벌돼요.</p></div>
        <div class="info-card red"><div class="tag">같은 법 · 신설</div>
          <h3>갖고 있거나 보기만 해도</h3><p class="big">3년 이하 징역</p>
          <p>또는 3천만 원 이하 벌금. 허위영상물인 줄 알면서 <b>소지·구입·저장·시청</b>한 경우.</p></div>
      </div>
      <div class="callout"><b>"장난이었어요"는 통하지 않아요</b> 피해자가 미성년자면 청소년성보호법이 적용돼 더 무겁게 처벌돼요. 성적이지 않은 합성이라도 명예훼손·모욕이 될 수 있어요.</div>`,
    chatPrompt: '이 법을 처음 알았나요? 느낀 점 한 줄',
    note: '사실 전달 위주. 구체적 피해 사례 묘사는 피함.',
  },
  {
    key: 'video-ebs', section: 3, title: '가짜 영상, 진짜 피해',
    video: { id: 'hpd7k8GHrlo', start: 0, end: 0, caption: 'EBS × 한국양성평등교육진흥원 「가짜 영상, 진짜 피해」 (2025.12, 9분 7초) · 일부 구간 시청' },
    chatPrompt: '영상에서 가장 기억에 남는 장면이나 말은?',
    note: '★ js/slides.js 에서 start/end(초)를 원하는 구간으로 설정하세요. 예: start: 60, end: 240',
  },
  {
    key: 'deepfake-help', section: 3, title: '피해를 입었거나, 친구의 피해를 알게 됐다면',
    html: `<div class="steps">
        <div class="step"><b>1</b><div><h4>증거 남기기</h4><p>화면 캡처, 게시물 주소(URL), 올린 계정, 날짜·시간을 저장해요.</p></div></div>
        <div class="step"><b>2</b><div><h4>혼자 해결하지 않기</h4><p>믿을 수 있는 어른·선생님께 바로 알려요. 혼자 지우거나 가해자와 직접 다투지 않아요.</p></div></div>
        <div class="step"><b>3</b><div><h4>신고·삭제 지원 받기</h4><p>디지털성범죄피해자지원센터 <b>02-735-8994</b> · 학교폭력 신고 <b>117</b> · 경찰 <b>112</b></p></div></div>
        <div class="step"><b>4</b><div><h4>친구가 피해자라면</h4><p>보지 않기, 퍼뜨리지 않기, 피해자 탓하지 않기. 공유하는 순간 나도 가해에 가담하게 돼요.</p></div></div>
      </div>`,
    chatPrompt: '친구가 피해를 입었다는 걸 알게 되면, 나는 먼저 무엇을 할까?',
    note: '③ 단원 마무리. 시간 체크(누적 약 23분).',
  },

  // ───────────── ④ AI 생성물 저작권 (11분) ─────────────
  {
    key: 'ai-copyright', section: 4, title: 'AI가 만든 그림, 저작권이 있을까?',
    html: `<div class="grid-2">
        <div class="info-card"><div class="tag">저작권법 제2조</div><h3>저작물 = 인간의 사상·감정을 표현한 창작물</h3>
          <p>그래서 <b>AI 혼자 만든 결과물은 저작물이 아니에요.</b> 누구의 것도 아닌 '산출물'로 봐요.</p></div>
        <div class="info-card blue"><div class="tag">문체부·한국저작권위원회 안내서 (2025.7)</div><h3>사람이 기여한 부분만 등록</h3>
          <ul><li>내가 결과를 <b>통제</b>하고 <b>예측</b>할 수 있었는지가 기준</li><li>프롬프트 입력만으로는 원칙적으로 인정이 어려워요</li><li>AI가 만든 것을 사람이 만든 것처럼 등록하면 <b>허위등록</b>으로 처벌</li></ul></div>
      </div>
      <div class="cases-row">
        <div class="mini"><b>AI 영화 「AI 수로부인」</b><span>영상 자체가 아니라 사람이 장면을 고르고 배열·편집한 부분이 '편집저작물'로 등록 (국내 첫 사례)</span></div>
        <div class="mini"><b>AI 만화 (미국)</b><span>사람이 쓴 글과 컷 배치는 인정, AI가 그린 그림은 불인정</span></div>
      </div>`,
    chatPrompt: 'AI 그림에도 저작권을 줘야 할까? 찬성/반대와 이유',
    note: '핵심: "AI 결과물 자체 ✕, 내가 한 선택·수정·배열 ○"',
  },
  {
    key: 'video-colorado', section: 4, title: '미술대회 1위 작품, 알고 보니 AI가 그렸다?',
    video: { id: '6alFjze_LVc', start: 0, end: 0, caption: 'KBS [글로벌K] 미 미술전서 AI가 그린 그림이 1위…논란 일파만파 (2022.9.7.)' },
    html: `<p class="sub">2022년 미국 콜로라도 주 박람회 미술대회 디지털아트 부문에서 미드저니로 만든 「스페이스 오페라 극장」이 1위를 차지했어요. 작가는 프롬프트를 수백 번 고쳤다고 했지만, 미국 저작권청은 이 그림의 저작권 등록을 거절했어요.</p>`,
    chatPrompt: '이 작품의 1위, 인정할 수 있다/없다? 이유는?',
    note: '영상 후 바로 다음 장 투표로.',
  },
  {
    key: 'debate', section: 4, title: '누구에게 저작권을 인정할 수 있을까?',
    html: `<p class="sub">세 사람 모두 AI를 써서 미술대회에 작품을 냈어요. 각각 O(인정) · △(일부만) · X(불인정)로 판정하고, 이유는 채팅에 써 주세요.</p>`,
    cards: {
      choices: ['O', '△', 'X'],
      items: [
        { title: '지민', text: '그림은 못 그리지만 프롬프트를 수백 번 고쳐 가장 마음에 드는 결과를 골라 그대로 냈다.' },
        { title: '서연', text: '일러스트 작가. AI 결과물을 참고 자료로만 보고, 구도와 색을 바꿔 직접 다시 그렸다.' },
        { title: '하준', text: '특정 작가의 그림 수백 장을 허락 없이 AI에 학습시켜, 그 작가 화풍의 그림을 만들어 냈다.' },
      ],
    },
    chatPrompt: '내 판정의 이유를 적어 주세요 (예: 서연 O — 직접 그렸으니까)',
    note: '안내서 기준: 지민 = 원칙적으로 불인정(선택·배열에 창작성 있으면 일부), 서연 = 직접 그린 부분 인정, 하준 = 인정 어렵고 오히려 원작가 권리 침해 소지.',
  },
  {
    key: 'prevent', section: 4, title: 'AI 저작권 침해를 막는 5가지 습관',
    html: `<div class="rules">
        <div class="rule"><b>1</b><p><strong>특정 작품·캐릭터·작가 화풍</strong>을 그대로 재현해 달라고 하지 않기</p></div>
        <div class="rule"><b>2</b><p>남의 사진·그림을 AI에 넣기 전에 <strong>권리를 확인</strong>하기</p></div>
        <div class="rule"><b>3</b><p><strong>이용약관</strong>에서 상업적 이용·권리 귀속 확인하기</p></div>
        <div class="rule"><b>4</b><p>프롬프트·수정본 등 <strong>작업 과정을 기록</strong>하기 (내 기여의 증거)</p></div>
        <div class="rule"><b>5</b><p><strong>AI 사용 사실을 표기</strong>하기</p></div>
      </div>
      <div class="callout small"><b>AI 기본법 (2026.1.22. 시행)</b> 생성형 AI 결과물에 AI 생성 사실을 표시할 의무는 <u>서비스 사업자</u>에게 있고, 실제와 구별하기 어려운 딥페이크는 알아볼 수 있게 표시해야 해요. 개인에게 직접 지우는 의무는 아니지만 플랫폼 규칙과 학교 규정은 따로 있어요. 침해 책임은 대부분 <b>사용자</b>에게 돌아와요.</div>`,
    chatPrompt: '5가지 중 내가 가장 안 지켰던 습관은?',
    note: '다음 체험에서 1·4·5번을 직접 실천.',
  },

  // ───────────── ⑤ 생성 체험 (7분) ─────────────
  {
    key: 'make', section: 5, title: '미션: 우리 동아리 홍보 이미지 만들기',
    html: `<div class="grid-2 make">
        <div>
          <ol class="howto">
            <li><b>주제·분위기·색·구도</b>를 넣어 구체적으로 요청</li>
            <li>결과를 보고 <b>최소 1번 수정</b> 요청</li>
            <li>아래 칸에 <b>최종 프롬프트 · 내가 기여한 점 · 표기문</b> 제출</li>
          </ol>
          <div class="banlist"><b>하지 않기</b> 실존 인물·연예인 · 기존 캐릭터 · 특정 작가·스튜디오 화풍 · 친구 사진 업로드</div>
          <p class="hint">계정이 없다면 옆 친구와 짝으로 함께 해요.</p>
        </div>
        <div class="submit-host"></div>
      </div>`,
    link: { url: 'https://chatgpt.com/', label: 'ChatGPT 열기', hint: '새 탭에서 열려요. 만든 뒤 이 화면으로 돌아오세요.' },
    submit: {
      fields: [
        { id: 'prompt', label: '최종 프롬프트', placeholder: '예: 별이 쏟아지는 밤하늘 아래 노트북을 든 학생들, 파란·보라 톤, 포스터 구도…', rows: 3 },
        { id: 'contrib', label: '내가 기여한 점', placeholder: '예: 동아리 주제에 맞게 장면을 기획하고, 색감을 두 번 수정 요청함', rows: 2 },
        { id: 'label', label: 'AI 사용 표기문', placeholder: '예: 이 이미지는 ChatGPT(OpenAI)로 생성했으며, 기획과 프롬프트 수정은 ○○○가 했습니다. (2026.11.)', rows: 2 },
      ],
      button: '제출하고 채팅에 공유',
    },
    chatPrompt: '제출하면 여기에 공유돼요. 친구 표기문에 피드백도 남겨 주세요',
    note: '5분 생성 + 2분 공유. 좋은 표기문 1~2개 읽어 주기.',
  },

  // ───────────── ⑥ 상황 판정 (6분) ─────────────
  {
    key: 'judge', section: 6, title: '이거 괜찮을까? 상황 카드 판정',
    html: `<p class="sub">각 상황을 O(괜찮다) · △(조건부) · X(안 된다)로 판정하고, 이유는 채팅에 남겨요.</p>`,
    cards: {
      choices: ['O', '△', 'X'],
      items: [
        { title: '카드 1', text: '친구들 동의 없이 단체사진을 애니풍으로 바꿔 학급 SNS에 올렸다.' },
        { title: '카드 2', text: '아이돌 사진을 AI로 합성한 굿즈를 만들어 중고 거래 앱에서 팔았다.' },
        { title: '카드 3', text: 'ChatGPT로 만든 그림을 AI 사용 표기 없이 교내 그림 대회에 냈다.' },
        { title: '카드 4', text: '직접 찍은 풍경 사진을 AI로 보정하고 "AI 보정" 표기 후 블로그에 올렸다.' },
      ],
    },
    chatPrompt: '판정이 가장 갈린 카드는? 내 이유를 적어 주세요',
    note: '정리: 1 X/△(동의 받으면 O) · 2 X(초상권+퍼블리시티) · 3 X(대회 규정·허위 표시) · 4 O(내 저작물+투명한 표기).',
  },

  // ───────────── ⑦ 마무리 (3분) ─────────────
  {
    key: 'wrap', section: 7, title: '오늘 기억할 세 가지',
    html: `<div class="takeaways">
        <div><b>1</b><p>사진 한 장에는 <strong>찍은 사람의 저작권</strong>과 <strong>찍힌 사람의 초상권</strong>이 함께 있다.</p></div>
        <div><b>2</b><p>AI 혼자 만든 결과물은 저작물이 아니다. <strong>내 기여를 남기고, AI 사용을 밝히자.</strong></p></div>
        <div><b>3</b><p>올리기 전, 넣기 전, 만들기 전에 <strong>한 번 더 묻자</strong>: 허락 받았나? 표기했나?</p></div>
      </div>`,
    chatPrompt: '나의 AI 사용 원칙 한 줄을 남겨 주세요',
    note: '원칙 한 줄 2~3개 소개하며 마무리. 수업 후 CSV 내보내기.',
  },
  {
    key: 'end', section: 7, layout: 'cover',
    kicker: '수고했어요',
    title: '고맙습니다',
    html: `<p class="lead">오늘 남긴 원칙을 내일 AI를 쓸 때 한 번 떠올려 주세요.</p>
      <p class="source">참고 자료: 한국언론진흥재단 「미래를 이끄는 AI 리터러시」 · 문화체육관광부·한국저작권위원회 「생성형 AI 활용 저작물의 저작권 등록 안내서」「생성형 AI 결과물에 의한 저작권 분쟁 예방 안내서」(2025.7) · 성폭력범죄의 처벌 등에 관한 특례법 · 인공지능 발전과 신뢰 기반 조성 등에 관한 기본법 · 각 사 약관·도움말 (2026.10. 확인)</p>`,
    chatPrompt: '오늘 수업 한 줄 소감',
    note: '',
  },
];
