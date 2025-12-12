# Question and Follow-up Generation: Current Implementation vs Plan

## 📋 Overview

This document explains how questions and follow-ups are currently generated in the codebase, and compares it to the original plan.

---

## 🔍 How Questions Are Generated

### **First Question (Main Questions)**

#### **Current Implementation:**
- **NOT chosen by LLM** ❌
- **Selected by `QuestionManager.select_question()`** ✅
- **Method**: Random selection with topic-based filtering
- **Location**: `backend/core/question_manager.py`

#### **Selection Logic:**
1. **Load Question Bank**: Questions are loaded from JSON files (`backend/questions/python.json` or `backend/questions/java.json`)
2. **Filter Available**: Exclude questions already asked
3. **Topic-Based Selection**:
   - Prefer questions from **uncovered topics** (topics not yet discussed)
   - If all topics covered, select randomly from available questions
4. **Random Selection**: Uses `random.choice()` to pick from filtered questions

#### **Code Flow:**
```python
# backend/core/question_manager.py
def select_question(self, context: Dict) -> Optional[Dict]:
    # Get topics already covered
    topics_covered = set()
    for summary in context.get("round_summaries", []):
        if "topic" in summary:
            topics_covered.add(summary["topic"])
    
    # Filter questions
    available_questions = [
        q for q in self.question_bank 
        if q["id"] not in self.questions_asked
    ]
    
    # Prefer questions from uncovered topics
    uncovered_questions = [
        q for q in available_questions
        if q.get("topic") not in topics_covered
    ]
    
    if uncovered_questions:
        selected = random.choice(uncovered_questions)
    else:
        selected = random.choice(available_questions)
    
    return selected
```

#### **Original Plan:**
- The plan mentioned "intelligently picked" questions
- **LLM-based selection was NOT implemented**
- Current implementation uses **rule-based selection** (topic filtering + random)

---

## 🔄 How Follow-ups Are Generated

### **Current Implementation:**

#### **Flow:**
1. **Response Evaluation**: Candidate response is evaluated deterministically
2. **Strategy Selection**: Based on evaluation scores, a strategy is selected
3. **Strategy Guidance**: Strategy provides guidance (intent, focus areas, approach)
4. **LLM Generation**: Gemini API generates natural question from guidance
5. **Validation**: Question is cleaned and validated
6. **Fallback**: If LLM fails, intelligent fallback creates natural question

#### **Code Flow:**
```python
# backend/core/interview_controller.py
def _generate_followup(self, response: str, evaluation: Dict, strategy) -> Optional[Dict]:
    # Strategy provides guidance
    strategy_guidance = strategy.get_followup_guidance(
        self.current_question,
        response,
        evaluation,
        self.context_manager.get_context()
    )
    
    # Generate follow-up using LLM
    followup_text = self.gemini_client.generate_followup(
        self.current_question,
        response,
        evaluation,
        strategy_guidance,
        self.context_manager.get_context()
    )
    
    return {
        "text": followup_text,
        "followup_number": self.current_followup_count,
        "strategy_id": strategy.get_strategy_id()
    }
```

#### **Strategy Selection Logic:**
- **Depth-Focused**: Used when depth < 70 or completeness < 70
- **Clarification**: Used when clarity < 75 or completeness < 70
- **Breadth-Focused**: Used when score is adequate (70-85) to explore breadth
- **Challenge**: Used when score is high (≥90) to test deeper understanding

#### **LLM Prompt Structure:**
```
ORIGINAL QUESTION: [question text]
CANDIDATE'S RESPONSE: [response text]
EVALUATION SCORES: [scores]
WHAT TO EXPLORE: [strategy intent - what the candidate should address]
CRITICAL RULES: [instructions to generate natural question]
GOOD EXAMPLES: [examples of natural questions]
BAD EXAMPLES: [examples to avoid]
```

---

## 🆚 Current vs Plan Comparison

### **Main Questions:**

| Aspect | Plan | Current Implementation |
|--------|------|----------------------|
| **Selection Method** | "Intelligently picked" (implied LLM) | **Rule-based** (topic filtering + random) |
| **LLM Involvement** | Not specified | **No LLM** - pure rule-based |
| **Intelligence** | "Intelligent" selection | **Topic-based filtering** (avoids duplicates, prefers uncovered topics) |
| **Source** | Question bank | **JSON question bank** ✅ |

### **Follow-ups:**

| Aspect | Plan | Current Implementation |
|--------|------|----------------------|
| **Generation Method** | Strategy-guided + LLM | **Strategy-guided + LLM** ✅ |
| **Strategy Selection** | Based on evaluation | **Based on evaluation scores** ✅ |
| **LLM Usage** | Yes | **Yes - Gemini API** ✅ |
| **Naturalness** | Natural questions | **Improved with better prompts** ✅ |
| **Determinism** | Strategy-based | **Strategy-based with LLM naturalization** ✅ |

---

## 🐛 Issues and Fixes

### **Issue 1: Follow-up Questions Showing Strategy Guidance Text**

**Problem:**
- Follow-ups like: "Can you elaborate on that? Ask specifically about for loop or related concepts"
- Strategy guidance text was leaking into the question

**Root Cause:**
1. Strategy guidance contained instructional text ("Ask about...", "Explore...")
2. LLM was including this instructional text in the generated question
3. Prompt wasn't explicit enough about avoiding meta-instructions

**Fix Applied:**
1. **Improved LLM Prompt**:
   - More explicit instructions to avoid instructional text
   - Better examples of good vs bad follow-ups
   - Clearer structure and formatting
   
2. **Improved Strategy Guidance**:
   - Changed from instructional ("Ask about...") to descriptive ("The candidate should...")
   - Removed imperative phrases
   - Focus on intent rather than instructions

3. **Better Fallback Logic**:
   - Creates natural questions based on strategy type
   - No longer concatenates raw strategy text

---

## 📊 Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Question Selection                    │
│                                                          │
│  QuestionManager.select_question()                      │
│  ├─ Load question bank (JSON)                          │
│  ├─ Filter by topics covered                          │
│  ├─ Filter by questions asked                         │
│  └─ Random selection (prefer uncovered topics)          │
│                                                          │
│  ❌ NO LLM INVOLVEMENT                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Follow-up Generation                    │
│                                                          │
│  1. Evaluate Response (Deterministic)                  │
│     └─ Evaluator.evaluate()                            │
│                                                          │
│  2. Select Strategy                                     │
│     └─ StrategyFactory.select_strategy()               │
│        ├─ Depth-Focused (depth < 70)                   │
│        ├─ Clarification (clarity < 75)                 │
│        ├─ Breadth-Focused (score 70-85)                │
│        └─ Challenge (score ≥ 90)                       │
│                                                          │
│  3. Get Strategy Guidance                               │
│     └─ Strategy.get_followup_guidance()                │
│        └─ Returns: intent, focus areas, approach        │
│                                                          │
│  4. Generate Follow-up (LLM)                           │
│     └─ GeminiClient.generate_followup()                │
│        ├─ Build prompt with strategy intent            │
│        ├─ Call Gemini API                              │
│        ├─ Clean and validate response                 │
│        └─ Fallback if LLM fails                        │
│                                                          │
│  ✅ LLM INVOLVEMENT                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Recommendations

### **For Main Questions:**
1. **Current approach is fine** for deterministic selection
2. **Could add LLM-based selection** in future if needed:
   - Analyze JD/resume to select most relevant questions
   - Consider candidate's experience level
   - Adapt difficulty based on previous responses

### **For Follow-ups:**
1. **Current approach is good** - strategy-guided + LLM
2. **Continue improving prompts** to ensure natural questions
3. **Monitor follow-up quality** and adjust strategy guidance as needed

---

## ✅ Summary

- **Main Questions**: Rule-based selection (NOT LLM) - works well for deterministic interviews
- **Follow-ups**: Strategy-guided + LLM - generates natural questions based on evaluation
- **Both approaches** align with the goal of deterministic evaluation with natural conversation flow

