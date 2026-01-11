import argparse
import json
from pathlib import Path

import cv2
from ultralytics import YOLO


def parse_args():
    parser = argparse.ArgumentParser(description="Count cars in an image with YOLOv8")
    parser.add_argument("--image", "-i", type=str, default="../img/cars.jpg", help="path to image")
    parser.add_argument("--model", "-m", type=str, default="yolov8s.pt", help="YOLO model file")
    parser.add_argument("--conf", type=float, default=0.30, help="confidence threshold")
    parser.add_argument("--display", action="store_true", help="show window with detections")
    parser.add_argument("--json", action="store_true", help="print car_count as JSON only")
    return parser.parse_args()


def main():
    args = parse_args()

    image_path = Path(args.image)
    if not image_path.exists():
        raise SystemExit(f"image not found: {image_path}")

    model = YOLO(args.model)
    results = model(str(image_path))

    image = cv2.imread(str(image_path))
    car_ct = 0

    for result in results:
        boxes = result.boxes
        for box in boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            if model.names[cls] == "car" and conf >= args.conf:
                car_ct += 1
                cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(
                    image,
                    f"car {conf:.2f}",
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 255, 0),
                    2,
                )

    if args.json:
        print(json.dumps({"car_count": car_ct}))
    else:
        print(f"\nDetected cars: {car_ct}\n")

    if args.display:
        cv2.imshow("Car Detection", image)
        cv2.waitKey(0)
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
