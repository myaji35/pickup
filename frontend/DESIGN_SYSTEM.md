# Pickup MaaS Admin Portal - Design System

## 개요
TailwindCSS 3.x와 shadcn/ui 기반의 모던하고 일관된 디자인 시스템

## 색상 팔레트

### Primary Colors (브랜드 그라디언트)
```css
/* 브랜드 그라디언트: Blue to Purple */
bg-gradient-to-r from-blue-600 to-purple-600
```

### Background Colors
```css
/* 메인 배경 - 그라디언트 */
bg-gradient-to-br from-blue-50 via-white to-purple-50

/* 카드/컨테이너 */
bg-white
bg-card

/* 반투명 헤더 */
bg-white/80 backdrop-blur-sm
```

### Text Colors
```css
/* 주요 텍스트 */
text-foreground

/* 보조 텍스트 */
text-muted-foreground

/* 브랜드 그라디언트 텍스트 */
bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent
```

### Border & Divider
```css
border
border-border
```

## Typography

### Headings
```tsx
{/* H1 - 페이지 타이틀 */}
<h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
  Pickup MaaS
</h1>

{/* H2 - 섹션 헤더 */}
<h2 className="text-2xl font-bold">
  환영합니다
</h2>

{/* H3 - 카드 타이틀 */}
<h3 className="text-xl font-semibold">
  차량 관리
</h3>
```

### Body Text
```tsx
{/* 일반 텍스트 */}
<p className="text-sm text-muted-foreground">
  설명 텍스트
</p>

{/* 강조 텍스트 */}
<p className="text-lg">
  중요한 내용
</p>
```

## Spacing

### Container & Layout
```tsx
{/* 컨테이너 */}
<div className="container mx-auto px-4 py-8">

{/* 섹션 간격 */}
<div className="space-y-6">

{/* 카드 그리드 */}
<div className="grid md:grid-cols-2 gap-4">
```

## Components (shadcn/ui)

### Button
```tsx
import { Button } from '@/components/ui/button';

{/* Primary Button */}
<Button size="lg" className="text-lg px-8">
  로그인
</Button>

{/* Outline Button */}
<Button variant="outline" size="sm">
  로그아웃
</Button>
```

### Card
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle>제목</CardTitle>
    <CardDescription>설명</CardDescription>
  </CardHeader>
  <CardContent>
    내용
  </CardContent>
</Card>
```

### Input & Label
```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div className="space-y-2">
  <Label htmlFor="email">이메일</Label>
  <Input
    id="email"
    type="email"
    placeholder="admin@test.com"
  />
</div>
```

### Separator
```tsx
import { Separator } from '@/components/ui/separator';

<Separator />
```

## Layout Patterns

### Full Page Layout
```tsx
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
  {/* Header */}
  <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
    {/* ... */}
  </header>

  {/* Main Content */}
  <main className="container mx-auto px-4 py-8">
    {/* ... */}
  </main>
</div>
```

### Centered Card Layout (로그인 페이지)
```tsx
<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
  <Card className="w-full max-w-md">
    {/* ... */}
  </Card>
</div>
```

### Dashboard Grid
```tsx
<div className="grid md:grid-cols-2 gap-4">
  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
    {/* ... */}
  </Card>
</div>
```

## Interactive States

### Hover Effects
```css
hover:shadow-lg transition-shadow
hover:border-gray-300 hover:bg-gray-100
```

### Loading States
```tsx
<Button disabled={loading}>
  {loading ? '로딩 중...' : '제출'}
</Button>
```

### Error States
```tsx
<div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
  에러 메시지
</div>
```

### Success States
```tsx
<div className="bg-green-50 text-green-800 border border-green-200 p-4 rounded-md">
  성공 메시지
</div>
```

## Icons & Emojis

현재는 이모지를 사용하여 아이콘 대체:

```tsx
<div className="text-4xl mb-4">🚐</div>  {/* 차량 */}
<div className="text-4xl mb-4">👥</div>  {/* 승객 */}
<div className="text-4xl mb-4">🤖</div>  {/* AI */}
<div className="text-4xl mb-4">⚙️</div>  {/* 설정 */}
```

**향후 개선**: Lucide Icons 또는 Heroicons 사용 권장

## Responsive Design

### Breakpoints
```css
/* Mobile First */
className="..."

/* Tablet (md: 768px) */
className="md:grid-cols-2"

/* Desktop (lg: 1024px) */
className="lg:grid-cols-3"
```

### Mobile Navigation
```tsx
{/* 모바일에서는 세로 배치, 데스크톱에서는 가로 배치 */}
<div className="flex flex-col md:flex-row gap-4">
```

## Animation

### Transitions
```css
transition-shadow
transition-colors
```

### Custom Animations (globals.css)
```css
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
```

## Accessibility

### Form Labels
```tsx
{/* 모든 input은 label과 연결 */}
<Label htmlFor="email">이메일</Label>
<Input id="email" />
```

### Focus States
shadcn/ui 컴포넌트는 기본적으로 포커스 스타일 포함

### Semantic HTML
```tsx
<main>  {/* 메인 컨텐츠 */}
<header>  {/* 헤더 */}
<footer>  {/* 푸터 */}
```

## Best Practices

### 1. 일관된 간격 사용
```tsx
{/* space-y-* 유틸리티 활용 */}
<div className="space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### 2. 반응형 디자인
```tsx
{/* 모바일 우선, 점진적 향상 */}
<div className="flex flex-col md:flex-row">
```

### 3. 접근성 우선
```tsx
{/* 의미 있는 alt 텍스트, aria-label 사용 */}
<button aria-label="메뉴 열기">
```

### 4. 성능 최적화
```tsx
{/* 이미지 최적화 */}
import Image from 'next/image';

{/* 조건부 렌더링으로 불필요한 컴포넌트 제거 */}
{isLoading ? <Spinner /> : <Content />}
```

## Theme Configuration

현재 테마는 `frontend/app/globals.css`에 정의:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --border: 0 0% 89.8%;
  /* ... */
}
```

## Example: 완전한 로그인 폼

```tsx
<Card className="w-full max-w-md">
  <CardHeader className="space-y-1 text-center">
    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
      Pickup MaaS
    </CardTitle>
    <CardDescription className="text-lg">
      관리자 로그인
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@test.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          required
        />
      </div>
      <Button type="submit" className="w-full">
        로그인
      </Button>
    </form>
  </CardContent>
</Card>
```

## 향후 개선 사항

1. **아이콘 시스템**: 이모지 → Lucide Icons 전환
2. **다크 모드**: 테마 토글 추가
3. **애니메이션**: Framer Motion 통합
4. **컴포넌트 스토리북**: Storybook 설정
5. **디자인 토큰**: CSS 변수 확장
