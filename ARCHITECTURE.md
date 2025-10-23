# 아키텍처 문서

## 개요

이 문서는 텍스트 하이라이터 Chrome Extension의 기술 아키텍처와 구현 세부사항을 설명합니다.

## 시스템 아키텍처

### Chrome Extension 패턴

이 확장 프로그램은 Chrome Extension Manifest V3의 표준 아키텍처를 따릅니다:

```
┌─────────────────────────────────────────────────────┐
│              Chrome Browser                          │
│                                                      │
│  ┌──────────────┐         ┌──────────────────────┐ │
│  │   Popup UI   │         │    Active Tab        │ │
│  │              │         │                      │ │
│  │ popup.html   │         │  ┌────────────────┐ │ │
│  │ popup.js     │────────>│  │ Injected       │ │ │
│  │ styles.css   │ Script  │  │ Functions      │ │ │
│  │              │ Inject  │  │                │ │ │
│  └──────────────┘         │  │ highlightText()│ │ │
│                           │  │ clearHighlights│ │ │
│  ┌──────────────┐         │  └────────────────┘ │ │
│  │  content.js  │         │                      │ │
│  │  (Loaded on  │         │   Webpage DOM        │ │
│  │   all pages) │         │                      │ │
│  └──────────────┘         └──────────────────────┘ │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 핵심 컴포넌트

#### 1. Manifest (manifest.json)

Chrome Extension의 설정 파일로, 권한과 리소스를 정의합니다.

**주요 설정:**
- **Manifest Version**: 3 (최신 표준)
- **권한**:
  - `activeTab`: 현재 활성화된 탭에 대한 접근 권한
  - `scripting`: 스크립트 주입 권한
- **Content Scripts**: 모든 URL에서 `content.js` 로드
- **Action**: 팝업 UI 정의

```json
{
  "manifest_version": 3,
  "permissions": ["activeTab", "scripting"],
  "action": {
    "default_popup": "popup.html"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

#### 2. Popup UI (popup.html, popup.js, styles.css)

사용자와 상호작용하는 인터페이스입니다.

**popup.html 구조:**
```html
<body>
  <div class="container">
    <input type="text" id="keyword">  <!-- 키워드 입력 -->
    <button id="highlight">하이라이트</button>
    <button id="clear">하이라이트 제거</button>
    <div id="status"></div>  <!-- 상태 메시지 -->
  </div>
</body>
```

**popup.js 이벤트 흐름:**
```
User Input → Event Listener → Chrome API → Script Injection → DOM Manipulation
```

#### 3. Content Script (content.js)

모든 웹페이지에 자동으로 로드되는 스크립트입니다.

**현재 역할:**
- 확장 프로그램이 정상적으로 로드되었는지 확인
- 디버깅 로그 출력

**참고:** 실제 하이라이트 로직은 `chrome.scripting.executeScript()`를 통해 동적으로 주입됩니다.

## 핵심 기능 구현

### 1. 텍스트 하이라이트 (highlightText)

#### 알고리즘 흐름

```
1. 기존 하이라이트 제거 (clearHighlights 로직 인라인)
   ↓
2. TreeWalker로 모든 텍스트 노드 순회
   ↓
3. 각 텍스트 노드에서 키워드 검색
   ↓
4. 키워드 발견 시 <mark> 태그로 래핑
   ↓
5. DOM에 변경사항 반영
   ↓
6. 결과 리턴 (하이라이트 개수)
```

#### 상세 구현

```javascript
function highlightText(keyword) {
  // 1. 기존 하이라이트 제거
  const existingMarks = document.querySelectorAll('mark.text-highlighter-mark');
  existingMarks.forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });

  // 2. TreeWalker 생성 (텍스트 노드만 순회)
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // SCRIPT, STYLE 태그 내부는 제외
        if (node.parentElement.tagName === 'SCRIPT' ||
            node.parentElement.tagName === 'STYLE') {
          return NodeFilter.FILTER_REJECT;
        }
        // 키워드를 포함하는 노드만 처리
        if (node.textContent.includes(keyword)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      }
    }
  );

  // 3. 텍스트 노드 처리
  let node;
  let count = 0;
  const nodesToReplace = [];

  while (node = walker.nextNode()) {
    nodesToReplace.push(node);
  }

  // 4. DOM 조작 (순회 완료 후)
  nodesToReplace.forEach(node => {
    const parent = node.parentNode;
    const text = node.textContent;
    const parts = text.split(keyword);

    const fragment = document.createDocumentFragment();

    parts.forEach((part, index) => {
      fragment.appendChild(document.createTextNode(part));

      if (index < parts.length - 1) {
        const mark = document.createElement('mark');
        mark.className = 'text-highlighter-mark';
        mark.textContent = keyword;
        mark.style.backgroundColor = 'yellow';
        mark.style.color = 'black';
        fragment.appendChild(mark);
        count++;
      }
    });

    parent.replaceChild(fragment, node);
  });

  return count;
}
```

#### 기술적 선택 이유

**TreeWalker API 사용:**
- `querySelectorAll('*')`보다 효율적
- 텍스트 노드에 직접 접근 가능
- 필터 함수로 불필요한 노드 제외

**DocumentFragment 사용:**
- 여러 DOM 조작을 한 번에 수행
- 리플로우/리페인트 최소화
- 성능 최적화

**클래스 네임 부여:**
- `.text-highlighter-mark`로 하이라이트 요소 식별
- 다른 확장 프로그램과의 충돌 방지

### 2. 하이라이트 제거 (clearHighlights)

#### 알고리즘

```
1. 모든 mark.text-highlighter-mark 요소 검색
   ↓
2. 각 mark 요소를 텍스트 노드로 교체
   ↓
3. 부모 노드 정규화 (텍스트 노드 병합)
   ↓
4. 제거된 개수 리턴
```

#### 구현

```javascript
function clearHighlights() {
  const marks = document.querySelectorAll('mark.text-highlighter-mark');
  const count = marks.length;

  marks.forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });

  return count;
}
```

**normalize() 사용 이유:**
- 연속된 텍스트 노드를 하나로 병합
- DOM 구조 정리 및 메모리 최적화
- 다음 하이라이트 작업 시 일관성 유지

### 3. 스크립트 주입 (popup.js)

Chrome Extension API를 사용하여 함수를 웹페이지에 주입합니다.

```javascript
// 활성 탭 조회
const [tab] = await chrome.tabs.query({
  active: true,
  currentWindow: true
});

// 스크립트 주입 및 실행
const results = await chrome.scripting.executeScript({
  target: { tabId: tab.id },
  func: highlightText,
  args: [keyword]
});

// 결과 처리
const count = results[0].result;
```

**executeScript 방식의 장점:**
- 함수를 직접 주입하여 코드 중복 방지
- `args`로 파라미터 전달 가능
- 실행 결과를 Promise로 받을 수 있음
- Manifest V3 호환

## 데이터 흐름

### 하이라이트 작업 시퀀스

```
1. User: 키워드 입력 + 버튼 클릭
   ↓
2. popup.js: 이벤트 리스너 트리거
   ↓
3. popup.js: chrome.tabs.query() - 활성 탭 조회
   ↓
4. popup.js: chrome.scripting.executeScript() - 함수 주입
   ↓
5. Injected Function: highlightText(keyword) 실행
   ↓
6. Webpage DOM: TreeWalker로 텍스트 노드 순회
   ↓
7. Webpage DOM: 키워드를 <mark> 태그로 래핑
   ↓
8. Injected Function: 하이라이트 개수 리턴
   ↓
9. popup.js: 결과 수신 및 상태 메시지 표시
   ↓
10. User: 상태 메시지 확인
```

## 상태 관리

### 클라이언트 상태

**Popup 상태:**
- 입력 필드 값 (ephemeral, 팝업 닫으면 사라짐)
- 상태 메시지 (3초 후 자동 제거)

**웹페이지 상태:**
- DOM에 주입된 `<mark>` 요소들
- 페이지 새로고침 시 모두 초기화됨

**영구 저장소 없음:**
- 현재 버전은 localStorage나 chrome.storage 사용 안 함
- 모든 상태는 휘발성 (세션 기반)

## 성능 고려사항

### 최적화 기법

1. **TreeWalker 필터링**
   - SCRIPT, STYLE 태그 사전 제외
   - 키워드 없는 노드 건너뛰기

2. **배치 DOM 조작**
   - DocumentFragment 사용
   - 한 번의 replaceChild로 처리

3. **이벤트 위임**
   - 버튼별 개별 리스너 (간단한 UI)

4. **디바운싱 없음**
   - Enter 키 또는 버튼 클릭만 처리
   - 실시간 검색 없음 (성능 고려)

### 제한사항

1. **대용량 페이지**
   - 수천 개의 텍스트 노드가 있는 경우 느려질 수 있음
   - 개선 방안: 가상 스크롤링, 점진적 하이라이트

2. **동적 컨텐츠**
   - AJAX로 로드된 컨텐츠는 자동 하이라이트 안 됨
   - MutationObserver로 개선 가능

3. **대소문자 구분**
   - 현재는 대소문자를 구분함
   - `String.toLowerCase()` 추가로 개선 가능

## 보안 고려사항

### Content Security Policy (CSP)

- Manifest V3는 `eval()` 및 인라인 스크립트 금지
- 모든 스크립트는 별도 파일로 분리
- `chrome.scripting.executeScript` 사용 (안전한 방식)

### 권한 최소화

- `activeTab`: 사용자가 명시적으로 클릭한 탭만 접근
- 백그라운드 권한 없음
- 네트워크 요청 없음

### XSS 방지

- 사용자 입력을 HTML로 파싱하지 않음
- `textContent` 사용 (innerHTML 대신)
- 입력값을 그대로 문자열로 처리

## 에러 핸들링

### Try-Catch 블록

```javascript
try {
  const results = await chrome.scripting.executeScript({...});
  showStatus('성공!', 'success');
} catch (error) {
  console.error('Error:', error);
  showStatus('실패: ' + error.message, 'error');
}
```

### 디버깅 로그

- 콘솔 로그로 상세한 작업 내역 기록
- 하이라이트 개수, 처리 노드 수 출력
- 에러 발생 시 스택 트레이스 표시

## 확장 가능성

### 향후 개선 가능 항목

1. **설정 페이지**
   - 하이라이트 색상 커스터마이징
   - 대소문자 구분 옵션
   - 정규표현식 지원

2. **영구 저장**
   - `chrome.storage.sync`로 키워드 히스토리 저장
   - 자주 사용하는 키워드 목록

3. **컨텍스트 메뉴**
   - 텍스트 선택 후 우클릭으로 하이라이트
   - 단축키 지원 (Keyboard Shortcuts)

4. **성능 개선**
   - Web Worker로 대용량 페이지 처리
   - 점진적 하이라이트 (Incremental Rendering)

5. **UI/UX 개선**
   - 하이라이트 네비게이션 (이전/다음)
   - 매칭 개수 실시간 표시
   - 다크 모드 지원

## 기술 스택 상세

### 브라우저 API

| API | 용도 | 파일 |
|-----|------|------|
| chrome.tabs.query() | 활성 탭 조회 | popup.js |
| chrome.scripting.executeScript() | 스크립트 주입 | popup.js |
| TreeWalker API | DOM 트리 순회 | popup.js (injected) |
| DocumentFragment | 배치 DOM 조작 | popup.js (injected) |
| NodeFilter | 노드 필터링 | popup.js (injected) |

### DOM 조작

- `document.createTreeWalker()` - 텍스트 노드 순회
- `document.createElement()` - mark 요소 생성
- `document.createTextNode()` - 텍스트 노드 생성
- `document.createDocumentFragment()` - 배치 처리
- `node.replaceChild()` - 노드 교체
- `node.normalize()` - 텍스트 노드 병합

### 이벤트 처리

- `addEventListener('click')` - 버튼 클릭
- `addEventListener('keypress')` - Enter 키 입력
- `setTimeout()` - 상태 메시지 자동 제거

## 디렉토리 구조 상세

```
claude_test/
│
├── manifest.json          # Chrome Extension 메타데이터
│   ├── manifest_version: 3
│   ├── permissions: ["activeTab", "scripting"]
│   └── content_scripts: content.js 자동 로드 설정
│
├── popup.html             # 팝업 UI 구조
│   ├── keyword input field
│   ├── highlight button
│   ├── clear button
│   └── status message area
│
├── popup.js               # 메인 로직
│   ├── Event Listeners (click, keypress)
│   ├── highlightText() - 하이라이트 함수
│   ├── clearHighlights() - 제거 함수
│   └── showStatus() - 상태 표시 함수
│
├── content.js             # 콘텐츠 스크립트
│   └── 페이지 로드 확인 로그
│
├── styles.css             # UI 스타일
│   ├── 버튼 스타일 (hover, active)
│   ├── 입력 필드 스타일
│   └── 상태 메시지 스타일 (success, error)
│
└── README.md              # 사용자 문서
```

## 버전 히스토리 및 변경 이력

### v1.0 (현재)

**주요 변경사항:**

1. **eab73da** - highlightText 함수 리팩토링
   - clearHighlights 로직을 highlightText 내부로 이동
   - 함수 호출 단순화
   - 코드 중복 제거

2. **43a4243** - 디버깅 강화
   - 상세한 console.log 추가
   - 처리 노드 수, 하이라이트 개수 출력
   - 에러 추적 개선

3. **f610c3a** - 아이콘 참조 제거
   - manifest.json에서 아이콘 파일 제거
   - 선택적 아이콘 지원

4. **0279c21** - 초기 구현
   - 기본 하이라이트 기능
   - Manifest V3 구조
   - 팝업 UI

## 참고 자료

- [Chrome Extension Manifest V3 문서](https://developer.chrome.com/docs/extensions/mv3/)
- [TreeWalker API](https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker)
- [Chrome Scripting API](https://developer.chrome.com/docs/extensions/reference/scripting/)
- [DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment)
