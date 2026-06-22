-- Ensure nurture tables are writable by the API service role
GRANT ALL ON TABLE email_unsubscribes TO service_role;
GRANT ALL ON TABLE email_sequences TO service_role;
GRANT ALL ON TABLE email_sends TO service_role;

GRANT ALL ON TABLE email_unsubscribes TO postgres;
GRANT ALL ON TABLE email_sequences TO postgres;
GRANT ALL ON TABLE email_sends TO postgres;
