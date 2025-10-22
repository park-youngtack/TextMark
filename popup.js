document.addEventListener('DOMContentLoaded', function() {
  const keywordInput = document.getElementById('keyword-input');
  const highlightBtn = document.getElementById('highlight-btn');
  const clearBtn = document.getElementById('clear-btn');
  const status = document.getElementById('status');

  // Enter 키로 하이라이트 실행
  keywordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      highlightBtn.click();
    }
  });

  // 하이라이트 버튼 클릭
  highlightBtn.addEventListener('click', async function() {
    const keyword = keywordInput.value.trim();
    console.log('[POPUP] 하이라이트 버튼 클릭됨');
    console.log('[POPUP] 입력된 키워드:', keyword);

    if (!keyword) {
      console.log('[POPUP] 키워드가 비어있음');
      showStatus('키워드를 입력해주세요!', 'error');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('[POPUP] 현재 탭 정보:', tab);
      console.log('[POPUP] 탭 ID:', tab.id);
      console.log('[POPUP] 탭 URL:', tab.url);

      console.log('[POPUP] executeScript 실행 시작...');
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: highlightText,
        args: [keyword]
      });

      console.log('[POPUP] executeScript 실행 완료');
      showStatus(`"${keyword}" 하이라이트 완료!`, 'success');
    } catch (error) {
      console.error('[POPUP] 오류 발생:', error);
      showStatus('오류가 발생했습니다: ' + error.message, 'error');
    }
  });

  // 하이라이트 제거 버튼 클릭
  clearBtn.addEventListener('click', async function() {
    console.log('[POPUP] 하이라이트 제거 버튼 클릭됨');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('[POPUP] 하이라이트 제거 - 탭 ID:', tab.id);

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: clearHighlights
      });

      console.log('[POPUP] 하이라이트 제거 완료');
      showStatus('하이라이트가 제거되었습니다', 'success');
    } catch (error) {
      console.error('[POPUP] 제거 중 오류 발생:', error);
      showStatus('오류가 발생했습니다: ' + error.message, 'error');
    }
  });

  // 상태 메시지 표시
  function showStatus(message, type) {
    status.textContent = message;
    status.className = 'status ' + type;
    setTimeout(() => {
      status.textContent = '';
      status.className = 'status';
    }, 3000);
  }
});

// 페이지에서 실행될 하이라이트 함수
function highlightText(keyword) {
  console.log('=== [PAGE] highlightText 함수 실행 시작 ===');
  console.log('[PAGE] 검색 키워드:', keyword);
  console.log('[PAGE] document.body 존재 여부:', !!document.body);

  // 기존 하이라이트 제거 (인라인)
  console.log('[PAGE] 기존 하이라이트 제거 중...');
  const existingHighlights = document.querySelectorAll('mark.text-highlighter-mark');
  console.log('[PAGE] 제거할 기존 하이라이트 개수:', existingHighlights.length);
  existingHighlights.forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });

  console.log('[PAGE] TreeWalker 생성 중...');
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // script, style 태그는 제외
        if (node.parentElement.tagName === 'SCRIPT' ||
            node.parentElement.tagName === 'STYLE') {
          return NodeFilter.FILTER_REJECT;
        }
        // 텍스트가 키워드를 포함하는지 확인
        if (node.textContent.includes(keyword)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      }
    }
  );

  console.log('[PAGE] 텍스트 노드 수집 중...');
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  console.log('[PAGE] 찾은 텍스트 노드 개수:', textNodes.length);

  if (textNodes.length === 0) {
    console.warn('[PAGE] 경고: 키워드를 포함하는 텍스트 노드를 찾지 못했습니다!');
    return;
  }

  console.log('[PAGE] 하이라이트 적용 시작...');
  let highlightCount = 0;
  textNodes.forEach((textNode, index) => {
    const text = textNode.textContent;
    console.log(`[PAGE] 노드 ${index + 1}/${textNodes.length} - 텍스트:`, text.substring(0, 50));
    const parts = text.split(keyword);

    if (parts.length > 1) {
      console.log(`[PAGE] 노드 ${index + 1}에서 ${parts.length - 1}개 발견`);
      const fragment = document.createDocumentFragment();

      parts.forEach((part, partIndex) => {
        fragment.appendChild(document.createTextNode(part));

        if (partIndex < parts.length - 1) {
          const highlight = document.createElement('mark');
          highlight.className = 'text-highlighter-mark';
          highlight.style.backgroundColor = 'yellow';
          highlight.style.color = 'black';
          highlight.textContent = keyword;
          fragment.appendChild(highlight);
          highlightCount++;
        }
      });

      textNode.parentNode.replaceChild(fragment, textNode);
    }
  });

  console.log('[PAGE] 총 하이라이트 개수:', highlightCount);
  console.log('=== [PAGE] highlightText 함수 실행 완료 ===');
}

// 하이라이트 제거 함수
function clearHighlights() {
  console.log('[PAGE] clearHighlights 함수 실행');
  const highlights = document.querySelectorAll('mark.text-highlighter-mark');
  console.log('[PAGE] 제거할 하이라이트 개수:', highlights.length);

  highlights.forEach((mark, index) => {
    console.log(`[PAGE] 하이라이트 ${index + 1} 제거 중...`);
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });

  console.log('[PAGE] 하이라이트 제거 완료');
}
