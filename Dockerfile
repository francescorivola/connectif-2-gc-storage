ARG NODE_IMAGE_TAG
ARG CLI_VERSION

FROM node:${NODE_IMAGE_TAG}

WORKDIR /usr/src/cli

RUN npm i -g connectif-2-gc-storage@${CLI_VERSION}

USER node

ENTRYPOINT [ "connectif-2-gc-storage" ]

CMD [ "0", "--version" ]