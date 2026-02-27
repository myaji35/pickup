# 기관 유형
daycare = InstitutionType.find_or_create_by!(type_code: "DAYCARE") do |t|
  t.type_name = "주간보호"
  t.minimum_care_time_hours = 8
end

general = InstitutionType.find_or_create_by!(type_code: "GENERAL") do |t|
  t.type_name = "일반"
end

# 요금제
starter = Plan.find_or_create_by!(code: "STARTER") do |p|
  p.name = "스타터"
  p.monthly_price = 99_000
  p.max_vehicles = 3
  p.max_passengers = 30
  p.features = { csv_upload: false, analytics: false }.to_json
  p.is_active = true
end

pro = Plan.find_or_create_by!(code: "PRO") do |p|
  p.name = "프로"
  p.monthly_price = 299_000
  p.max_vehicles = 10
  p.max_passengers = 150
  p.features = { csv_upload: true, analytics: true }.to_json
  p.is_active = true
end

enterprise = Plan.find_or_create_by!(code: "ENTERPRISE") do |p|
  p.name = "엔터프라이즈"
  p.monthly_price = 0
  p.max_vehicles = nil
  p.max_passengers = nil
  p.features = { csv_upload: true, analytics: true, dedicated_support: true }.to_json
  p.is_active = true
end

# SUPER_ADMIN 계정
admin = User.find_or_create_by!(email: "admin@pickup.kr") do |u|
  u.name = "시스템 관리자"
  u.role = :super_admin
  u.password = ENV.fetch("ADMIN_PASSWORD", "Admin1234!")
  u.is_active = true
end

# ─────────────────────────────────────────────────
# DTC 코드 시드 (Epic 15)
# ─────────────────────────────────────────────────
dtc_seeds = [
  # Engine (P0xxx)
  { code: 'P0100', category: 'engine', severity: 'medium', description: '공기 유량 센서 회로 오류', possible_causes: '센서 불량,배선 손상,공기 누출', recommended_action: '공기 유량 센서 점검 및 교체' },
  { code: 'P0101', category: 'engine', severity: 'medium', description: '공기 유량 센서 범위/성능 문제', possible_causes: '센서 오염,배기 누출', recommended_action: '센서 청소 또는 교체' },
  { code: 'P0110', category: 'engine', severity: 'low',    description: '흡기 온도 센서 회로 오류', possible_causes: '센서 불량,배선 단락', recommended_action: '흡기 온도 센서 점검' },
  { code: 'P0128', category: 'engine', severity: 'medium', description: '냉각수 온도 낮음 (서모스탯 의심)', possible_causes: '서모스탯 고장,냉각수 부족', recommended_action: '서모스탯 점검 및 교체' },
  { code: 'P0171', category: 'engine', severity: 'medium', description: '연료 혼합비 희박 (Bank 1)', possible_causes: '인젝터 막힘,공기 누출,연료 압력 부족', recommended_action: '인젝터 청소,흡기 계통 점검' },
  { code: 'P0172', category: 'engine', severity: 'medium', description: '연료 혼합비 과농 (Bank 1)', possible_causes: '산소 센서 불량,인젝터 누출', recommended_action: '산소 센서 및 인젝터 점검' },
  { code: 'P0200', category: 'engine', severity: 'high',   description: '인젝터 회로 오류', possible_causes: '인젝터 불량,배선 손상,ECU 문제', recommended_action: '인젝터 및 배선 즉시 점검' },
  { code: 'P0300', category: 'engine', severity: 'high',   description: '다중 실린더 실화 감지', possible_causes: '점화 플러그 마모,코일 불량,연료 문제', recommended_action: '점화 플러그 및 코일 즉시 점검' },
  { code: 'P0301', category: 'engine', severity: 'high',   description: '1번 실린더 실화', possible_causes: '점화 플러그 불량,인젝터 막힘', recommended_action: '점화 플러그 교체' },
  { code: 'P0302', category: 'engine', severity: 'high',   description: '2번 실린더 실화', possible_causes: '점화 플러그 불량,인젝터 막힘', recommended_action: '점화 플러그 교체' },
  { code: 'P0420', category: 'emission', severity: 'medium', description: '촉매 변환기 효율 저하 (Bank 1)', possible_causes: '촉매 노화,산소 센서 불량,엔진 오일 연소', recommended_action: '촉매 변환기 점검' },
  { code: 'P0440', category: 'emission', severity: 'low',    description: '연료 증발 가스 제어 시스템 오류', possible_causes: '연료 캡 불량,캐니스터 누출', recommended_action: '연료 캡 확인 후 교체' },
  { code: 'P0455', category: 'emission', severity: 'low',    description: '증발 가스 대량 누출', possible_causes: '연료 캡 누락,EVAP 배관 손상', recommended_action: 'EVAP 시스템 점검' },
  { code: 'P0500', category: 'engine', severity: 'medium', description: '차속 센서 오류', possible_causes: '센서 불량,배선 손상', recommended_action: '차속 센서 점검' },
  { code: 'P0505', category: 'engine', severity: 'medium', description: '공회전 제어 시스템 오류', possible_causes: 'IAC 밸브 오염,배선 불량', recommended_action: 'IAC 밸브 청소 또는 교체' },
  # Battery / Electrical
  { code: 'P0562', category: 'electrical', severity: 'high',   description: '배터리 전압 낮음', possible_causes: '배터리 방전,발전기 불량', recommended_action: '배터리 및 발전기 즉시 점검' },
  { code: 'P0563', category: 'electrical', severity: 'high',   description: '배터리 전압 높음', possible_causes: '발전기 과충전,전압 조정기 불량', recommended_action: '발전기 점검' },
  { code: 'P0600', category: 'electrical', severity: 'critical', description: '직렬 통신 링크 오류 (ECU)', possible_causes: 'ECU 불량,CAN 버스 오류', recommended_action: '즉시 정비소 방문 필요' },
  { code: 'P0620', category: 'electrical', severity: 'high',   description: '발전기 제어 회로 오류', possible_causes: '발전기 불량,배선 손상', recommended_action: '발전기 점검 및 교체' },
  # Transmission
  { code: 'P0700', category: 'transmission', severity: 'high',   description: '변속기 제어 시스템 오류', possible_causes: 'TCU 불량,오일 부족', recommended_action: '변속기 즉시 점검' },
  { code: 'P0730', category: 'transmission', severity: 'high',   description: '변속 비율 오류', possible_causes: '클러치 마모,TCU 불량', recommended_action: '변속기 전문 점검' },
  { code: 'P0740', category: 'transmission', severity: 'medium', description: '토크 컨버터 클러치 회로 오류', possible_causes: '솔레노이드 불량,유압 문제', recommended_action: '변속기 오일 점검' },
  # Brake / Chassis
  { code: 'C0031', category: 'brake', severity: 'critical', description: '우측 앞 휠 속도 센서 오류', possible_causes: '센서 손상,배선 단락', recommended_action: 'ABS 시스템 즉시 점검' },
  { code: 'C0034', category: 'brake', severity: 'critical', description: '좌측 앞 휠 속도 센서 오류', possible_causes: '센서 손상,배선 단락', recommended_action: 'ABS 시스템 즉시 점검' },
  { code: 'C0040', category: 'brake', severity: 'high',     description: '우측 앞 스티어링 각도 이상', possible_causes: '센서 불량,조향 계통 손상', recommended_action: '조향 시스템 점검' },
  { code: 'C0051', category: 'brake', severity: 'high',     description: '타이어 공기압 경고 (TPMS)', possible_causes: '타이어 펑크,TPMS 센서 불량', recommended_action: '타이어 공기압 즉시 확인' },
  # Body
  { code: 'B0001', category: 'body', severity: 'medium', description: '에어백 시스템 오류', possible_causes: '충격 센서 불량,배선 손상', recommended_action: '에어백 시스템 전문 점검' },
  { code: 'B0010', category: 'body', severity: 'low',    description: '에어컨 온도 센서 오류', possible_causes: '센서 불량', recommended_action: '에어컨 센서 점검' },
  { code: 'B0020', category: 'body', severity: 'low',    description: '파워 윈도우 회로 오류', possible_causes: '모터 불량,스위치 고장', recommended_action: '파워 윈도우 모터 점검' },
  { code: 'B0030', category: 'body', severity: 'medium', description: '도어 잠금 액추에이터 오류', possible_causes: '액추에이터 불량,배선 손상', recommended_action: '도어 잠금 시스템 점검' },
]

dtc_seeds.each do |attrs|
  DtcCode.find_or_create_by!(code: attrs[:code]) do |d|
    d.assign_attributes(attrs)
  end
end

puts "Seeds 완료!"
puts "SUPER_ADMIN: admin@pickup.kr / #{ENV.fetch("ADMIN_PASSWORD", "Admin1234!")}"
puts "요금제: #{Plan.count}개"
puts "기관 유형: #{InstitutionType.count}개"
puts "DTC 코드: #{DtcCode.count}개"
