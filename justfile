build:
  QUARTZ_LIB_PATH=~/qkg/pkgs/quartz@master quartz compile -o build/main.wat ./app/main.qz

watch:
  fswatch -o ./app | xargs -n1 -I{} just build
