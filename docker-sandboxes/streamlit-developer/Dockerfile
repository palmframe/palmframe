FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y curl gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# Install Streamlit and data science packages
RUN pip install --no-cache-dir \
    streamlit \
    pandas \
    numpy \
    matplotlib \
    requests \
    seaborn \
    plotly \
    scikit-learn

# Create working directory
WORKDIR /home/user

# Expose Streamlit port
EXPOSE 8501

# Default command
CMD ["streamlit", "run", "app.py", "--server.address", "0.0.0.0"]
