FROM node

COPY . /home/src

WORKDIR /home/src
RUN cd /home/src && npm i

EXPOSE 80
CMD npm run prod