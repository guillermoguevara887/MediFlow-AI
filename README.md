# MediFlow AI - Smart Medical Triage System 🏥

**MediFlow AI** is an intelligent triage solution designed to optimize emergency room workflows in emerging markets, specifically tailored for the healthcare context of **El Salvador**. 

Using advanced AI, this system provides administrative classification of symptoms to prioritize critical cases and reduce hospital overcrowding.

## ✨ Key Features
* **Automated Triage**: Instant classification of patient symptoms into Red (Emergency), Yellow (Urgent), or Green (Non-urgent).
* **Medical Entity Recognition**: Uses NLP to identify clinical terms and symptoms directly from user input.
* **Safety Protocol**: Built-in fallback mechanisms to ensure a safe administrative response even during connectivity issues.

## 🛠️ Tech Stack (Microsoft AI)
This project is built using the **Microsoft Azure** ecosystem to ensure scalability and reliability:

* **Azure AI Foundry**: Powers the reasoning engine using the **gpt-4o-mini** model for clinical decision support.
* **Azure AI Language**: Utilized for **Text Analytics for Health** to extract and validate medical entities from patient descriptions.
* **Next.js 15**: Modern frontend/backend framework for a fast and responsive user experience.
* **Tailwind CSS**: For a clean, professional, and accessible medical interface.

## 🚀 Impact
In many regions, emergency rooms are overwhelmed by non-critical cases. **MediFlow AI** serves as a digital first-response layer, ensuring that life-threatening symptoms (like chest pain) are identified instantly, potentially saving lives by reducing the time to treatment.

## ⚙️ Setup & Deployment
1. Clone the repository.
2. Configure environment variables (`.env.local`) with your **Azure AI Foundry** and **Language** keys.
3. Run `npm install` and `npm run dev`.
4. Deploy to **Vercel** or **Railway** for production.

