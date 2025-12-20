# LLM Model Comparison Test

## Overview
This script tests **FREE** LLM models to find the best alternative to Gemma 3 27B IT for your AI Interview Platform.

## Models Tested

### 🔵 Google Gemini (Free Tier)
- **gemini-2.0-flash-exp** - Latest experimental model (RECOMMENDED)
- **gemini-1.5-flash** - Stable, reliable
- **gemini-1.5-flash-8b** - Smaller, faster
- **gemma-3-27b-it** - Current model (your baseline)
- **gemma-2-9b-it** - Smaller Gemma variant

### 🟠 Hugging Face (Free Inference API - 300 req/hour)
- **Qwen 2.5 1.5B/7B** - Excellent for coding & reasoning
- **Mistral 7B Instruct** - Strong general performance
- **LLaMA 3.2 3B** - Meta's open-source model
- **Zephyr 7B** - Fine-tuned for conversations
- **Phi-3 Mini** - Microsoft's efficient model

## Setup

### 1. Install Dependencies
```bash
pip install -r test_llm_requirements.txt
```

### 2. Get API Keys (FREE)

#### Gemini API Key
1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the key

#### Hugging Face API Key
1. Go to https://huggingface.co/settings/tokens
2. Click "New token"
3. Name it (e.g., "llm-testing")
4. Select "Read" access
5. Copy the token

### 3. Add Keys to `.env`
Create or edit `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_key_here
HUGGINGFACE_API_KEY=your_huggingface_token_here
```

## Running the Test

```bash
cd backend
python test_llm_models.py
```

## What It Tests

The script evaluates each model on 4 scenarios:

1. **Code Generation** - Write a palindrome function
2. **Technical Reasoning** - Explain deep vs shallow copy
3. **Conversational AI** - Generate natural follow-up questions
4. **Code Review** - Analyze and improve code

## Metrics Measured

- ✅ **Success Rate** - How many tests passed
- ⏱️ **Response Time** - Average seconds per response
- 🚀 **Speed** - Tokens per second
- 📊 **Quality** - Response length and relevance

## Expected Output

```
🏆 TOP PERFORMERS:
1. gemini-2.0-flash-exp
   Success: 100% | Avg Time: 1.2s | Speed: 45 tokens/sec

2. Qwen 2.5 7B
   Success: 100% | Avg Time: 2.1s | Speed: 32 tokens/sec

📊 RECOMMENDATIONS:
🔧 Best for Code Generation: gemini-2.0-flash-exp
💬 Best for Conversational AI: Mistral 7B Instruct

✅ RECOMMENDATION FOR AI INTERVIEW PLATFORM:
Primary Model: gemini-2.0-flash-exp
Fallback Model: Qwen 2.5 7B
```

## Results File

Detailed JSON results saved to: `llm_comparison_results_YYYYMMDD_HHMMSS.json`

## Free Tier Limits

### Google Gemini
- **gemini-2.0-flash-exp**: ~20 requests/day (free tier)
- **gemini-1.5-flash**: ~1500 requests/day
- **gemma models**: Higher limits (separate quota)

### Hugging Face
- **Free tier**: 300 requests/hour
- **Pro ($9/month)**: 1000 requests/hour

## Troubleshooting

### "GEMINI_API_KEY not found"
- Make sure `.env` file is in the `backend` directory
- Check the key name is exactly `GEMINI_API_KEY`

### "Rate limit exceeded"
- Wait a few minutes between test runs
- Gemini free tier resets daily
- Hugging Face resets hourly

### "Model not found"
- Some HF models may require Pro subscription
- The script will skip failed models and continue

## Next Steps

After running the test:

1. Review the comparison report
2. Check the JSON file for detailed metrics
3. Update `backend/llm/gemini_client.py` with the best model:

```python
models_to_try = [
    'gemini-2.0-flash-exp',  # New best model
    'gemini-1.5-flash',      # Fallback
    'gemma-3-27b-it',        # Current baseline
]
```

## Cost Comparison

| Model | Cost | Limits |
|-------|------|--------|
| Gemini 2.0 Flash | FREE | ~20/day |
| Gemini 1.5 Flash | FREE | ~1500/day |
| Gemma 3 27B IT | FREE | Higher quota |
| Qwen 2.5 (HF) | FREE | 300/hour |
| Mistral 7B (HF) | FREE | 300/hour |

All models tested are **100% FREE** with reasonable rate limits for development and testing.
