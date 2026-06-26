| table_name     | trigger_name                    | definition                                         |
| -------------- | ------------------------------- | -------------------------------------------------- |
| hostels        | update_hostels_updated_at       | EXECUTE FUNCTION set_updated_at()                  |
| kyc_log        | update_kyc_log_updated_at       | EXECUTE FUNCTION set_updated_at()                  |
| auth_log       | update_auth_log_updated_at      | EXECUTE FUNCTION set_updated_at()                  |
| admin          | update_admin_updated_at         | EXECUTE FUNCTION set_updated_at()                  |
| chat_log       | update_chat_log_updated_at      | EXECUTE FUNCTION set_updated_at()                  |
| vendor_kyc     | update_vendor_kyc_updated_at    | EXECUTE FUNCTION set_updated_at()                  |
| security_log   | update_security_log_updated_at  | EXECUTE FUNCTION set_updated_at()                  |
| users          | update_users_updated_at         | EXECUTE FUNCTION set_updated_at()                  |
| favorites      | update_favorites_updated_at     | EXECUTE FUNCTION set_updated_at()                  |
| hostel_log     | update_hostel_log_updated_at    | EXECUTE FUNCTION set_updated_at()                  |
| user_kyc       | update_user_kyc_updated_at      | EXECUTE FUNCTION set_updated_at()                  |
| chat_rooms     | update_chat_rooms_updated_at    | EXECUTE FUNCTION set_updated_at()                  |
| messages       | trg_update_room_timestamp       | EXECUTE FUNCTION update_room_on_new_message()      |
| vendor_ratings | trigger_update_vendor_metrics   | EXECUTE FUNCTION update_vendor_metrics_on_rating() |
| vendor_ratings | trigger_update_vendor_metrics   | EXECUTE FUNCTION update_vendor_metrics_on_rating() |
| vendor_ratings | trigger_update_vendor_metrics   | EXECUTE FUNCTION update_vendor_metrics_on_rating() |
| product_log    | update_product_log_updated_at   | EXECUTE FUNCTION set_updated_at()                  |
| product_items  | update_product_items_updated_at | EXECUTE FUNCTION set_updated_at()                  |
| hostels        | tsvector_update                 | EXECUTE FUNCTION update_hostel_search_document()   |
| hostels        | tsvector_update                 | EXECUTE FUNCTION update_hostel_search_document()   |
| metrics_log    | update_metrics_log_updated_at   | EXECUTE FUNCTION set_updated_at()                  |
| users          | trg_protect_immutable_fields    | EXECUTE FUNCTION protect_immutable_fields()        |