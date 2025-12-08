from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
import cv2
import math
import os

cv2.setUseOptimized(True)
cv2.setNumThreads(os.cpu_count())

model = YOLO("yolov8n.pt")
WHEEL_CLASSES = ["car", "truck", "bus"]

tracker = DeepSort(
    max_age=3,
    n_init=3,
    max_iou_distance=0.5,
    nn_budget=50,
    embedder="mobilenet"
)

STOP_THRESHOLD = 15
STOP_FRAMES = 12
# SKIP = 2

# frame_id = 0
track_history = {}
velocity_history = {}
parked_ids = set()

cap = cv2.VideoCapture("video/car_video_demo.mp4")

cv2.waitKey(max(1, int(1000 / cap.get(cv2.CAP_PROP_FPS))))

if not cap.isOpened():
    print("Error: Could not open video stream.")
    exit()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # frame_id += 1
    # if frame_id % SKIP == 0:
    #     continue

    results = model(frame, imgsz=480, device="cpu", verbose=False)

    detections = []
    for result in results:
        for box in result.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])

            if model.names[cls] in WHEEL_CLASSES and conf > 0.35:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                detections.append(([x1, y1, x2 - x1, y2 - y1], conf, cls))

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

        if track_id not in track_history:
            track_history[track_id] = []
        if track_id not in velocity_history:
            velocity_history[track_id] = []

        if len(track_history[track_id]) > 0:
            px, py = track_history[track_id][-1]
            velocity = math.hypot(cx - px, cy - py)
            velocity_history[track_id].append(velocity)
        else:
            velocity_history[track_id].append(0)

        track_history[track_id].append((cx, cy))

        if len(track_history[track_id]) > STOP_FRAMES:
            track_history[track_id].pop(0)
        if len(velocity_history[track_id]) > STOP_FRAMES:
            velocity_history[track_id].pop(0)

        avg_speed = sum(velocity_history[track_id]) / len(velocity_history[track_id])

        if avg_speed < 2:
            parked_ids.add(track_id)
        else:
            if track_id in parked_ids:
                parked_ids.remove(track_id)

        color = (0, 255, 0) if track_id in parked_ids else (255, 0, 0)
        label = f"ID:{track_id} {'Parked' if track_id in parked_ids else 'Moving'}"

        cv2.rectangle(frame, (int(l), int(t)), (int(r), int(b)), color, 2)
        cv2.putText(frame, label, (int(l), int(t) - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    current_ids = set([t.track_id for t in tracks if t.is_confirmed()])
    disappeared_ids = set(track_history.keys()) - current_ids

    for tid in disappeared_ids:
        if tid in parked_ids:
            parked_ids.remove(tid)
        if tid in track_history:
            del track_history[tid]
        if tid in velocity_history:
            del velocity_history[tid]

    cv2.putText(frame, f"Cars: {car_count}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
    cv2.putText(frame, f"Parked: {len(parked_ids)}", (10, 70),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 200, 0), 2)

    cv2.imshow("Car & Parking Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
