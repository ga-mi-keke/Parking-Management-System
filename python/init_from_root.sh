BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

printf "初回起動ですか？\n0: no\t1: yes\n"
read INIT
case "$INIT" in
    1)
    python3 -m venv python/yolo_env
    source python/yolo_env/bin/activate
    pip install ultralytics opencv-python deep_sort_realtime
    ;;
    *)
    ;;
esac
printf "先頭に(yolo_env)がついてなかったら\n${BLUE}~/Parking-Management-System${NC}\$ ${RED}source python/yolo_env/bin/activate${NC}\nしたら動くはず!!!\n"