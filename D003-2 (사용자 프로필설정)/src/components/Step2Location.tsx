import React, { useState, useMemo } from 'react';
import { Globe2, MapPin, Search, CloudSun, Ruler } from 'lucide-react';
import { COUNTRY_OPTIONS, CITIES_BY_COUNTRY } from '../types/onboarding';

interface Step2LocationProps {
  country: string;
  city: string;
  onChange: (fields: { country?: string; city?: string }) => void;
  errors: Record<string, string>;
}

export const Step2Location: React.FC<Step2LocationProps> = ({
  country,
  city,
  onChange,
  errors,
}) => {
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  // 국가 필터링
  const filteredCountries = useMemo(() => {
    return COUNTRY_OPTIONS.filter(
      (c) =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.nativeName.includes(countrySearch) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [countrySearch]);

  const selectedCountryInfo = COUNTRY_OPTIONS.find((c) => c.code === country);

  // 해당 국가의 도시 목록
  const availableCities = useMemo(() => {
    if (!country) return [];
    const list = CITIES_BY_COUNTRY[country] || ['기타 / 직접입력'];
    if (!citySearch) return list;
    return list.filter((cityName) => cityName.toLowerCase().includes(citySearch.toLowerCase()));
  }, [country, citySearch]);

  const handleCountrySelect = (code: string) => {
    onChange({ country: code, city: '' }); // 국가 변경 시 도시 리셋
    setIsCountryDropdownOpen(false);
    setCountrySearch('');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: '#fff' }}>
          거주지 및 환경을 선택해주세요
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          지역별 글로벌 의류 규격(KS, US, EU)과 실시간 날씨 기반 OOTD 추천에 활용됩니다.
        </p>
      </div>

      {/* 1. Country Selection (검색형 드롭다운) */}
      <div style={{ position: 'relative' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
          <Globe2 size={15} color="var(--primary)" /> 거주 국가 <span style={{ color: 'var(--secondary)' }}>*</span>
          <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>
            (글로벌 사이징 규격 연동용)
          </span>
        </label>

        {/* Selected Box Trigger */}
        <button
          type="button"
          id="country-selector-btn"
          onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
          style={{
            width: '100%',
            padding: '13px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${errors.country ? 'var(--danger)' : country ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: country ? '#fff' : 'var(--text-sub)',
            fontSize: '14px',
            textAlign: 'left'
          }}
        >
          {selectedCountryInfo ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>{selectedCountryInfo.flag}</span>
              <span style={{ fontWeight: 600, color: '#fff' }}>{selectedCountryInfo.nativeName} ({selectedCountryInfo.name})</span>
              <span style={{ fontSize: '11px', color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                {selectedCountryInfo.code}
              </span>
            </span>
          ) : (
            <span>국가를 검색하여 선택해주세요 (예: 대한민국, KR, United States)</span>
          )}
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isCountryDropdownOpen ? '▲' : '▼'}</span>
        </button>

        {/* Dropdown Menu */}
        {isCountryDropdownOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'rgba(18, 22, 31, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 15px 30px rgba(0,0,0,0.7)',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden'
          }}>
            {/* Search Input inside Dropdown */}
            <div style={{ padding: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                id="country-search-input"
                type="text"
                placeholder="국가명 또는 코드 검색..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            {/* List */}
            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {filteredCountries.length > 0 ? (
                filteredCountries.map((c) => (
                  <button
                    key={c.code}
                    id={`country-opt-${c.code}`}
                    type="button"
                    onClick={() => handleCountrySelect(c.code)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: country === c.code ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: country === c.code ? 'var(--primary)' : 'var(--text-main)',
                      fontSize: '13px'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>{c.flag}</span>
                      <span>{c.nativeName} ({c.name})</span>
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>{c.code}</span>
                  </button>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-sub)', fontSize: '13px' }}>
                  일치하는 국가가 없습니다.
                </div>
              )}
            </div>
          </div>
        )}

        {errors.country && (
          <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '6px' }}>{errors.country}</p>
        )}

        {/* Global Size Tag Preview */}
        {selectedCountryInfo && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--accent-cyan)',
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            marginTop: '8px'
          }}>
            <Ruler size={14} />
            <span>연동 규격: <strong>{selectedCountryInfo.standardSize}</strong></span>
          </div>
        )}
      </div>

      {/* 2. City Selection (Autocomplete / 드롭다운) */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
          <MapPin size={15} color="var(--secondary)" /> 거주 시 / 도시 <span style={{ color: 'var(--secondary)' }}>*</span>
          <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>
            (실시간 날씨 기반 OOTD 추천용)
          </span>
        </label>

        {!country ? (
          <div style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            color: 'var(--text-sub)',
            fontSize: '13px'
          }}>
            먼저 위의 거주 국가를 선택해주세요.
          </div>
        ) : (
          <div>
            {/* Search or Direct Input */}
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <input
                id="city-input"
                type="text"
                placeholder="도시명을 검색하거나 목록에서 선택하세요 (예: 서울특별시, 고양시)"
                value={city}
                onChange={(e) => {
                  onChange({ city: e.target.value });
                  setCitySearch(e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${errors.city ? 'var(--danger)' : city ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Quick Pick City Chips */}
            <div style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '8px' }}>
              추천 주요 도시 빠른 선택:
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              maxHeight: '130px',
              overflowY: 'auto',
              padding: '2px'
            }}>
              {availableCities.slice(0, 15).map((cityName) => {
                const isSelected = city === cityName;
                return (
                  <button
                    key={cityName}
                    type="button"
                    onClick={() => onChange({ city: cityName })}
                    className={`glass-chip ${isSelected ? 'active' : ''}`}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {cityName}
                  </button>
                );
              })}
            </div>

            {errors.city ? (
              <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '6px' }}>{errors.city}</p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-sub)', fontSize: '11px', marginTop: '8px' }}>
                <CloudSun size={13} color="var(--accent-amber)" /> 실시간 기상청/글로벌 날씨 API와 연동되어 오늘의 온도에 맞는 두께감/소재를 추천합니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
