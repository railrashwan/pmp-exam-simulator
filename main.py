import os
import requests
import certifi
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.tools import tool
from langchain import hub
from langchain.agents import create_react_agent, AgentExecutor

# Fix potential SSL certificate path issues across OS environments
os.environ["SSL_CERT_FILE"] = certifi.where()

# Load environment variables from .env file if available
load_dotenv()

# Initialize LLM (OpenAI)
llm = ChatOpenAI(
    model="gpt-3.5-turbo",
    temperature=0
)

# Tool 1: Built-in Tavily Search Tool
search_tool = TavilySearchResults(max_results=2)

# Tool 2: Custom Weather Tool using WeatherStack API
@tool
def get_weather_data(city: str) -> str:
    """Fetches real-time weather information for a specified city name."""
    api_key = os.getenv("WEATHERSTACK_API_KEY")
    if not api_key:
        return "Error: WEATHERSTACK_API_KEY is not configured."

    url = f"http://api.weatherstack.com/current?access_key={api_key}&query={city}"
    try:
        response = requests.get(url, timeout=10)
        data = response.json()

        if "current" not in data:
            return f"Could not retrieve weather data for '{city}'. Please check the city name."

        location_name = data.get("location", {}).get("name", city)
        temperature = data["current"].get("temperature")
        weather_descriptions = ", ".join(data["current"].get("weather_descriptions", []))
        humidity = data["current"].get("humidity")

        return f"Weather in {location_name}: {temperature}°C, {weather_descriptions}, Humidity: {humidity}%."
    except Exception as e:
        return f"Error fetching weather data: {str(e)}"

# Aggregate Tools
tools = [search_tool, get_weather_data]

# Pull standard ReAct prompt from LangChain Hub
prompt = hub.pull("hwchase17/react")

# Create ReAct Agent and Agent Executor
agent = create_react_agent(llm=llm, tools=tools, prompt=prompt)
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    handle_parsing_errors=True
)

def run_agent(user_query: str) -> str:
    """Invokes the agent with a prompt query and returns the final result string."""
    try:
        response = agent_executor.invoke({"input": user_query})
        return response.get("output", "No response generated.")
    except Exception as e:
        return f"An error occurred while executing the agent: {str(e)}"

if __name__ == "__main__":
    test_prompt = "Find the capital of Nepal and tell me its current weather."
    print(f"\n--- Running Test Query: {test_prompt} ---\n")
    print(run_agent(test_prompt))
