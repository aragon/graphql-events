FROM node:lts-slim as builder

RUN mkdir -p /app
# Add user so we don't need --no-sandbox.
RUN groupadd -r appuser && useradd -r -g appuser -G audio,video appuser \
    && mkdir -p /home/appuser/Downloads \
    && chown -R appuser:appuser /home/appuser \
    && chown -R appuser:appuser /app

# Run everything after as non-privileged user.
USER appuser

WORKDIR /app

COPY --chown=appuser:appuser . /app
RUN yarn
RUN yarn run build

FROM node:lts-slim

RUN mkdir -p /app
# Add user so we don't need --no-sandbox.
RUN groupadd -r appuser && useradd -r -g appuser -G audio,video appuser \
    && mkdir -p /home/appuser/Downloads \
    && chown -R appuser:appuser /home/appuser \
    && chown -R appuser:appuser /app

# Run everything after as non-privileged user.
USER appuser

WORKDIR /app

COPY --chown=appuser:appuser --from=builder /app/dist /app/dist
COPY --chown=appuser:appuser --from=builder /app/package.json /app
COPY --chown=appuser:appuser --from=builder /app/yarn.lock /app
COPY --chown=appuser:appuser --from=builder /app/queries /app/queries

RUN yarn --prod
ENTRYPOINT ["yarn", "start"]
