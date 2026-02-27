# 카카오맵 통합 가이드

> **Pickup MaaS는 카카오맵을 메인 지도 솔루션으로 사용합니다**
>
> **선택 이유**: 한국 지도 정확도, 무료 할당량, 한글 지원, 낮은 비용

---

## 📊 카카오맵 vs Google Maps 비교

| 기능 | 카카오맵 | Google Maps | 선택 |
|------|---------|-------------|------|
| **지오코딩** (주소→좌표) | Local API (무료 300K/일) | Geocoding API ($5/1K) | ✅ **카카오** |
| **역지오코딩** (좌표→주소) | Local API (무료) | Geocoding API ($5/1K) | ✅ **카카오** |
| **지도 표시** | JavaScript API (무료) | Maps JavaScript API ($7/1K) | ✅ **카카오** |
| **거리 계산** | 길찾기 API (무료 100K/일) | Distance Matrix API ($5/1K) | ✅ **카카오** |
| **주소 검색** | Local API (무료) | Places API ($17/1K) | ✅ **카카오** |
| **도로명 주소** | Local API (무료) | - | ✅ **카카오** |
| **경로 최적화** | - | OR-Tools (무료) | ⚙️ **OR-Tools** |

### 예상 비용 (월간)

```
카카오맵 중심:
- 모든 지도 API: 무료 (할당량 내)
- OR-Tools: 무료 (Self-hosted)
총: $0/월

Google Maps 중심 (기존):
- Geocoding: $150/월
- Distance Matrix: $100/월
- Maps JavaScript: $200/월
총: $450/월

💰 절감액: $450/월 (100% 절감)
```

---

## 🔑 카카오 개발자 등록

### 1. 계정 생성 및 앱 등록

```bash
1. https://developers.kakao.com/ 접속
2. 로그인 (카카오 계정 필요)
3. 내 애플리케이션 > 애플리케이션 추가하기
4. 앱 이름: "Pickup MaaS"
5. 사업자명: (선택사항)
```

### 2. API 키 발급

앱 설정 > 앱 키에서 3가지 키 확인:

| 키 이름 | 용도 | 사용 위치 |
|---------|------|----------|
| **REST API 키** | 서버 사이드 API 호출 | Backend `.env` |
| **JavaScript 키** | 웹 브라우저 지도 표시 | Frontend `.env.local` |
| **Admin 키** | (사용 안 함) | - |

### 3. 플랫폼 설정

#### 웹 플랫폼
```
앱 설정 > 플랫폼 > Web 플랫폼 등록
- 사이트 도메인: http://localhost:3012
- 사이트 도메인: https://yourdomain.com (프로덕션)
```

#### Android 플랫폼 (Q2 - Driver/Passenger App)
```
앱 설정 > 플랫폼 > Android 플랫폼 등록
- 패키지명: com.pickupmaas.driver
- 마켓 URL: (Play Store 출시 후)
- 키 해시: (앱 서명 키)
```

#### iOS 플랫폼 (Q2)
```
앱 설정 > 플랫폼 > iOS 플랫폼 등록
- Bundle ID: com.pickupmaas.driver
- 마켓 URL: (App Store 출시 후)
```

### 4. API 활성화

앱 설정 > Kakao SDK에서 필요한 SDK 활성화:

- [x] **Kakao Map** (지도 표시)
- [x] **Kakao Local** (주소 검색, 지오코딩)
- [x] **Kakao Mobility** (길찾기, 거리 계산)

---

## 🛠️ Backend 통합

### 1. 환경 변수 설정

`backend/.env`:
```bash
# 카카오맵 REST API 키
KAKAO_REST_API_KEY="your-kakao-rest-api-key"

# Optional: Naver Maps (Fallback)
NAVER_CLIENT_ID="your-naver-client-id"
NAVER_CLIENT_SECRET="your-naver-client-secret"
```

### 2. Geocoding Service 구현

`backend/src/common/geocoding/kakao-geocoding.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface Coordinates {
  lat: number;
  lng: number;
}

@Injectable()
export class KakaoGeocodingService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://dapi.kakao.com/v2';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('KAKAO_REST_API_KEY');
  }

  /**
   * 주소 → 좌표 변환 (Geocoding)
   * @param address 도로명 주소 또는 지번 주소
   * @returns 위도/경도
   */
  async geocode(address: string): Promise<Coordinates | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/local/search/address.json`,
        {
          headers: {
            Authorization: `KakaoAK ${this.apiKey}`,
          },
          params: {
            query: address,
          },
        }
      );

      const result = response.data.documents[0];
      if (!result) {
        console.warn(`Geocoding failed for address: ${address}`);
        return null;
      }

      // 도로명 주소 우선, 없으면 지번 주소
      const coords = result.road_address || result.address;

      return {
        lat: parseFloat(coords.y),
        lng: parseFloat(coords.x),
      };
    } catch (error) {
      console.error('Kakao Geocoding error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * 좌표 → 주소 변환 (Reverse Geocoding)
   * @param lat 위도
   * @param lng 경도
   * @returns 도로명 주소
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/local/geo/coord2address.json`,
        {
          headers: {
            Authorization: `KakaoAK ${this.apiKey}`,
          },
          params: {
            x: lng,
            y: lat,
          },
        }
      );

      const result = response.data.documents[0];
      if (!result) return null;

      // 도로명 주소 우선
      return result.road_address?.address_name || result.address?.address_name;
    } catch (error) {
      console.error('Kakao Reverse Geocoding error:', error);
      return null;
    }
  }

  /**
   * 키워드로 장소 검색
   * @param keyword 검색어 (예: "강남역", "스타벅스")
   * @returns 검색 결과 목록
   */
  async searchPlaces(keyword: string, page = 1) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/local/search/keyword.json`,
        {
          headers: {
            Authorization: `KakaoAK ${this.apiKey}`,
          },
          params: {
            query: keyword,
            page,
            size: 15,
          },
        }
      );

      return response.data.documents.map((doc: any) => ({
        name: doc.place_name,
        address: doc.address_name,
        roadAddress: doc.road_address_name,
        lat: parseFloat(doc.y),
        lng: parseFloat(doc.x),
        category: doc.category_name,
        phone: doc.phone,
      }));
    } catch (error) {
      console.error('Kakao Places Search error:', error);
      return [];
    }
  }
}
```

### 3. 거리 계산 Service

`backend/src/common/geocoding/kakao-directions.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface RouteInfo {
  distance: number; // meters
  duration: number; // seconds
}

@Injectable()
export class KakaoDirectionsService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://apis-navi.kakaomobility.com/v1';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('KAKAO_REST_API_KEY');
  }

  /**
   * 두 지점 간 도로 거리 및 소요 시간 계산
   * @param origin 출발지 좌표
   * @param destination 도착지 좌표
   * @returns 거리(m), 소요시간(초)
   */
  async getDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<RouteInfo | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/directions`, {
        headers: {
          Authorization: `KakaoAK ${this.apiKey}`,
        },
        params: {
          origin: `${origin.lng},${origin.lat}`,
          destination: `${destination.lng},${destination.lat}`,
          priority: 'RECOMMEND', // RECOMMEND, TIME, DISTANCE
        },
      });

      const route = response.data.routes[0];
      if (!route) return null;

      const summary = route.summary;

      return {
        distance: summary.distance, // meters
        duration: summary.duration, // seconds
      };
    } catch (error) {
      console.error('Kakao Directions error:', error);
      return null;
    }
  }

  /**
   * 여러 지점 간 거리 행렬 계산
   * (OR-Tools VRP에 사용)
   */
  async getDistanceMatrix(
    origins: Array<{ lat: number; lng: number }>,
    destinations: Array<{ lat: number; lng: number }>
  ): Promise<number[][]> {
    const matrix: number[][] = [];

    for (let i = 0; i < origins.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < destinations.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
          continue;
        }

        const route = await this.getDirections(origins[i], destinations[j]);
        matrix[i][j] = route ? route.distance : this.haversineDistance(origins[i], destinations[j]);

        // Rate limit: 10 calls/sec (카카오 제한)
        await this.sleep(100);
      }
    }

    return matrix;
  }

  /**
   * Haversine 공식으로 직선 거리 계산 (Fallback)
   */
  private haversineDistance(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
  ): number {
    const R = 6371000; // Earth radius in meters
    const dLat = this.toRad(b.lat - a.lat);
    const dLng = this.toRad(b.lng - a.lng);
    const lat1 = this.toRad(a.lat);
    const lat2 = this.toRad(b.lat);

    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4. Module 등록

`backend/src/common/geocoding/geocoding.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KakaoGeocodingService } from './kakao-geocoding.service';
import { KakaoDirectionsService } from './kakao-directions.service';

@Module({
  imports: [ConfigModule],
  providers: [KakaoGeocodingService, KakaoDirectionsService],
  exports: [KakaoGeocodingService, KakaoDirectionsService],
})
export class GeocodingModule {}
```

---

## 🖥️ Frontend 통합

### 1. 환경 변수 설정

`frontend/.env.local`:
```bash
# 카카오맵 JavaScript API 키
NEXT_PUBLIC_KAKAO_MAP_API_KEY="your-kakao-javascript-key"
```

### 2. Kakao Maps SDK 로드

`frontend/app/layout.tsx`:

```typescript
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        {/* 카카오맵 SDK */}
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false`}
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 3. 지도 컴포넌트

`frontend/components/KakaoMap.tsx`:

```typescript
'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

interface Marker {
  lat: number;
  lng: number;
  title: string;
  content?: string;
}

interface KakaoMapProps {
  center: { lat: number; lng: number };
  markers?: Marker[];
  level?: number; // 확대 레벨 (1-14, 작을수록 확대)
  width?: string;
  height?: string;
}

export default function KakaoMap({
  center,
  markers = [],
  level = 3,
  width = '100%',
  height = '400px',
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Kakao Maps SDK 로드 대기
    window.kakao.maps.load(() => {
      const container = mapRef.current;
      const options = {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level: level,
      };

      const map = new window.kakao.maps.Map(container, options);

      // 마커 추가
      markers.forEach((marker) => {
        const position = new window.kakao.maps.LatLng(marker.lat, marker.lng);
        const mapMarker = new window.kakao.maps.Marker({
          position: position,
          title: marker.title,
        });
        mapMarker.setMap(map);

        // InfoWindow (Optional)
        if (marker.content) {
          const infowindow = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:5px;">${marker.content}</div>`,
          });

          window.kakao.maps.event.addListener(mapMarker, 'click', () => {
            infowindow.open(map, mapMarker);
          });
        }
      });
    });
  }, [center, markers, level]);

  return <div ref={mapRef} style={{ width, height }} />;
}
```

### 4. 사용 예시

`frontend/app/tracking/page.tsx`:

```typescript
'use client';

import KakaoMap from '@/components/KakaoMap';
import { useQuery } from '@tanstack/react-query';

export default function TrackingPage() {
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-tracking'],
    queryFn: () => fetch('/api/vehicles/tracking').then(r => r.json()),
    refetchInterval: 5000, // 5초마다 갱신
  });

  if (!vehicles) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">실시간 차량 추적</h1>

      <KakaoMap
        center={{ lat: 37.5665, lng: 126.9780 }} // 서울시청
        markers={vehicles.map((v: any) => ({
          lat: v.currentLat,
          lng: v.currentLng,
          title: `차량 ${v.lastFourDigits}`,
          content: `<strong>${v.lastFourDigits}</strong><br/>승객: ${v.passengerCount}명`,
        }))}
        level={5}
        height="600px"
      />
    </div>
  );
}
```

### 5. 주소 검색 컴포넌트

`frontend/components/AddressSearch.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AddressResult {
  name: string;
  address: string;
  roadAddress: string;
  lat: number;
  lng: number;
}

interface AddressSearchProps {
  onSelect: (address: AddressResult) => void;
}

export default function AddressSearch({ onSelect }: AddressSearchProps) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<AddressResult[]>([]);

  const handleSearch = async () => {
    const res = await fetch(`/api/geocoding/search?keyword=${encodeURIComponent(keyword)}`);
    const data = await res.json();
    setResults(data);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="주소 또는 장소명 입력"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch}>검색</Button>
      </div>

      {results.length > 0 && (
        <div className="border rounded-lg divide-y">
          {results.map((result, idx) => (
            <div
              key={idx}
              className="p-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelect(result)}
            >
              <p className="font-medium">{result.name}</p>
              <p className="text-sm text-gray-600">{result.roadAddress || result.address}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 📱 React Native 통합 (Q2: Driver/Passenger App)

### 1. 라이브러리 설치

```bash
npm install react-native-kakao-maps
```

### 2. iOS 설정

`ios/Podfile`:
```ruby
pod 'KakaoMapsSDK-SPM'
```

`ios/Info.plist`:
```xml
<key>KAKAO_APP_KEY</key>
<string>your-kakao-native-app-key</string>
```

### 3. Android 설정

`android/app/build.gradle`:
```gradle
dependencies {
    implementation 'com.kakao.maps.open:android:2.6.0'
}
```

`android/app/src/main/AndroidManifest.xml`:
```xml
<application>
    <meta-data
        android:name="com.kakao.maps.APP_KEY"
        android:value="your-kakao-native-app-key"/>
</application>
```

### 4. 사용 예시

`driver-app/src/screens/TrackingScreen.tsx`:

```typescript
import React from 'react';
import { View } from 'react-native';
import KakaoMapView, { Marker } from 'react-native-kakao-maps';

export default function TrackingScreen() {
  return (
    <View style={{ flex: 1 }}>
      <KakaoMapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 37.5665,
          longitude: 126.9780,
          zoomLevel: 3,
        }}
      >
        <Marker
          coordinate={{ latitude: 37.5665, longitude: 126.9780 }}
          title="서울시청"
        />
      </KakaoMapView>
    </View>
  );
}
```

---

## 🔄 OR-Tools 경로 최적화에서 카카오맵 사용

`backend/src/route/infrastructure/external/or-tools-solver.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { KakaoDirectionsService } from '../../../common/geocoding/kakao-directions.service';

@Injectable()
export class ORToolsSolverService {
  constructor(
    private kakaoDirections: KakaoDirectionsService
  ) {}

  async solveVRP(input: {
    vehicleCapacity: number;
    depot: { lat: number; lng: number };
    pickups: Array<{ id: string; lat: number; lng: number }>;
  }) {
    // 1. 카카오 길찾기 API로 거리 행렬 생성
    const locations = [input.depot, ...input.pickups];
    const distanceMatrix = await this.kakaoDirections.getDistanceMatrix(
      locations,
      locations
    );

    // 2. OR-Tools VRP 솔버 실행
    // ... (기존 OR-Tools 로직)

    return optimizedRoute;
  }
}
```

---

## 💰 비용 및 할당량

### 카카오맵 API 할당량 (무료)

| API | 할당량 (일) | 예상 사용량 | 충분한가? |
|-----|------------|------------|---------|
| Local API (Geocoding) | 300,000건 | ~1,000건 | ✅ 충분 |
| Mobility API (길찾기) | 100,000건 | ~5,000건 | ✅ 충분 |
| Maps JavaScript API | 무제한 | - | ✅ 무제한 |

**예상 월간 사용량** (100개 기관 기준):
- 주소 검증 (Geocoding): 30,000건/월
- 거리 계산 (길찾기): 150,000건/월
- 지도 표시: 무제한

**결론**: 무료 할당량으로 충분히 운영 가능

### 할당량 초과 시 대응

1. **캐싱 적용**:
   - 자주 조회되는 주소 → 좌표는 DB 캐싱
   - Redis에 24시간 캐싱

2. **Batch 처리**:
   - Excel 업로드 시 한 번에 100개씩 처리
   - Rate limit: 10 calls/sec 준수

3. **Fallback**:
   - 카카오 API 실패 시 Naver Maps API 사용
   - 최종 Fallback: Haversine 직선거리

---

## 📚 공식 문서

- [카카오 Local API](https://developers.kakao.com/docs/latest/ko/local/dev-guide)
- [카카오 Mobility API](https://developers.kakaomobility.com/docs/navi-api/directions/)
- [카카오 Maps JavaScript API](https://apis.map.kakao.com/web/)
- [React Native Kakao Maps](https://github.com/JWWon/react-native-kakao-maps)

---

**작성일**: 2025-01-15
**버전**: 1.0 (Kakao Maps 중심)
**담당자**: Development Team
