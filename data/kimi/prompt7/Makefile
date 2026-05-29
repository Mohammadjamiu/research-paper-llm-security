# Payment API Integration Service - Makefile

.PHONY: help install test test-coverage run run-dev docker-build docker-run clean lint

help:
	@echo "Available commands:"
	@echo "  make install      - Install dependencies"
	@echo "  make test         - Run tests"
	@echo "  make test-coverage - Run tests with coverage"
	@echo "  make run          - Run the server"
	@echo "  make run-dev      - Run the server in development mode with reload"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-run   - Run Docker container"
	@echo "  make clean        - Clean up generated files"

install:
	pip install -r requirements.txt

test:
	pytest tests/ -v

test-coverage:
	pytest tests/ -v --cov=payment_service --cov-report=html --cov-report=term

run:
	python -m uvicorn payment_service.main:app --host 0.0.0.0 --port 8000

run-dev:
	python -m uvicorn payment_service.main:app --reload --host 0.0.0.0 --port 8000

docker-build:
	docker build -t payment-service .

docker-run:
	docker run --env-file .env -p 8000:8000 payment-service

clean:
	rm -rf __pycache__ .pytest_cache .coverage htmlcov *.pyc
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
