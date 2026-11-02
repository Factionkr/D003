// ========================================================
// StyleAI 통합 프론트엔드 엔진 (D003-1 ~ D003-9 종합 구현체)
// ========================================================

// 1. 초기 전역 상태 (Global State)
const state = {
  activeTab: 'dashboard',
  userProfile: {
    nickname: '스타일마스터',
    gender: 'female',
    country: 'KR',
    city: '서울특별시',
    occupation: 'it_design',
    personalColor: '여름쿨톤',
    preferredStyles: ['casual', 'minimal', 'business_casual'],
    bodyType: '모래시계형',
    metrics: { shoulderWidth: 24, waistWidth: 12, hipWidth: 24, ratioSH: 1.0, ratioWH: 0.5 }
  },
  weather: {
    city: '서울특별시',
    temp: 16.5,
    feelsLike: 15.8,
    condition: '맑음',
    conditionKey: 'Clear',
    advice: '선선한 가을 날씨입니다. 니트, 맨투맨이나 가디건/자켓 레이어드를 추천합니다.'
  },
  closet: [
    { id: 'c1', name: '오프화이트 실켓 크루넥 반팔 티셔츠', category: 'top', color: '화이트', style: '미니멀', season: '봄/여름/가을', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400', fav: true, wearCount: 14 },
    { id: 'c2', name: '스카이블루 클래식 옥스포드 셔츠', category: 'top', color: '블루', style: '비즈니스/출근룩', season: '사계절', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400', fav: true, wearCount: 9 },
    { id: 'c3', name: '멜란지 그레이 헤비웨이트 맨투맨', category: 'top', color: '그레이', style: '캐주얼', season: '봄/가을/겨울', img: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400', fav: false, wearCount: 8 },
    { id: 'c4', name: '파인게이지 메리노울 V넥 니트', category: 'top', color: '네이비', style: '미니멀', season: '가을/겨울', img: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400', fav: true, wearCount: 12 },
    { id: 'c5', name: '블랙 소프트 린넨 오픈칼라 셔츠', category: 'top', color: '블랙', style: '캐주얼', season: '여름', img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400', fav: false, wearCount: 6 },
    { id: 'c6', name: '차콜 원턱 세미와이드 슬랙스', category: 'pants', color: '그레이', style: '비즈니스/출근룩', season: '사계절', img: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=400', fav: true, wearCount: 19 },
    { id: 'c7', name: '미드블루 클래식 스트레이트 데님', category: 'pants', color: '블루', style: '캐주얼', season: '사계절', img: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=400', fav: true, wearCount: 15 },
    { id: 'c8', name: '베이지 테이퍼드 치노 팬츠', category: 'pants', color: '베이지', style: '캐주얼', season: '봄/가을', img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400', fav: false, wearCount: 5 },
    { id: 'c9', name: '블랙 이지 밴딩 조거 슬랙스', category: 'pants', color: '블랙', style: '스포티', season: '사계절', img: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400', fav: false, wearCount: 11 },
    { id: 'c10', name: '다크네이비 테일러드 블레이저', category: 'outer', color: '네이비', style: '비즈니스/출근룩', season: '봄/가을', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400', fav: true, wearCount: 16 },
    { id: 'c11', name: '베이지 더블 브레스티드 트렌치코트', category: 'outer', color: '베이지', style: '미니멀', season: '봄/가을', img: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=400', fav: true, wearCount: 7 },
    { id: 'c12', name: '블랙 미니멀 레더 바이커 자켓', category: 'outer', color: '블랙', style: '스트릿', season: '봄/가을', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', fav: false, wearCount: 4 },
    { id: 'c13', name: '차콜 핸드메이드 캐시미어 롱코트', category: 'outer', color: '그레이', style: '비즈니스/출근룩', season: '겨울', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400', fav: true, wearCount: 10 },
    { id: 'c14', name: '화이트 클래식 레더 스니커즈', category: 'shoes', color: '화이트', style: '미니멀', season: '사계절', img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', fav: true, wearCount: 28 },
    { id: 'c15', name: '블랙 플레인토 가죽 페니 로퍼', category: 'shoes', color: '블랙', style: '비즈니스/출근룩', season: '사계절', img: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400', fav: true, wearCount: 17 },
    { id: 'c16', name: '어반 런닝 쿠셔닝 스니커즈', category: 'shoes', color: '그레이', style: '스포티', season: '사계절', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', fav: false, wearCount: 13 },
    { id: 'c17', name: '블랙 미니멀 레더 토트백', category: 'bag', color: '블랙', style: '비즈니스/출근룩', season: '사계절', img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400', fav: true, wearCount: 22 },
    { id: 'c18', name: '그레이 캐시미어 프린지 머플러', category: 'etc', color: '그레이', style: '미니멀', season: '겨울', img: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400', fav: false, wearCount: 6 }
  ],
  selectedFittingOutfit: null,
  archives: [
    {
      id: 'arch-1',
      date: '2026-11-01',
      title: '스마트 비즈니스 테일러드 룩',
      occasion: '비즈니스 전략 회의',
      rating: 5,
      review: '블레이저와 슬랙스 조합으로 포멀하면서도 신뢰감 있는 인상을 연출했습니다.',
      img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400'
    },
    {
      id: 'arch-2',
      date: '2026-10-30',
      title: '클래식 프렌치 시크 나들이',
      occasion: '주말 성수동 브런치',
      rating: 5,
      review: '트렌치코트 벨티드 연출로 허리 라인이 예쁘게 돋보였습니다.',
      img: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=400'
    }
  ]
};

// ==========================================
// 2. 탭 전환 관리 (Tab Switcher)
// ==========================================
function switchTab(tabId) {
  state.activeTab = tabId;

  // Toggle tab buttons
  document.querySelectorAll('.nav-tab').forEach((btn) => {
    if (btn.dataset.tab === tabId) {
      btn.className = 'nav-tab active-tab px-3.5 py-2 rounded-lg flex items-center space-x-2 transition text-violet-400 bg-violet-500/10 font-semibold';
    } else {
      btn.className = 'nav-tab px-3.5 py-2 rounded-lg flex items-center space-x-2 transition text-slate-400 hover:text-white hover:bg-slate-800 font-medium';
    }
  });

  // Toggle tab view containers
  document.querySelectorAll('.tab-view').forEach((view) => {
    view.classList.add('hidden');
  });

  const targetView = document.getElementById(`view-${tabId}`);
  if (targetView) {
    targetView.classList.remove('hidden');
  }

  // 특수 탭 진입 시 초기화
  if (tabId === 'closet') renderClosetGrid();
  if (tabId === 'recommend') generateRecommendationRun();
  if (tabId === 'calendar') renderCalendarDays();

  // Re-run Lucide Icons render
  if (window.lucide) {
    lucide.createIcons();
  }
}

// ==========================================
// 3. 체형 분석 모듈 (D003-1 Body Shape Analyzer)
// ==========================================
function updateBodyAnalysis() {
  const shoulder = parseFloat(document.getElementById('sliderShoulder').value);
  const waist = parseFloat(document.getElementById('sliderWaist').value);
  const hip = parseFloat(document.getElementById('sliderHip').value);

  document.getElementById('valShoulder').innerText = `${shoulder} cm (0.${shoulder})`;
  document.getElementById('valWaist').innerText = `${waist} cm (0.${waist})`;
  document.getElementById('valHip').innerText = `${hip} cm (0.${hip})`;

  // 비율 계산
  const ratioSH = (shoulder / (hip || 1)).toFixed(2);
  const ratioWH = (waist / (hip || 1)).toFixed(2);

  document.getElementById('metricSH').innerText = ratioSH;
  document.getElementById('metricWH').innerText = ratioWH;

  // 5대 체형 판정 알고리즘 (D003-1 BodyShapeAnalyzer)
  let bType = '직사각형';
  let badgeColor = 'bg-slate-500/20 text-slate-300 border-slate-500/40';

  if (waist > shoulder && waist > hip) {
    bType = '라운드형';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  } else if (Math.abs(shoulder - hip) <= 0.08 * Math.max(shoulder, hip)) {
    if (ratioWH < 0.70) {
      bType = '모래시계형';
      badgeColor = 'bg-violet-500/20 text-violet-300 border-violet-500/40';
    } else {
      bType = '직사각형';
      badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  } else if (shoulder > hip * 1.08) {
    bType = '역삼각형';
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  } else if (hip > shoulder * 1.08) {
    bType = '삼각형(A라인)';
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  }

  // 배지 업데이트
  const badgeEl = document.getElementById('resultTypeBadge');
  badgeEl.innerText = `${bType}`;
  badgeEl.className = `px-3 py-1 rounded-full text-xs font-extrabold border ${badgeColor}`;

  // SVG 골격 와이어프레임 좌표 동적 변환
  const cx = 100;
  const sW2 = shoulder * 2.0;
  const wW2 = waist * 2.0;
  const hW2 = hip * 2.0;

  const lsX = cx - sW2;
  const rsX = cx + sW2;
  const lwX = cx - wW2;
  const rwX = cx + wW2;
  const lhX = cx - hW2;
  const rhX = cx + hW2;

  // Poly Points: LeftShoulder -> RightShoulder -> RightWaist -> RightHip -> LeftHip -> LeftWaist
  const polyPoints = `${lsX},80 ${rsX},80 ${rwX},145 ${rhX},190 ${lhX},190 ${lwX},145`;
  document.getElementById('torsoPoly').setAttribute('points', polyPoints);

  document.getElementById('ptLeftShoulder').setAttribute('cx', lsX);
  document.getElementById('ptRightShoulder').setAttribute('cx', rsX);
  document.getElementById('ptLeftWaist').setAttribute('cx', lwX);
  document.getElementById('ptRightWaist').setAttribute('cx', rwX);
  document.getElementById('ptLeftHip').setAttribute('cx', lhX);
  document.getElementById('ptRightHip').setAttribute('cx', rhX);

  // 체형별 팁 갱신
  renderBodyTips(bType);

  state.userProfile.bodyType = bType;
  state.userProfile.metrics = { shoulderWidth: shoulder, waistWidth: waist, hipWidth: hip, ratioSH, ratioWH };
}

function renderBodyTips(type) {
  const guideMap = {
    '모래시계형': {
      tips: [
        '균형 잡힌 상하체와 슬림한 허리선을 자연스럽게 강조하세요.',
        '허리 라인을 잡아주는 랩 원피스나 벨티드 아우터가 베스트입니다.',
        '과도한 박시핏보다는 신체 실루엣을 살려주는 레귤러/슬림핏 추천.'
      ],
      recs: ['랩 드레스', 'V넥 니트', '하이웨이스트 와이드 팬츠', '벨티드 코트'],
      avoids: ['박시 통원피스', '과한 어깨패드']
    },
    '역삼각형': {
      tips: [
        '넓은 어깨를 소프트하게 분산하고 하체에 볼륨감을 더하세요.',
        '상의는 심플한 V넥이나 래글런을 선택하고 어깨 패드는 피하세요.',
        'A라인 스커트나 와이드 카고 팬츠로 하체 실루엣을 안정감 있게 연출.'
      ],
      recs: ['A라인 스커트', '와이드 데님 팬츠', 'U넥/V넥 셔츠', '플리츠 스커트'],
      avoids: ['어깨 패드 각진 자켓', '보트넥 상의', '타이트 스키니진']
    },
    '삼각형(A라인)': {
      tips: [
        '골반과 하체에 비해 좁은 상체에 시선을 분산시키세요.',
        '상의에 디테일(보트넥, 퍼프 슬리브, 셔링)이나 밝은 컬러를 활용하세요.',
        '하의는 어두운 톤의 스트레이트/테이퍼드 슬랙스로 슬림하게 연출.'
      ],
      recs: ['테일러드 자켓', '보트넥 니트', '스트레이트 슬랙스', '셔츠 레이어드'],
      avoids: ['타이트한 밝은색 레깅스', '밑단 큰 장식 스커트']
    },
    '직사각형': {
      tips: [
        '허리선이 밋밋할 수 있으므로 입체감과 굴곡을 형성하세요.',
        '크롭 상의와 하이웨이스트 하의 조합으로 비율을 분할하세요.',
        '벨트나 턱인(Tuck-in) 스타일링으로 허리 포인트를 주면 살아납니다.'
      ],
      recs: ['벨티드 슬랙스', '크롭 가디건', '페플럼 블라우스', '플레어 스커트'],
      avoids: ['일자 통짜 원피스', '단조로운 스트레이트 풀착장']
    },
    '라운드형': {
      tips: [
        '복부 라인을 커버하고 세로 방향의 직선 실루엣으로 길어보이게 유도하세요.',
        '오픈형 롱 가디건이나 버티컬 스트라이프 자켓이 탁월합니다.',
        '목선이 드러나는 V넥/오픈 칼라 셔츠로 시원한 인상을 연출.'
      ],
      recs: ['오픈형 롱 가디건', 'V넥 블라우스', '루즈핏 셔츠', '세미와이드 슬랙스'],
      avoids: ['허리를 강하게 조이는 벨트', '복부 큰 포켓 상의']
    }
  };

  const g = guideMap[type] || guideMap['모래시계형'];
  document.getElementById('bodyStylingTipsList').innerHTML = g.tips.map((t) => `<li>${t}</li>`).join('');
  document.getElementById('bodyRecItems').innerHTML = g.recs.map((r) => `<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[11px] border border-emerald-500/20">${r}</span>`).join('');
  document.getElementById('bodyAvoidItems').innerHTML = g.avoids.map((a) => `<span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 text-[11px] border border-rose-500/20">${a}</span>`).join('');
}

function applyBodyPreset(type) {
  const presets = {
    '모래시계형': { s: 24, w: 12, h: 24 },
    '역삼각형': { s: 28, w: 14, h: 20 },
    '삼각형(A라인)': { s: 20, w: 14, h: 28 },
    '직사각형': { s: 24, w: 20, h: 24 },
    '라운드형': { s: 22, w: 28, h: 22 }
  };
  const p = presets[type];
  if (!p) return;

  document.getElementById('sliderShoulder').value = p.s;
  document.getElementById('sliderWaist').value = p.w;
  document.getElementById('sliderHip').value = p.h;
  updateBodyAnalysis();

  // Button styles toggle
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    if (btn.innerText.includes(type)) {
      btn.className = 'preset-btn px-3 py-1.5 rounded-lg bg-violet-600 text-white font-semibold';
    } else {
      btn.className = 'preset-btn px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700';
    }
  });

  showToast(`${type} 프리셋이 적용되었습니다.`);
}

function saveBodyAnalysisToProfile() {
  document.getElementById('navBodyBadge').innerText = state.userProfile.bodyType;
  document.getElementById('dashBodyType').innerText = state.userProfile.bodyType;
  showToast(`체형 분석(${state.userProfile.bodyType})이 프로필에 성공적으로 저장되었습니다!`);
}

// ==========================================
// 4. 날씨 & 기온 모듈 (D003-3 Weather Module)
// ==========================================
function changeWeatherCity(cityName) {
  const weatherMap = {
    '서울특별시': { temp: 16.5, feels: 15.8, cond: '맑음', advice: '선선한 가을 날씨입니다. 셔츠/니트와 자켓 레이어드를 추천합니다.' },
    '부산광역시': { temp: 19.2, feels: 18.5, cond: '쾌청함', advice: '활동하기 쾌적합니다. 얇은 가디건이나 긴팔 티셔츠가 좋습니다.' },
    '제주시': { temp: 20.1, feels: 19.8, cond: '구름 조금', advice: '포근한 날씨입니다. 가벼운 셔츠나 면바지를 추천합니다.' },
    'New York': { temp: 13.4, feels: 11.8, cond: '비 내림', advice: '비가 내리고 쌀쌀합니다. 트렌치코트와 방수 슈즈를 챙기세요.' },
    'Paris': { temp: 11.2, feels: 9.5, cond: '흐림', advice: '바람이 붑니다. 도톰한 니트와 울 자켓을 권장합니다.' }
  };

  const w = weatherMap[cityName] || weatherMap['서울특별시'];
  state.weather.city = cityName;
  state.weather.temp = w.temp;
  state.weather.feelsLike = w.feels;
  state.weather.condition = w.cond;
  state.weather.advice = w.advice;

  // DOM 갱신
  document.getElementById('navCityText').innerText = cityName;
  document.getElementById('navTempText').innerText = `${w.temp}°C`;
  document.getElementById('navFeelsLikeText').innerText = `${w.feels}°C`;
  document.getElementById('dashCityText').innerText = cityName;
  document.getElementById('dashTempHighlight').innerText = `${w.temp}°C`;
  document.getElementById('dashWeatherTemp').innerText = `${w.temp}°C`;
  document.getElementById('dashWeatherDesc').innerText = `${w.cond} (체감 ${w.feels}°C)`;

  showToast(`${cityName} 날씨 데이터(${w.temp}°C)로 갱신되었습니다.`);
}

// ==========================================
// 5. 스마트 옷장 관리 (D003-4 Closet Module)
// ==========================================
let currentClosetCat = 'all';

function filterClosetCategory(cat) {
  currentClosetCat = cat;
  document.querySelectorAll('.closet-cat-btn').forEach((btn) => {
    if (btn.dataset.cat === cat) {
      btn.className = 'closet-cat-btn active-cat px-3.5 py-1.5 rounded-lg bg-violet-600 text-white font-semibold whitespace-nowrap';
    } else {
      btn.className = 'closet-cat-btn px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 whitespace-nowrap';
    }
  });
  renderClosetGrid();
}

function renderClosetGrid() {
  const grid = document.getElementById('closetGrid');
  if (!grid) return;

  let filtered = state.closet;
  if (currentClosetCat === 'favorite') {
    filtered = filtered.filter((i) => i.fav);
  } else if (currentClosetCat !== 'all') {
    filtered = filtered.filter((i) => i.category === currentClosetCat);
  }

  grid.innerHTML = filtered.map((item) => `
    <div class="glass-card rounded-xl p-3 border border-slate-800 relative group flex flex-col justify-between hover:border-violet-500/50 transition">
      <div class="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-900 mb-2.5">
        <img src="${item.img}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
        <button onclick="toggleFavorite('${item.id}', event)" class="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 backdrop-blur text-${item.fav ? 'rose-500' : 'slate-400'} hover:text-rose-400 transition">
          <i data-lucide="heart" class="w-3.5 h-3.5 fill-current"></i>
        </button>
        <span class="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950/80 text-violet-300 uppercase">
          ${item.category}
        </span>
      </div>
      <div>
        <p class="text-xs font-semibold text-white truncate" title="${item.name}">${item.name}</p>
        <div class="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-1">
          <span class="px-1.5 py-0.5 bg-slate-800 rounded">${item.color}</span>
          <span class="px-1.5 py-0.5 bg-slate-800 rounded">${item.style}</span>
        </div>
      </div>
      <div class="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <span>착용 ${item.wearCount || 0}회</span>
        <button onclick="pickForFitting('${item.id}')" class="text-violet-400 hover:text-violet-300 font-semibold">피팅 추가</button>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function toggleFavorite(itemId, event) {
  if (event) event.stopPropagation();
  const item = state.closet.find((i) => i.id === itemId);
  if (item) {
    item.fav = !item.fav;
    renderClosetGrid();
    showToast(`'${item.name}' 즐겨찾기 상태 변경.`);
  }
}

function openAddItemModal() {
  document.getElementById('modalAddItem').classList.remove('hidden');
}

function closeAddItemModal() {
  document.getElementById('modalAddItem').classList.add('hidden');
}

function submitNewItem() {
  const name = document.getElementById('addName').value.trim();
  const category = document.getElementById('addCategory').value;
  const color = document.getElementById('addColor').value;
  let img = document.getElementById('addImageUrl').value.trim();

  if (!name) {
    alert('아이템 명칭을 입력해주세요.');
    return;
  }

  if (!img) {
    img = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400';
  }

  const newItem = {
    id: `c_${Date.now()}`,
    name,
    category,
    color,
    style: '캐주얼',
    season: '사계절',
    img,
    fav: false,
    wearCount: 0
  };

  state.closet.unshift(newItem);
  document.getElementById('dashClosetCount').innerText = `${state.closet.length}벌`;
  document.getElementById('dashItemCountTotal').innerText = `${state.closet.length}벌`;

  closeAddItemModal();
  renderClosetGrid();
  showToast(`새 의류 '${name}'이(가) 옷장에 추가되었습니다!`);
}

// ==========================================
// 6. AI 코디 추천 엔진 (D003-5 & D003-7)
// ==========================================
function syncOccasionFormality() {
  const occ = document.getElementById('selOccasion').value;
  const map = {
    WORK_MEETING: 4.5,
    WORK_OFFICE: 3.2,
    WEDDING_GUEST: 4.0,
    SPECIAL_ANNIVERSARY: 3.0,
    WEEKEND_OUTING: 1.8,
    WEEKEND_DAILY: 1.0
  };
  const val = map[occ] || 3.0;
  document.getElementById('sliderFormality').value = val;
  document.getElementById('txtFormalityLevel').innerText = `${val.toFixed(1)} / 5.0`;
}

function generateRecommendationRun() {
  const container = document.getElementById('recommendationResultsContainer');
  if (!container) return;

  const formality = parseFloat(document.getElementById('sliderFormality').value);
  const occ = document.getElementById('selOccasion').value;

  // 1순위 추천 세트
  const outer = state.closet.find((i) => i.id === (formality >= 3.5 ? 'c10' : 'c11')) || state.closet[9];
  const top = state.closet.find((i) => i.id === (formality >= 3.5 ? 'c2' : 'c1')) || state.closet[1];
  const bottom = state.closet.find((i) => i.id === (formality >= 3.5 ? 'c6' : 'c7')) || state.closet[5];
  const shoes = state.closet.find((i) => i.id === (formality >= 3.5 ? 'c15' : 'c14')) || state.closet[14];

  // 2순위 추천 세트
  const top2 = state.closet.find((i) => i.id === 'c4') || state.closet[3];
  const bottom2 = state.closet.find((i) => i.id === 'c8') || state.closet[7];
  const outer2 = state.closet.find((i) => i.id === 'c12') || state.closet[11];
  const shoes2 = state.closet.find((i) => i.id === 'c14') || state.closet[13];

  const totalScore = formality >= 4.0 ? 96 : (formality >= 3.0 ? 93 : 90);

  container.innerHTML = `
    <!-- Top 1 Recommendation Card -->
    <div class="glass-card rounded-2xl p-6 border border-violet-500/30 bg-slate-900/60 shadow-xl relative overflow-hidden">
      <div class="absolute -right-12 -top-12 w-40 h-40 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div class="flex items-center space-x-2">
          <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-600 text-white shadow-sm">AI 1순위 추천</span>
          <h3 class="font-extrabold text-white text-lg">${formality >= 3.5 ? '신뢰감을 주는 테일러드 비즈니스 포멀' : '자연스럽고 감각적인 시티 캐주얼'}</h3>
        </div>
        <div class="flex items-center space-x-3">
          <span class="text-xs text-slate-400">매칭 점수</span>
          <span class="px-3 py-1 rounded-xl bg-violet-500/20 text-violet-300 font-extrabold text-sm border border-violet-500/30">${totalScore}점</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-center">
        <!-- Garments -->
        <div class="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col items-center text-center">
            <span class="text-[10px] text-violet-400 font-bold mb-1">OUTER</span>
            <img src="${outer.img}" class="w-24 h-28 object-cover rounded-lg mb-2 shadow" />
            <p class="text-xs font-semibold text-white truncate w-full">${outer.name}</p>
          </div>
          <div class="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col items-center text-center">
            <span class="text-[10px] text-violet-400 font-bold mb-1">TOP</span>
            <img src="${top.img}" class="w-24 h-28 object-cover rounded-lg mb-2 shadow" />
            <p class="text-xs font-semibold text-white truncate w-full">${top.name}</p>
          </div>
          <div class="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col items-center text-center">
            <span class="text-[10px] text-violet-400 font-bold mb-1">PANTS</span>
            <img src="${bottom.img}" class="w-24 h-28 object-cover rounded-lg mb-2 shadow" />
            <p class="text-xs font-semibold text-white truncate w-full">${bottom.name}</p>
          </div>
          <div class="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col items-center text-center">
            <span class="text-[10px] text-violet-400 font-bold mb-1">SHOES</span>
            <img src="${shoes.img}" class="w-24 h-28 object-cover rounded-lg mb-2 shadow" />
            <p class="text-xs font-semibold text-white truncate w-full">${shoes.name}</p>
          </div>
        </div>

        <!-- 5 Scoring Breakdown & Reasoning -->
        <div class="lg:col-span-5 bg-slate-900/50 rounded-xl p-5 border border-slate-800 space-y-3">
          <div class="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>5대 가중치 세부 채점 (100점 만점)</span>
            <span class="text-violet-400">Hard Filter 통과</span>
          </div>

          <!-- Progress bars -->
          <div class="space-y-1.5 text-[11px]">
            <div>
              <div class="flex justify-between text-slate-400"><span>TPO 적합도 (30%)</span><span class="font-bold text-white">29 / 30</span></div>
              <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"><div class="h-full bg-violet-500 w-[96%]"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-slate-400"><span>기온/날씨 일치도 (25%)</span><span class="font-bold text-white">24 / 25</span></div>
              <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"><div class="h-full bg-blue-500 w-[96%]"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-slate-400"><span>체형 보완율 (20%)</span><span class="font-bold text-white">19 / 20</span></div>
              <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"><div class="h-full bg-fuchsia-500 w-[95%]"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-slate-400"><span>스타일 선호도 (15%)</span><span class="font-bold text-white">14 / 15</span></div>
              <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"><div class="h-full bg-amber-500 w-[93%]"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-slate-400"><span>컬러 배색 조화 (10%)</span><span class="font-bold text-white">10 / 10</span></div>
              <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"><div class="h-full bg-emerald-500 w-[100%]"></div></div>
            </div>
          </div>

          <div class="pt-2 text-[11px] text-slate-300 border-t border-slate-800 space-y-1">
            <p><strong class="text-violet-300">스타일리스트 총평:</strong> 현재 기온 ${state.weather.temp}°C에 부합하며 ${state.userProfile.bodyType}의 슬림한 허리선을 살려주는 균형 잡힌 코디입니다.</p>
          </div>

          <div class="pt-2 flex items-center justify-between">
            <button onclick="setFittingItems(['${outer.id}', '${top.id}', '${bottom.id}', '${shoes.id}'])" class="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-xs shadow-md transition hover:opacity-95">
              가상 피팅룸에서 입어보기
            </button>
            <button onclick="saveRecAsOotd('${outer.id}', '${top.id}')" class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700">
              OOTD 저장
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Alternative Recommendation Set 2 -->
    <div class="glass-card rounded-2xl p-5 border border-slate-800 opacity-90">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center space-x-2">
          <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300">대안 추천 2순위</span>
          <h4 class="font-bold text-white text-sm">트렌디한 레더 자켓 & 치노 캐주얼 셋업</h4>
        </div>
        <span class="text-xs font-bold text-slate-300">89점</span>
      </div>
      <div class="flex items-center space-x-3 mt-3 text-xs text-slate-400">
        <span>아이템: ${outer2.name} + ${top2.name} + ${bottom2.name}</span>
        <button onclick="setFittingItems(['${outer2.id}', '${top2.id}', '${bottom2.id}'])" class="text-violet-400 hover:underline font-semibold ml-auto">피팅룸 적용</button>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

function setFittingItems(itemIds) {
  state.selectedFittingOutfit = itemIds.map((id) => state.closet.find((c) => c.id === id)).filter(Boolean);
  switchTab('fitting');
  renderFittingLayers();
  showToast('선택한 추천 코디가 가상 피팅 룸에 로드되었습니다.');
}

function openFittingWithSelected() {
  setFittingItems(['c10', 'c2', 'c6', 'c15']);
}
function _unused() {
}

// ==========================================
// 7. 가상 피팅 스튜디오 (D003-6 & D003-8 VTON)
// ==========================================
function renderFittingLayers() {
  const container = document.getElementById('fittingLayersList');
  if (!container) return;

  const items = state.selectedFittingOutfit || [state.closet[1], state.closet[9], state.closet[5]];
  container.innerHTML = items.map((item, idx) => `
    <div class="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
      <span class="w-5 h-5 rounded-full bg-violet-600/30 text-violet-400 text-xs flex items-center justify-center font-bold">${idx + 1}</span>
      <img src="${item.img}" class="w-10 h-10 object-cover rounded-lg" />
      <div class="flex-1 min-w-0 text-xs">
        <p class="font-semibold text-white truncate">${item.name}</p>
        <span class="text-[10px] text-slate-400 uppercase">${item.category} (Layer ${idx + 1})</span>
      </div>
    </div>
  `).join('');
}

function triggerFittingSimulation() {
  const overlay = document.getElementById('fittingProgressOverlay');
  const stageTxt = document.getElementById('fittingProgressStage');
  const bar = document.getElementById('fittingProgressBar');
  const pctTxt = document.getElementById('fittingProgressPct');
  const vtonModel = document.getElementById('selVTONModel').value;

  overlay.classList.remove('hidden');

  const stages = [
    { text: 'Stage 1: OpenPose 관절 랜드마크 분석 및 체형 좌표 매핑 중...', pct: 25 },
    { text: 'Stage 2: 의류 SCHP 세그멘테이션 및 배경 마스킹 추출...', pct: 50 },
    { text: 'Stage 3: 신체 윤곽에 따른 TPS Garment Warping 곡면 변형...', pct: 75 },
    { text: `Stage 4: ${vtonModel} 디퓨전 텍스처 융합 및 실시간 렌더링...`, pct: 95 },
  ];

  let cur = 0;
  function nextStage() {
    if (cur < stages.length) {
      stageTxt.innerText = stages[cur].text;
      bar.style.width = `${stages[cur].pct}%`;
      pctTxt.innerText = `${stages[cur].pct}%`;
      cur++;
      setTimeout(nextStage, 400);
    } else {
      setTimeout(() => {
        overlay.classList.add('hidden');
        document.getElementById('fittingCanvasImg').src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80';
        document.getElementById('fittingStatusBadge').innerText = `${vtonModel} 피팅 완료 (1.42s)`;
        showToast('가상 피팅 렌더링이 성공적으로 완료되었습니다! ✨');
      }, 300);
    }
  }

  nextStage();
}

function resetFittingCanvas() {
  document.getElementById('fittingCanvasImg').src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';
  document.getElementById('fittingStatusBadge').innerText = '기본 아바타 준비됨';
  showToast('피팅 캔버스가 초기화되었습니다.');
}

function saveFittedOutfitToArchive() {
  const today = '2026-11-02';
  const newArch = {
    id: `arch-${Date.now()}`,
    date: today,
    title: 'AI 가상 피팅 맞춤 셋업',
    occasion: '출근 및 데일리',
    rating: 5,
    review: '가상 피팅 후 실제 착용하니 색상과 핏이 완벽하게 들어맞았습니다.',
    img: document.getElementById('fittingCanvasImg').src
  };
  state.archives.unshift(newArch);
  showToast('오늘의 OOTD 캘린더에 성공적으로 저장되었습니다!');
  switchTab('calendar');
}

// ==========================================
// 8. OOTD 캘린더 & 통계 (D003-9 Fit Archive)
// ==========================================
function renderCalendarDays() {
  const container = document.getElementById('calendarGridDays');
  if (!container) return;

  // 2026년 11월 (1일이 일요일)
  let html = '';
  for (let d = 1; d <= 30; d++) {
    const dateStr = `2026-11-${String(d).padStart(2, '0')}`;
    const arch = state.archives.find((a) => a.date === dateStr);

    if (arch) {
      html += `
        <div class="aspect-square bg-slate-900 border border-violet-500/50 rounded-xl p-1 relative flex flex-col justify-between overflow-hidden cursor-pointer hover:border-violet-400 group" onclick="showArchiveDetail('${arch.id}')">
          <img src="${arch.img}" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition" />
          <span class="relative z-10 text-[10px] font-bold text-white bg-slate-950/80 px-1 py-0.2 rounded w-fit">${d}</span>
          <div class="relative z-10 text-[9px] text-amber-300 font-bold bg-slate-950/80 px-1 rounded flex items-center justify-between">
            <span>⭐ ${arch.rating}</span>
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="aspect-square bg-slate-900/40 border border-slate-800/80 rounded-xl p-1.5 flex flex-col justify-between text-slate-500 hover:border-slate-700 transition">
          <span class="text-[10px] font-medium">${d}</span>
          <button onclick="logForDay('${dateStr}')" class="text-[9px] text-slate-600 hover:text-violet-400 text-center opacity-0 hover:opacity-100 transition">+ 기록</button>
        </div>
      `;
    }
  }

  container.innerHTML = html;
}

function showArchiveDetail(archId) {
  const arch = state.archives.find((a) => a.id === archId);
  if (!arch) return;
  alert(`[${arch.date}] ${arch.title}\n일정: ${arch.occasion}\n만족도: ⭐ ${arch.rating} / 5.0\n리뷰: ${arch.review}`);
}

function saveTodayQuickOOTD() {
  saveFittedOutfitToArchive();
}

function saveRecAsOotd(outerId, topId) {
  saveFittedOutfitToArchive();
}

function pickForFitting(itemId) {
  const item = state.closet.find((c) => c.id === itemId);
  if (!item) return;
  if (!state.selectedFittingOutfit) state.selectedFittingOutfit = [state.closet[1], state.closet[9], state.closet[5]];
  if (!state.selectedFittingOutfit.some((i) => i.id === itemId)) state.selectedFittingOutfit.push(item);
  renderFittingLayers();
  switchTab('fitting');
  showToast(`'${item.name}' 아이템이 가상 피팅 룸에 추가되었습니다.`);
}

function logForDay(dateStr) {
  state.archives.unshift({
    id: `arch-${Date.now()}`,
    date: dateStr,
    title: '데일리 스타일링 기록',
    occasion: '일상 및 외출',
    rating: 5,
    review: `${dateStr} 착장 기록이 추가되었습니다.`,
    img: document.getElementById('fittingCanvasImg')?.src || state.closet[0].img
  });
  renderCalendarDays();
  showToast(`${dateStr} OOTD 기록이 캘린더에 저장되었습니다!`);
}

function openLogOotdModal() {
  saveFittedOutfitToArchive();
}

// ==========================================
// 9. 사용자 프로필 & 온보딩 (D003-2 Profile)
// ==========================================
function saveUserProfile() {
  const nick = document.getElementById('profNickname').value.trim();
  const gender = document.getElementById('profGender').value;
  const city = document.getElementById('profCity').value;
  const occ = document.getElementById('profOccupation').value;
  const col = document.getElementById('profColor').value;

  state.userProfile.nickname = nick || '스타일마스터';
  state.userProfile.gender = gender;
  state.userProfile.city = city;
  state.userProfile.occupation = occ;
  state.userProfile.personalColor = col;

  document.getElementById('navNickname').innerText = state.userProfile.nickname;
  document.getElementById('dashWelcomeNick').innerText = state.userProfile.nickname;

  showToast('사용자 프로필 설정이 성공적으로 저장되었습니다!');
  switchTab('dashboard');
}

// ==========================================
// 10. 공통 토스트 알림 (Toast Notification)
// ==========================================
function showToast(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;

  toastMsg.innerText = msg;
  toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');

  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
  }, 2500);
}

// ==========================================
// 초기 부트스트랩 (App Bootstrap)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }
  updateBodyAnalysis();
  renderClosetGrid();
  renderFittingLayers();
  renderCalendarDays();
});

