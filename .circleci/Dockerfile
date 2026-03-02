FROM --platform=linux/amd64 ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    curl tar jq ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NONINTERACTIVE=true

# SDK configuration
ARG VEGA_SDK_VERSION=0.21.5245
ARG SKIP_SDK_INSTALL=false

ENV VEGA_SDK_VERSION=${VEGA_SDK_VERSION}
ENV SKIP_SDK_INSTALL=${SKIP_SDK_INSTALL}

RUN curl -fsSL https://sdk-installer.vega.labcollab.net/get_vvm.sh | bash

ENV PATH="/root/vega/bin:${PATH}"

RUN vega -v

# Node.js 20 LTS and Yarn for build_sample_app
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g yarn \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

CMD ["/bin/bash"]
