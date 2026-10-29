# AI 데이터 리터러시 수업 웹앱

숙명여고 동아리 특강(50분)에 쓰는 실시간 수업 웹앱입니다. 화면은 교사가 넘기고, 학생 의견은 오른쪽 채팅창에 실시간으로 쌓입니다.

## 파일 구성
```
index.html          화면 틀
css/style.css       디자인 (iPad Safari 스타일)
js/config.js        ★ Supabase 주소·키, 방 이름, 영상 설정
js/slides.js        ★ 슬라이드 내용 22장 (문구·순서·영상 구간 수정)
js/backend.js       Supabase 연결 / 데모 모드
js/app.js           동작 로직
supabase/schema.sql ★ Supabase에서 한 번 실행할 SQL
```

## 1. 미리 보기 (설정 없이)
`js/config.js`의 `SUPABASE_URL`이 비어 있으면 **데모 모드**로 실행됩니다. 같은 브라우저의 탭끼리만 동기화돼요.
- 탭 1: 이름 칸에 `teacher` 입력 → 교사 화면
- 탭 2, 3: 아무 이름이나 입력 → 학생 화면

## 2. Supabase 설정
1. [supabase.com](https://supabase.com)에서 New project 만들기 (Region: Northeast Asia (Seoul))
2. **SQL Editor > New query**에 `supabase/schema.sql` 전체를 붙여넣기
3. 맨 아래 `'여기에-교사코드'`를 원하는 교사 코드로 바꾼 뒤 **Run**
4. **Project Settings > API**에서 `Project URL`과 `anon public` 키를 복사해 `js/config.js`에 붙여넣기

> 교사 코드는 Supabase 서버에만 저장되고 학생 화면 코드에는 들어가지 않습니다. anon 키는 공개해도 되는 키예요.

## 3. GitHub Pages 배포
1. GitHub에서 새 저장소(public) 만들기
2. **Add file > Upload files**로 이 폴더 안의 파일을 폴더 구조 그대로 올리기
3. **Settings > Pages > Branch: main / (root) > Save**
4. 1~2분 뒤 `https://아이디.github.io/저장소이름/` 주소로 접속 → 학생들에게 QR로 공유

## 4. 수업 당일
- **교사**: 같은 주소에서 이름 칸에 교사 코드를 입력하면 교사 모드로 들어갑니다. 전자칠판에서 띄우세요.
- **화면 넘기기**: 아래 도구막대의 ‹ ›, 키보드 ← →, 위쪽 탭(단원 바로가기)
- **채팅 잠금**: 설명할 때 학생 입력을 멈춤
- **숨기기**: 교사 화면에서 메시지 아래 [숨기기]를 누르면 학생 화면에서 사라집니다
- **명단**: 접속 중인 학생과 현재 슬라이드 참여 여부
- **CSV**: 투표·판정·제출·채팅 전체를 엑셀용 파일로 저장 (수업 후 꼭 받아 두세요)
- **초기화**: 모든 응답을 지우고 1번 슬라이드로 (리허설 후 사용)
- 다른 반에서 다시 쓰려면 SQL Editor에서 방을 하나 더 만들고 주소 뒤에 `?room=방이름`을 붙이면 됩니다.

## 5. 꼭 확인할 것
- **영상 구간**: `js/slides.js`에서 `video-ebs`, `video-colorado` 슬라이드의 `start`, `end`(초)를 원하는 구간으로 바꾸세요. `0`이면 처음부터 끝까지 재생됩니다.
- **학생 태블릿 영상**: 기본값은 교사 화면에서만 재생(`STUDENT_VIDEO: false`). 학생 기기에서도 재생하려면 `true`로 바꾸세요.
- **약관·법 내용**은 2026년 10월 기준입니다. 수업 직전에 한 번 더 확인하세요.
