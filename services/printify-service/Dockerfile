# Stage 1: Build the application
FROM node:22-alpine AS builder
WORKDIR /app

# Printify service depend on product-contract package, 
# so we need to copy the package.json files for both the root and the product-contract package.
COPY package.json ./
COPY packages/product-contract/package.json ./packages/product-contract/package.json
COPY services/printify-service/package.json ./services/printify-service/package.json
# Copy the package-lock.json file to cache the dependencies and speed up the build process.
COPY package-lock.json ./

RUN npm ci

# Copy real source code to the container
# We need to copy the tsconfig.base.json file to the container because the product-contract package extends it.
COPY tsconfig.base.json ./
# We need to copy the product-contract folder to the container because the printify-service extends it.
COPY packages/product-contract ./packages/product-contract
COPY services/printify-service ./services/printify-service

# Because the product-contract package is a dependency of the printify-service,
# we need to build it first before building the printify-service.
RUN npm run build --workspace=packages/product-contract
RUN npm run build --workspace=services/printify-service

# Stage 2: Create the final image
FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder app/node_modules ./node_modules
COPY --from=builder app/packages/product-contract/dist ./packages/product-contract/dist
COPY --from=builder app/packages/product-contract/package.json ./packages/product-contract/package.json
COPY --from=builder app/services/printify-service/dist ./services/printify-service/dist

EXPOSE 3000
CMD [ "node", "services/printify-service/dist/main.js" ]