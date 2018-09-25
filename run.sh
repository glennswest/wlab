docker kill wlab.${SVCDOMAIN}
docker rm wlab.${SVCDOMAIN}
chcon -Rt svirt_sandbox_file_t /data/wlab.${SVCDOMAIN}
docker run  -d -P --name wlab.${SVCDOMAIN} -v /data/wlab.${SVCDOMAIN}:/data wlab


