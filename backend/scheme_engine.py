import sys
import json
import os
import requests
import asyncio
import concurrent.futures
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

def call_groq(messages, model="llama-3.3-70b-versatile", temperature=0.1, max_tokens=3000):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "response_format": { "type": "json_object" }
    }
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]

def search_tavily(query):
    url = "https://api.tavily.com/search"
    payload = {
        "api_key": TAVILY_API_KEY,
        "query": query,
        "search_depth": "basic",
        "max_results": 3,
        "include_answer": False,
        "include_raw_content": False,
        "include_images": False
    }
    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()

async def run_pipeline(profile):
    # Step 1: Query Generation
    query_gen_prompt = f"""
    Generate 4 targeted search queries for Indian government disability schemes based on this profile:
    {json.dumps(profile)}
    
    Queries should target:
    1. Central DEPwD / Ministry of Social Justice schemes
    2. State-specific welfare schemes for {profile.get('state', 'India')}
    3. Education/Scholarship schemes for PwDs
    4. Financial/Pension/Insurance schemes
    
    Return ONLY a JSON object: {{ "queries": ["query1", "query2", "query3", "query4"] }}
    """
    
    messages = [{"role": "system", "content": "You are a government policy expert."}, {"role": "user", "content": query_gen_prompt}]
    query_data = json.loads(call_groq(messages))
    queries = query_data.get("queries", [])

    # Step 2: Parallel Search
    with concurrent.futures.ThreadPoolExecutor() as executor:
        loop = asyncio.get_event_loop()
        search_tasks = [loop.run_in_executor(executor, search_tavily, q) for q in queries]
        search_results = await asyncio.gather(*search_tasks)

    # Step 3: Extract and Structure Context
    context = ""
    sources = []
    for res in search_results:
        for r in res.get("results", []):
            context += f"Source: {r['url']}\nContent: {r['content']}\n\n"
            domain = r['url'].split('/')[2]
            if domain not in sources: sources.append(domain)

    # Step 4: Scheme Extraction
    extraction_prompt = f"""
    Based on the following search results and user profile, extract EVERY relevant government scheme the user is entitled to.
    User Profile: {json.dumps(profile)}
    
    Search Context:
    {context}
    
    Strictly return a JSON object with a 'schemes' array. Each scheme must have:
    - name (string)
    - ministry (string)
    - type ("Central" | "State")
    - benefit (string, explain the financial/physical benefit)
    - eligibility (string, explain criteria)
    - howToApply (string, steps to apply)
    - tags (array of strings)
    - sourceUrl (string)
    
    Rank by impact. If no specific results found in context, use your internal knowledge of Indian schemes but flag them.
    Return ONLY JSON.
    """
    
    messages = [
        {"role": "system", "content": "You are a professional social worker assisting PwDs in India. Extract and structure entitlements accurately."},
        {"role": "user", "content": extraction_prompt}
    ]
    
    schemes_data = json.loads(call_groq(messages))
    return {
        "schemes": schemes_data.get("schemes", []),
        "sources": sources
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No profile provided"}))
        sys.exit(1)
        
    profile_json = sys.argv[1]
    profile = json.loads(profile_json)
    
    try:
        result = asyncio.run(run_pipeline(profile))
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
