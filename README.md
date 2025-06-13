# 🚀 BlockBit Frontend

BlockBit 디지털 자산 거래 플랫폼의 프론트엔드 애플리케이션입니다.

최첨단 기술을 활용하여 번개처럼 빠른 거래, 최고 수준의 보안, 그리고 원활한 접근성을 제공하는 현대적인 웹 애플리케이션입니다.

## 🛠️ 기술 스택

• **프레임워크**: Next.js 15.1.7 (App Router)
• **UI 라이브러리**: React 19.0.0 + TypeScript
• **디자인 시스템**: Material-UI 7.1.0
• **스타일링**: Emotion (@emotion/react, @emotion/styled)
• **인증**: 쿠키 기반 JWT 토큰 관리
• **상태 관리**: React Hooks + Context API

## 📦 주요 기능

### 🏠 **랜딩 페이지**
• **Hero 섹션**: "The World's Fastest BlockBit" 메인 메시지
• **반응형 디자인**: 모바일부터 데스크톱까지 완벽 대응
• **다크/라이트 테마**: 사용자 선호도에 따른 테마 전환

### 🔐 **인증 시스템**
• **로그인/회원가입**: 이메일 기반 인증
• **소셜 로그인**: Google, Facebook 연동 준비
• **토큰 관리**: 쿠키 기반 보안 토큰 저장
• **미들웨어**: 자동 인증 검증 및 리다이렉트

### 💼 **지갑 관리**
• **자산 조회**: 실시간 디지털 자산 현황
• **거래 내역**: 상세한 트랜잭션 히스토리
• **지갑 주소**: 다중 지갑 주소 관리
• **보안 기능**: 멀티시그 지갑 지원

### 📰 **블로그 & 정보**
• **뉴스 피드**: 최신 암호화폐 동향
• **교육 콘텐츠**: 블록체인 가이드
• **마켓 인사이트**: 시장 분석 정보

## 🏗️ 프로젝트 구조

```
blockbit2-front/
├── public/                    # 정적 파일
│   ├── hero-bg.png           # 히어로 배경 이미지
│   ├── logo.png              # 로고 파일
│   └── icons/                # SVG 아이콘들
│       ├── quant.svg         # 퀀트 트레이딩 아이콘
│       ├── trade.svg         # 거래 아이콘
│       └── wallet.svg        # 지갑 아이콘
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── BlockBitLanding.tsx  # 메인 랜딩 컴포넌트
│   │   ├── layout.tsx        # 전역 레이아웃
│   │   ├── page.tsx          # 홈페이지
│   │   ├── login/            # 로그인 페이지
│   │   ├── signup/           # 회원가입 페이지
│   │   ├── wallet/           # 지갑 페이지
│   │   └── blog/             # 블로그 페이지
│   ├── components/           # 재사용 컴포넌트
│   │   ├── AppAppBar.tsx     # 네비게이션 바
│   │   ├── Hero.tsx          # 히어로 섹션
│   │   ├── Features.tsx      # 기능 소개
│   │   ├── Pricing.tsx       # 가격 정책
│   │   ├── FAQ.tsx           # 자주 묻는 질문
│   │   └── Footer.tsx        # 푸터
│   ├── services/             # API 서비스 계층
│   │   ├── apiService.ts     # 공통 API 요청
│   │   ├── userInfoService.ts # 사용자 관리
│   │   ├── walletsService.ts # 지갑 관리
│   │   └── transactionsService.ts # 거래 관리
│   ├── lib/                  # 유틸리티
│   │   ├── auth.ts           # 인증 헬퍼
│   │   └── priceService.ts   # 가격 정보
│   ├── theme/                # Material-UI 테마
│   │   ├── AppTheme.tsx      # 메인 테마
│   │   └── themePrimitives.ts # 테마 기본값
│   ├── types/                # TypeScript 타입
│   │   └── common.ts         # 공통 타입 정의
│   └── middleware.ts         # Next.js 미들웨어
└── package.json              # 의존성 관리
```

## 🎨 UI/UX 특징

### **Material Design 3.0**
- 최신 Material-UI 컴포넌트 활용
- 일관된 디자인 시스템 적용
- 접근성(Accessibility) 고려

### **반응형 디자인**
- 모바일 퍼스트 접근법
- 태블릿, 데스크톱 최적화
- 유연한 그리드 시스템

### **다크 테마 지원**
- 시스템 설정 자동 감지
- 사용자 선호도 저장
- 부드러운 테마 전환 애니메이션

## 🔧 개발 환경 구성

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 코드 린팅
npm run lint
```

## 🌐 API 연동

### **백엔드 통신**
- **Base URL**: 환경변수로 관리
- **인증**: Bearer 토큰 기반
- **에러 처리**: 통합 에러 핸들링
- **타입 안정성**: TypeScript 완전 지원

### **주요 API 서비스**
```typescript
// 사용자 관리
userInfoService.ts
- 로그인/로그아웃
- 회원가입
- 프로필 관리

// 지갑 관리  
walletsService.ts
- 지갑 생성/조회
- 잔액 확인
- 주소 관리

// 거래 관리
transactionsService.ts
- 거래 내역 조회
- 송금/수신
- 트랜잭션 상태 확인
```

## 🚀 배포 및 운영

### **빌드 최적화**
- **Tree Shaking**: 사용하지 않는 코드 제거
- **Code Splitting**: 동적 import로 번들 크기 최적화
- **이미지 최적화**: Next.js Image 컴포넌트 활용
- **SEO 최적화**: 메타 태그 및 구조화 데이터

### **성능 모니터링**
- **Core Web Vitals**: 사용자 경험 지표 추적
- **번들 크기 분석**: 정기적인 번들 사이즈 모니터링
- **렌더링 성능**: React DevTools를 통한 최적화

## 📱 모바일 지원

### **Progressive Web App (PWA) 준비**
- 서비스 워커 설정 준비
- 오프라인 기능 고려
- 푸시 알림 인프라

### **터치 최적화**
- 터치 친화적 UI 요소
- 스와이프 제스처 지원
- 적절한 터치 타겟 크기

## 🔒 보안 고려사항

### **클라이언트 보안**
- **XSS 방지**: 입력값 검증 및 이스케이프
- **CSRF 보호**: 토큰 기반 요청 검증
- **쿠키 보안**: HttpOnly, Secure 플래그 적용
- **Content Security Policy**: 악성 스크립트 차단

## 💡 개발자 가이드

### **컴포넌트 개발 원칙**
- **재사용성**: 범용적으로 사용 가능한 컴포넌트 설계
- **단일 책임**: 하나의 기능에 집중하는 컴포넌트
- **타입 안정성**: Props 및 State의 명확한 타입 정의

### **성능 최적화 팁**
- **React.memo**: 불필요한 리렌더링 방지
- **useMemo/useCallback**: 계산 결과 및 함수 메모이제이션
- **Lazy Loading**: 컴포넌트 지연 로딩

---

*Built with ❤️ using Next.js & Material-UI*

*"The World's Fastest Digital Asset Platform"*