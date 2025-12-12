# MAX_TOKENS Root Cause Analysis

## 🔍 Issue Summary

**Problem**: Getting `finish_reason = MAX_TOKENS (2)` with **empty parts array** (`parts = []`), even with `max_output_tokens=1024`.

## 📚 Research Findings

Based on [Google Cloud Documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/thinking#budget) and web search:

### 1. **Thinking Tokens Hypothesis** ✅

According to the [Google Cloud Thinking Documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/thinking#budget):

> **"You are charged for the tokens that are generated during a model's thinking process. For some models, such as Gemini 3 Pro and Gemini 2.5 Pro, thinking is enabled by default and you are billed for these tokens."**

**Key Points**:
- Thinking tokens count toward **total token budget**
- For Gemini 2.5 Pro/Flash, thinking may be enabled by default
- When thinking tokens exhaust the budget **before any output tokens are generated**, we get:
  - `finish_reason = MAX_TOKENS (2)`
  - `parts = []` (empty - no output generated)

### 2. **Known Issues** (from web search)

From [Google AI Developers Forum](https://discuss.ai.google.dev/t/max-output-tokens-isnt-respected-when-using-gemini-2-5-flash-model/106708):

- Some users reported `gemini-2.5-flash` not respecting `max_output_tokens` parameter
- This was acknowledged and addressed by the engineering team
- Issue may still occur in edge cases

### 3. **Empty Response Behavior**

From [Google AI Developers Forum](https://discuss.ai.google.dev/t/finishreason-max-tokens-but-text-is-empty/81874):

- When output is truncated due to token limits, response may be empty
- This is a known behavior observed by other developers

## 🧪 Test Results

### Test 1: Simple Call
- ✅ Works: finish_reason = STOP, text extracted

### Test 2: Follow-up Generation (Short Prompt)
- ✅ Works: finish_reason = STOP, text extracted

### Test 3: Follow-up Generation (Current Prompt)
- ⚠️ Intermittent: Sometimes finish_reason = MAX_TOKENS, parts = []
- ⚠️ Sometimes: finish_reason = MAX_TOKENS, parts = [text] (truncated but has content)

## 💡 Root Cause

**The MAX_TOKENS issue occurs when**:

1. **Thinking tokens exhaust budget first**: 
   - Model uses tokens for internal reasoning (thinking)
   - These tokens count toward `max_output_tokens` limit
   - If thinking uses all/most tokens, no output tokens remain
   - Result: `finish_reason = MAX_TOKENS`, `parts = []`

2. **Prompt too long**:
   - Long prompts consume input tokens
   - Less room for output tokens
   - Can cause truncation

3. **Model-specific behavior**:
   - Some models may not strictly respect `max_output_tokens`
   - Edge cases where truncation happens unexpectedly

## ✅ Solutions Applied

1. **Increased max_output_tokens**: 200 → 300 → 1024
2. **Refined prompt**: Reduced from ~135 lines to ~18 lines
3. **Better error handling**: Check finish_reason and empty parts
4. **Fallback mechanism**: Use rule-based questions when LLM fails

## 🎯 Recommended Solutions

### Option 1: Increase max_output_tokens Further
```python
max_output_tokens=2048  # Account for thinking tokens
```

### Option 2: Use Model Without Thinking
- Try `gemini-2.0-flash` (older, might not have thinking)
- Try `gemini-pro-latest` (stable version)

### Option 3: Control Thinking Budget (if available)
```python
# If SDK supports it:
generation_config=genai.types.GenerationConfig(
    max_output_tokens=1024,
    thinking_tokens_budget=0  # Disable thinking
)
```

### Option 4: Make Prompt Even Shorter
- Reduce prompt to absolute minimum
- Remove examples if not critical
- Focus on essential instructions only

## 📊 Current Status

- ✅ LLM calls succeed
- ✅ Responses generated (when quota available)
- ⚠️ Intermittent MAX_TOKENS with empty parts
- ✅ Fallback works correctly

## 🔗 References

1. [Google Cloud Thinking Documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/thinking#budget)
2. [Gemini API Troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting)
3. [Google AI Developers Forum - MAX_TOKENS Issue](https://discuss.ai.google.dev/t/max-output-tokens-isnt-respected-when-using-gemini-2-5-flash-model/106708)
4. [Google AI Developers Forum - Empty Response](https://discuss.ai.google.dev/t/finishreason-max-tokens-but-text-is-empty/81874)

