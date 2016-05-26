FROM andrewosh/binder-base

MAINTAINER Attila Bagoly <battila93@gmail.com>

USER root

RUN apt-get -y update && apt-get install -y libx11-6 libxext6 libxft2 libxpm4 

WORKDIR /opt
RUN wget http://battila93.web.elte.hu/gsoc/root.tar.gz
RUN tar -xzf root.tar.gz && rm root.tar.gz

USER main

ENV ROOTSYS         "/opt/root"
ENV PATH            "${ROOTSYS}/bin:${PATH}"
ENV LD_LIBRARY_PATH "${ROOTSYS}/lib:${LD_LIBRARY_PATH}"
ENV PYTHONPATH      "${ROOTSYS}/lib:${PYTHONPATH}"

