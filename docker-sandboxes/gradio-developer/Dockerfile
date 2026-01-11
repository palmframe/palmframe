FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y curl gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# Install Gradio and data science packages
RUN pip install --no-cache-dir \
    gradio \
    pandas \
    numpy \
    matplotlib \
    requests \
    seaborn \
    plotly \
    scikit-learn

# Create working directory
WORKDIR /home/user

# Expose Gradio port
EXPOSE 7860

# Default command
CMD ["python", "app.py"]
