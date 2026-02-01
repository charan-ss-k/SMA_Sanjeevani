#!/bin/bash
# Test script for Sanjeevani API endpoints

echo "=========================================="
echo "SANJEEVANI SYSTEM TESTING"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "TEST 1: Health Check"
echo "URL: GET http://127.0.0.1:8000/health"
curl -s http://127.0.0.1:8000/health | jq .
echo ""
echo "---"
echo ""

# Test 2: Status Check
echo "TEST 2: LLM Status"
echo "URL: GET http://127.0.0.1:8000/api/symptoms/status"
curl -s http://127.0.0.1:8000/api/symptoms/status | jq .
echo ""
echo "---"
echo ""

# Test 3: Medical Q&A (Main Test)
echo "TEST 3: Medical Q&A - Chatbot Feature ✅"
echo "URL: POST http://127.0.0.1:8000/api/medical-qa"
echo "Question: What is fever?"
curl -s -X POST http://127.0.0.1:8000/api/medical-qa \
  -H "Content-Type: application/json" \
  -d '{"question":"What is fever?"}' | jq .
echo ""
echo "---"
echo ""

# Test 4: Ollama Test
echo "TEST 4: Ollama Connectivity"
echo "URL: GET http://127.0.0.1:8000/api/symptoms/test-ollama"
curl -s http://127.0.0.1:8000/api/symptoms/test-ollama | jq .
echo ""
echo "=========================================="
echo "TESTING COMPLETE"
echo "=========================================="
