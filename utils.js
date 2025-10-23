/**
 * Utility Functions - 유틸리티 함수 모음
 */

console.log('[Utils] 모듈 로드됨');

/**
 * 색상 프리셋
 */
const COLOR_PRESETS = [
  { name: '노란색', value: '#FFFF00', textColor: '#000000' },
  { name: '초록색', value: '#4ADE80', textColor: '#000000' },
  { name: '파란색', value: '#60A5FA', textColor: '#000000' },
  { name: '분홍색', value: '#F472B6', textColor: '#000000' },
  { name: '주황색', value: '#FB923C', textColor: '#000000' },
  { name: '보라색', value: '#C084FC', textColor: '#000000' },
  { name: '하늘색', value: '#67E8F9', textColor: '#000000' },
  { name: '라임색', value: '#BEF264', textColor: '#000000' }
];

/**
 * 날짜 포맷팅
 * @param {number} timestamp - 타임스탬프
 * @returns {string} 포맷된 날짜 문자열
 */
function formatDate(timestamp) {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('[Utils] ❌ 날짜 포맷팅 실패:', error);
    return '알 수 없음';
  }
}

/**
 * 상대 시간 표시 (예: "5분 전")
 * @param {number} timestamp - 타임스탬프
 * @returns {string} 상대 시간 문자열
 */
function getRelativeTime(timestamp) {
  try {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return formatDate(timestamp);
  } catch (error) {
    console.error('[Utils] ❌ 상대 시간 계산 실패:', error);
    return '알 수 없음';
  }
}

/**
 * 색상 이름으로 값 가져오기
 * @param {string} colorValue - 색상 값
 * @returns {string} 색상 이름
 */
function getColorName(colorValue) {
  const preset = COLOR_PRESETS.find(c => c.value.toLowerCase() === colorValue.toLowerCase());
  return preset ? preset.name : '사용자 정의';
}

/**
 * 텍스트를 안전하게 HTML로 이스케이프
 * @param {string} text - 원본 텍스트
 * @returns {string} 이스케이프된 텍스트
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 디바운스 함수
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (ms)
 * @returns {Function} 디바운스된 함수
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 로그 레벨 설정
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

let currentLogLevel = LOG_LEVELS.DEBUG;

/**
 * 상세 로거
 * @param {string} level - 로그 레벨
 * @param {string} module - 모듈 이름
 * @param {string} message - 메시지
 * @param {*} data - 추가 데이터
 */
function log(level, module, message, data = null) {
  const timestamp = new Date().toLocaleTimeString('ko-KR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });

  const prefix = `[${timestamp}] [${module}]`;

  if (LOG_LEVELS[level] >= currentLogLevel) {
    switch (level) {
      case 'DEBUG':
        console.log(`${prefix} 🔍`, message, data || '');
        break;
      case 'INFO':
        console.info(`${prefix} ℹ️`, message, data || '');
        break;
      case 'WARN':
        console.warn(`${prefix} ⚠️`, message, data || '');
        break;
      case 'ERROR':
        console.error(`${prefix} ❌`, message, data || '');
        if (data && data.stack) {
          console.error(`${prefix} 스택 트레이스:`, data.stack);
        }
        break;
    }
  }
}
