from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from services.ollama import chat_with_ollama_stream

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

@app.get("/")
def root():
    return {"status": "Backend is running!"}

@app.post("/chat")
async def chat(request: ChatRequest):
    async def generate():
        async for token in chat_with_ollama_stream(request.messages, request.temperature, request.system_prompt):
            yield token

    return StreamingResponse(generate(), media_type="text/plain")