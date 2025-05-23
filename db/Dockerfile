FROM postgres:17
COPY ./db/pg_hba.conf /var/lib/postgresql/data/
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    apt-get install -y postgresql-plpython3-17 && \
    apt-get install -y postgresql-17-postgis && \
    apt-get install -y postgresql-17-postgis-scripts && \
    rm -rf /var/lib/apt/lists/*

ENV PATH="$PATH:/usr/lib/python3.9"
ENV PYTHONHOME=/usr/lib/python3.9

# COPY ./db/init.sql /docker-entrypoint-initdb.d/init.sql

RUN echo "CREATE EXTENSION IF NOT EXISTS plpython3u;" > /docker-entrypoint-initdb.d/init.sql


