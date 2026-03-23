from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from services.ollama import chat_with_ollama_stream
import asyncio
import json
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    messages: list
    temperature: Optional[float] = 0.7
    system_prompt: Optional[str] = None

class MemoryRequest(BaseModel):
    messages: list

@app.get("/")
def root():
    return {"status": "Backend is running!"}

@app.post("/chat")
async def chat(request: Request, body: ChatRequest):
    async def generate():
        async for token in chat_with_ollama_stream(
            body.messages,
            body.temperature,
            body.system_prompt
        ):
            if await request.is_disconnected():
                break
            yield token

    return StreamingResponse(generate(), media_type="text/plain")

@app.post("/extract-memory")
async def extract_memory(request: MemoryRequest):
    user_messages = [m for m in request.messages if m.get('role') == 'user']
    if not user_messages:
        return {"facts": []}

    prompt = f"""Extract 1-3 key facts about the user from these messages.
Only extract clear, specific facts (name, age, interests, job, location etc).
Return ONLY a JSON array of strings. Example: ["User's name is John", "User likes physics"]
If no clear facts, return []

Messages: {str(user_messages[-6:])}"""

    try:
        result = ""
        async for token in chat_with_ollama_stream(
            [{"role": "user", "content": prompt}],
            temperature=0.1
        ):
            result += token

        match = re.search(r'\[.*?\]', result, re.DOTALL)
        if match:
            facts = json.loads(match.group())
            return {"facts": facts[:3]}
    except Exception as e:
        print(f"Memory extraction error: {e}")

    return {"facts": []}