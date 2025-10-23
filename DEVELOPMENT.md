# 개발 가이드

## 개발 환경 설정

### 필수 요구사항

- **브라우저**: Google Chrome (최신 버전)
- **에디터**: VS Code, Sublime Text, 또는 원하는 텍스트 에디터
- **Git**: 버전 관리용

### 초기 설정

1. **저장소 클론**
```bash
git clone https://github.com/park-youngtack/claude_test.git
cd claude_test
```

2. **로컬 테스트 환경 설정**
```bash
# 개발 파일을 테스트 디렉토리로 복사
cp -r C:/code/github/claude_test/* "C:/Users/박영택/Documents/extensions/highlight/"

# 또는 Windows 명령 프롬프트에서
xcopy /E /I /Y C:\code\github\claude_test\* "C:\Users\박영택\Documents\extensions\highlight\"
```

**중요**:
- 개발 저장소: `C:\code\github\claude_test\` (Git 버전 관리)
- 테스트 환경: `C:\Users\박영택\Documents\extensions\highlight\` (Chrome Extension 로드용)
- 코드 수정 후 테스트하려면 반드시 테스트 디렉토리로 파일을 복사해야 합니다

3. **Chrome Extension 로드**
```
1. Chrome 브라우저에서 chrome://extensions/ 접속
2. 우측 상단의 "개발자 모드" 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. C:\Users\박영택\Documents\extensions\highlight 폴더 선택
```

4. **개발자 도구 설정**
```
- 팝업 디버깅: 팝업 창에서 우클릭 → "검사"
- 콘텐츠 스크립트 디버깅: 웹페이지에서 F12 → Console 탭
- 백그라운드 디버깅: chrome://extensions/ → 확장 프로그램 "서비스 워커" 클릭
```

## 개발 워크플로우

### 1. 코드 수정 시

```bash
# 1. 새 브랜치 생성
git checkout -b feature/새기능명

# 2. 코드 수정
# (에디터에서 C:\code\github\claude_test\ 폴더의 파일 편집)

# 3. 테스트 환경에 복사
cp -r C:/code/github/claude_test/* "C:/Users/박영택/Documents/extensions/highlight/"

# 또는 특정 파일만 복사 (예: popup.js만 수정한 경우)
cp C:/code/github/claude_test/popup.js "C:/Users/박영택/Documents/extensions/highlight/"

# 4. Chrome에서 확장 프로그램 새로고침
# chrome://extensions/ → 확장 프로그램 옆 새로고침 버튼 클릭

# 5. 테스트
# 웹페이지에서 확장 프로그램 동작 확인

# 6. 커밋 (테스트 성공 시)
git add .
git commit -m "설명적인 커밋 메시지"

# 7. 푸시
git push origin feature/새기능명
```

**빠른 복사 스크립트 (PowerShell)**:
```powershell
# deploy-to-test.ps1 파일 생성
Copy-Item -Path "C:\code\github\claude_test\*" -Destination "C:\Users\박영택\Documents\extensions\highlight\" -Recurse -Force -Exclude ".git"
Write-Host "파일 복사 완료!" -ForegroundColor Green
```

**사용법**:
```powershell
# PowerShell에서 실행
.\deploy-to-test.ps1
```

### 2. 디버깅 워크플로우

**팝업 UI 디버깅:**
```javascript
// popup.js에서 console.log 사용
console.log('키워드:', keyword);
console.log('결과:', results);
```

**웹페이지 디버깅:**
```javascript
// highlightText 함수 내부에서
console.log('하이라이트 시작:', keyword);
console.log('처리된 노드 수:', nodesToReplace.length);
console.log('하이라이트 개수:', count);
```

**에러 추적:**
```javascript
try {
  // 코드
} catch (error) {
  console.error('에러 발생:', error);
  console.error('스택 트레이스:', error.stack);
}
```

### 3. 테스트 체크리스트

새로운 변경사항을 적용한 후 다음 항목을 확인하세요:

- [ ] 팝업이 정상적으로 열리는가?
- [ ] 키워드 입력이 정상 작동하는가?
- [ ] Enter 키로 하이라이트가 실행되는가?
- [ ] 하이라이트 버튼이 정상 작동하는가?
- [ ] 하이라이트 제거 버튼이 정상 작동하는가?
- [ ] 상태 메시지가 올바르게 표시되는가?
- [ ] 콘솔에 에러가 없는가?
- [ ] 다양한 웹사이트에서 테스트했는가?
- [ ] 대용량 페이지에서도 작동하는가?
- [ ] 특수문자가 포함된 키워드도 작동하는가?

## 코딩 스타일 가이드

### JavaScript 컨벤션

**변수 명명:**
```javascript
// Good
const keywordInput = document.getElementById('keyword');
const highlightCount = results[0].result;

// Bad
const ki = document.getElementById('keyword');
const cnt = results[0].result;
```

**함수 명명:**
```javascript
// Good - 동사로 시작
function highlightText(keyword) { }
function clearHighlights() { }
function showStatus(message, type) { }

// Bad
function text(keyword) { }
function highlights() { }
function status(message, type) { }
```

**주석 작성:**
```javascript
// Good - 왜(Why)를 설명
// TreeWalker를 사용하여 성능 최적화
const walker = document.createTreeWalker(...);

// Bad - 무엇(What)만 반복
// TreeWalker 생성
const walker = document.createTreeWalker(...);
```

**에러 처리:**
```javascript
// Good
try {
  const results = await chrome.scripting.executeScript({...});
  if (!results || results.length === 0) {
    throw new Error('결과 없음');
  }
} catch (error) {
  console.error('Error:', error);
  showStatus('실패: ' + error.message, 'error');
}

// Bad
try {
  const results = await chrome.scripting.executeScript({...});
} catch (error) {
  // 에러 무시
}
```

### HTML/CSS 컨벤션

**HTML:**
```html
<!-- Good - 의미있는 ID 사용 -->
<input type="text" id="keyword" placeholder="키워드 입력">
<button id="highlight">하이라이트</button>

<!-- Bad - 불명확한 ID -->
<input type="text" id="input1">
<button id="btn1">버튼</button>
```

**CSS:**
```css
/* Good - BEM 스타일 또는 명확한 클래스명 */
.status-message {
  padding: 10px;
}

.status-message--success {
  background-color: #d4edda;
}

/* Bad - 불명확한 클래스명 */
.msg {
  padding: 10px;
}
```

## 파일 구조 가이드

### 새 파일 추가 시

1. **JavaScript 파일**
   - `popup.js`: 팝업 관련 로직만
   - `content.js`: 웹페이지에 로드되는 스크립트
   - 새 기능은 별도 파일로 분리 고려 (예: `utils.js`, `storage.js`)

2. **CSS 파일**
   - `styles.css`: 팝업 스타일만
   - 새 페이지는 별도 CSS 파일 생성 (예: `options.css`)

3. **HTML 파일**
   - `popup.html`: 팝업 UI
   - 설정 페이지: `options.html`

### manifest.json 수정

새 파일을 추가하면 manifest.json을 업데이트해야 합니다:

```json
{
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js", "utils.js"],  // 새 파일 추가
      "run_at": "document_idle"
    }
  ],
  "web_accessible_resources": [
    {
      "resources": ["icons/*"],  // 리소스 추가
      "matches": ["<all_urls>"]
    }
  ]
}
```

## 주요 기능 구현 가이드

### 1. 새로운 하이라이트 스타일 추가

```javascript
// popup.js의 highlightText 함수 수정
function highlightText(keyword, style = 'yellow') {
  // ...
  const mark = document.createElement('mark');
  mark.className = 'text-highlighter-mark';
  mark.textContent = keyword;

  // 스타일 적용
  if (style === 'yellow') {
    mark.style.backgroundColor = 'yellow';
    mark.style.color = 'black';
  } else if (style === 'green') {
    mark.style.backgroundColor = '#90EE90';
    mark.style.color = 'black';
  }
  // ...
}
```

### 2. 키워드 히스토리 저장

```javascript
// chrome.storage API 사용
async function saveKeyword(keyword) {
  const { keywords = [] } = await chrome.storage.sync.get('keywords');
  keywords.unshift(keyword);
  const uniqueKeywords = [...new Set(keywords)].slice(0, 10);
  await chrome.storage.sync.set({ keywords: uniqueKeywords });
}

async function loadKeywords() {
  const { keywords = [] } = await chrome.storage.sync.get('keywords');
  return keywords;
}
```

**manifest.json에 권한 추가:**
```json
{
  "permissions": ["activeTab", "scripting", "storage"]
}
```

### 3. 정규표현식 지원

```javascript
function highlightText(pattern, isRegex = false) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        if (node.parentElement.tagName === 'SCRIPT' ||
            node.parentElement.tagName === 'STYLE') {
          return NodeFilter.FILTER_REJECT;
        }

        // 정규표현식 또는 일반 문자열 검색
        if (isRegex) {
          const regex = new RegExp(pattern);
          return regex.test(node.textContent) ?
            NodeFilter.FILTER_ACCEPT :
            NodeFilter.FILTER_REJECT;
        } else {
          return node.textContent.includes(pattern) ?
            NodeFilter.FILTER_ACCEPT :
            NodeFilter.FILTER_REJECT;
        }
      }
    }
  );
  // ...
}
```

### 4. 대소문자 무시 옵션

```javascript
function highlightText(keyword, caseSensitive = true) {
  const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        const text = caseSensitive ?
          node.textContent :
          node.textContent.toLowerCase();

        return text.includes(searchKeyword) ?
          NodeFilter.FILTER_ACCEPT :
          NodeFilter.FILTER_REJECT;
      }
    }
  );
  // ...
}
```

### 5. 컨텍스트 메뉴 추가

**manifest.json:**
```json
{
  "permissions": ["activeTab", "scripting", "contextMenus"],
  "background": {
    "service_worker": "background.js"
  }
}
```

**background.js (새 파일):**
```javascript
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "highlightSelection",
    title: "선택 텍스트 하이라이트",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "highlightSelection") {
    const keyword = info.selectionText;
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: highlightText,
      args: [keyword]
    });
  }
});
```

## 성능 최적화 팁

### 1. 대용량 페이지 처리

```javascript
// 배치 처리로 성능 개선
function highlightText(keyword, batchSize = 100) {
  const nodesToReplace = [];
  let node;

  while (node = walker.nextNode()) {
    nodesToReplace.push(node);

    // 배치 단위로 처리
    if (nodesToReplace.length >= batchSize) {
      processNodes(nodesToReplace.splice(0, batchSize), keyword);
    }
  }

  // 남은 노드 처리
  if (nodesToReplace.length > 0) {
    processNodes(nodesToReplace, keyword);
  }
}

function processNodes(nodes, keyword) {
  nodes.forEach(node => {
    // DOM 조작
  });
}
```

### 2. 디바운싱 적용

```javascript
// 실시간 검색 시 사용
let debounceTimer;

keywordInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    highlightText(e.target.value);
  }, 300); // 300ms 대기
});
```

### 3. 메모리 누수 방지

```javascript
// 이벤트 리스너 정리
window.addEventListener('beforeunload', () => {
  // 리스너 제거
  keywordInput.removeEventListener('keypress', handleKeypress);
  highlightBtn.removeEventListener('click', handleHighlight);
});
```

## 디버깅 팁

### Chrome DevTools 활용

**1. 팝업 디버깅:**
```javascript
// popup.js
console.log('팝업 로드됨');
console.log('현재 탭:', tab);
console.log('실행 결과:', results);
```

**2. 콘텐츠 스크립트 디버깅:**
```javascript
// highlightText 함수 내부
console.log('=== 하이라이트 시작 ===');
console.log('키워드:', keyword);
console.log('발견된 노드 수:', nodesToReplace.length);
console.log('=== 하이라이트 완료 ===');
```

**3. Performance 프로파일링:**
```javascript
console.time('하이라이트 작업');
// 작업 수행
console.timeEnd('하이라이트 작업');
```

**4. 메모리 프로파일링:**
```
Chrome DevTools → Memory 탭 → Take snapshot
```

### 일반적인 문제 해결

**문제 1: 팝업이 열리지 않음**
- 해결: manifest.json의 action.default_popup 경로 확인
- 해결: 콘솔에서 에러 메시지 확인

**문제 2: 스크립트 주입 실패**
- 해결: chrome://extensions/ 페이지에서는 작동 안 함 (보안상)
- 해결: activeTab 권한 확인
- 해결: 일반 웹페이지에서 테스트

**문제 3: 하이라이트가 적용되지 않음**
- 해결: TreeWalker 필터 로직 확인
- 해결: 콘솔 로그로 nodesToReplace 배열 확인
- 해결: SCRIPT, STYLE 태그 제외 확인

**문제 4: 하이라이트 제거가 안 됨**
- 해결: mark.text-highlighter-mark 클래스명 일치 확인
- 해결: querySelectorAll 결과 확인

## 테스트 가이드

### 수동 테스트

**기본 기능 테스트:**
```
1. 간단한 웹페이지 (예: Google 검색 결과)
   - 키워드: "Google"
   - 예상 결과: 여러 개 하이라이트

2. 복잡한 웹페이지 (예: Wikipedia)
   - 키워드: "the"
   - 예상 결과: 수백 개 하이라이트

3. 동적 컨텐츠 (예: Twitter)
   - 스크롤 후 하이라이트 재실행
   - 예상 결과: 새 컨텐츠도 하이라이트

4. 특수문자 테스트
   - 키워드: "C++"
   - 예상 결과: 정확한 매칭
```

**엣지 케이스 테스트:**
```
1. 빈 키워드 입력
   - 예상 결과: 아무 동작 안 함

2. 존재하지 않는 키워드
   - 예상 결과: "0개 하이라이트" 메시지

3. 매우 긴 키워드
   - 예상 결과: 정상 작동

4. 특수문자만 입력
   - 예상 결과: 정상 작동 또는 에러 메시지
```

### 자동화 테스트 (미래 개선)

```javascript
// 예시: Jest를 사용한 단위 테스트
describe('highlightText', () => {
  test('키워드를 정확히 하이라이트한다', () => {
    document.body.innerHTML = '<p>Hello World</p>';
    const count = highlightText('Hello');
    expect(count).toBe(1);
    expect(document.querySelector('mark').textContent).toBe('Hello');
  });
});
```

## 배포 가이드

### Chrome Web Store 배포

1. **확장 프로그램 패키징**
```bash
# 프로젝트 폴더를 ZIP으로 압축
zip -r text-highlighter.zip . -x "*.git*" "*.DS_Store"
```

2. **Chrome Web Store 등록**
```
1. Chrome Web Store Developer Dashboard 접속
2. 새 항목 등록
3. ZIP 파일 업로드
4. 스크린샷, 설명, 아이콘 추가
5. 게시 신청
```

3. **아이콘 준비**
```
필요한 아이콘 크기:
- 16x16 (툴바)
- 48x48 (확장 프로그램 관리 페이지)
- 128x128 (웹 스토어)
```

### 버전 관리

**manifest.json 버전 업데이트:**
```json
{
  "version": "1.1.0"
}
```

**버전 번호 규칙:**
- Major.Minor.Patch (예: 1.2.3)
- Major: 호환성이 깨지는 변경
- Minor: 새 기능 추가
- Patch: 버그 수정

## 기여 가이드

### Pull Request 프로세스

1. **이슈 확인**
   - 기존 이슈 검색
   - 없으면 새 이슈 생성

2. **브랜치 생성**
```bash
git checkout -b feature/issue-번호-기능명
```

3. **코드 작성**
   - 코딩 스타일 가이드 준수
   - 주석 추가
   - 테스트 수행

4. **커밋**
```bash
git add .
git commit -m "feat: 새 기능 추가 (#이슈번호)"
```

**커밋 메시지 컨벤션:**
- `feat:` 새 기능
- `fix:` 버그 수정
- `docs:` 문서 수정
- `style:` 코드 스타일 변경
- `refactor:` 리팩토링
- `test:` 테스트 추가
- `chore:` 빌드, 설정 변경

5. **Push & PR**
```bash
git push origin feature/issue-번호-기능명
```
- GitHub에서 Pull Request 생성
- 변경사항 설명
- 리뷰 요청

### 코드 리뷰 체크리스트

리뷰어는 다음 항목을 확인합니다:

- [ ] 코드가 스타일 가이드를 따르는가?
- [ ] 주석이 적절하게 작성되었는가?
- [ ] 에러 처리가 되어 있는가?
- [ ] 성능 문제가 없는가?
- [ ] 보안 취약점이 없는가?
- [ ] 테스트가 통과하는가?
- [ ] manifest.json이 올바르게 업데이트되었는가?

## 문제 해결 및 지원

### 로그 수집

```javascript
// 상세 로그 활성화
const DEBUG = true;

if (DEBUG) {
  console.log('디버그 정보:', ...);
}
```

### 자주 묻는 질문 (FAQ)

**Q: 확장 프로그램이 특정 사이트에서 작동하지 않습니다.**
A: chrome:// 또는 chrome-extension:// 페이지에서는 보안상 작동하지 않습니다.

**Q: 페이지 새로고침 후 하이라이트가 사라집니다.**
A: 현재는 정상 동작입니다. 영구 저장 기능은 향후 추가될 예정입니다.

**Q: 성능이 느립니다.**
A: 대용량 페이지의 경우 처리 시간이 걸릴 수 있습니다. 배치 처리 최적화를 고려하세요.

### 지원 및 연락

- **GitHub Issues**: https://github.com/park-youngtack/claude_test/issues
- **이메일**: (이메일 주소 추가)
- **문서**: [README.md](./README.md), [ARCHITECTURE.md](./ARCHITECTURE.md)

## 참고 자료

### 공식 문서

- [Chrome Extension 개발 가이드](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 마이그레이션](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Extension API 레퍼런스](https://developer.chrome.com/docs/extensions/reference/)

### 유용한 도구

- [Extension Reloader](https://chrome.google.com/webstore/detail/extensions-reloader/) - 자동 새로고침
- [Chrome Extension Source Viewer](https://chrome.google.com/webstore/detail/chrome-extension-source-v/) - 다른 확장 프로그램 코드 보기

### 학습 리소스

- [MDN Web Docs - TreeWalker](https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker)
- [Chrome Extension 샘플 코드](https://github.com/GoogleChrome/chrome-extensions-samples)
- [Manifest V3 예제](https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/functional-samples)
