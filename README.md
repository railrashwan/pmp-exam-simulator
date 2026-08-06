# 🤖 Search & Weather AI Agent

A production-ready **Single AI Agent System** built with **LangChain**, the
**Tavily Search API**, the **WeatherStack API**, and a **Streamlit** web UI —
with a **Render.com** deployment blueprint included.

The agent uses the **ReAct** (Reason + Act) architecture: it reasons about a
question, decides which tool to call, observes the result, and repeats until it
can answer — combining live web search with real-time weather lookups.

---

## ✨ Features

- **ReAct agent** powered by OpenAI (`gpt-3.5-turbo`) via LangChain.
- **Two tools**
  - 🔎 **Tavily Search** — live web search (`TavilySearchResults`).
  - 🌦️ **WeatherStack** — a custom tool for real-time weather by city.
- **Streamlit UI** for step-by-step, interactive querying.
- **One-click deploy** to Render.com via `render.yaml`.

---

## 🗂️ Project Structure

```
├── .gitignore          # Ignored files (env, caches, virtualenvs, …)
├── .env.example        # Template for required API keys
├── requirements.txt    # Python dependencies
├── main.py             # Agent backend (LLM, tools, ReAct executor)
├── app.py              # Streamlit web UI
├── render.yaml         # Render.com deployment blueprint
└── README.md           # This file
```

---

## 🔑 Prerequisites

You will need API keys for:

| Service      | Environment variable      | Get a key at                        |
| ------------ | ------------------------- | ----------------------------------- |
| OpenAI       | `OPENAI_API_KEY`          | https://platform.openai.com/        |
| Tavily       | `TAVILY_API_KEY`          | https://tavily.com/                 |
| WeatherStack | `WEATHERSTACK_API_KEY`    | https://weatherstack.com/           |

---

## 🚀 Local Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/railrashwan/pmp-exam-simulator.git
   cd pmp-exam-simulator
   ```

2. **Create and activate a virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate      # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Configure your API keys**

   Copy the example file and fill in your keys:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env`:

   ```text
   OPENAI_API_KEY=your_openai_api_key_here
   TAVILY_API_KEY=your_tavily_api_key_here
   WEATHERSTACK_API_KEY=your_weatherstack_api_key_here
   ```

---

## ▶️ Running the App

### Streamlit web UI

```bash
streamlit run app.py
```

Then open the URL printed in your terminal (default: http://localhost:8501).

### Command-line test

Run the agent backend directly to execute a sample query:

```bash
python main.py
```

This runs the built-in test prompt:
*"Find the capital of Nepal and tell me its current weather."*

---

## ☁️ Deploying to Render.com

This repository ships with a `render.yaml` blueprint.

1. Push the repository to GitHub.
2. In the Render dashboard, choose **New → Blueprint** and point it at this repo.
3. Render reads `render.yaml` and provisions a free web service that runs:

   ```bash
   streamlit run app.py --server.port $PORT --server.address 0.0.0.0
   ```

4. Add your API keys as environment variables in the Render dashboard
   (`OPENAI_API_KEY`, `TAVILY_API_KEY`, `WEATHERSTACK_API_KEY`). They are marked
   `sync: false` so they are never stored in the repo.

---

## 🧩 How It Works

`main.py` builds the agent:

1. Initializes the `ChatOpenAI` LLM.
2. Registers two tools: `TavilySearchResults` and the custom `get_weather_data`.
3. Pulls the standard ReAct prompt (`hwchase17/react`) from LangChain Hub.
4. Wraps everything in an `AgentExecutor` that loops through
   **Thought → Action → Observation** until it produces a final answer.

`app.py` imports that executor and exposes it through a Streamlit interface.

---

## 🛠️ Tech Stack

- [LangChain](https://www.langchain.com/)
- [OpenAI](https://platform.openai.com/)
- [Tavily Search API](https://tavily.com/)
- [WeatherStack API](https://weatherstack.com/)
- [Streamlit](https://streamlit.io/)
- [Render.com](https://render.com/)
