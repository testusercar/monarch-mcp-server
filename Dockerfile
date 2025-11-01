FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY pyproject.toml .
COPY src/ ./src/

# Install the package
RUN pip install -e .

# Expose port (Smithery will set the actual port)
EXPOSE 8080

# Run the server (Smithery will override this)
CMD ["python", "-m", "mcp.server.stdio", "src.monarch_mcp_server.server:create_server"]

