#Docker file for fragment microservice.

#use node version 22.12.0
FROM node:22.12.0-alpine3.20 AS build

LABEL maintainer="Ali Sedigh Moghadam <asedigh-moghadam@myseneca.ca>"
LABEL description="Fragments Node.js microservice"

# Use /app as our working directory
WORKDIR /app

COPY package*.json /app/

# Install node dependencies defined in package-lock.json
RUN npm ci --only=production

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

RUN chown -R node:node /app

####################################################################
#stage 2 

FROM node:22.12.0-alpine3.20

# We default to use port 8080 in our service
# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel


# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color

ENV PORT=8080 \ 
  NPM_CONFIG_LOGLEVEL=warn\
  NPM_CONFIG_COLOR=false


WORKDIR /app

USER node

COPY --from=build --chown=node:node /app /app/

# Start the container by running our server
CMD npm start

# We run our service on port 8080
EXPOSE 8080

