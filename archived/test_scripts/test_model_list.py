"""Test script to list available Gemini models"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import google.generativeai as genai
from backend.config import Config

def list_available_models():
    """List all available Gemini models"""
    print("=" * 60)
    print("Listing Available Gemini Models")
    print("=" * 60)
    
    try:
        genai.configure(api_key=Config.GEMINI_API_KEY)
        
        print(f"\n✅ API Key configured: {Config.GEMINI_API_KEY[:10]}...")
        print("\n📋 Fetching available models...\n")
        
        models = genai.list_models()
        
        available_models = []
        for model in models:
            if 'generateContent' in model.supported_generation_methods:
                available_models.append(model.name)
                print(f"✅ {model.name}")
                print(f"   Display Name: {model.display_name}")
                print(f"   Description: {model.description[:100]}...")
                print()
        
        print(f"\n📊 Total models with generateContent: {len(available_models)}")
        
        # Try to use the first available model
        if available_models:
            model_name = available_models[0].split('/')[-1]  # Extract just the model name
            print(f"\n🎯 Recommended model name: {model_name}")
            
            # Test the model
            print(f"\n🧪 Testing model: {model_name}")
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content("Say hello in one word.")
                print(f"✅ Model works! Response: {response.text}")
                return model_name
            except Exception as e:
                print(f"❌ Error testing model: {e}")
        
        return None
        
    except Exception as e:
        print(f"❌ Error listing models: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    model_name = list_available_models()
    if model_name:
        print(f"\n✅ Use this model name in your code: '{model_name}'")
    else:
        print("\n❌ Could not determine model name")

