# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_02_28_120000) do
  create_table "check_ins", force: :cascade do |t|
    t.datetime "alighted_at"
    t.datetime "boarded_at"
    t.datetime "created_at", null: false
    t.integer "passenger_id", null: false
    t.string "source", default: "manual"
    t.integer "status"
    t.integer "trip_id", null: false
    t.datetime "updated_at", null: false
    t.index ["passenger_id"], name: "index_check_ins_on_passenger_id"
    t.index ["source"], name: "index_check_ins_on_source"
    t.index ["trip_id"], name: "index_check_ins_on_trip_id"
  end

  create_table "coaching_messages", force: :cascade do |t|
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.integer "driver_id", null: false
    t.string "message_type", default: "tip", null: false
    t.boolean "read", default: false
    t.string "severity", default: "info"
    t.string "trigger_event", null: false
    t.integer "trip_id"
    t.datetime "updated_at", null: false
    t.index ["driver_id", "read"], name: "index_coaching_messages_on_driver_id_and_read"
    t.index ["driver_id"], name: "index_coaching_messages_on_driver_id"
    t.index ["trip_id"], name: "index_coaching_messages_on_trip_id"
  end

  create_table "driver_badges", force: :cascade do |t|
    t.string "badge_type", null: false
    t.datetime "created_at", null: false
    t.text "criteria_snapshot"
    t.integer "driver_id", null: false
    t.date "earned_on", null: false
    t.string "level", null: false
    t.datetime "updated_at", null: false
    t.index ["driver_id", "badge_type"], name: "index_driver_badges_on_driver_id_and_badge_type"
    t.index ["driver_id"], name: "index_driver_badges_on_driver_id"
  end

  create_table "driver_safety_scores", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "driver_id", null: false
    t.integer "harsh_accel_count", default: 0
    t.integer "harsh_brake_count", default: 0
    t.integer "idling_count", default: 0
    t.integer "institution_id", null: false
    t.integer "period_week", null: false
    t.integer "period_year", null: false
    t.integer "rank_in_institution"
    t.integer "speeding_count", default: 0
    t.integer "total_distance_km", default: 0
    t.decimal "total_score", precision: 5, scale: 2, default: "100.0"
    t.integer "total_trips", default: 0
    t.datetime "updated_at", null: false
    t.index ["driver_id", "period_year", "period_week"], name: "idx_safety_score_driver_period", unique: true
    t.index ["driver_id"], name: "index_driver_safety_scores_on_driver_id"
    t.index ["institution_id", "period_year", "period_week"], name: "idx_safety_score_institution_period"
    t.index ["institution_id"], name: "index_driver_safety_scores_on_institution_id"
  end

  create_table "driving_events", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "driver_id", null: false
    t.integer "duration_seconds", default: 0
    t.string "event_type", null: false
    t.decimal "lat", precision: 10, scale: 7
    t.decimal "lng", precision: 10, scale: 7
    t.decimal "rpm", precision: 7, scale: 2
    t.decimal "speed", precision: 6, scale: 2
    t.integer "trip_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_driving_events_on_created_at"
    t.index ["driver_id"], name: "index_driving_events_on_driver_id"
    t.index ["event_type"], name: "index_driving_events_on_event_type"
    t.index ["trip_id"], name: "index_driving_events_on_trip_id"
  end

  create_table "dtc_codes", force: :cascade do |t|
    t.string "category", null: false
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.string "description", null: false
    t.string "possible_causes"
    t.string "recommended_action"
    t.string "severity", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_dtc_codes_on_category"
    t.index ["code"], name: "index_dtc_codes_on_code", unique: true
    t.index ["severity"], name: "index_dtc_codes_on_severity"
  end

  create_table "dtc_reports", force: :cascade do |t|
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.string "status", default: "pending"
    t.integer "trip_id", null: false
    t.datetime "updated_at", null: false
    t.integer "vehicle_id", null: false
    t.index ["code"], name: "index_dtc_reports_on_code"
    t.index ["status"], name: "index_dtc_reports_on_status"
    t.index ["trip_id"], name: "index_dtc_reports_on_trip_id"
    t.index ["vehicle_id"], name: "index_dtc_reports_on_vehicle_id"
  end

  create_table "fcm_tokens", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "device_type", default: "unknown", null: false
    t.datetime "last_used_at"
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["token"], name: "index_fcm_tokens_on_token", unique: true
    t.index ["user_id", "device_type"], name: "index_fcm_tokens_on_user_id_and_device_type"
    t.index ["user_id"], name: "index_fcm_tokens_on_user_id"
  end

  create_table "garage_reservations", force: :cascade do |t|
    t.datetime "confirmed_at"
    t.datetime "created_at", null: false
    t.integer "dtc_report_id"
    t.integer "institution_id", null: false
    t.text "note"
    t.integer "partner_garage_id", null: false
    t.integer "referral_fee_krw", default: 0
    t.date "reserved_date", null: false
    t.string "reserved_time"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.integer "vehicle_id", null: false
    t.index ["dtc_report_id"], name: "index_garage_reservations_on_dtc_report_id"
    t.index ["institution_id"], name: "index_garage_reservations_on_institution_id"
    t.index ["partner_garage_id"], name: "index_garage_reservations_on_partner_garage_id"
    t.index ["reserved_date"], name: "index_garage_reservations_on_reserved_date"
    t.index ["status"], name: "index_garage_reservations_on_status"
    t.index ["vehicle_id"], name: "index_garage_reservations_on_vehicle_id"
  end

  create_table "guardian_notification_settings", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "enabled", default: true, null: false
    t.integer "guardian_id", null: false
    t.string "notif_type", null: false
    t.text "template"
    t.datetime "updated_at", null: false
    t.index ["guardian_id", "notif_type"], name: "idx_guardian_notif_settings_unique", unique: true
    t.index ["guardian_id"], name: "index_guardian_notification_settings_on_guardian_id"
  end

  create_table "guardians", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "passenger_id", null: false
    t.string "relationship", default: "parent"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["passenger_id"], name: "index_guardians_on_passenger_id"
    t.index ["user_id", "passenger_id"], name: "index_guardians_on_user_passenger", unique: true
    t.index ["user_id"], name: "index_guardians_on_user_id"
  end

  create_table "institution_types", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "minimum_care_time_hours"
    t.string "type_code"
    t.string "type_name"
    t.datetime "updated_at", null: false
    t.index ["type_code"], name: "index_institution_types_on_type_code", unique: true
  end

  create_table "institutions", force: :cascade do |t|
    t.string "address"
    t.datetime "approved_at"
    t.bigint "approved_by_id"
    t.string "business_number"
    t.datetime "created_at", null: false
    t.integer "institution_type_id"
    t.string "name"
    t.string "phone"
    t.string "rejection_reason"
    t.integer "status"
    t.datetime "suspended_at"
    t.string "suspension_reason"
    t.datetime "updated_at", null: false
    t.index ["business_number"], name: "index_institutions_on_business_number", unique: true
    t.index ["institution_type_id"], name: "index_institutions_on_institution_type_id"
  end

  create_table "invoices", force: :cascade do |t|
    t.integer "amount_krw", null: false
    t.datetime "created_at", null: false
    t.date "due_date"
    t.integer "institution_id", null: false
    t.string "invoice_number", null: false
    t.date "issue_date", null: false
    t.integer "payment_record_id", null: false
    t.string "pdf_url"
    t.string "status", default: "issued"
    t.integer "tax_amount_krw", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["institution_id"], name: "index_invoices_on_institution_id"
    t.index ["invoice_number"], name: "index_invoices_on_invoice_number", unique: true
    t.index ["issue_date"], name: "index_invoices_on_issue_date"
    t.index ["payment_record_id"], name: "index_invoices_on_payment_record_id"
  end

  create_table "maintenance_predictions", force: :cascade do |t|
    t.text "basis"
    t.string "component", null: false
    t.integer "confidence_pct"
    t.datetime "created_at", null: false
    t.datetime "d30_notified_at"
    t.datetime "d7_notified_at"
    t.datetime "last_predicted_at", null: false
    t.date "predicted_due_date"
    t.integer "remaining_days"
    t.integer "remaining_km"
    t.string "status", default: "ok", null: false
    t.datetime "updated_at", null: false
    t.integer "vehicle_id", null: false
    t.index ["predicted_due_date"], name: "index_maintenance_predictions_on_predicted_due_date"
    t.index ["status"], name: "index_maintenance_predictions_on_status"
    t.index ["vehicle_id", "component"], name: "index_maintenance_predictions_on_vehicle_id_and_component", unique: true
    t.index ["vehicle_id"], name: "index_maintenance_predictions_on_vehicle_id"
  end

  create_table "maintenance_records", force: :cascade do |t|
    t.string "component", null: false
    t.decimal "cost", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.string "created_by_role"
    t.string "garage_name"
    t.integer "maintenance_prediction_id"
    t.integer "mileage_km"
    t.text "notes"
    t.date "performed_on", null: false
    t.string "record_type", default: "repair", null: false
    t.datetime "updated_at", null: false
    t.integer "vehicle_id", null: false
    t.index ["component"], name: "index_maintenance_records_on_component"
    t.index ["maintenance_prediction_id"], name: "index_maintenance_records_on_maintenance_prediction_id"
    t.index ["performed_on"], name: "index_maintenance_records_on_performed_on"
    t.index ["vehicle_id"], name: "index_maintenance_records_on_vehicle_id"
  end

  create_table "notification_logs", force: :cascade do |t|
    t.string "body", null: false
    t.datetime "created_at", null: false
    t.text "data", default: "{}"
    t.string "fcm_message_id"
    t.integer "institution_id"
    t.string "notification_type", null: false
    t.string "status", default: "sent", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.index ["created_at"], name: "index_notification_logs_on_created_at"
    t.index ["institution_id"], name: "index_notification_logs_on_institution_id"
    t.index ["notification_type"], name: "index_notification_logs_on_notification_type"
    t.index ["user_id"], name: "index_notification_logs_on_user_id"
  end

  create_table "partner_api_keys", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.string "allowed_scopes", default: "safety_report", null: false
    t.string "api_key_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "last_used_at"
    t.string "partner_name", null: false
    t.string "partner_type", null: false
    t.datetime "updated_at", null: false
    t.index ["api_key_digest"], name: "index_partner_api_keys_on_api_key_digest", unique: true
    t.index ["partner_type"], name: "index_partner_api_keys_on_partner_type"
  end

  create_table "partner_garages", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.string "address", null: false
    t.string "brand"
    t.datetime "created_at", null: false
    t.decimal "lat", precision: 10, scale: 7
    t.decimal "lng", precision: 10, scale: 7
    t.string "name", null: false
    t.string "phone"
    t.integer "rating_x10", default: 0
    t.string "specialties", default: "[]"
    t.datetime "updated_at", null: false
    t.index ["lat", "lng"], name: "index_partner_garages_on_lat_and_lng"
  end

  create_table "passenger_schedules", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "day_of_week"
    t.string "dropoff_time"
    t.boolean "is_active"
    t.integer "passenger_id", null: false
    t.string "pickup_time"
    t.integer "shuttle_type"
    t.datetime "updated_at", null: false
    t.index ["passenger_id"], name: "index_passenger_schedules_on_passenger_id"
  end

  create_table "passengers", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "dropoff_address"
    t.float "dropoff_lat"
    t.float "dropoff_lng"
    t.string "guardian_phone"
    t.integer "institution_id", null: false
    t.string "invite_code"
    t.boolean "is_active"
    t.string "name"
    t.string "phone"
    t.string "pickup_address"
    t.float "pickup_lat"
    t.float "pickup_lng"
    t.datetime "updated_at", null: false
    t.index ["institution_id"], name: "index_passengers_on_institution_id"
    t.index ["invite_code"], name: "index_passengers_on_invite_code", unique: true
  end

  create_table "payment_records", force: :cascade do |t|
    t.integer "amount_krw", null: false
    t.string "card_company"
    t.string "card_number_masked"
    t.datetime "created_at", null: false
    t.string "failure_reason"
    t.integer "institution_id", null: false
    t.datetime "paid_at"
    t.string "status", default: "pending", null: false
    t.integer "subscription_id", null: false
    t.string "toss_order_id", null: false
    t.string "toss_payment_key"
    t.datetime "updated_at", null: false
    t.index ["institution_id"], name: "index_payment_records_on_institution_id"
    t.index ["paid_at"], name: "index_payment_records_on_paid_at"
    t.index ["status"], name: "index_payment_records_on_status"
    t.index ["subscription_id"], name: "index_payment_records_on_subscription_id"
    t.index ["toss_order_id"], name: "index_payment_records_on_toss_order_id", unique: true
    t.index ["toss_payment_key"], name: "index_payment_records_on_toss_payment_key", unique: true, where: "toss_payment_key IS NOT NULL"
  end

  create_table "plans", force: :cascade do |t|
    t.string "code"
    t.datetime "created_at", null: false
    t.text "features"
    t.boolean "is_active"
    t.integer "max_passengers"
    t.integer "max_vehicles"
    t.integer "monthly_price"
    t.string "name"
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_plans_on_code", unique: true
  end

  create_table "referral_rewards", force: :cascade do |t|
    t.integer "amount_krw", default: 5000, null: false
    t.datetime "created_at", null: false
    t.integer "garage_reservation_id", null: false
    t.datetime "paid_at"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["garage_reservation_id"], name: "index_referral_rewards_on_garage_reservation_id"
  end

  create_table "roster_passengers", force: :cascade do |t|
    t.integer "boarding_order"
    t.datetime "created_at", null: false
    t.integer "cumulative_distance_m"
    t.integer "estimated_arrival_sec"
    t.integer "passenger_id", null: false
    t.integer "roster_id", null: false
    t.datetime "updated_at", null: false
    t.index ["boarding_order"], name: "index_roster_passengers_on_boarding_order"
    t.index ["passenger_id"], name: "index_roster_passengers_on_passenger_id"
    t.index ["roster_id"], name: "index_roster_passengers_on_roster_id"
  end

  create_table "rosters", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "distance_source"
    t.integer "institution_id", null: false
    t.datetime "last_optimized_at"
    t.integer "optimized_distance_m"
    t.integer "optimized_duration_sec"
    t.integer "original_distance_m"
    t.integer "shuttle_type"
    t.datetime "updated_at", null: false
    t.integer "vehicle_id", null: false
    t.date "week_start_date"
    t.index ["institution_id"], name: "index_rosters_on_institution_id"
    t.index ["vehicle_id"], name: "index_rosters_on_vehicle_id"
  end

  create_table "solid_cable_messages", force: :cascade do |t|
    t.binary "channel", limit: 1024, null: false
    t.integer "channel_hash", limit: 8, null: false
    t.datetime "created_at", null: false
    t.binary "payload", limit: 536870912, null: false
    t.index ["channel"], name: "index_solid_cable_messages_on_channel"
    t.index ["channel_hash"], name: "index_solid_cable_messages_on_channel_hash"
    t.index ["created_at"], name: "index_solid_cable_messages_on_created_at"
  end

  create_table "subscriptions", force: :cascade do |t|
    t.boolean "auto_renew"
    t.datetime "created_at", null: false
    t.datetime "end_date"
    t.integer "failed_payment_count", default: 0, null: false
    t.integer "institution_id", null: false
    t.date "next_billing_date"
    t.text "notes"
    t.integer "plan_id", null: false
    t.datetime "start_date"
    t.integer "status"
    t.string "toss_billing_key"
    t.datetime "trial_ends_at"
    t.datetime "updated_at", null: false
    t.index ["institution_id"], name: "index_subscriptions_on_institution_id"
    t.index ["next_billing_date"], name: "index_subscriptions_on_next_billing_date"
    t.index ["plan_id"], name: "index_subscriptions_on_plan_id"
    t.index ["toss_billing_key"], name: "index_subscriptions_on_toss_billing_key", unique: true, where: "toss_billing_key IS NOT NULL"
  end

  create_table "trip_cancellations", force: :cascade do |t|
    t.date "cancel_date", null: false
    t.datetime "created_at", null: false
    t.string "reason"
    t.integer "requested_by_id", null: false
    t.integer "roster_passenger_id", null: false
    t.datetime "updated_at", null: false
    t.index ["requested_by_id"], name: "index_trip_cancellations_on_requested_by_id"
    t.index ["roster_passenger_id"], name: "index_trip_cancellations_on_roster_passenger_id"
  end

  create_table "trips", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.decimal "current_lat", precision: 10, scale: 7
    t.decimal "current_lng", precision: 10, scale: 7
    t.integer "driver_id", null: false
    t.datetime "ended_at"
    t.decimal "last_coolant_temp", precision: 5, scale: 2
    t.decimal "last_fuel_level", precision: 5, scale: 2
    t.decimal "last_rpm", precision: 7, scale: 2
    t.decimal "last_throttle", precision: 5, scale: 2
    t.datetime "location_updated_at"
    t.datetime "obd_updated_at"
    t.integer "roster_id", null: false
    t.integer "shuttle_type"
    t.datetime "started_at"
    t.integer "status"
    t.date "trip_date"
    t.datetime "updated_at", null: false
    t.integer "vehicle_id", null: false
    t.index ["driver_id"], name: "index_trips_on_driver_id"
    t.index ["roster_id"], name: "index_trips_on_roster_id"
    t.index ["vehicle_id"], name: "index_trips_on_vehicle_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "fcm_token"
    t.integer "institution_id"
    t.boolean "is_active"
    t.datetime "last_login_at"
    t.string "name"
    t.string "password_digest"
    t.string "phone"
    t.integer "role"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["institution_id"], name: "index_users_on_institution_id"
  end

  create_table "vehicles", force: :cascade do |t|
    t.integer "capacity"
    t.datetime "created_at", null: false
    t.decimal "current_lat", precision: 10, scale: 7
    t.decimal "current_lng", precision: 10, scale: 7
    t.integer "current_mileage_km", default: 0
    t.decimal "heading", precision: 5, scale: 2
    t.integer "institution_id", null: false
    t.datetime "last_mileage_updated_at"
    t.datetime "location_updated_at"
    t.string "plate_last4"
    t.string "plate_number"
    t.decimal "speed", precision: 5, scale: 2
    t.integer "status"
    t.datetime "updated_at", null: false
    t.string "vehicle_type"
    t.index ["institution_id"], name: "index_vehicles_on_institution_id"
  end

  create_table "weekly_coaching_summaries", force: :cascade do |t|
    t.decimal "avg_score", precision: 5, scale: 2
    t.integer "badges_earned", default: 0
    t.datetime "created_at", null: false
    t.integer "driver_id", null: false
    t.text "improvement_tips"
    t.text "praise_points"
    t.integer "total_events", default: 0
    t.integer "total_trips", default: 0
    t.datetime "updated_at", null: false
    t.date "week_start", null: false
    t.index ["driver_id", "week_start"], name: "index_weekly_coaching_summaries_on_driver_id_and_week_start", unique: true
    t.index ["driver_id"], name: "index_weekly_coaching_summaries_on_driver_id"
  end

  add_foreign_key "check_ins", "passengers"
  add_foreign_key "check_ins", "trips"
  add_foreign_key "coaching_messages", "trips"
  add_foreign_key "coaching_messages", "users", column: "driver_id"
  add_foreign_key "driver_badges", "users", column: "driver_id"
  add_foreign_key "driver_safety_scores", "institutions"
  add_foreign_key "driver_safety_scores", "users", column: "driver_id"
  add_foreign_key "driving_events", "trips"
  add_foreign_key "driving_events", "users", column: "driver_id"
  add_foreign_key "dtc_reports", "trips"
  add_foreign_key "dtc_reports", "vehicles"
  add_foreign_key "fcm_tokens", "users"
  add_foreign_key "garage_reservations", "dtc_reports"
  add_foreign_key "garage_reservations", "institutions"
  add_foreign_key "garage_reservations", "partner_garages"
  add_foreign_key "garage_reservations", "vehicles"
  add_foreign_key "guardian_notification_settings", "guardians"
  add_foreign_key "guardians", "passengers"
  add_foreign_key "guardians", "users"
  add_foreign_key "institutions", "institution_types"
  add_foreign_key "invoices", "institutions"
  add_foreign_key "invoices", "payment_records"
  add_foreign_key "maintenance_predictions", "vehicles"
  add_foreign_key "maintenance_records", "maintenance_predictions"
  add_foreign_key "maintenance_records", "vehicles"
  add_foreign_key "notification_logs", "institutions"
  add_foreign_key "notification_logs", "users"
  add_foreign_key "passenger_schedules", "passengers"
  add_foreign_key "passengers", "institutions"
  add_foreign_key "payment_records", "institutions"
  add_foreign_key "payment_records", "subscriptions"
  add_foreign_key "referral_rewards", "garage_reservations"
  add_foreign_key "roster_passengers", "passengers"
  add_foreign_key "roster_passengers", "rosters"
  add_foreign_key "rosters", "institutions"
  add_foreign_key "rosters", "vehicles"
  add_foreign_key "subscriptions", "institutions"
  add_foreign_key "subscriptions", "plans"
  add_foreign_key "trip_cancellations", "roster_passengers"
  add_foreign_key "trip_cancellations", "users", column: "requested_by_id"
  add_foreign_key "trips", "rosters"
  add_foreign_key "trips", "users", column: "driver_id"
  add_foreign_key "trips", "vehicles"
  add_foreign_key "users", "institutions"
  add_foreign_key "vehicles", "institutions"
  add_foreign_key "weekly_coaching_summaries", "users", column: "driver_id"
end
