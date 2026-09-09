FROM node:18-bullseye
WORKDIR /app

# Install build dependencies required by chartjs-node-canvas and its image backend (cairo)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --production
COPY . ./
EXPOSE 3000
CMD ["node", "index.js"]
