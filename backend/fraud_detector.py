import os
from dotenv import load_dotenv
from pathlib import Path
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def analyze_fraud_with_gemini(transaction: dict) -> dict:
    """Analyze transaction for fraud using Gemini 3 Flash"""
    
    try:
        # Get API key
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        
        # Initialize Gemini chat
        chat = LlmChat(
            api_key=api_key,
            session_id=f"fraud-analysis-{transaction.get('id', 'unknown')}",
            system_message="You are a banking fraud detection expert. Analyze transactions and provide detailed fraud risk assessment."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        # Create analysis prompt
        prompt = f"""
Analyze this banking transaction for potential fraud:

Transaction Details:
- Amount: ${transaction.get('amount', 0)}
- Merchant: {transaction.get('merchant_name', 'Unknown')}
- Category: {transaction.get('category', 'Unknown')}
- Location: {transaction.get('location', 'Unknown')}
- Date: {transaction.get('transaction_date', 'Unknown')}
- Current Fraud Score: {transaction.get('fraud_score', 0)}

Provide:
1. Risk Assessment (Low/Medium/High/Critical)
2. Fraud Probability (0-100%)
3. Key Risk Factors (list 3-5 specific concerns)
4. Recommendation (Approve/Review/Block)
5. Brief Explanation (2-3 sentences)

Format as JSON with keys: risk_level, fraud_probability, risk_factors (array), recommendation, explanation
"""
        
        # Send message and get response
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse response
        try:
            # Try to extract JSON from response
            response_text = response.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            analysis_result = json.loads(response_text)
        except:
            # Fallback if JSON parsing fails
            analysis_result = {
                "risk_level": "Medium",
                "fraud_probability": 65,
                "risk_factors": [
                    "Transaction pattern analysis required",
                    "Geographic location review needed",
                    "Merchant verification recommended"
                ],
                "recommendation": "Review",
                "explanation": response[:200] if response else "Analysis completed. Manual review recommended."
            }
        
        return {
            "success": True,
            "analysis": analysis_result,
            "raw_response": response
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "analysis": {
                "risk_level": "Unknown",
                "fraud_probability": 0,
                "risk_factors": ["Analysis failed"],
                "recommendation": "Manual Review Required",
                "explanation": f"Error during fraud analysis: {str(e)}"
            }
        }