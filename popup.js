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

    if (!keyword) {
      showStatus('키워드를 입력해주세요!', 'error');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: highlightText,
        args: [keyword]
      });

      showStatus(`"${keyword}" 하이라이트 완료!`, 'success');
    } catch (error) {
      showStatus('오류가 발생했습니다: ' + error.message, 'error');
    }
  });

  // 하이라이트 제거 버튼 클릭
  clearBtn.addEventListener('click', async function() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: clearHighlights
      });

      showStatus('하이라이트가 제거되었습니다', 'success');
    } catch (error) {
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
  // 기존 하이라이트 제거
  clearHighlights();

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

  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }

  textNodes.forEach(textNode => {
    const text = textNode.textContent;
    const parts = text.split(keyword);

    if (parts.length > 1) {
      const fragment = document.createDocumentFragment();

      parts.forEach((part, index) => {
        fragment.appendChild(document.createTextNode(part));

        if (index < parts.length - 1) {
          const highlight = document.createElement('mark');
          highlight.className = 'text-highlighter-mark';
          highlight.style.backgroundColor = 'yellow';
          highlight.style.color = 'black';
          highlight.textContent = keyword;
          fragment.appendChild(highlight);
        }
      });

      textNode.parentNode.replaceChild(fragment, textNode);
    }
  });
}

// 하이라이트 제거 함수
function clearHighlights() {
  const highlights = document.querySelectorAll('mark.text-highlighter-mark');
  highlights.forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}
