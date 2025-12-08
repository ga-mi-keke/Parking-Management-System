from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
import cv2
import math

cv2.setUseOptimized(True)
cv2.setNumThreads(8)
cv2.waitKey(33)

model = YOLO("yolov8n.pt")
WHEEL_CLASSES = ['car', 'truck', 'bus']

tracker = DeepSort(
    #boxの寿命
    max_age=3,
    #車両認定までのフレーム数
    n_init=3,
    #boxの最大追従距離？
    max_iou_distance=0.3,
    nn_budget=50,
    embedder="mobilenet"
)

STOP_THRESHOLD = 15
STOP_FRAMES = 12
frame_id = 0
SKIP = 3

track_history = {}
parked_ids = set()
##################################################
#この下のパスを書き換えたら別の動画にも処理ができます
##################################################
cap = cv2.VideoCapture("video/car_video_demo.mp4")
# cap = cv2.VideoCapture(0)

cv2.waitKey(max(1,int(1000/cap.get(cv2.CAP_PROP_FPS))))

if not cap.isOpened():
    print("Error: Could not open video stream.")
    exit()

while True:
    ret, frame = cap.read()
    # print("frame:", cap.get(cv2.CAP_PROP_POS_FRAMES))
    if not ret:
        break
    
    frame_id+=1
    if frame_id%SKIP == 0:
        continue

    # results = model.predict(frame, imgsz=640, device='cpu', verbose=False)
    results = model(frame, imgsz=480, device='cpu', verbose=False)

    detections = []
    for result in results:
        for box in result.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])

            if model.names[cls] in WHEEL_CLASSES and conf > 0.35:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                w = x2 - x1
                h = y2 - y1
                detections.append(([x1, y1, w, h], conf, cls))

    tracks = tracker.update_tracks(detections, frame=frame)

    car_count = 0

    for track in tracks:
        if not track.is_confirmed():
            continue

        track_id = track.track_id
        l, t, r, b = track.to_ltrb()
        cx = (l + r) / 2
        cy = (t + b) / 2
        car_count += 1

        # 追跡履歴を更新
        if track_id not in track_history:
            track_history[track_id] = []
        track_history[track_id].append((cx, cy))

        # 古すぎる履歴は削除
        if len(track_history[track_id]) > STOP_FRAMES:
            track_history[track_id].pop(0)

        # 停止判定（ STOP_FRAMES フレーム比較 ）
        if len(track_history[track_id]) == STOP_FRAMES:
            old_x, old_y = track_history[track_id][0]
            dist = math.hypot(cx - old_x, cy - old_y)

            if dist < STOP_THRESHOLD:
                parked_ids.add(track_id)
            else:
                # ★★★ 追加：動き出した場合は駐車から解除 ★★★
                if track_id in parked_ids:
                    parked_ids.remove(track_id)

        # 描画
        color = (0, 255, 0) if track_id in parked_ids else (255, 0, 0)
        label = f"ID:{track_id} {'Parked' if track_id in parked_ids else 'Moving'}"

        cv2.rectangle(frame, (int(l), int(t)), (int(r), int(b)), color, 2)
        cv2.putText(frame, label, (int(l), int(t) - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    cv2.putText(frame, f"Cars: {car_count}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
    cv2.putText(frame, f"Parked: {len(parked_ids)}", (10, 70),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 200, 0), 2)

    cv2.imshow("Car & Parking Detection", frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
