# Palmframe Docker Sandbox Images

This directory contains Dockerfile definitions for all Palmframe sandbox runtime environments.

## Images

1. **python-interpreter** - Python 3.11 with Jupyter, NumPy, Pandas, Matplotlib, Seaborn, Plotly
2. **nextjs-developer** - Node 20 with Next.js 14.2.5, TypeScript, Tailwind CSS, shadcn
3. **vue-developer** - Node 20 with Nuxt 3, Tailwind CSS
4. **streamlit-developer** - Python 3.11 with Streamlit and data science libraries
5. **gradio-developer** - Python 3.11 with Gradio and data science libraries

## Building Images

To build all images at once:

```bash
cd docker-sandboxes
./build-images.sh
```

To build individual images:

```bash
docker build -t palmframe/python-interpreter:latest ./python-interpreter
docker build -t palmframe/nextjs-developer:latest ./nextjs-developer
docker build -t palmframe/vue-developer:latest ./vue-developer
docker build -t palmframe/streamlit-developer:latest ./streamlit-developer
docker build -t palmframe/gradio-developer:latest ./gradio-developer
```

## Verifying Images

After building, verify images exist:

```bash
docker images | grep palmframe
```

You should see all 5 images listed.

## Using with Palmframe

Once images are built, Palmframe will automatically use them when:
- `SANDBOX_PROVIDER` is not set or set to `docker`
- No `E2B_API_KEY` or `DAYTONA_API_KEY` is configured
- Docker is running and accessible

## Customization

You can modify the Dockerfiles to add additional packages or change versions. After making changes, rebuild the affected image.
