#!/bin/bash

# Mailgun Webhook Setup Script for KTS
# This script helps configure Mailgun to forward emails to your backend

echo "📧 KTS Mailgun Setup Script"
echo "=============================="
echo ""

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo "❌ Error: curl is not installed. Please install curl first."
    exit 1
fi

# Prompt for Mailgun API key
read -p "Enter your Mailgun API key: " MAILGUN_API_KEY
read -p "Enter your Mailgun domain (e.g., mg.yourdomain.com): " MAILGUN_DOMAIN
read -p "Enter your backend URL (e.g., https://kts-backend.onrender.com): " BACKEND_URL

# Validate inputs
if [ -z "$MAILGUN_API_KEY" ] || [ -z "$MAILGUN_DOMAIN" ] || [ -z "$BACKEND_URL" ]; then
    echo "❌ Error: All fields are required"
    exit 1
fi

# Construct the webhook URL
WEBHOOK_URL="${BACKEND_URL}/api/email/webhook"

echo ""
echo "Setting up webhook..."
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# Create the webhook using Mailgun API
response=$(curl -s -X POST \
  "https://api.mailgun.net/v3/domains/$MAILGUN_DOMAIN/webhooks" \
  --user "api:$MAILGUN_API_KEY" \
  -F "url=$WEBHOOK_URL" \
  -F "events[]=stored")

echo "Response: $response"
echo ""

# Verify webhook was created
echo "Verifying webhook..."
curl -s -X GET \
  "https://api.mailgun.net/v3/domains/$MAILGUN_DOMAIN/webhooks" \
  --user "api:$MAILGUN_API_KEY"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Important notes:"
echo "1. Test the webhook by sending an email to your Mailgun address"
echo "2. Monitor your backend logs for incoming webhooks"
echo "3. Make sure your backend is accessible from the internet"
echo ""
echo "Your email receiving address:"
echo "user@YOUR-DOMAIN (replace YOUR-DOMAIN with your Mailgun domain)"
