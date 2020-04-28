FROM node
EXPOSE 8080
ADD . /home/sozialhilfe
VOLUME /home/sozialhilfe/data
WORKDIR /home/sozialhilfe
RUN npm ci \
 && chmod +x build.sh \
 && ./build.sh
CMD npm start
