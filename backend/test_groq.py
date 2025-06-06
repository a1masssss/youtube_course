from groq import Groq
import os
import time
from dotenv import load_dotenv

load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

def test_summarize_from_file():
    """
    Test summarization using content from test.txt file with fastest model
    """
    print("🧪 Testing Groq summarization from test.txt file with gemma2-9b-it...")
    
    try:
        # Read content from test.txt
        with open('test.txt', 'r', encoding='utf-8') as file:
            transcript = file.read().strip()
        
        if not transcript:
            print("❌ test.txt is empty or not found")
            return None
            
        input_word_count = len(transcript.split())
        print(f"📊 Input from test.txt: {input_word_count} words")
        
        start_time = time.time()
        
        # Use fastest model: gemma2-9b-it
        completion = client.chat.completions.create(
            model="gemma2-9b-it",  # Changed to fastest model
            messages=[
                {"role": "system", "content": "Create concise summaries focusing on key points only."},
                {"role": "user", "content": f"Summarize this transcript in exactly 150 words, focusing on main topics only:\n\n{transcript}"}
            ],
            max_tokens=250,
            temperature=0.3,
            stream=True
        )
        
        summary = ""
        first_token_time = None
        
        for chunk in completion:
            if chunk.choices[0].delta.content:
                if first_token_time is None:
                    first_token_time = time.time()
                    ttft = first_token_time - start_time
                    print(f"⚡ Time to first token: {ttft:.2f}s")
                summary += chunk.choices[0].delta.content
        
        end_time = time.time()
        processing_time = end_time - start_time
        word_count = len(summary.split())
        
        print(f"✅ Summarization completed!")
        print(f"⏱️  Total processing time: {processing_time:.2f} seconds")
        print(f"📝 Summary word count: {word_count} words")
        print(f"📊 Input word count: {input_word_count} words")
        print(f"🚄 Speed: {word_count/processing_time:.1f} words per second")
        print(f"📉 Compression ratio: {input_word_count/word_count:.1f}:1")
        
        if processing_time < 3:
            print("🎉 EXCELLENT! Very fast processing.")
        elif processing_time < 8:
            print("✅ Good performance.")
        else:
            print("⚠️ Slower than expected.")
        
        print(f"\n📝 Generated Summary (150 words):")
        print("=" * 60)
        print(summary)
        print("=" * 60)
        
        return processing_time
        
    except FileNotFoundError:
        print("❌ test.txt file not found. Please create test.txt with content to summarize.")
        return None
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return None

def test_quick_model_comparison():
    """
    Quick test of different models with short text
    """
    print("\n🏁 Quick model comparison test...")
    
    models = ["gemma2-9b-it", "llama-3.1-8b-instant"]  # Reordered with fastest first
    
    short_text = """
    Machine learning is transforming industries through pattern recognition and predictive analytics. 
    Key applications include image recognition, natural language processing, and recommendation systems. 
    Major companies are investing heavily in AI research while addressing ethical concerns about bias 
    and privacy.
    """
    
    results = []
    
    for model in models:
        print(f"\n🧪 Testing model: {model}")
        try:
            start_time = time.time()
            
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": f"Summarize this in exactly 50 words: {short_text}"}
                ],
                max_tokens=80,
                temperature=0.3
            )
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            summary = completion.choices[0].message.content.strip()
            word_count = len(summary.split())
            
            print(f"⏱️  {model}: {processing_time:.2f}s ({word_count} words)")
            results.append((model, processing_time, word_count))
            
        except Exception as e:
            print(f"❌ {model} failed: {str(e)}")
    
    if results:
        fastest = min(results, key=lambda x: x[1])
        print(f"\n🏆 FASTEST MODEL: {fastest[0]} ({fastest[1]:.2f}s)")
    
    return results

if __name__ == "__main__":
    print("🧪 Testing Groq Summarization from test.txt with FASTEST MODEL")
    print("=" * 60)
    
    # Test summarization from test.txt file
    time1 = test_summarize_from_file()
    
    # Quick model comparison
    test_quick_model_comparison()

    
