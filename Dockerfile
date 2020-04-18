FROM node

COPY . /home

WORKDIR /home
RUN cd /home && npm i
RUN mkdir /home/content

EXPOSE 80
CMD npm run start