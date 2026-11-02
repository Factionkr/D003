/**
 * D003 통합 AI 코디 앱 메인 서버 (StyleAI Server - ES Module)
 * 순수 Node.js 표준 라이브러리(http, fs, path, url) 기반으로 구현되어
 * 별도의 외부 패키지 설치 없이도 즉시 실행 가능합니다.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME 타입 매핑
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

// ==========================================
// In-Memory Database (D003 통합 데이터 스토어)
// ==========================================
let wardrobeDb = [
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
];

let archivesDb = [
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
];

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = reqUrl.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // REST API
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/health') {
      return sendJson(res, 200, {
        status: 'UP',
        modules: [
          'D003-1: Body Shape Analyzer',
          'D003-2: User Profile Settings',
          'D003-3: Daily Weather Coordination',
          'D003-4: Closet Items Inventory',
          'D003-5: Schedule TPO Engine',
          'D003-6: AI Virtual Try-On Pipeline',
          'D003-7: AI Outfit Recommendation Engine',
          'D003-8: Virtual Canvas Fitting Studio',
          'D003-9: Fit Archive & OOTD Calendar'
        ],
        timestamp: new Date().toISOString()
      });
    }

    if (pathname === '/api/body-analysis' && method === 'POST') {
      const body = await getRequestBody(req);
      const shoulder = body.shoulderWidth || 24;
      const waist = body.waistWidth || 12;
      const hip = body.hipWidth || 24;
      const ratioSH = (shoulder / hip).toFixed(2);
      const ratioWH = (waist / hip).toFixed(2);

      let bodyType = '모래시계형';
      if (shoulder > hip * 1.08) bodyType = '역삼각형';
      else if (hip > shoulder * 1.08) bodyType = '삼각형(A라인)';
      else if (waist > shoulder && waist > hip) bodyType = '라운드형';
      else if (ratioWH >= 0.75) bodyType = '직사각형';

      return sendJson(res, 200, {
        success: true,
        bodyType,
        metrics: { shoulderWidth: shoulder, waistWidth: waist, hipWidth: hip, ratioSH, ratioWH },
        stylingAdvice: `${bodyType}에 어울리는 최적의 실루엣 추천이 적용되었습니다.`
      });
    }

    if (pathname === '/api/closet') {
      if (method === 'GET') {
        const cat = reqUrl.searchParams.get('category');
        const list = cat && cat !== 'all' ? wardrobeDb.filter(i => i.category === cat) : wardrobeDb;
        return sendJson(res, 200, { success: true, count: list.length, items: list });
      }
      if (method === 'POST') {
        const item = await getRequestBody(req);
        const newItem = {
          id: `c_${Date.now()}`,
          name: item.name || '새 의류 아이템',
          category: item.category || 'top',
          color: item.color || '화이트',
          style: item.style || '캐주얼',
          season: item.season || '사계절',
          img: item.img || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400',
          fav: false,
          wearCount: 0
        };
        wardrobeDb.unshift(newItem);
        return sendJson(res, 201, { success: true, item: newItem });
      }
    }

    if (pathname === '/api/recommend' && method === 'POST') {
      const payload = await getRequestBody(req);
      const formality = payload.formality || 4.2;

      const outer = wardrobeDb.find(i => i.id === (formality >= 3.5 ? 'c10' : 'c11')) || wardrobeDb[9];
      const top = wardrobeDb.find(i => i.id === (formality >= 3.5 ? 'c2' : 'c1')) || wardrobeDb[1];
      const bottom = wardrobeDb.find(i => i.id === (formality >= 3.5 ? 'c6' : 'c7')) || wardrobeDb[5];
      const shoes = wardrobeDb.find(i => i.id === (formality >= 3.5 ? 'c15' : 'c14')) || wardrobeDb[14];

      return sendJson(res, 200, {
        success: true,
        outfit: {
          id: `rec_${Date.now()}`,
          title: formality >= 3.5 ? '신뢰감을 주는 테일러드 비즈니스 포멀' : '자연스럽고 감각적인 시티 캐주얼',
          totalScore: formality >= 4.0 ? 96 : 92,
          scoreBreakdown: {
            tpoMatch: 29,
            weatherMatch: 24,
            bodyTypeMatch: 19,
            stylePreference: 14,
            colorHarmony: 10
          },
          items: [outer, top, bottom, shoes],
          stylistReasoning: '기온과 TPO 격식에 부합하며 체형의 곡선미를 살려주는 최적의 밸런스 착장입니다.'
        }
      });
    }

    if (pathname === '/api/fitting' && method === 'POST') {
      const body = await getRequestBody(req);
      return sendJson(res, 200, {
        success: true,
        jobId: `vton_${Date.now()}`,
        status: 'COMPLETED',
        model: body.model || 'IDM-VTON',
        renderedImageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
        metrics: {
          inferenceTimeSec: 1.42,
          resolution: '1024x1536 (HD)',
          facePreservation: '94.2%'
        }
      });
    }

    if (pathname === '/api/archives') {
      if (method === 'GET') {
        return sendJson(res, 200, { success: true, count: archivesDb.length, archives: archivesDb });
      }
      if (method === 'POST') {
        const arch = await getRequestBody(req);
        const newArch = {
          id: `arch_${Date.now()}`,
          date: arch.date || new Date().toISOString().split('T')[0],
          title: arch.title || '오늘의 OOTD',
          occasion: arch.occasion || '일상',
          rating: arch.rating || 5,
          review: arch.review || '만족스러운 코디였습니다.',
          img: arch.img || wardrobeDb[0].img
        };
        archivesDb.unshift(newArch);
        return sendJson(res, 201, { success: true, archive: newArch });
      }
    }

    return sendJson(res, 404, { error: 'API endpoint not found' });
  }

  // Static File Serving
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('서버 내부 오류가 발생했습니다.');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`✨ StyleAI - D003 통합 AI 코디 앱 서버 가동!`);
  console.log(`🚀 http://localhost:${PORT}`);
  console.log(`================================================================`);
});
