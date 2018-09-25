FROM mhart/alpine-node:10

RUN apk update \
	&& apk upgrade \
        && apk add tzdata \
        && apk add py2-dnspython \
        && apk add openssh-client \
        && apk add python \
        && apk add linux-headers \
        && apk add py2-pip \
        && pip install netaddr \
        && apk add gcc \
        && apk add --update build-base libffi-dev openssl-dev \
        && apk add python-dev \
        && apk add musl-dev \
        && cp /usr/share/zoneinfo/Asia/Singapore /etc/localtime \
        && apk del tzdata \
	&& rm -rf /var/cache/apk/*
RUN pip install ansible


RUN echo "Asia/Singapore" > /etc/timezone
RUN mkdir -p /usr/src/app
RUN mkdir /etc/ansible
COPY hosts /etc/ansible/hosts
WORKDIR /usr/src/app

#Install app dependencies
RUN mkdir -p ~/.ssh
COPY .ssh/id_rsa  /root/.ssh/id_rsa
COPY .ssh/id_rsa.pub /root/.ssh/id_rsa.pub
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

EXPOSE 8085

CMD ["ash","./wlab.sh"]

