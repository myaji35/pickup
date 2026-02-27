Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    allowed = [
      ENV.fetch("FRONTEND_URL", "http://localhost:3000"),
      "http://localhost:3001",
      "http://localhost:3012",
    ]
    # Production: CORS_ORIGINS 환경변수로 추가 허용
    if ENV["CORS_ORIGINS"].present?
      allowed += ENV["CORS_ORIGINS"].split(",").map(&:strip)
    end

    origins(*allowed)

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ["Authorization"],
      credentials: true
  end
end
