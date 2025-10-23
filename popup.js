/**
 * Popup Script - 키워드 관리 UI 로직
 */

console.log('[Popup] 스크립트 로드 시작');

// DOM 요소
let keywordInput;
let colorSelect;
let addBtn;
let keywordsList;
let keywordCount;
let statusEl;

// 드래그 앤 드롭 상태
let draggedElement = null;

/**
 * 초기화
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Popup] DOM 로드 완료');

  try {
    // DOM 요소 가져오기
    keywordInput = document.getElementById('keyword-input');
    colorSelect = document.getElementById('color-select');
    addBtn = document.getElementById('add-btn');
    keywordsList = document.getElementById('keywords-list');
    keywordCount = document.getElementById('keyword-count');
    statusEl = document.getElementById('status');

    console.log('[Popup] DOM 요소 확인 완료');

    // 이벤트 리스너 등록
    addBtn.addEventListener('click', handleAddKeyword);
    keywordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleAddKeyword();
      }
    });

    console.log('[Popup] 이벤트 리스너 등록 완료');

    // 키워드 목록 로드 및 렌더링
    await loadAndRenderKeywords();

    console.log('[Popup] ✅ 초기화 완료');
  } catch (error) {
    console.error('[Popup] ❌ 초기화 실패:', error);
    console.error('[Popup] 에러 스택:', error.stack);
    showStatus('초기화 실패: ' + error.message, 'error');
  }
});

/**
 * 키워드 추가 핸들러
 */
async function handleAddKeyword() {
  console.log('[Popup] 키워드 추가 시작');

  const text = keywordInput.value.trim();
  const color = colorSelect.value;

  console.log('[Popup] 입력값:', { text, color });

  if (!text) {
    console.warn('[Popup] ⚠️ 빈 키워드');
    showStatus('키워드를 입력해주세요', 'error');
    return;
  }

  try {
    const keyword = await addKeyword(text, color);

    if (!keyword) {
      console.warn('[Popup] ⚠️ 키워드 추가 실패 (중복 가능성)');
      showStatus('이미 존재하는 키워드이거나 추가할 수 없습니다', 'error');
      return;
    }

    console.log('[Popup] ✅ 키워드 추가 성공:', keyword);

    // 입력 필드 초기화
    keywordInput.value = '';
    keywordInput.focus();

    // 목록 새로고침
    await loadAndRenderKeywords();

    // 현재 탭에 즉시 하이라이트 적용
    await applyHighlightToCurrentTab(keyword);

    showStatus(`"${text}" 추가 완료!`, 'success');
  } catch (error) {
    console.error('[Popup] ❌ 키워드 추가 에러:', error);
    console.error('[Popup] 에러 스택:', error.stack);
    showStatus('키워드 추가 실패', 'error');
  }
}

/**
 * 키워드 목록 로드 및 렌더링
 */
async function loadAndRenderKeywords() {
  console.log('[Popup] 키워드 목록 렌더링 시작');

  try {
    const keywords = await getKeywords();
    console.log('[Popup] 로드된 키워드:', keywords.length, '개');

    renderKeywordsList(keywords);

    // 개수 업데이트
    keywordCount.textContent = keywords.length;

    console.log('[Popup] ✅ 렌더링 완료');
  } catch (error) {
    console.error('[Popup] ❌ 렌더링 에러:', error);
    console.error('[Popup] 에러 스택:', error.stack);
  }
}

/**
 * 키워드 목록 렌더링
 */
function renderKeywordsList(keywords) {
  console.log('[Popup] 리스트 렌더링:', keywords.length, '개');

  if (keywords.length === 0) {
    keywordsList.innerHTML = `
      <div class="empty-state">
        <p>저장된 키워드가 없습니다</p>
        <p class="hint">위에서 키워드를 추가해보세요</p>
      </div>
    `;
    return;
  }

  keywordsList.innerHTML = '';

  keywords.forEach((keyword, index) => {
    const item = createKeywordElement(keyword, index);
    keywordsList.appendChild(item);
  });

  console.log('[Popup] ✅ 리스트 렌더링 완료');
}

/**
 * 키워드 요소 생성
 */
function createKeywordElement(keyword, index) {
  console.log('[Popup] 키워드 요소 생성:', keyword.text);

  const item = document.createElement('div');
  item.className = 'keyword-item' + (keyword.enabled ? '' : ' disabled');
  item.draggable = true;
  item.dataset.id = keyword.id;
  item.dataset.index = index;

  item.innerHTML = `
    <div class="drag-handle">
      <span></span>
      <span></span>
      <span></span>
    </div>

    <label class="toggle-switch">
      <input type="checkbox" ${keyword.enabled ? 'checked' : ''}>
      <span class="toggle-slider"></span>
    </label>

    <div class="keyword-text">${escapeHtml(keyword.text)}</div>

    <div class="color-indicator" style="background-color: ${keyword.color}"></div>

    <div class="keyword-actions">
      <button class="btn-icon btn-delete" title="삭제">🗑️</button>
    </div>
  `;

  // 드래그 이벤트
  item.addEventListener('dragstart', handleDragStart);
  item.addEventListener('dragend', handleDragEnd);
  item.addEventListener('dragover', handleDragOver);
  item.addEventListener('drop', handleDrop);

  // 토글 이벤트
  const toggle = item.querySelector('input[type="checkbox"]');
  toggle.addEventListener('change', () => handleToggle(keyword.id, toggle.checked));

  // 색상 변경 이벤트
  const colorIndicator = item.querySelector('.color-indicator');
  colorIndicator.addEventListener('click', () => handleColorChange(keyword.id, keyword.color));

  // 삭제 이벤트
  const deleteBtn = item.querySelector('.btn-delete');
  deleteBtn.addEventListener('click', () => handleDelete(keyword.id, keyword.text));

  return item;
}

/**
 * 드래그 시작
 */
function handleDragStart(e) {
  draggedElement = e.currentTarget;
  draggedElement.classList.add('dragging');

  console.log('[Popup] 드래그 시작 ID:', draggedElement.dataset.id);

  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', draggedElement.innerHTML);
}

/**
 * 드래그 종료
 */
function handleDragEnd(e) {
  console.log('[Popup] 드래그 종료');

  if (draggedElement) {
    draggedElement.classList.remove('dragging');
  }

  // 모든 drag-over 클래스 제거
  document.querySelectorAll('.keyword-item').forEach(item => {
    item.classList.remove('drag-over');
  });

  draggedElement = null;
}

/**
 * 드래그 오버
 */
function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }

  e.dataTransfer.dropEffect = 'move';

  const target = e.currentTarget;
  if (target !== draggedElement) {
    target.classList.add('drag-over');
  }

  return false;
}

/**
 * 드롭
 */
async function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  if (e.preventDefault) {
    e.preventDefault();
  }

  console.log('[Popup] 드롭 이벤트');

  const target = e.currentTarget;
  target.classList.remove('drag-over');

  if (!draggedElement || draggedElement === target) {
    console.log('[Popup] 같은 위치로 드롭, 무시');
    return false;
  }

  const draggedId = draggedElement.dataset.id;
  const targetId = target.dataset.id;

  console.log('[Popup] 드래그:', draggedId, '→ 타겟:', targetId);

  try {
    const keywords = await getKeywords();

    // ID로 실제 인덱스 찾기
    const draggedIndex = keywords.findIndex(k => k.id === draggedId);
    const targetIndex = keywords.findIndex(k => k.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      console.error('[Popup] ❌ 인덱스를 찾을 수 없음');
      return false;
    }

    console.log('[Popup] 실제 인덱스:', draggedIndex, '→', targetIndex);

    // 배열 순서 변경
    const [movedItem] = keywords.splice(draggedIndex, 1);
    keywords.splice(targetIndex, 0, movedItem);

    console.log('[Popup] 새 순서:', keywords.map(k => k.text));

    await reorderKeywords(keywords);

    console.log('[Popup] ✅ 순서 변경 완료');

    // 렌더링 새로고침
    await loadAndRenderKeywords();

    showStatus('순서가 변경되었습니다', 'success');
  } catch (error) {
    console.error('[Popup] ❌ 순서 변경 실패:', error);
    console.error('[Popup] 에러 스택:', error.stack);
    showStatus('순서 변경 실패', 'error');
  }

  return false;
}

/**
 * 토글 핸들러
 */
async function handleToggle(id, enabled) {
  console.log('[Popup] 토글:', id, enabled);

  try {
    await updateKeyword(id, { enabled });

    console.log('[Popup] ✅ 토글 완료');

    // 목록 새로고침
    await loadAndRenderKeywords();

    // 현재 탭에 변경사항 반영
    await refreshCurrentTab();

    showStatus(enabled ? '하이라이트 활성화' : '하이라이트 비활성화', 'success');
  } catch (error) {
    console.error('[Popup] ❌ 토글 실패:', error);
    console.error('[Popup] 에러 스택:', error.stack);
    showStatus('토글 실패', 'error');
  }
}

/**
 * 색상 변경 핸들러
 */
async function handleColorChange(id, currentColor) {
  console.log('[Popup] 색상 변경 요청:', id, currentColor);

  // 간단한 프롬프트로 색상 선택 (나중에 개선 가능)
  const colors = COLOR_PRESETS.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
  const choice = prompt(`색상을 선택하세요:\n\n${colors}\n\n번호를 입력하세요:`);

  if (choice) {
    const index = parseInt(choice) - 1;
    if (index >= 0 && index < COLOR_PRESETS.length) {
      const newColor = COLOR_PRESETS[index].value;

      console.log('[Popup] 새 색상:', newColor);

      try {
        await updateKeyword(id, { color: newColor });

        console.log('[Popup] ✅ 색상 변경 완료');

        // 목록 새로고침
        await loadAndRenderKeywords();

        // 현재 탭에 변경사항 반영
        await refreshCurrentTab();

        showStatus('색상이 변경되었습니다', 'success');
      } catch (error) {
        console.error('[Popup] ❌ 색상 변경 실패:', error);
        console.error('[Popup] 에러 스택:', error.stack);
        showStatus('색상 변경 실패', 'error');
      }
    }
  }
}

/**
 * 삭제 핸들러
 */
async function handleDelete(id, text) {
  console.log('[Popup] 삭제 요청:', id, text);

  try {
    await deleteKeyword(id);

    console.log('[Popup] ✅ 삭제 완료');

    // 목록 새로고침
    await loadAndRenderKeywords();

    // 현재 탭에 변경사항 반영
    await refreshCurrentTab();

    showStatus(`"${text}" 삭제 완료`, 'success');
  } catch (error) {
    console.error('[Popup] ❌ 삭제 실패:', error);
    console.error('[Popup] 에러 스택:', error.stack);
    showStatus('삭제 실패', 'error');
  }
}

/**
 * 현재 탭에 하이라이트 적용
 */
async function applyHighlightToCurrentTab(keyword) {
  console.log('[Popup] 현재 탭에 하이라이트 적용:', keyword.text);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      console.warn('[Popup] ⚠️ 활성 탭을 찾을 수 없음');
      return;
    }

    console.log('[Popup] 활성 탭:', tab.id, tab.url);

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: highlightKeyword,
      args: [keyword.text, keyword.color]
    });

    console.log('[Popup] ✅ 하이라이트 적용 완료');
  } catch (error) {
    console.error('[Popup] ❌ 하이라이트 적용 실패:', error);
    console.error('[Popup] 에러 스택:', error.stack);
  }
}

/**
 * 현재 탭 새로고침 (모든 하이라이트 재적용)
 */
async function refreshCurrentTab() {
  console.log('[Popup] 현재 탭 새로고침');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      console.warn('[Popup] ⚠️ 활성 탭을 찾을 수 없음');
      return;
    }

    const keywords = await getKeywords();
    const enabledKeywords = keywords.filter(k => k.enabled);

    console.log('[Popup] 활성화된 키워드:', enabledKeywords.length, '개');

    // 기존 하이라이트 모두 제거
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: clearAllHighlights
    });

    // 활성화된 키워드만 다시 하이라이트
    for (const keyword of enabledKeywords) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: highlightKeyword,
        args: [keyword.text, keyword.color]
      });
    }

    console.log('[Popup] ✅ 탭 새로고침 완료');
  } catch (error) {
    console.error('[Popup] ❌ 탭 새로고침 실패:', error);
    console.error('[Popup] 에러 스택:', error.stack);
  }
}

/**
 * 웹페이지에 주입될 함수: 하이라이트 적용
 */
function highlightKeyword(keyword, color) {
  console.log('[Page] 하이라이트 시작:', keyword, color);

  try {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          if (node.parentElement.tagName === 'SCRIPT' ||
              node.parentElement.tagName === 'STYLE' ||
              node.parentElement.tagName === 'MARK') {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.textContent.includes(keyword)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        }
      }
    );

    let node;
    const nodesToReplace = [];

    while (node = walker.nextNode()) {
      nodesToReplace.push(node);
    }

    console.log('[Page] 처리할 노드:', nodesToReplace.length, '개');

    let count = 0;
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
          mark.dataset.keyword = keyword;
          mark.textContent = keyword;
          mark.style.backgroundColor = color;
          mark.style.color = '#000000';
          fragment.appendChild(mark);
          count++;
        }
      });

      parent.replaceChild(fragment, node);
    });

    console.log('[Page] ✅ 하이라이트 완료:', count, '개');
    return count;
  } catch (error) {
    console.error('[Page] ❌ 하이라이트 실패:', error);
    return 0;
  }
}

/**
 * 웹페이지에 주입될 함수: 모든 하이라이트 제거
 */
function clearAllHighlights() {
  console.log('[Page] 모든 하이라이트 제거 시작');

  try {
    const marks = document.querySelectorAll('mark.text-highlighter-mark');
    console.log('[Page] 제거할 마크:', marks.length, '개');

    marks.forEach(mark => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });

    console.log('[Page] ✅ 하이라이트 제거 완료');
    return marks.length;
  } catch (error) {
    console.error('[Page] ❌ 하이라이트 제거 실패:', error);
    return 0;
  }
}

/**
 * 상태 메시지 표시
 */
function showStatus(message, type = 'info') {
  console.log('[Popup] 상태 메시지:', type, message);

  statusEl.textContent = message;
  statusEl.className = `status ${type} show`;

  setTimeout(() => {
    statusEl.classList.remove('show');
  }, 3000);
}

console.log('[Popup] ✅ 스크립트 로드 완료');
