<div align="center">
  <h1>🏟️ VenueFlow</h1>
  <p><strong>Physical Event Experience Reimagined</strong></p>
  <p><em>Official Submission for PromptWars: The Ultimate AI Challenge by Google</em></p>
  
  <p>
    <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white" alt="Gemini AI" />
    <img src="https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white" alt="Google Cloud" />
    <img src="https://img.shields.io/badge/Firebase_Analytics-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/Google_Maps-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white" alt="Google Maps" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vitest-Coverage_Tested-729B1B?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
  </p>
</div>

<br/>

> **🎯 Chosen Vertical: Physical Event Experience**  
> *"Design a solution that improves the physical event experience for attendees at large-scale sporting venues. The system should address challenges such as crowd movement, waiting times, and real-time coordination."*

---

## 🚀 The Core Problem & Our Solution
Large-scale events are plagued by navigational confusion, bottlenecked crowd movements, and poor reactive communication. Attendees miss vital sessions because they get stuck in unexpected lines.

**VenueFlow** acts as the ultimate **"Event Copilot."**

✨ **Intelligent Crowd Mapping:** Visualizes the entire event floor plan in real-time. Zones are color-coded based on live crowd density (Green = Clear, Red = Crowded).  
✨ **Context-Aware Generative AI:** Integrated natively with **Google Gemini 1.5 Flash**, the built-in Event Assistant reads live schedule and zone data to provide hyper-accurate, contextual responses.  
✨ **Emergency SOS & Navigation:** Attendees get instant walking directions to clear zones or dispatch an SOS alert directly to marshals.  

---

## 📸 Application Showcase

### 🎨 Interface Highlights

| Live Venue Flow Map & Navigation | Context-Aware Gemini AI Assistant |
| :---: | :---: |
| <img src="./docs/map.png" alt="Live Map" width="400" /> | <img src="./docs/ai.png" alt="Gemini Chat" width="400" /> |

---

## ⚡ Technical Architecture & Implementation

VenueFlow is built to be fast, scalable, and resilient.

* **Client-Side Framework:** A Progressive Web App built with React (Vite) and `shadcn/ui` for a premium, accessible mobile-first interface.
* **Real-time Synchronization Engine:** Custom React Hooks synchronize database payloads flawlessly via WebSockets. If a gate closes, the UI updates universally for all attendees instantly.
* **Generative AI Injection Loop:** The application transparently intercepts user questions, injects live venue data into the prompt payload securely, and passes it to Google's servers. *Logic: `User Question -> App Context Injection {Live Zones + Schedule} -> Gemini Analysis -> Accurate Answer.`*
* **Test Coverage:** Comprehensive testing suite powered by **Vitest** ensuring critical hooks, auth layers, and Map components fall back safely.

---

## ☁️ Google Services Integration

VenueFlow fully leverages Google's global infrastructure:

1. 🧠 **Google Gemini API:** Utilizes the lightweight `gemini-3.1-flash-preview` model to ensure mobile data users experience zero delay in AI decision-making. Responses stream instantly.
2. 🚀 **Google Cloud Run:** The application is 100% containerized (`Dockerfile` + `nginx.conf`) and deployed frictionlessly via serverless Google Cloud Run.
3. 📊 **Google Firebase:** Embedded initial Firebase Analytics initialization hooks to track user engagement and emergency app flow metrics effortlessly.

---
<div align="center">
  <strong>Author:</strong> Dev Vekariya <br/>
  <a href="https://www.linkedin.com/in/dev-vekariya-630544402/">Connect with me on LinkedIn</a> <br/><br/>
  <em>Built with ❤️ and ☕ for Google PromptWars 2026</em>
</div>
