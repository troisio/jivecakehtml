### Running with Docker

`docker 1.12.11`

#### Building your image

```sh
cd your_project_directory
docker build -t jivecakeweb .
bash restart.sh
```

The `restart.sh` will stop the container on your docker host named `jivecakeweb`, start a container named `jivecakeweb`, host files on port `80` via nginx, and load the root directory as a volume