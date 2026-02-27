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

ActiveRecord::Schema[8.1].define(version: 2026_02_28_030001) do
  create_table "check_ins", force: :cascade do |t|
    t.datetime "alighted_at"
    t.datetime "boarded_at"
    t.datetime "created_at", null: false
    t.integer "passenger_id", null: false
    t.integer "status"
    t.integer "trip_id", null: false
    t.datetime "updated_at", null: false
    t.index ["passenger_id"], name: "index_check_ins_on_passenger_id"
    t.index ["trip_id"], name: "index_check_ins_on_trip_id"
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

  create_table "roster_passengers", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "passenger_id", null: false
    t.integer "roster_id", null: false
    t.datetime "updated_at", null: false
    t.index ["passenger_id"], name: "index_roster_passengers_on_passenger_id"
    t.index ["roster_id"], name: "index_roster_passengers_on_roster_id"
  end

  create_table "rosters", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "institution_id", null: false
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
    t.integer "institution_id", null: false
    t.integer "plan_id", null: false
    t.datetime "start_date"
    t.integer "status"
    t.datetime "trial_ends_at"
    t.datetime "updated_at", null: false
    t.index ["institution_id"], name: "index_subscriptions_on_institution_id"
    t.index ["plan_id"], name: "index_subscriptions_on_plan_id"
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
    t.decimal "heading", precision: 5, scale: 2
    t.integer "institution_id", null: false
    t.datetime "location_updated_at"
    t.string "plate_last4"
    t.string "plate_number"
    t.decimal "speed", precision: 5, scale: 2
    t.integer "status"
    t.datetime "updated_at", null: false
    t.string "vehicle_type"
    t.index ["institution_id"], name: "index_vehicles_on_institution_id"
  end

  add_foreign_key "check_ins", "passengers"
  add_foreign_key "check_ins", "trips"
  add_foreign_key "driver_safety_scores", "institutions"
  add_foreign_key "driver_safety_scores", "users", column: "driver_id"
  add_foreign_key "driving_events", "trips"
  add_foreign_key "driving_events", "users", column: "driver_id"
  add_foreign_key "dtc_reports", "trips"
  add_foreign_key "dtc_reports", "vehicles"
  add_foreign_key "guardians", "passengers"
  add_foreign_key "guardians", "users"
  add_foreign_key "institutions", "institution_types"
  add_foreign_key "passenger_schedules", "passengers"
  add_foreign_key "passengers", "institutions"
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
end
