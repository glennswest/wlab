docker build -t wlab .
docker tag wlab ${SVCHOST}:5000/wlab
docker push ${SVCHOST}:5000/wlab

