FROM centos:7

ENV SOURCE_DIRECTORY /root/jivecakehtml

ADD init.sh /init.sh
ADD nginx.conf /root/nginx.conf
ADD nginx-https.conf /root/nginx-https.conf

RUN \
    printf "[nginx]\nname=nginx repo\nbaseurl=http://nginx.org/packages/centos/7/x86_64/\ngpgcheck=0\nenabled=1" >> /etc/yum.repos.d/nginx.repo && \
    yum -y update && \
    yum install -y wget nginx-1.12.0 git-all curl nano which man manpages && \

    curl --silent --location https://rpm.nodesource.com/setup_6.x | bash - && \
    yum -y install nodejs && \
    chmod +x /init.sh && \
    mkdir ~/.ssh && \

    git clone -b master https://github.com/troisio/jivecakehtml.git $SOURCE_DIRECTORY && \
    cd $SOURCE_DIRECTORY && \
    npm install && \
    cp -R node_modules ~/node_modules && \
    rm -rf $SOURCE_DIRECTORY && \
    yum clean all

CMD /init.sh