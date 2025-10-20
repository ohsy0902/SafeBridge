# SafeBridge 기여 가이드

SafeBridge 프로젝트에 기여해주셔서 감사합니다! 이 문서는 프로젝트에 기여하는 방법을 안내합니다.

## 🤝 기여 방법

### 1. 이슈 리포트
버그를 발견하거나 새로운 기능을 제안하고 싶다면:
- [GitHub Issues](https://github.com/your-username/safebridge/issues)에서 새 이슈를 생성
- 명확하고 상세한 설명 제공
- 가능하다면 스크린샷이나 에러 로그 첨부

### 2. Pull Request
코드 기여를 원한다면:
1. 리포지토리를 Fork
2. 새로운 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📋 개발 가이드라인

### 코드 스타일
- **TypeScript** 사용 필수
- **ESLint** 및 **Prettier** 설정 준수
- 컴포넌트명은 PascalCase 사용
- 함수명과 변수명은 camelCase 사용

### 커밋 메시지 규칙
```
type(scope): description

예시:
feat(auth): add multi-language login support
fix(dashboard): resolve mobile responsive issue
docs(readme): update installation guide
```

**Type 종류:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스 또는 도구 변경

### 다국어 지원
- 모든 사용자 인터페이스 텍스트는 다국어 지원 고려
- 새로운 텍스트 추가 시 번역 키 사용
- 문화적 차이를 고려한 UI/UX 설계

### 테스트
- 새로운 기능에는 테스트 코드 작성
- 기존 테스트가 통과하는지 확인
- `npm test` 명령어로 테스트 실행

## 🌍 다국어 기여

SafeBridge는 다음 언어를 지원합니다:
- 한국어 (Korean)
- 영어 (English)
- 중국어 (Chinese)
- 베트남어 (Vietnamese)
- 태국어 (Thai)
- 필리핀어 (Filipino)
- 인도네시아어 (Indonesian)
- 네팔어 (Nepali)
- 캄보디아어 (Cambodian)
- 미얀마어 (Myanmar)

번역 기여를 원한다면:
1. `src/locales/` 폴더의 언어 파일 확인
2. 누락된 번역 추가 또는 기존 번역 개선
3. 안전 관련 전문 용어의 정확성 확인

## 🔒 보안 이슈

보안 관련 이슈를 발견했다면:
- 공개 이슈로 리포트하지 마세요
- contact@safebridge.app로 직접 연락
- 상세한 설명과 재현 방법 제공

## 📞 도움이 필요하다면

- [GitHub Discussions](https://github.com/your-username/safebridge/discussions)에서 질문
- [Discord 커뮤니티](https://discord.gg/safebridge) 참여
- 이메일: contact@safebridge.app

## 🎯 우선순위 기여 영역

현재 다음 영역에서 기여를 특히 환영합니다:
- 모바일 반응형 개선
- 접근성(Accessibility) 향상
- 성능 최적화
- 테스트 커버리지 증가
- 문서화 개선

감사합니다! 🙏