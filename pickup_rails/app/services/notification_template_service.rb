class NotificationTemplateService
  # 변수 키 매핑
  VARIABLE_MAP = {
    '{{ETA분}}'   => :eta_minutes,
    '{{승객이름}}' => :passenger_name,
    '{{기관명}}'   => :institution_name
  }.freeze

  # template: 문자열 (예: "{{ETA분}}분 후 {{승객이름}}님 탑승 예정입니다.")
  # variables: Hash (예: { eta_minutes: 5, passenger_name: "홍길동", institution_name: "행복유치원" })
  # 반환: 변수 치환된 문자열
  def self.render(template, variables = {})
    result = template.dup
    VARIABLE_MAP.each do |placeholder, key|
      value = variables[key]
      result.gsub!(placeholder, value.to_s) if value
    end
    result
  end

  # GuardianNotificationSetting 레코드와 변수 해시를 받아
  # enabled 여부와 최종 문구를 반환
  def self.resolve(setting, variables = {})
    return { enabled: false, body: nil } unless setting.enabled

    body = render(setting.effective_template, variables)
    { enabled: true, body: body }
  end
end
