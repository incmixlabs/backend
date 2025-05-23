FROM postgres:17
COPY db/pg_hba.conf /var/lib/postgresql/data/
RUN apt-get update && \
    apt-get update && apt-get install -y python3 python3-pip && \
    apt-get install -y postgresql-plpython3-17 && \
    apt-get install -y postgresql-17-postgis && \ 
    apt-get install -y postgresql-17-postgis-scripts && \
    apt-get install -y postgresql-17-cron && \
    rm -rf /var/lib/apt/lists/*
COPY db/install-extensions.sql /docker-entrypoint-initdb.d
ENV PATH="$PATH:/usr/lib/python3.9"
ENV PYTHONHOME=/usr/lib/python3.9
WORKDIR /usr/local/
