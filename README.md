# 🤖 Kikar

An AI-powered chat application built with **Next.js**, **Supabase**, **GROQ**, and **Capacitor**. The application allows users to chat with AI-generated characters, create custom personalities, communicate with other users through direct messages, and receive push notifications on Android.

---

## ✨ Features

* 🔐 User Authentication (Sign Up / Login)
* 🤖 Chat with AI-powered characters
* 🎭 Create and manage custom AI characters
* 💬 Real-time messaging
* 👥 Direct messaging between users
* 👤 User profiles
* 🔔 Push notifications (Android)
* 📱 Mobile support using Capacitor
* ☁️ Supabase backend for authentication and database

---

## 🛠️ Tech Stack

### Frontend

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS

### Backend & Services

* Supabase

  * Authentication
  * Database
* GROQ

### Mobile

* Capacitor
* Android

---

## 📂 Project Structure

```
ChatBot/
│
├── app/                 # Next.js App Router
├── src/
│   ├── components/      # UI Components
│   ├── lib/             # Supabase & helper functions
│   └── styles.ts
│
├── android/             # Android project (Capacitor)
├── public/
├── package.json
└── README.md
```

---

## 🚀 Installation

### Clone the repository

```bash
git clone https://github.com/Bhavya4907/ChatBot.git
cd ChatBot
```

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env.local` file.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
GOOGLE_API_KEY=your_gemini_api_key
```

---

## ▶️ Run the project

Development server

```bash
npm run dev
```

Production build

```bash
npm run build
npm start
```

---

## 📱 Android Build

Sync Capacitor

```bash
npx cap sync
```

Open Android Studio

```bash
npx cap open android
```

---

## 📸 Screenshots

Add screenshots here.

```
screenshots/
    login.png
    chat.png
    characters.png
    profile.png
```

Example:

```md
![Login](screenshots/login.png)

![Chat](screenshots/chat.png)
```

---

## 🎯 Future Improvements

* Voice conversations
* AI memory system
* Image generation
* Group chats
* Friend requests
* Typing indicators
* Read receipts
* Better character customization
* Theme support (Dark/Light Mode)

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---


