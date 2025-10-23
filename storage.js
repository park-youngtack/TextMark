/**
 * Storage API Wrapper - 키워드 데이터 관리
 * chrome.storage.sync를 사용하여 여러 기기 간 동기화
 */

console.log('[Storage] 모듈 로드됨');

const STORAGE_KEY = 'highlighter_keywords';

/**
 * 모든 키워드 가져오기
 * @returns {Promise<Array>} 키워드 배열
 */
async function getKeywords() {
  try {
    console.log('[Storage] 키워드 조회 시작');
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    const keywords = result[STORAGE_KEY] || [];
    console.log('[Storage] 키워드 조회 완료:', keywords.length, '개');
    console.log('[Storage] 데이터:', JSON.stringify(keywords, null, 2));
    return keywords;
  } catch (error) {
    console.error('[Storage] ❌ 키워드 조회 실패:', error);
    console.error('[Storage] 에러 스택:', error.stack);
    return [];
  }
}

/**
 * 키워드 저장
 * @param {Array} keywords - 키워드 배열
 * @returns {Promise<boolean>} 성공 여부
 */
async function saveKeywords(keywords) {
  try {
    console.log('[Storage] 키워드 저장 시작:', keywords.length, '개');
    console.log('[Storage] 저장할 데이터:', JSON.stringify(keywords, null, 2));

    await chrome.storage.sync.set({ [STORAGE_KEY]: keywords });

    console.log('[Storage] ✅ 키워드 저장 완료');
    return true;
  } catch (error) {
    console.error('[Storage] ❌ 키워드 저장 실패:', error);
    console.error('[Storage] 에러 스택:', error.stack);
    return false;
  }
}

/**
 * 새 키워드 추가
 * @param {string} text - 키워드 텍스트
 * @param {string} color - 하이라이트 색상
 * @returns {Promise<Object|null>} 추가된 키워드 객체
 */
async function addKeyword(text, color) {
  try {
    console.log('[Storage] 키워드 추가 시작:', { text, color });

    if (!text || text.trim() === '') {
      console.warn('[Storage] ⚠️ 빈 키워드는 추가할 수 없습니다');
      return null;
    }

    const keywords = await getKeywords();

    // 중복 체크
    const exists = keywords.find(k => k.text === text);
    if (exists) {
      console.warn('[Storage] ⚠️ 이미 존재하는 키워드:', text);
      return null;
    }

    const newKeyword = {
      id: generateUUID(),
      text: text.trim(),
      color: color || '#FFFF00',
      enabled: true,
      createdAt: Date.now(),
      lastUsed: Date.now()
    };

    keywords.push(newKeyword);
    await saveKeywords(keywords);

    console.log('[Storage] ✅ 키워드 추가 완료:', newKeyword);
    return newKeyword;
  } catch (error) {
    console.error('[Storage] ❌ 키워드 추가 실패:', error);
    console.error('[Storage] 에러 스택:', error.stack);
    return null;
  }
}

/**
 * 키워드 업데이트
 * @param {string} id - 키워드 ID
 * @param {Object} updates - 업데이트할 필드
 * @returns {Promise<boolean>} 성공 여부
 */
async function updateKeyword(id, updates) {
  try {
    console.log('[Storage] 키워드 업데이트 시작:', { id, updates });

    const keywords = await getKeywords();
    const index = keywords.findIndex(k => k.id === id);

    if (index === -1) {
      console.warn('[Storage] ⚠️ 키워드를 찾을 수 없음:', id);
      return false;
    }

    keywords[index] = { ...keywords[index], ...updates };
    keywords[index].lastUsed = Date.now();

    await saveKeywords(keywords);

    console.log('[Storage] ✅ 키워드 업데이트 완료:', keywords[index]);
    return true;
  } catch (error) {
    console.error('[Storage] ❌ 키워드 업데이트 실패:', error);
    console.error('[Storage] 에러 스택:', error.stack);
    return false;
  }
}

/**
 * 키워드 삭제
 * @param {string} id - 키워드 ID
 * @returns {Promise<boolean>} 성공 여부
 */
async function deleteKeyword(id) {
  try {
    console.log('[Storage] 키워드 삭제 시작:', id);

    const keywords = await getKeywords();
    const filtered = keywords.filter(k => k.id !== id);

    if (filtered.length === keywords.length) {
      console.warn('[Storage] ⚠️ 삭제할 키워드를 찾을 수 없음:', id);
      return false;
    }

    await saveKeywords(filtered);

    console.log('[Storage] ✅ 키워드 삭제 완료');
    return true;
  } catch (error) {
    console.error('[Storage] ❌ 키워드 삭제 실패:', error);
    console.error('[Storage] 에러 스택:', error.stack);
    return false;
  }
}

/**
 * 키워드 순서 변경
 * @param {Array} reorderedKeywords - 재정렬된 키워드 배열
 * @returns {Promise<boolean>} 성공 여부
 */
async function reorderKeywords(reorderedKeywords) {
  try {
    console.log('[Storage] 키워드 순서 변경 시작');
    console.log('[Storage] 새 순서:', reorderedKeywords.map(k => k.text));

    await saveKeywords(reorderedKeywords);

    console.log('[Storage] ✅ 키워드 순서 변경 완료');
    return true;
  } catch (error) {
    console.error('[Storage] ❌ 키워드 순서 변경 실패:', error);
    console.error('[Storage] 에러 스택:', error.stack);
    return false;
  }
}

/**
 * UUID 생성 (간단한 버전)
 * @returns {string} UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
