export interface Profile {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  bio?: string
  is_online?: boolean
  last_seen?: string
  push_token?: string
}

export interface Character {
  id: string
  name: string
  emoji: string
  system_prompt: string
  created_by: string
  is_replica?: boolean
  replica_of?: string
}

export interface Message {
  id?: string
  role: "user" | "assistant"
  content: string
  character_id: string
  user_id: string
  created_at?: string
}

export interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  user1?: Profile
  user2?: Profile
}

export interface DirectMessage {
  id?: string
  conversation_id: string
  sender_id: string
  content: string
  created_at?: string
  read_at?: string
}