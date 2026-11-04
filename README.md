
# 🧠 TraceMind
### AI-Powered Incident Investigation with Persistent Memory

**Investigate faster. Remember every fix.**

TraceMind is an AI-powered debugging and incident investigation platform that helps developers diagnose application errors, recall previously resolved incidents, and reuse proven solutions.

Unlike traditional AI debugging assistants that analyze each problem independently, TraceMind integrates **Hindsight Agent Memory** to retain and retrieve historical engineering knowledge across sessions.

---

## 🌐 Live Demo

🚀 **[Launch TraceMind](https://tracemind-3tvdfok0o-editorxp1-alts-projects.vercel.app/)**

📂 **[GitHub Repository](https://github.com/Shahib-Alam-Saifi/TraceMind)**

> The deployed application may require Vercel authentication if deployment protection is enabled.

---

## 🎯 Problem Statement

Development teams frequently encounter recurring bugs, deployment failures, and production incidents.

Even when an issue has already been resolved, the solution often gets buried in logs, documentation, or conversations.

This results in:
- Repeated debugging of previously solved errors
- Loss of important engineering knowledge
- Longer incident investigation times
- Difficulty identifying recurring failure patterns

**TraceMind addresses this by giving the investigation agent persistent memory of confirmed incidents and their resolutions.**

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🧠 Persistent Memory | Stores confirmed incidents and successful fixes using Hindsight |
| 🔍 AI Incident Analysis | Analyzes errors and suggests debugging steps |
| 📚 Historical Recall | Retrieves relevant previously resolved incidents |
| ⚡ Memory Comparison | Compares diagnoses with and without historical context |
| 🛠️ Resolution Tracking | Records verified root causes and fixes |
| 📊 Evidence Display | Shows recalled incident evidence alongside AI diagnoses |
| 💻 Developer Dashboard | Responsive interface for investigating incidents |
| 🔐 Server-Side API Integration | Keeps provider credentials outside frontend code |

---

## 🏗️ System Architecture

```text
           Developer
               |
               v
      TraceMind Dashboard
       (Next.js + React)
               |
               v
         Backend API
               |
        +------+------+
        |             |
        v             v
    Hindsight      Groq LLM
   Agent Memory   AI Reasoning
        |             |
        v             |
  Recall previous     |
  incidents/fixes     |
        |             |
        +------+------+
               |
               v
       AI Diagnosis +
       Historical Evidence
               |
               v
    Developer Verifies Fix
               |
               v
       Hindsight Retain
               |
               v
      Persistent Memory
```

### How Hindsight Works in TraceMind

**1. Retain**

When a developer confirms a successful resolution, TraceMind stores the incident details, root cause, and fix in Hindsight.

**2. Recall**

When a similar error occurs, TraceMind retrieves relevant historical incidents and passes that context into the investigation workflow.

**3. Analyze**

Groq generates debugging suggestions using the current error and, when enabled, the retrieved historical context.

**4. Improve future investigations**

As more confirmed resolutions are stored, the agent gains access to a larger history of debugging experience.

TraceMind uses persistent memory and retrieval, not automatic model retraining.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Frontend | Next.js 16, React 19 |
| Language | TypeScript |
| Styling | CSS |
| Icons | Lucide React |
| Backend | Next.js API Routes |
| Agent Memory | Hindsight by Vectorize |
| LLM | Groq API |
| Testing | Node.js Test Runner |
| Deployment | Vercel |
| Version Control | Git & GitHub |

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js and npm
- Git
- Hindsight Cloud account or local Hindsight server
- Groq API key

### 1. Clone the Repository

```bash
git clone https://github.com/Shahib-Alam-Saifi/TraceMind.git
cd TraceMind
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create the environment file:

```bash
cp .env.example .env.local
```

Add the following variables:

```env
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=your_hindsight_api_key

HINDSIGHT_BANK_ID=tracemind-demo

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b

TRACEMIND_ACCESS_KEY=
```

Replace the placeholder API keys with your own credentials.

**Never push `.env.local` or API credentials to GitHub.**

### 4. Start the Development Server

```bash
npm run dev
```

Open:

http://localhost:3000

---

## 🧪 Testing the Application

### Test 1 — Record a Confirmed Incident

Open **Memory Bank → Add confirmed incident**.

Use the following synthetic example:

**Service:** `nextjs-frontend`

**Observed Error:** `Invalid element type in Navbar`

**Root Cause:** Incorrect named import of a default-exported component.

**Fix:** Changed the named import to a default import.

Click **Save to Hindsight**.

### Test 2 — Recall Historical Memory

Navigate to **Investigation**.

Enter:

```text
Service: nextjs-frontend
Error: Invalid element type in Navbar
```

Enable **Hindsight Memory** and click **Analyze incident**.

The application should retrieve relevant stored incidents and provide a diagnosis.

### Test 3 — Memory ON vs OFF

Run the same investigation twice:

- **Memory OFF:** Analyze the error without historical evidence.
- **Memory ON:** Include previously stored incident information.

Compare the diagnoses and the recalled evidence.

This demonstrates how persistent memory can influence incident investigation. Actual improvement must be measured through reproducible tests.

### Run Automated Checks

```bash
npm test
npm run build
npm run lint
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/status` | GET | Reports provider configuration status |
| `/api/analyze` | POST | Performs AI incident analysis |
| `/api/incident` | POST | Stores a confirmed incident in Hindsight |

---

## ☁️ Deployment

TraceMind is deployed using **Vercel** and connected to its GitHub repository.

### Live Application

🔗 https://tracemind-3tvdfok0o-editorxp1-alts-projects.vercel.app/

### Deployment Steps

1. Fork or clone this repository.
2. Import the repository into Vercel.
3. Select the Next.js framework preset.
4. Add the required environment variables.
5. Deploy the application.

Environment variables should be configured server-side in Vercel.

---

## 🔒 Security & Limitations

- API credentials are stored as server-side environment variables.
- Developers should remove secrets and sensitive customer information from logs.
- AI-generated diagnoses require human verification.
- TraceMind does not automatically execute suggested fixes.
- The current memory comparison does not establish a measured accuracy improvement.
- Production multi-user usage requires stronger authentication, rate limiting, and isolated memory banks.

---

## 🔮 Future Enhancements

- GitHub issue and pull-request integration
- Automated incident classification
- Historical incident similarity ranking
- Deployment failure correlation
- Slack incident notifications
- Incident analytics and trends
- Team-specific memory banks
- Evaluation dashboards for diagnosis accuracy

---

## 📚 Documentation & Resources

- [Hindsight Official Documentation](https://hindsight.vectorize.io/)
- [Hindsight GitHub](https://github.com/vectorize-io/hindsight)
- [Groq Documentation](https://console.groq.com/docs/overview)
- [Next.js Documentation](https://nextjs.org/docs)

---

## 👨‍💻 Project

**TraceMind — AI Incident Intelligence**

GitHub: https://github.com/Shahib-Alam-Saifi/TraceMind

Live Demo: https://tracemind-3tvdfok0o-editorxp1-alts-projects.vercel.app/

---

**Built to ensure that engineering knowledge doesn't disappear after an incident is resolved.**
