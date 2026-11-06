# 감사 노트

하루하루의 감사를 달력에 담아두는 앱입니다.

## 쓰는 법

- 달력에서 날짜를 누르면 그날의 감사를 적을 수 있습니다
- 위쪽 버튼으로 1주일 / 1달 / 6개월 / 1년 보기를 바꿀 수 있습니다
- 기록한 날은 분홍색으로 표시됩니다
- 오른쪽 위 ⋮ 버튼에서 백업하고 복원할 수 있습니다

## 백업 (CSV)

- 엑셀이나 워드에서 바로 열어 고칠 수 있습니다
- 저장되는 곳: 내 파일 > Documents
- 칸 구성: 날짜 / 요일 / 감사한 내용
- 고친 파일을 다시 불러오면 그대로 반영됩니다

## APK 만들기

1. GitHub에 새 저장소를 만듭니다 (이름 예: `thanks-note`)
2. 이 폴더의 파일을 모두 올립니다 (node_modules, dist 제외)
3. Actions 탭 → APK 빌드 → Run workflow
4. 5~8분 뒤 Artifacts 에서 `thanks-note-apk` 다운로드

## 내용 바꾸기

- 색깔: `src/index.css`, `src/components/Backdrop.tsx`
- 앱 이름: `capacitor.config.json`
- 아이콘: `assets/icon.png` 교체
