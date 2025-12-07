from ultralytics import YOLO
import cv2

# 学習済みYOLOv8モデルをロード
model = YOLO('yolov8s.pt')

# 検出したい画像を読み込む
image_path = '../img/cars.jpg'
results = model(image_path)

# OpenCVで画像読み込み
image = cv2.imread(image_path)

car_ct = 0

# 検出結果を解析
for result in results:
    boxes = result.boxes  # バウンディングボックス
    for box in boxes:
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        x1, y1, x2, y2 = map(int, box.xyxy[0])

        if model.names[cls] == 'car' and conf >= 0.30:  # 車のみ
            car_ct+=1
            cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(image, f"car {conf:.2f}", (x1, y1-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)

# 結果表示
print(f"\nDetected cars: {car_ct}\n")
cv2.imshow("Car Detection", image)
cv2.waitKey(0)
cv2.destroyAllWindows()
