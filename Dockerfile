ARG NODE_IMAGE_TAG
ARG CLI_VERSION

FROM node:${NODE_IMAGE_TAG}

USER node
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin
WORKDIR /home/node

RUN npm i -g connectif-2-gc-storage@${CLI_VERSION}

ENTRYPOINT [ "connectif-2-gc-storage" ]

CMD [ "0", "--version" ]