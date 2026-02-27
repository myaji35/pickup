class ApplicationController < ActionController::API
  before_action :authenticate_user!

  attr_reader :current_user

  private

  def authenticate_user!
    token = extract_token
    payload = JwtService.decode(token)
    @current_user = User.find(payload[:user_id])
    render_unauthorized("비활성화된 계정입니다") unless @current_user.is_active
  rescue AuthenticationError => e
    render_unauthorized(e.message)
  rescue ActiveRecord::RecordNotFound
    render_unauthorized("사용자를 찾을 수 없습니다")
  end

  def require_super_admin!
    render_forbidden unless current_user.super_admin?
  end

  def require_institution_admin!
    render_forbidden unless current_user.super_admin? || current_user.institution_admin?
  end

  def require_driver!
    render_forbidden unless current_user.driver?
  end

  def render_success(data, status: :ok, meta: nil)
    response = { success: true, data: data }
    response[:meta] = meta if meta
    render json: response, status: status
  end

  def render_error(message, status: :unprocessable_entity, errors: nil)
    response = { success: false, error: message }
    response[:errors] = errors if errors
    render json: response, status: status
  end

  def render_unauthorized(message = "인증이 필요합니다")
    render json: { success: false, error: message }, status: :unauthorized
  end

  def render_forbidden(message = "접근 권한이 없습니다")
    render json: { success: false, error: message }, status: :forbidden
  end

  def extract_token
    header = request.headers["Authorization"]
    raise AuthenticationError, "인증 토큰이 없습니다" unless header&.start_with?("Bearer ")
    header.split(" ").last
  end

  def pagination_meta(records)
    {
      current_page: records.current_page,
      total_pages: records.total_pages,
      total_count: records.total_count,
      per_page: records.limit_value
    }
  end
end
