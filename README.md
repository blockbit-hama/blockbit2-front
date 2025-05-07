# BlockBit

BlockBit은 빠르고 안전한 디지털 자산 거래 플랫폼입니다. 최첨단 기술을 활용하여 번개처럼 빠른 거래, 최고 수준의 보안, 그리고 원활한 접근성을 제공합니다.

## 🌟 프로젝트 개요

BlockBit은 다음과 같은 특징을 가진 디지털 자산 거래 플랫폼입니다:

- **빠른 거래**: 최적화된 엔진으로 빠른 거래 수행
- **최고 수준의 보안**: 사용자 자산 보호를 위한 최첨단 보안 시스템
- **직관적인 인터페이스**: 사용자 친화적인 디자인으로 쉽게 사용 가능
- **다양한 거래 옵션**: 일반 거래부터 퀀트 거래까지 다양한 옵션 제공

## 💻 기술 스택

이 프로젝트는 다음과 같은 기술 스택으로 구축되었습니다:

- **Frontend**: Next.js (v15.1.7), React (v19.0.0), TypeScript
- **UI 라이브러리**: Material-UI (v7.1.0)
- **인증**: 자체 구현 인증 시스템 (쿠키 기반)
- **스타일링**: Emotion (@emotion/react, @emotion/styled)

## 🚀 프로젝트 구조

```
blockbit/
├── public/            # 정적 파일 (이미지, 아이콘 등)
├── src/
│   ├── app/           # Next.js App Router 페이지
│   ├── components/    # 재사용 가능한 컴포넌트
│   ├── config/        # 설정 파일
│   ├── lib/           # 유틸리티 및 헬퍼 함수
│   ├── services/      # API 서비스
│   ├── theme/         # Material UI 테마 설정
│   └── middleware.ts  # Next.js 미들웨어
├── package.json       # 의존성 및 스크립트
└── tsconfig.json      # TypeScript 설정
```

## 📋 주요 기능

### 홈페이지
- 메인 랜딩 페이지는 Hero 섹션, 특징, 로고 컬렉션, 고객 후기, 가격 정책, FAQ 등의 섹션으로 구성됩니다.
- AppAppBar는 로그인 상태에 따라 다른 네비게이션 옵션을 제공합니다.

### 인증 시스템
- 이메일/비밀번호 기반 로그인
- 쿠키 기반의 인증 토큰 관리
- 사용자 세션 관리
- 구글, 페이스북 소셜 로그인 지원 (준비 중)

### 지갑 기능
- 디지털 자산 관리
- 자산 조회
- 거래 내역 확인

### 블로그
- 최신 암호화폐 뉴스 및 정보 제공
- 교육 콘텐츠

## 🔧 설치 및 실행 방법

### 필수 요구 사항
- Node.js 14.0.0 이상
- npm 또는 yarn

### 설치 단계

1. 레포지토리 클론
```bash
git clone https://github.com/blockbit-hama/blockbit-front.git
cd blockbit
```

2. 의존성 설치
```bash
npm install
# 또는
yarn install
```

3. 개발 서버 실행
```bash
npm run dev
# 또는
yarn dev
```

4. 브라우저에서 확인
```
http://localhost:3000
```

## 🔨 빌드 방법

프로덕션 배포를 위한 빌드:

```bash
npm run build
# 또는
yarn build
```

빌드된 애플리케이션 실행:

```bash
npm run start
# 또는
yarn start
```

## 👩‍💻 개발 가이드

### 코드 스타일
- TypeScript를 사용한 정적 타입 체크
- Material UI 컴포넌트 시스템 준수
- 재사용 가능한 컴포넌트 설계

### 디렉토리 구조
- `/src/app`: 페이지 레이아웃 및 라우팅
- `/src/components`: 재사용 가능한 UI 컴포넌트
- `/src/lib`: 유틸리티 함수 및 헬퍼
- `/src/theme`: Material UI 테마 구성

### API 요청 가이드
- `/src/lib/auth.ts`의 `fetchWithAuth` 함수를 사용하여 인증이 필요한 API 요청 처리