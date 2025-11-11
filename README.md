## 🤖 CHATBOT WEB APP

An interactive **Chatbot Web Application** that processes user queries and generates responses through backend API integration.  
Built with **JavaScript** and **React.js** for seamless frontend–backend communication.

---

## 🚀 Features
- 💬 chatbot and Users conversations  
- 🧠 Backend integration for intelligent responses  
- ⚡ Dynamic and responsive chat interface  
- 🌐 Smooth frontend–backend API communication  
- 🎨 Clean and modern UI  

---

## 🛠️ Tech Stack
**Frontend:** HTML, CSS, JavaScript  
**Backend:** Node.js / Express
**API Integration:** Custom REST API  
**Version Control:** Git, GitHub  

---
Output images
<img width="1877" height="907" alt="Screenshot 2025-11-08 171509" src="https://github.com/user-attachments/assets/0878feeb-fecd-4ef1-8448-f078643f4d13" />


## ⚙️ Installation & Setup

```bash
# Clone this repository
git clone https://github.com/Inchara-Manjunath/chatbot-web-app.git

# Go to project directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

---

## 🔧 Environment Variables (Frontend)

If the frontend needs to call the backend API, configure the backend URL in Vite:

1) Create a file at `frontend/.env` with:

```
VITE_BACKEND_URL=https://your-backend.onrender.com
```

2) Rebuild or restart the dev server after changes.

In code, read it as:

```js
const baseUrl = import.meta.env.VITE_BACKEND_URL;
```
