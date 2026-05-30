import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  "https://dhykgbrhfjdlkuyswmat.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoeWtnYnJoZmpkbGt1eXN3bWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MDkyOTIsImV4cCI6MjA5NTI4NTI5Mn0.gZz_lP56l4xNyFeESJDhtaXbQSksctgFGHr7zTttSQ0"
)