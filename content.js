/**
 * Content Script - 페이지 로드 시 자동 하이라이트
 * 모든 웹페이지에 로드되며, 저장된 키워드를 자동으로 하이라이트합니다
 */

console.log('[Content] 스크립트 로드됨');
console.log('[Content] URL:', window.location.href);
console.log('[Content] 타임스탬프:', new Date().toISOString());

/**
 * 페이지 로드 완료 후 자동 하이라이트 실행
 */
if (document.readyState === 'loading') {
  console.log('[Content] 문서 로딩 중... DOMContentLoaded 이벤트 대기');
  document.addEventListener('DOMContentLoaded', initAutoHighlight);
} else {
  console.log('[Content] 문서 이미 로드됨, 즉시 실행');
  initAutoHighlight();
}

/**
 * 자동 하이라이트 초기화
 */
async function initAutoHighlight() {
  console.log('[Content] ========================================');
  console.log('[Content] 자동 하이라이트 초기화 시작');
  console.log('[Content] ========================================');

  try {
    // Storage에서 키워드 가져오기
    const keywords = await getKeywords();

    console.log('[Content] 저장된 키워드 총 개수:', keywords.length);

    if (keywords.length === 0) {
      console.log('[Content] ℹ️ 저장된 키워드가 없습니다');
      return;
    }

    // 활성화된 키워드만 필터링
    const enabledKeywords = keywords.filter(k => k.enabled);

    console.log('[Content] 활성화된 키워드 개수:', enabledKeywords.length);
    console.log('[Content] 활성화된 키워드 목록:', enabledKeywords.map(k => `"${k.text}" (${k.color})`));

    if (enabledKeywords.length === 0) {
      console.log('[Content] ℹ️ 활성화된 키워드가 없습니다');
      return;
    }

    // 각 키워드에 대해 하이라이트 적용
    let totalHighlights = 0;
    for (const keyword of enabledKeywords) {
      console.log('[Content] ------------------');
      console.log('[Content] 키워드 처리 시작:', keyword.text);
      console.log('[Content] 색상:', keyword.color);

      const count = highlightTextOnPage(keyword.text, keyword.color);

      console.log('[Content] 하이라이트 개수:', count);
      totalHighlights += count;
    }

    console.log('[Content] ========================================');
    console.log('[Content] ✅ 자동 하이라이트 완료');
    console.log('[Content] 총 하이라이트 개수:', totalHighlights);
    console.log('[Content] ========================================');
  } catch (error) {
    console.error('[Content] ❌ 자동 하이라이트 실패:', error);
    console.error('[Content] 에러 메시지:', error.message);
    console.error('[Content] 에러 스택:', error.stack);
  }
}

/**
 * 텍스트 하이라이트 함수
 * @param {string} keyword - 검색할 키워드
 * @param {string} color - 하이라이트 색상
 * @returns {number} 하이라이트된 개수
 */
function highlightTextOnPage(keyword, color) {
  console.log('[Content] highlightTextOnPage 시작:', keyword);

  try {
    // TreeWalker로 텍스트 노드 순회
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // SCRIPT, STYLE, MARK 태그 내부는 제외
          const tagName = node.parentElement.tagName;
          if (tagName === 'SCRIPT' || tagName === 'STYLE' || tagName === 'MARK') {
            return NodeFilter.FILTER_REJECT;
          }

          // 키워드를 포함하는 노드만 허용
          if (node.textContent.includes(keyword)) {
            return NodeFilter.FILTER_ACCEPT;
          }

          return NodeFilter.FILTER_REJECT;
        }
      }
    );

    console.log('[Content] TreeWalker 생성 완료');

    // 노드 수집
    let node;
    const nodesToReplace = [];

    while (node = walker.nextNode()) {
      nodesToReplace.push(node);
    }

    console.log('[Content] 수집된 노드 수:', nodesToReplace.length);

    // DOM 조작
    let count = 0;
    nodesToReplace.forEach((node, index) => {
      try {
        const parent = node.parentNode;
        if (!parent) {
          console.warn('[Content] ⚠️ 부모 노드 없음, 스킵:', index);
          return;
        }

        const text = node.textContent;
        const parts = text.split(keyword);

        const fragment = document.createDocumentFragment();

        parts.forEach((part, partIndex) => {
          // 텍스트 부분 추가
          fragment.appendChild(document.createTextNode(part));

          // 마지막 부분이 아니면 키워드(mark 요소) 추가
          if (partIndex < parts.length - 1) {
            const mark = document.createElement('mark');
            mark.className = 'text-highlighter-mark';
            mark.dataset.keyword = keyword;
            mark.textContent = keyword;
            mark.style.backgroundColor = color;
            mark.style.color = '#000000';
            mark.style.padding = '0';
            mark.style.borderRadius = '2px';

            fragment.appendChild(mark);
            count++;
          }
        });

        // 기존 노드를 새 fragment로 교체
        parent.replaceChild(fragment, node);
      } catch (nodeError) {
        console.error('[Content] ❌ 노드 처리 에러:', index, nodeError);
      }
    });

    console.log('[Content] ✅ highlightTextOnPage 완료:', count, '개');
    return count;
  } catch (error) {
    console.error('[Content] ❌ highlightTextOnPage 에러:', error);
    console.error('[Content] 에러 스택:', error.stack);
    return 0;
  }
}

/**
 * Storage 변경 감지 - 실시간 업데이트
 */
chrome.storage.onChanged.addListener((changes, area) => {
  console.log('[Content] ========================================');
  console.log('[Content] Storage 변경 감지');
  console.log('[Content] Area:', area);
  console.log('[Content] Changes:', changes);
  console.log('[Content] ========================================');

  if (area === 'sync' && changes.highlighter_keywords) {
    console.log('[Content] 키워드 변경 감지됨, 하이라이트 재적용');

    // 기존 하이라이트 제거
    clearAllHighlights();

    // 새로운 키워드로 하이라이트 재적용
    const newKeywords = changes.highlighter_keywords.newValue || [];
    const enabledKeywords = newKeywords.filter(k => k.enabled);

    console.log('[Content] 새 키워드 개수:', enabledKeywords.length);

    enabledKeywords.forEach(keyword => {
      highlightTextOnPage(keyword.text, keyword.color);
    });

    console.log('[Content] ✅ 하이라이트 재적용 완료');
  }
});

/**
 * 모든 하이라이트 제거
 */
function clearAllHighlights() {
  console.log('[Content] 모든 하이라이트 제거 시작');

  try {
    const marks = document.querySelectorAll('mark.text-highlighter-mark');
    console.log('[Content] 제거할 마크 개수:', marks.length);

    marks.forEach((mark, index) => {
      try {
        const parent = mark.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(mark.textContent), mark);
          parent.normalize();
        }
      } catch (markError) {
        console.error('[Content] ❌ 마크 제거 에러:', index, markError);
      }
    });

    console.log('[Content] ✅ 하이라이트 제거 완료');
    return marks.length;
  } catch (error) {
    console.error('[Content] ❌ 하이라이트 제거 실패:', error);
    console.error('[Content] 에러 스택:', error.stack);
    return 0;
  }
}

console.log('[Content] ✅ 스크립트 준비 완료');
