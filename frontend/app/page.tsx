export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-4">
          Pickup MaaS
        </h1>
        <p className="text-center text-muted-foreground">
          송영 서비스 차량 및 승객명단 관리 플랫폼
        </p>
        <div className="mt-8 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left gap-4">
          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              차량 관리
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              차량 정보 등록 및 현재 배정된 승객 그룹 관리
            </p>
          </div>

          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              승객 그룹 관리
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              승객 그룹 생성 및 차량 배정
            </p>
          </div>

          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              승객 명단 관리
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              승객 정보 입력 및 8시간 케어 검증
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
