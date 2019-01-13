FROM node

COPY . /home

WORKDIR /home
RUN cd /home && npm i

EXPOSE 80
CMD npm run start