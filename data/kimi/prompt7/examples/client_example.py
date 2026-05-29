"""
Example client usage for the Payment API Integration Service.

This demonstrates how to use the payment service from a client application.
"""

import asyncio
import httpx
from decimal import Decimal


BASE_URL = "http://localhost:8000"
API_KEY = "your-api-key-here"  # In production, load from environment


async def create_payment():
    """Example: Create a payment charge."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/payments/charge",
            headers={"X-API-Key": API_KEY},
            json={
                "amount": "99.99",
                "currency": "USD",
                "provider": "stripe",
                "payment_method": "card",
                "payment_token": "tok_visa",  # From Stripe.js/Elements
                "description": "Premium subscription",
                "customer": {
                    "email": "customer@example.com",
                    "name": "John Doe"
                },
                "metadata": {
                    "order_id": "ORD-12345",
                    "product_id": "PROD-001"
                }
            }
        )
        
        if response.status_code == 200:
            payment = response.json()
            print(f"Payment created: {payment['id']}")
            print(f"Status: {payment['status']}")
            print(f"Receipt: {payment.get('receipt_url', 'N/A')}")
        else:
            print(f"Error: {response.status_code}")
            print(response.json())


async def check_payment_status(payment_id: str):
    """Example: Check payment status."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/payments/{payment_id}",
            headers={"X-API-Key": API_KEY},
            params={"provider": "stripe"}
        )
        
        if response.status_code == 200:
            payment = response.json()
            print(f"Payment {payment_id} status: {payment['status']}")
            return payment
        else:
            print(f"Error: {response.status_code}")
            return None


async def refund_payment(payment_id: str, amount: Decimal = None):
    """Example: Refund a payment."""
    async with httpx.AsyncClient() as client:
        payload = {
            "payment_id": payment_id,
            "reason": "Customer request"
        }
        
        if amount:
            payload["amount"] = str(amount)
        
        response = await client.post(
            f"{BASE_URL}/payments/refund",
            headers={"X-API-Key": API_KEY},
            json=payload
        )
        
        if response.status_code == 200:
            refund = response.json()
            print(f"Refund created: {refund['id']}")
            print(f"Status: {refund['status']}")
        else:
            print(f"Error: {response.status_code}")
            print(response.json())


async def list_providers():
    """Example: List available payment providers."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/providers")
        
        if response.status_code == 200:
            data = response.json()
            print("Available providers:")
            for provider in data["providers"]:
                status = "✓" if provider["healthy"] else "✗"
                print(f"  {status} {provider['name']} ({provider['status']})")
        else:
            print(f"Error: {response.status_code}")


async def health_check():
    """Example: Check service health."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        
        if response.status_code == 200:
            health = response.json()
            print(f"Service status: {health['status']}")
            print(f"Version: {health['version']}")
            print("Provider health:")
            for name, status in health["providers"].items():
                print(f"  {name}: {status['status']}")
        else:
            print(f"Error: {response.status_code}")


async def main():
    """Run all examples."""
    print("=" * 50)
    print("Payment API Client Examples")
    print("=" * 50)
    
    # Check health
    print("\n1. Health Check:")
    await health_check()
    
    # List providers
    print("\n2. List Providers:")
    await list_providers()
    
    # Create payment (commented out - requires real token)
    # print("\n3. Create Payment:")
    # await create_payment()
    
    # Check payment status (commented out - requires real payment ID)
    # print("\n4. Check Payment Status:")
    # await check_payment_status("pi_1234567890")
    
    # Refund payment (commented out - requires real payment ID)
    # print("\n5. Refund Payment:")
    # await refund_payment("pi_1234567890", Decimal("50.00"))
    
    print("\n" + "=" * 50)
    print("Note: Some examples are commented out.")
    print("Uncomment them and provide valid tokens/payment IDs to test.")


if __name__ == "__main__":
    asyncio.run(main())
