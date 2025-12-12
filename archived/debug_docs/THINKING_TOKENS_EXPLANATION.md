# Thinking Tokens - MAX_TOKENS Issue Explanation

## 🔍 Root Cause Identified

Based on [Google Cloud Documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/thinking#budget) and testing:

### The Problem:

**Thinking tokens count toward the total token budget**, and for some models like Gemini 2.5 Pro/Flash, **thinking is enabled by default**.

### What Happens:

1. Model starts generating response
2. **Thinking tokens are used first** (internal reasoning)
3. If thinking tokens exhaust the `max_output_tokens` budget **before any output tokens are generated**:
   - `finish_reason = MAX_TOKENS (2)`
   - `parts = []` (empty - no output generated)
   - This is why we see empty parts even with high `max_output_tokens`

### Why This Shouldn't Happen:

According to the docs, `max_output_tokens` should account for both thinking and output tokens. However:
- There may be edge cases where thinking tokens consume the entire budget
- Some models may not strictly respect the parameter
- This is a known issue discussed in [Google AI Developers Forum](https://discuss.ai.google.dev/t/finishreason-max-tokens-but-text-is-empty/81874)

## ✅ Solution Applied

1. **Increased max_output_tokens**: 1024 → **2048**
   - This provides more room for thinking tokens + output tokens
   - Should prevent thinking tokens from exhausting the budget

2. **Refined prompt**: Made it more concise
   - Reduces input tokens
   - Leaves more room for thinking + output

3. **Better error handling**: 
   - Checks for empty parts when MAX_TOKENS
   - Uses fallback when needed

## 📊 Expected Behavior

With `max_output_tokens=2048`:
- Thinking tokens: ~100-500 tokens (estimated)
- Output tokens: ~50-200 tokens (for follow-up question)
- Total: Well within 2048 limit
- Should prevent MAX_TOKENS with empty parts

## 🔗 References

- [Google Cloud Thinking Documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/thinking#budget)
- [Gemini API Troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting)
- [Google AI Forum - MAX_TOKENS Empty Response](https://discuss.ai.google.dev/t/finishreason-max-tokens-but-text-is-empty/81874)

