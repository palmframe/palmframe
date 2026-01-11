FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y curl gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# Install Python packages for data science
RUN pip install --no-cache-dir \
    jupyter \
    numpy \
    pandas \
    matplotlib \
    seaborn \
    plotly \
    scikit-learn \
    scipy

# Create working directory
WORKDIR /home/user

# Default command
CMD ["python3"]
