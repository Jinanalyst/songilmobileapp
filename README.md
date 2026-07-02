# 손길 (Songil) — 청소 중개 모바일 앱

손길 웹사이트(청소 예약 중개 플랫폼)를 그대로 옮긴 안드로이드 앱입니다.
**Vite + React (웹뷰)** 를 **Capacitor** 로 감싼 네이티브 앱이며, Google Play 스토어에
업로드할 수 있는 서명된 AAB를 생성합니다.

## 온보딩 플로우
로그인(카카오/구글) → 역할 선택(고객 / 청소 업체 / 아직 잘 모르겠어요 – 구경) → 메인

## 메인 화면 (하단 탭 4개)
1. **예약** — 4단계 예약 플로우(서비스 → 날짜·시간 → 정보 입력 → 예약금 3만원 결제·목업)
2. **파트너** — 검증된 청소 업체 소개, 업체 상세·후기
3. **상담** — 초보자도 쉬운 3단계 견적 상담 신청(무엇을 → 연락처 → 확인)
4. **계정** — 내 예약/상담 내역, 이용 유형 전환, 고객센터·사업자 정보

> 데이터·디자인은 웹의 `src/lib/data.ts` / `globals.css` 를 그대로 이식했습니다.
> 로그인/결제/상담 제출은 **목업(시뮬레이션)** 이며, 예약·상담 내역은 기기
> localStorage 에 저장됩니다.

## 산출물 (`build-output/`)
| 파일 | 용도 |
| --- | --- |
| `songil-1.0.0-release.aab` | **Google Play 업로드용** (서명됨) |
| `songil-1.0.0-release.apk` | 서명된 릴리스 APK (직접 배포·테스트) |
| `songil-1.0.0-debug.apk` | 디버그 APK (기기 사이드로드 테스트) |

- applicationId: `online.handway.songil`, versionName `1.0.0`, versionCode `1`

## 개발/실행
```powershell
npm install
npm run dev          # 웹 미리보기
npm run sync         # 웹 빌드 후 android 로 동기화 (cap sync)
```

## 안드로이드 빌드 (이 PC 기준)
프로젝트 경로에 한글이 포함돼 있어 `android/gradle.properties` 에
`android.overridePathCheck=true` 가 설정돼 있습니다. Java 17 + Android SDK 필요.

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"
cd android
.\gradlew.bat :app:bundleRelease :app:assembleRelease --no-daemon
```

## 서명 키스토어 ⚠️
- 파일: `android/songil-upload.keystore` (alias `songil-upload`)
- 비밀번호는 `android/keystore.properties` 에 저장 (storePassword / keyPassword).
- **키스토어 파일과 keystore.properties 는 git 에 포함되지 않습니다**(`.gitignore`).
  이 두 파일을 반드시 **안전한 곳에 별도 백업**하세요. 잃어버리면 Play 스토어 앱
  업데이트가 영구적으로 불가능합니다.
- 새 환경에서 빌드하려면 `android/keystore.properties` 를 아래 형식으로 만들면 됩니다:
  ```
  storeFile=../songil-upload.keystore
  storePassword=<비밀번호>
  keyAlias=songil-upload
  keyPassword=<비밀번호>
  ```

## 구글/카카오 OAuth 활성화 (남은 설정)
간편 로그인은 바로 동작합니다. 소셜 로그인을 켜려면:
1. Supabase 대시보드 → Authentication → URL Configuration → **Redirect URLs** 에
   `online.handway.songil://auth/callback` 추가.
2. (사이트에서 이미 구글/카카오 provider 를 쓰고 있으므로 provider 설정은 그대로 사용.)
- 앱에는 이미 딥링크 스킴(`online.handway.songil://`)이 AndroidManifest 에 등록돼 있습니다.

## 출시 전 다듬을 것 (권장)
- 앱 아이콘/스플래시를 손길 로고로 교체 (`android/app/src/main/res/mipmap-*`)
- 실제 카카오/구글 로그인, 결제(PG), 백엔드(Supabase) 연동으로 전환
- 개인정보처리방침 URL, 스토어 등록 정보(스크린샷·설명) 준비
