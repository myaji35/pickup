module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      token = request.params[:token] || request.headers["Authorization"]&.sub(/\ABearer /, "")
      raise ActionCable::Connection::Authorization::UnauthorizedError unless token.present?

      payload = JwtService.decode(token)
      user = User.find_by(id: payload[:user_id])
      raise ActionCable::Connection::Authorization::UnauthorizedError unless user&.is_active?

      user
    rescue => e
      Rails.logger.warn "ActionCable 인증 실패: #{e.message}"
      reject_unauthorized_connection
    end
  end
end
