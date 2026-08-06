import os
import certifi
import streamlit as st
from dotenv import load_dotenv

# Ensure SSL certificates path is correctly configured
os.environ["SSL_CERT_FILE"] = certifi.where()

load_dotenv()

from main import agent_executor

# Configure Streamlit page
st.set_page_config(
    page_title="Search & Weather AI Agent",
    page_icon="🤖",
    layout="centered"
)

st.title("🤖 Search & Weather AI Agent")
st.markdown(
    "This agent uses **LangChain ReAct Architecture** powered by **Tavily Search** "
    "and a custom **WeatherStack API** tool to answer questions step-by-step."
)

st.divider()

# Input section
user_query = st.text_input(
    label="Enter your prompt / question:",
    placeholder="e.g., Find the capital of France and tell me its current weather."
)

if st.button("Run Agent", type="primary"):
    if not user_query.strip():
        st.warning("Please enter a valid question before running the agent.")
    else:
        with st.spinner("Agent thinking step-by-step (Thought -> Action -> Observation)..."):
            try:
                response = agent_executor.invoke({"input": user_query})
                output = response.get("output", "No result returned.")
                st.success("Execution Complete!")
                st.markdown("### Agent Answer:")
                st.write(output)
            except Exception as e:
                st.error(f"Error executing agent: {str(e)}")

st.divider()
st.caption("Built with LangChain, Streamlit, and Python.")
