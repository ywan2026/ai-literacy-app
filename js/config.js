// ===============================================================
//  설정 파일 — 배포 전에 이 파일만 고치면 됩니다.
// ===============================================================
window.APP_CONFIG = {
  // Supabase 대시보드 > Project Settings > API 에서 복사
  // 두 값이 비어 있으면 '데모 모드'(이 브라우저 안에서만 동작)로 실행됩니다.
  SUPABASE_URL: 'https://qwlftpqwtmpbzmuuncue.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_kUgY92bUKR7Y_kbBYi5Jlw_owp_4QFm',  // publishable 키도 여기에 넣으면 됩니다

  // 수업 방 이름 (schema.sql 맨 아래 값과 같게). 주소 뒤에 ?room=다른이름 으로 바꿀 수도 있습니다.
  ROOM_ID: 'sookmyung',

  // 데모 모드에서만 쓰는 교사 코드. 실제 교사 코드는 Supabase(schema.sql)에 저장됩니다.
  DEMO_TEACHER_CODE: 'teacher',

  // 영상 슬라이드를 학생 태블릿에서도 재생할 수 있게 할지 (false면 '앞 화면을 봐 주세요' 표시)
  STUDENT_VIDEO: false,

  // 주소창에 보이는 이름 (꾸밈용)
  DISPLAY_HOST: 'ai-literacy.class',
};
