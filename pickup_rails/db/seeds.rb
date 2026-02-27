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

puts "Seeds 완료!"
puts "SUPER_ADMIN: admin@pickup.kr / #{ENV.fetch("ADMIN_PASSWORD", "Admin1234!")}"
puts "요금제: #{Plan.count}개"
puts "기관 유형: #{InstitutionType.count}개"
