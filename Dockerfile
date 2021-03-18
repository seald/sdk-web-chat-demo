# FROM node:12 as BUILDER
# WORKDIR /chat-demo/
# COPY . ./
# RUN npm ci # TODO : add credentials for private packages
# RUN npm run build

FROM nginx:stable
# COPY --from=BUILDER /chat-demo/build/* /usr/share/nginx/html/
COPY ./build /usr/share/nginx/html
