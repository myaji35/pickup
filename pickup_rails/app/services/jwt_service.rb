class JwtService
  SECRET = Rails.application.secret_key_base
  ALGORITHM = "HS256"
  ACCESS_TOKEN_EXP = 15.minutes
  REFRESH_TOKEN_EXP = 7.days

  def self.encode(payload, exp: ACCESS_TOKEN_EXP)
    payload = payload.merge(exp: exp.from_now.to_i)
    JWT.encode(payload, SECRET, ALGORITHM)
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET, true, { algorithm: ALGORITHM })
    HashWithIndifferentAccess.new(decoded.first)
  rescue JWT::ExpiredSignature
    raise AuthenticationError, "토큰이 만료되었습니다"
  rescue JWT::DecodeError
    raise AuthenticationError, "유효하지 않은 토큰입니다"
  end

  def self.encode_refresh(payload)
    encode(payload, exp: REFRESH_TOKEN_EXP)
  end
end

class AuthenticationError < StandardError; end
